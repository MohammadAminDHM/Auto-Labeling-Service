#!/usr/bin/env python3
# PD_test.py
# Professional evaluation & visualization script for HAR with safe label handling

import os
import io
import json
import logging
import datetime
from pathlib import Path

import torch
from PIL import Image
from transformers import AutoImageProcessor, SiglipForImageClassification
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
from tqdm import tqdm
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# -------------------------
# Logging Configuration
# -------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("HARTestPro")

# -------------------------
# Paths
# -------------------------
TEST_DATASET_DIR = r"/mnt/models/binatest/dataset_bina/Posture Detection/PostureDataset"
OUTPUT_DIR = r"/mnt/models/binatest/dataset_bina/auto_labeling_results/Posture_Labeling_Results"
os.makedirs(OUTPUT_DIR, exist_ok=True)
RESULTS_DIR = os.path.join(OUTPUT_DIR, "evaluation_results")
os.makedirs(RESULTS_DIR, exist_ok=True)
PREDICTIONS_JSON = os.path.join(RESULTS_DIR, "predictions.json")
METRICS_JSON = os.path.join(RESULTS_DIR, "metrics.json")
PLOTS_DIR = os.path.join(RESULTS_DIR, "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

# -------------------------
# Device
# -------------------------
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {DEVICE}")

# -------------------------
# HAR Model Class
# -------------------------
class PostureDetector:
    def __init__(self, model_name: str = "prithivMLmods/Human-Action-Recognition"):
        self.model_name = model_name
        self.device = DEVICE
        self.model = None
        self.processor = None
        self.id2label = self._init_labels()
        self._init_model()

    @staticmethod
    def _init_labels():
        return {
            0: "calling",
            1: "clapping",
            2: "cycling",
            3: "dancing",
            4: "drinking",
            5: "eating",
            6: "fighting",
            7: "hugging",
            8: "laughing",
            9: "listening_to_music",
            10: "running",
            11: "sitting",
            12: "sleeping",
            13: "texting",
            14: "using_laptop",
        }

    def _init_model(self):
        try:
            logger.info(f"Loading processor and model from '{self.model_name}'...")
            self.processor = AutoImageProcessor.from_pretrained(self.model_name)
            self.model = SiglipForImageClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            logger.info("HAR model successfully loaded.")
        except Exception as e:
            logger.exception("Failed to initialize HAR model.")
            raise RuntimeError(f"Model initialization failed: {e}")

    def _preprocess(self, image_bytes: io.BytesIO) -> Image.Image:
        image_bytes.seek(0)
        return Image.open(io.BytesIO(image_bytes.read())).convert("RGB")

    def _infer(self, image: Image.Image) -> dict:
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze().cpu().tolist()
        return {self.id2label[i]: round(probs[i], 3) for i in range(len(probs))}

    def detect(self, image_bytes: io.BytesIO) -> dict:
        image = self._preprocess(image_bytes)
        predictions = self._infer(image)
        top_action = max(predictions, key=predictions.get)
        return {
            "predictions": predictions,
            "summary": {
                "top_action": top_action,
                "timestamp": datetime.datetime.now().isoformat(),
            }
        }

# -------------------------
# Plotting Utilities
# -------------------------
def plot_confusion_matrix(cm, labels, save_path):
    plt.figure(figsize=(12,10))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=labels, yticklabels=labels, cmap="Blues")
    plt.ylabel("True label")
    plt.xlabel("Predicted label")
    plt.title("Confusion Matrix")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def plot_metrics_bar(metric_vals, labels, metric_name, save_path):
    plt.figure(figsize=(12,6))
    sns.barplot(x=labels, y=metric_vals)
    plt.xticks(rotation=45)
    plt.ylabel(metric_name)
    plt.title(f"{metric_name} per class")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def plot_prediction_histogram(all_probs, save_path):
    plt.figure(figsize=(10,6))
    plt.hist(all_probs, bins=20, color='skyblue', edgecolor='black')
    plt.title("Histogram of Top Prediction Probabilities")
    plt.xlabel("Probability")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def plot_true_vs_pred_scatter(all_labels_idx, all_preds_idx, save_path):
    plt.figure(figsize=(10,6))
    jitter = 0.1*np.random.randn(len(all_labels_idx))
    plt.scatter(all_labels_idx + jitter, all_preds_idx + jitter, alpha=0.6)
    plt.xlabel("True label index")
    plt.ylabel("Predicted label index")
    plt.title("Scatter Plot: True vs Predicted Label Indices")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

# -------------------------
# Main Testing Function
# -------------------------
def main():
    detector = PostureDetector()
    label_names = list(detector.id2label.values())
    label2idx = {l:i for i,l in enumerate(label_names)}

    test_dataset_path = Path(TEST_DATASET_DIR)
    if not test_dataset_path.exists():
        logger.error(f"Test dataset path does not exist: {TEST_DATASET_DIR}")
        return

    all_labels = []
    all_preds = []
    all_probs = []
    sample_predictions = []

    logger.info("Starting inference on test dataset...")
    for class_folder in sorted(test_dataset_path.iterdir()):
        if not class_folder.is_dir():
            continue
        class_label = class_folder.name
        if class_label not in label_names:
            logger.warning(f"Skipping unknown class folder: {class_label}")
            continue
        logger.info(f"Processing class '{class_label}'")
        for img_path in tqdm(list(class_folder.iterdir()), desc=class_label):
            if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png"]:
                continue
            try:
                with open(img_path, "rb") as f:
                    image_bytes = io.BytesIO(f.read())
                result = detector.detect(image_bytes)
                preds = result["predictions"]
                top_action = result["summary"]["top_action"]
                all_labels.append(class_label)
                all_preds.append(top_action)
                all_probs.append(preds[top_action])
                sample_predictions.append({
                    "file_name": str(img_path),
                    "true_label": class_label,
                    "predicted_label": top_action,
                    "predictions": preds
                })
            except Exception as e:
                logger.error(f"Failed processing {img_path}: {e}")

    # -------------------------
    # Save per-sample predictions
    # -------------------------
    with open(PREDICTIONS_JSON, "w") as f:
        json.dump(sample_predictions, f, indent=2)
    logger.info(f"Saved predictions → {PREDICTIONS_JSON}")

    # -------------------------
    # Filter valid labels for metrics
    # -------------------------
    valid_pairs = [(t, p) for t, p in zip(all_labels, all_preds) if t in label2idx and p in label2idx]
    if not valid_pairs:
        logger.error("No valid predictions for metric calculation!")
        return
    valid_labels, valid_preds = zip(*valid_pairs)
    all_labels_idx = [label2idx[l] for l in valid_labels]
    all_preds_idx = [label2idx[p] for p in valid_preds]

    # -------------------------
    # Compute metrics
    # -------------------------
    acc = accuracy_score(valid_labels, valid_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(valid_labels, valid_preds, average=None, labels=label_names)
    cm = confusion_matrix(valid_labels, valid_preds, labels=label_names)

    metrics_json = {
        "accuracy": acc,
        "precision_per_class": dict(zip(label_names, precision.tolist())),
        "recall_per_class": dict(zip(label_names, recall.tolist())),
        "f1_score_per_class": dict(zip(label_names, f1.tolist())),
        "confusion_matrix": cm.tolist()
    }

    with open(METRICS_JSON, "w") as f:
        json.dump(metrics_json, f, indent=2)
    logger.info(f"Saved metrics → {METRICS_JSON}")

    # -------------------------
    # Visualization
    # -------------------------
    plot_confusion_matrix(cm, label_names, os.path.join(PLOTS_DIR, "confusion_matrix.png"))
    plot_metrics_bar(precision, label_names, "Precision", os.path.join(PLOTS_DIR, "precision_per_class.png"))
    plot_metrics_bar(recall, label_names, "Recall", os.path.join(PLOTS_DIR, "recall_per_class.png"))
    plot_metrics_bar(f1, label_names, "F1-Score", os.path.join(PLOTS_DIR, "f1_per_class.png"))
    plot_prediction_histogram(all_probs, os.path.join(PLOTS_DIR, "prediction_prob_histogram.png"))
    plot_true_vs_pred_scatter(all_labels_idx, all_preds_idx, os.path.join(PLOTS_DIR, "true_vs_pred_scatter.png"))

    logger.info("✅ HAR model professional testing & evaluation completed.")
    logger.info(f"Plots saved in: {PLOTS_DIR}")

if __name__ == "__main__":
    main()
