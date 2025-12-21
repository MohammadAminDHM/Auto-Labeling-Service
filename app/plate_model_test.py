#!/usr/bin/env python3
"""
plate_eval_openvino.py

Loads two OpenVINO YOLO (IR .xml/.bin) models (detector + recognizer),
runs sequential inference on a dataset of images + PascalVOC-like .xml labels,
computes detection metrics (IoU matching, precision/recall, AP@0.5) for plates and characters,
and writes interactive Plotly visualizations.

Key assumptions:
 - Detector finds the whole plate (one bbox per plate). GT plate is an object whose <name>
   contains Persian substring 'پلاک' or 'کل' (case-insensitive). If not found, largest bbox used.
 - Recognizer returns character bboxes relative to a plate crop.
 - Both models are OpenVINO IR (xml+bin) and are loaded via openvino.runtime.Core().
 - YOLO-like outputs: tries to decode common variants (rows of [cx,cy,w,h,conf,cls_probs...]
   with cx/cy normalized or absolute). If your export differs, adapt postprocess() methods.
"""

import os
import sys
import argparse
import logging
import glob
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

import numpy as np
import cv2
from tqdm import tqdm
from sklearn.metrics import precision_recall_curve, average_precision_score
from ultralytics import YOLO

# Plotly
import plotly.graph_objects as go

# OpenVINO
try:
    from openvino.runtime import Core
except Exception as e:
    raise RuntimeError("Failed to import openvino.runtime.Core. Ensure OpenVINO is installed.") from e

# ----------------- logging -----------------
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )

# ----------------- utils -----------------
def iou(boxA, boxB):
    # boxes [x1,y1,x2,y2]
    xA = max(boxA[0], boxB[0]); yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2]); yB = min(boxA[3], boxB[3])
    interW = max(0, xB - xA + 1); interH = max(0, yB - yA + 1)
    interArea = interW * interH
    Aarea = max(0, boxA[2]-boxA[0]+1) * max(0, boxA[3]-boxA[1]+1)
    Barea = max(0, boxB[2]-boxB[0]+1) * max(0, boxB[3]-boxB[1]+1)
    denom = Aarea + Barea - interArea
    return 0.0 if denom <= 0 else interArea / denom

def clamp_box(box, w, h):
    x1,y1,x2,y2 = box
    x1 = max(0,min(w-1,int(round(x1))))
    x2 = max(0,min(w-1,int(round(x2))))
    y1 = max(0,min(h-1,int(round(y1))))
    y2 = max(0,min(h-1,int(round(y2))))
    return [x1,y1,x2,y2]

# ----------------- dataset parsing -----------------
def parse_voc(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    objs = []
    for obj in root.findall('object'):
        name_el = obj.find('name')
        bbox_el = obj.find('bndbox')
        if name_el is None or bbox_el is None:
            continue
        name = name_el.text.strip() if name_el.text is not None else ''
        try:
            xmin = int(float(bbox_el.find('xmin').text))
            ymin = int(float(bbox_el.find('ymin').text))
            xmax = int(float(bbox_el.find('xmax').text))
            ymax = int(float(bbox_el.find('ymax').text))
        except Exception:
            continue
        objs.append({'name': name, 'bbox': [xmin, ymin, xmax, ymax]})
    return objs

def discover_image_xml_pairs(data_dir):
    imgs = []
    for ext in ('jpg','jpeg','png','bmp'):
        imgs += glob.glob(os.path.join(data_dir, f'**/*.{ext}'), recursive=True)
    pairs = []
    for img in imgs:
        xml = os.path.splitext(img)[0] + '.xml'
        if os.path.exists(xml):
            pairs.append((img, xml))
        else:
            logging.warning(f"No xml found for {img} (expected {xml}); skipping")
    return sorted(pairs)

class OpenVINOYoloModel:
    """
    Loads YOLO IR (.xml + .bin) using Ultralytics YOLO.
    Provides a compatible API with the old OpenVINO class.
    """

    def __init__(self, model_xml_path: str, device: str = 'CPU'):
        model_xml_path = str(model_xml_path)

        if not os.path.exists(model_xml_path):
            raise FileNotFoundError(f"Model xml not found: {model_xml_path}")

        logging.info(f"Loading YOLO IR model from: {model_xml_path}")

        # Load using YOLO (OpenVINO IR is supported)
        try:
            self.model = YOLO(model_xml_path, task="detect")
        except Exception as e:
            logging.error(f"Failed to load YOLO IR model: {e}")
            raise RuntimeError(f"Failed to load YOLO IR model: {e}")

        # For compatibility with your pipeline
        self.input_shape = (1, 3, 640, 640)

        logging.info("YOLO IR model initialized successfully.")

    # ------------------------------------------------------------------
    # Preprocess: YOLO handles everything internally
    # ------------------------------------------------------------------
    def preprocess(self, img_bgr: np.ndarray):
        return img_bgr

    # ------------------------------------------------------------------
    # Raw YOLO inference
    # ------------------------------------------------------------------
    def infer_raw(self, img_bgr: np.ndarray):
        try:
            # YOLO v8/v9 returns list-like results
            return self.model.predict(img_bgr, verbose=False)[0]
        except Exception as e:
            logging.error(f"YOLO inference error: {e}")
            raise

    # ------------------------------------------------------------------
    # Convert YOLO results → list of dicts (what your pipeline expects)
    # ------------------------------------------------------------------

    def infer(self, img_bgr: np.ndarray):
        results = self.infer_raw(img_bgr)

        dets = []

        if results.boxes is None or len(results.boxes) == 0:
            return dets

        boxes = results.boxes

        xyxy = boxes.xyxy.cpu().numpy()
        conf = boxes.conf.cpu().numpy()
        cls  = boxes.cls.cpu().numpy()

        for i in range(len(xyxy)):
            x1, y1, x2, y2 = xyxy[i]
            dets.append({
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "score": float(conf[i]),
                "class_id": int(cls[i]),     # ✔ FIXED # issue was key eror for this value
            })

        return dets



# ----------------- Plate Detector (OpenVINO) -----------------
class OpenVINOPlateDetector(OpenVINOYoloModel):
    def __init__(self, model_xml_path, device='CPU', conf_thresh=0.25):
        super().__init__(model_xml_path, device)
        self.conf_thresh = conf_thresh

    def postprocess(self, outputs, image_shape):
        # Try decode common YOLO-like outputs.
        arrs = [np.array(v) for v in outputs.values()]
        if len(arrs) == 0:
            return []
        out = arrs[0]
        if out.ndim == 3 and out.shape[0] == 1:
            out = out[0]
        detections = []
        h_img, w_img = image_shape
        # rows of [cx,cy,w,h,conf,cls_probs...]
        if out.ndim == 2 and out.shape[1] >= 6:
            for row in out:
                conf = float(row[4])
                if conf < self.conf_thresh:
                    continue
                class_probs = row[5:]
                class_id = int(np.argmax(class_probs)) if class_probs.size>0 else 0
                cx, cy, bw, bh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
                # normalized?
                if cx <= 1.0 and cy <= 1.0 and bw <= 1.0 and bh <= 1.0:
                    x1 = (cx - bw/2.0) * w_img
                    y1 = (cy - bh/2.0) * h_img
                    x2 = (cx + bw/2.0) * w_img
                    y2 = (cy + bh/2.0) * h_img
                else:
                    x1 = cx - bw/2.0
                    y1 = cy - bh/2.0
                    x2 = cx + bw/2.0
                    y2 = cy + bh/2.0
                bb = clamp_box([x1,y1,x2,y2], w_img, h_img)
                detections.append({'bbox': bb, 'score': conf, 'class_id': class_id})
            return detections
        # fallback: sometimes output shape is raw flattened, handle minimal
        flat = out.flatten()
        logging.debug("Detector fallback postprocess used; output flattened")
        return []

# ----------------- Plate Recognizer (OpenVINO) -----------------
class OpenVINOPlateRecognizer(OpenVINOYoloModel):
    def __init__(self, model_xml_path, device='CPU', conf_thresh=0.2):
        super().__init__(model_xml_path, device)
        self.conf_thresh = conf_thresh

    def postprocess(self, outputs, image_shape):
        arrs = [np.array(v) for v in outputs.values()]
        if len(arrs) == 0:
            return []
        out = arrs[0]
        if out.ndim == 3 and out.shape[0] == 1:
            out = out[0]
        h_img, w_img = image_shape
        dets = []
        if out.ndim == 2 and out.shape[1] >= 6:
            for row in out:
                conf = float(row[4])
                if conf < self.conf_thresh:
                    continue
                class_probs = row[5:]
                class_id = int(np.argmax(class_probs)) if class_probs.size>0 else 0
                cx, cy, bw, bh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
                if cx <= 1.0 and cy <= 1.0 and bw <= 1.0 and bh <= 1.0:
                    x1 = (cx - bw/2.0) * w_img
                    y1 = (cy - bh/2.0) * h_img
                    x2 = (cx + bw/2.0) * w_img
                    y2 = (cy + bh/2.0) * h_img
                else:
                    x1 = cx - bw/2.0
                    y1 = cy - bh/2.0
                    x2 = cx + bw/2.0
                    y2 = cy + bh/2.0
                bb = clamp_box([x1,y1,x2,y2], w_img, h_img)
                dets.append({'bbox': bb, 'score': conf, 'class_id': class_id})
        return dets

# ----------------- Pipeline -----------------
class PlatePipeline:
    def __init__(self, det_model_path, rec_model_path, device='CPU', topk_plate=1):
        self.detector = OpenVINOPlateDetector(det_model_path, device)
        self.recognizer = OpenVINOPlateRecognizer(rec_model_path, device)
        self.topk_plate = topk_plate

    def run_single(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            raise RuntimeError(f"Cannot read image {image_path}")
        h,w = img.shape[:2]
        dets = self.detector.infer(img)
        dets = sorted(dets, key=lambda x: x['score'], reverse=True)[:self.topk_plate]
        results = []
        for d in dets:
            x1,y1,x2,y2 = d['bbox']
            x1 = max(0,int(x1)); y1 = max(0,int(y1)); x2 = min(w-1,int(x2)); y2 = min(h-1,int(y2))
            if x2 <= x1 or y2 <= y1:
                continue
            crop = img[y1:y2, x1:x2]
            rec_dets = self.recognizer.infer(crop)
            for r in rec_dets:
                bx1,by1,bx2,by2 = r['bbox']
                # map rec bbox to original image coords
                r_global = [bx1 + x1, by1 + y1, bx2 + x1, by2 + y1]
                results.append({'plate_bbox': d['bbox'], 'char_bbox': r_global, 'char_score': r['score'], 'char_class': r['class_id']})
        return {'plate_detections': dets, 'char_detections': results, 'image_shape': (h,w), 'image_path': image_path}

# ----------------- Matching & metrics -----------------
def greedy_match(gt_boxes, pred_boxes, scores, iou_thresh=0.5):
    # returns list of tp/fp flags matching sorted by scores descending
    if len(pred_boxes) == 0:
        return [], []
    idxs = np.argsort(-np.array(scores))
    gt_matched = [False]*len(gt_boxes)
    tp = []
    fp = []
    for idx in idxs:
        p = pred_boxes[idx]
        best_iou = 0.0; best_g = -1
        for g_i, g in enumerate(gt_boxes):
            if gt_matched[g_i]:
                continue
            cur_iou = iou(p, g)
            if cur_iou > best_iou:
                best_iou = cur_iou; best_g = g_i
        if best_iou >= iou_thresh and best_g >= 0:
            tp.append(1); fp.append(0)
            gt_matched[best_g] = True
        else:
            tp.append(0); fp.append(1)
    # any unmatched GTs are false negatives implicitly
    return tp, fp

def compute_pr_ap(all_gt_boxes, all_pred_boxes, all_scores, iou_thresh=0.5):
    # Flatten dataset-level predictions and gts into arrays for PR/AP
    # all_gt_boxes: list of list (per-image gt boxes)
    # all_pred_boxes: list of list (per-image pred boxes)
    # all_scores: list of list (per-image scores)
    per_image_tps = []
    per_image_fps = []
    all_scores_flat = []
    for gts, preds, scores in zip(all_gt_boxes, all_pred_boxes, all_scores):
        tp, fp = greedy_match(gts, preds, scores, iou_thresh)
        per_image_tps += tp
        per_image_fps += fp
        # append scores in same order as greedy match (the greedy_match sorts preds by score inside)
        # greedy_match returns tp/fp in order of descending score; but we didn't return that order's scores.
        # simpler approach: flatten scores then sort globally
        all_scores_flat += scores
    if len(all_scores_flat) == 0:
        return None
    # For global PR, produce sorted by score descending and use per-image matching result ordering.
    # We'll compute AP using sklearn's average_precision_score by constructing binary target vector:
    # For simplicity, reconstruct global list of predictions with their matched flag by re-running greedy matching per image,
    y_true = []
    y_scores = []
    for gts, preds, scores in zip(all_gt_boxes, all_pred_boxes, all_scores):
        if len(preds) == 0:
            continue
        # perform greedy matching and get ordering of preds by score
        order = np.argsort(-np.array(scores))
        tp, fp = greedy_match(gts, preds, scores, iou_thresh)
        # greedy_match returns tp/fp in score-desc order for this image, so append accordingly
        y_true += tp
        y_scores += [scores[i] for i in order]
    if len(y_true) == 0:
        return None
    y_true = np.array(y_true)
    y_scores = np.array(y_scores)
    precision, recall, _ = precision_recall_curve(y_true, y_scores)
    ap = average_precision_score(y_true, y_scores)
    return {'precision': precision, 'recall': recall, 'ap': ap, 'y_true': y_true, 'y_scores': y_scores}

# ----------------- New metrics -----------------
def compute_f1(pr_res):
    if pr_res is None:
        return None
    prec = pr_res['precision']
    rec = pr_res['recall']
    f1 = 2 * prec * rec / (prec + rec + 1e-8)
    return f1

def save_f1_curve(pr_res, out_path, title="F1 Curve"):
    if pr_res is None:
        logging.info("No predictions to plot F1 curve.")
        return
    f1 = compute_f1(pr_res)
    rec = pr_res['recall']
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=rec, y=f1, mode='lines+markers', name='F1'))
    fig.update_layout(title=title, xaxis_title='Recall', yaxis_title='F1 Score')
    fig.write_html(out_path)
    logging.info(f"Saved F1 curve to {out_path}")

def save_conf_iou_scatter(all_gt_boxes, all_pred_boxes, all_scores, out_path, iou_thresh=0.5, title="Conf vs IoU"):
    confs = []
    ious = []
    for gts, preds, scores in zip(all_gt_boxes, all_pred_boxes, all_scores):
        for p, s in zip(preds, scores):
            best_iou = 0.0
            for g in gts:
                best_iou = max(best_iou, iou(p,g))
            confs.append(s)
            ious.append(best_iou)
    if len(confs) == 0:
        logging.info("No predictions to plot Conf vs IoU.")
        return
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=confs, y=ious, mode='markers'))
    fig.update_layout(title=title, xaxis_title='Confidence', yaxis_title='IoU with GT')
    fig.write_html(out_path)
    logging.info(f"Saved Conf vs IoU scatter to {out_path}")

def save_iou_histogram(all_gt_boxes, all_pred_boxes, out_path, title="IoU Histogram"):
    iou_vals = []
    for gts, preds in zip(all_gt_boxes, all_pred_boxes):
        for p in preds:
            best_iou = 0.0
            for g in gts:
                best_iou = max(best_iou, iou(p,g))
            iou_vals.append(best_iou)
    if len(iou_vals) == 0:
        logging.info("No predictions to plot IoU histogram.")
        return
    fig = go.Figure()
    fig.add_trace(go.Histogram(x=iou_vals, nbinsx=20))
    fig.update_layout(title=title, xaxis_title='IoU', yaxis_title='Count')
    fig.write_html(out_path)
    logging.info(f"Saved IoU histogram to {out_path}")


# ----------------- Visualization -----------------
def save_pr_curve(pr_res, out_path, title="PR Curve"):
    if pr_res is None:
        logging.info("No predictions to plot PR curve.")
        return
    prec = pr_res['precision']; rec = pr_res['recall']; ap = pr_res['ap']
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=rec, y=prec, mode='lines+markers', name=f'AP={ap:.4f}'))
    fig.update_layout(title=title, xaxis_title='Recall', yaxis_title='Precision')
    fig.write_html(out_path)
    logging.info(f"Saved PR curve to {out_path}")

def save_examples_html(samples, out_path, max_examples=20):
    # samples: list of dict {image_path, image_shape, plate_detections, char_detections}
    # create an HTML with interactive images (plotly) showing GT vs predictions
    figs = []
    cnt = 0
    for s in samples:
        if cnt >= max_examples:
            break
        img = cv2.imread(s['image_path'])
        if img is None:
            continue
        h,w = s['image_shape']
        # build a plotly figure showing image and overlay boxes
        fig = go.Figure()
        fig.add_trace(go.Image(z=img[:,:,::-1]))  # BGR -> RGB
        # add plate preds
        for d in s['plate_detections']:
            x1,y1,x2,y2 = d['bbox']
            fig.add_shape(type='rect', x0=x1, y0=y1, x1=x2, y1=y2,
                          line=dict(color='red', width=2), name='plate_pred')
        # add char preds
        for cd in s['char_detections']:
            x1,y1,x2,y2 = cd['char_bbox']
            fig.add_shape(type='rect', x0=x1, y0=y1, x1=x2, y1=y2,
                          line=dict(color='orange', width=1))
        # add GT boxes if provided in sample
        if 'gt_plate' in s and s['gt_plate'] is not None:
            g = s['gt_plate']
            fig.add_shape(type='rect', x0=g[0], y0=g[1], x1=g[2], y1=g[3],
                          line=dict(color='green', width=2))
        if 'gt_chars' in s:
            for g in s['gt_chars']:
                fig.add_shape(type='rect', x0=g[0], y0=g[1], x1=g[2], y1=g[3],
                              line=dict(color='lime', width=1))
        fig.update_layout(title=os.path.basename(s['image_path']), margin=dict(l=0,r=0,t=30,b=0))
        figs.append(fig)
        cnt += 1
    # write combined HTML with figures
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write("<html><body>\n")
        for i, fig in enumerate(figs):
            f.write(f"<h3>Example {i+1}</h3>\n")
            f.write(fig.to_html(full_html=False, include_plotlyjs=(i==0)))
            f.write("<hr>\n")
        f.write("</body></html>\n")
    logging.info(f"Saved example visualization HTML to {out_path}")


import shutil

# ----------------- Per-sample AP -----------------
def compute_sample_ap(gt_boxes, pred_boxes, scores, iou_thresh=0.5):
    """
    Compute AP for a single sample using greedy matching.
    Returns AP (float) and max IoU for this sample.
    """
    if len(pred_boxes) == 0 or len(gt_boxes) == 0:
        return 0.0, 0.0
    
    tp, fp = greedy_match(gt_boxes, pred_boxes, scores, iou_thresh)
    # compute precision/recall for single sample
    y_true = np.array(tp)
    y_scores = np.array(scores[:len(tp)])  # ensure same length
    if len(y_true) == 0:
        ap = 0.0
    else:
        try:
            ap = average_precision_score(y_true, y_scores)
        except Exception:
            ap = 0.0

    # max IoU between GT and preds for this sample
    max_iou = 0.0
    for g in gt_boxes:
        for p in pred_boxes:
            max_iou = max(max_iou, iou(g, p))
    return ap, max_iou


# ----------------- Categorize sample -----------------
def categorize_samples(sample_metrics, conf_thresh=0.75, iou_map_thresh=0.9):
    """
    Categorize samples into 4 groups based on confidence and mAP/IoU thresholds.
    Adds 'category' field to each sample dict.
    """
    for s in sample_metrics:
        conf_ok = s['plate_confidence'] >= conf_thresh
        map_ok  = s['plate_ap'] >= iou_map_thresh  # you can decide to combine AP/IoU here
        if conf_ok and map_ok:
            s['category'] = 1
        elif not conf_ok and map_ok:
            s['category'] = 2
        elif conf_ok and not map_ok:
            s['category'] = 3
        else:
            s['category'] = 4
    return sample_metrics


# ----------------- Save categorized samples -----------------
def save_samples_by_category(sample_metrics, out_dir):
    """
    Copy images to separate directories for each category.
    """
    for cat in range(1, 5):
        cat_dir = os.path.join(out_dir, f"category_{cat}")
        os.makedirs(cat_dir, exist_ok=True)

    for s in sample_metrics:
        src = s['image_path']
        cat = s.get('category', 0)
        if cat not in [1,2,3,4]:
            continue
        dst = os.path.join(out_dir, f"category_{cat}", os.path.basename(src))
        try:
            shutil.copy(src, dst)
        except Exception as e:
            logging.warning(f"Failed to copy {src} to category folder: {e}")

# ----------------- Main evaluation loop (Updated) -----------------
def evaluate(det_model, rec_model, data_dir, out_dir, device='CPU', topk_plate=1, iou_thresh=0.5, max_examples=40):
    pipeline = PlatePipeline(det_model, rec_model, device, topk_plate)
    pairs = discover_image_xml_pairs(data_dir)
    logging.info(f"Found {len(pairs)} image/xml pairs")

    all_plate_gts = []
    all_plate_preds = []
    all_plate_scores = []

    all_char_gts = []
    all_char_preds = []
    all_char_scores = []

    examples = []

    # per-sample metrics list
    sample_metrics = []

    for img_path, xml_path in tqdm(pairs, desc="Evaluating"):
        try:
            gts = parse_voc(xml_path)
            # find plate gt by name substring 'پلاک' or 'کل' (fuzzy)
            plate_gt = None
            char_gts = []
            for o in gts:
                nm = o['name']
                if 'پلاک' in nm or 'پلاک'.lower() in nm or 'کل' in nm or 'کل'.lower() in nm or 'plate' in nm.lower():
                    plate_gt = o['bbox']
                else:
                    char_gts.append(o['bbox'])
            # fallback: if no plate_gt, choose largest-area bbox
            if plate_gt is None and len(gts) > 0:
                largest = max(gts, key=lambda x: (x['bbox'][2]-x['bbox'][0])*(x['bbox'][3]-x['bbox'][1]))
                plate_gt = largest['bbox']
                char_gts = [x['bbox'] for x in gts if x['bbox'] != plate_gt]

            # run pipeline
            out = pipeline.run_single(img_path)
            plate_preds = [d['bbox'] for d in out['plate_detections']]
            plate_scores = [d['score'] for d in out['plate_detections']]
            char_preds = [c['char_bbox'] for c in out['char_detections']]
            char_scores = [c['char_score'] for c in out['char_detections']]

            # store per-image
            all_plate_gts.append([] if plate_gt is None else [plate_gt])
            all_plate_preds.append(plate_preds)
            all_plate_scores.append(plate_scores)

            all_char_gts.append(char_gts)
            all_char_preds.append(char_preds)
            all_char_scores.append(char_scores)

            # collect examples for visualization
            examples.append({'image_path': img_path,
                             'image_shape': out['image_shape'],
                             'plate_detections': out['plate_detections'],
                             'char_detections': out['char_detections'],
                             'gt_plate': plate_gt,
                             'gt_chars': char_gts})

            # ----------------- compute per-sample AP & max IoU -----------------
            plate_ap, plate_max_iou = compute_sample_ap([] if plate_gt is None else [plate_gt],
                                                        plate_preds,
                                                        plate_scores,
                                                        iou_thresh=iou_thresh)
            plate_conf = max(plate_scores) if len(plate_scores) > 0 else 0.0
            sample_metrics.append({
                'image_path': img_path,
                'plate_confidence': plate_conf,
                'plate_ap': plate_ap,
                'plate_max_iou': plate_max_iou
            })

        except Exception as e:
            logging.exception(f"Error processing {img_path}: {e}")

    # ----------------- compute dataset-level metrics -----------------
    plate_pr = compute_pr_ap(all_plate_gts, all_plate_preds, all_plate_scores, iou_thresh)
    char_pr = compute_pr_ap(all_char_gts, all_char_preds, all_char_scores, iou_thresh)

    os.makedirs(out_dir, exist_ok=True)
    save_pr_curve(plate_pr, os.path.join(out_dir, 'plate_pr.html'), title=f'Plate PR (IoU={iou_thresh})')
    save_pr_curve(char_pr, os.path.join(out_dir, 'char_pr.html'), title=f'Char PR (IoU={iou_thresh})')
    save_examples_html(examples[:max_examples], os.path.join(out_dir, 'examples.html'), max_examples=max_examples)

    # ----------------- Additional metrics -----------------
    save_f1_curve(plate_pr, os.path.join(out_dir, 'plate_f1.html'), title=f'Plate F1 (IoU={iou_thresh})')
    save_f1_curve(char_pr, os.path.join(out_dir, 'char_f1.html'), title=f'Char F1 (IoU={iou_thresh})')

    save_conf_iou_scatter(all_plate_gts, all_plate_preds, all_plate_scores,
                        os.path.join(out_dir, 'plate_conf_vs_iou.html'), title="Plate Conf vs IoU")
    save_conf_iou_scatter(all_char_gts, all_char_preds, all_char_scores,
                        os.path.join(out_dir, 'char_conf_vs_iou.html'), title="Char Conf vs IoU")

    save_iou_histogram(all_plate_gts, all_plate_preds, os.path.join(out_dir, 'plate_iou_hist.html'))
    save_iou_histogram(all_char_gts, all_char_preds, os.path.join(out_dir, 'char_iou_hist.html'))

    # ----------------- categorize samples -----------------
    sample_metrics = categorize_samples(sample_metrics, conf_thresh=0.75, iou_map_thresh=0.9)
    save_samples_by_category(sample_metrics, out_dir)

    # Optionally save per-sample metrics to CSV
    import pandas as pd
    pd.DataFrame(sample_metrics).to_csv(os.path.join(out_dir, "per_sample_metrics.csv"), index=False)
    logging.info(f"Saved per-sample metrics CSV and categorized images to {out_dir}")

    # ----------------- Summary -----------------
    logging.info("==== SUMMARY ====")
    if plate_pr:
        logging.info(f"Plate AP@{iou_thresh} = {plate_pr['ap']:.4f}")
    else:
        logging.info("No plate predictions to compute AP.")
    if char_pr:
        logging.info(f"Char AP@{iou_thresh} = {char_pr['ap']:.4f}")
    else:
        logging.info("No char predictions to compute AP.")
    logging.info(f"Saved outputs to {os.path.abspath(out_dir)}")


# ----------------- CLI -----------------
def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--det-model', required=True, help='Path to detector .xml (OpenVINO IR)')
    p.add_argument('--rec-model', required=True, help='Path to recognizer .xml (OpenVINO IR)')
    p.add_argument('--data-dir', required=True, help='Dataset dir containing images + .xml labels')
    p.add_argument('--out-dir', required=True, help='Output directory for results/plots')
    p.add_argument('--device', default='CPU', help='OpenVINO device (CPU or GPU)')
    p.add_argument('--topk-plates', type=int, default=1, help='Number of top plate detections to send to recognizer')
    p.add_argument('--iou-thresh', type=float, default=0.5, help='IoU threshold for matching')
    p.add_argument('--max-examples', type=int, default=40, help='Max example images to save for HTML visualizations')
    return p.parse_args()

def main():
    setup_logging()
    args = parse_args()
    evaluate(args.det_model, args.rec_model, args.data_dir, args.out_dir,
             device=args.device, topk_plate=args.topk_plates, iou_thresh=args.iou_thresh,
             max_examples=args.max_examples)

if __name__ == '__main__':
    main()


# python .\plate_model_test.py `
#   --det-model "D:\hami_system_sharif\bina_models\PLATE\plate_detection\best_openvino_model" `
#   --rec-model "D:\hami_system_sharif\bina_models\PLATE\best_openvino_model" `
#   --data-dir "C:\Users\Home\Downloads\car_img-test\test" `
#   --out-dir "D:\hami_system_sharif\rex-omni\plate_test_results" `
#   --device "CPU" `
#   --topk-plates 1
