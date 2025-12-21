import os
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from PIL import Image, ImageStat
import cv2
from scipy.stats import entropy as scipy_entropy

# ============================================================
#               IMAGE QUALITY METRIC FUNCTIONS
# ============================================================

def compute_brightness(img_np):
    return np.mean(cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY))

def compute_contrast(img_np):
    return np.std(cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY))

def compute_sharpness(img_np):
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()

def compute_blur_score(img_np):
    sharp = compute_sharpness(img_np)
    return 1.0 / (sharp + 1e-6)

def compute_colorfulness(img_np):
    (B, G, R) = cv2.split(img_np.astype("float"))
    rg = np.abs(R - G)
    yb = np.abs(0.5 * (R + G) - B)
    std_rg, std_yb = np.std(rg), np.std(yb)
    mean_rg, mean_yb = np.mean(rg), np.mean(yb)
    return np.sqrt(std_rg**2 + std_yb**2) + 0.3 * np.sqrt(mean_rg**2 + mean_yb**2)

def compute_saturation(img_np):
    hsv = cv2.cvtColor(img_np, cv2.COLOR_BGR2HSV)
    return np.mean(hsv[:, :, 1])

def compute_entropy(img_np):
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    hist, _ = np.histogram(gray.ravel(), bins=256, range=(0, 255))
    hist = hist / np.sum(hist)
    return scipy_entropy(hist + 1e-12)

def compute_exposure_quality(img_np):
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    dark = np.mean(gray < 15)
    bright = np.mean(gray > 240)
    return dark, bright

def compute_edge_density(img_np):
    edges = cv2.Canny(img_np, 100, 200)
    return np.mean(edges > 0)

def compute_noise_estimate(img_np):
    gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()  # simple approximation


# ============================================================
#           AUGMENT ORIGINAL METRICS WITH IQA METRICS
# ============================================================

def enhance_metrics(df, image_base_dir, output_dir):

    results = {
        'brightness': [], 'contrast': [], 'sharpness': [], 'blur_score': [],
        'colorfulness': [], 'saturation': [], 'entropy': [],
        'exposure_dark': [], 'exposure_bright': [],
        'edge_density': [], 'noise_estimate': []
    }

    widths = []
    heights = []
    aspect_ratios = []
    file_sizes = []

    for path in df['image_path']:
        full_path = os.path.join(image_base_dir, path)

        try:
            img_bgr = cv2.imread(full_path)
            if img_bgr is None:
                raise ValueError("Invalid image")

            h, w = img_bgr.shape[:2]
            widths.append(w)
            heights.append(h)
            aspect_ratios.append(h / w)
            file_sizes.append(os.path.getsize(full_path) / 1024)

            # compute IQA metrics
            results['brightness'].append(compute_brightness(img_bgr))
            results['contrast'].append(compute_contrast(img_bgr))
            results['sharpness'].append(compute_sharpness(img_bgr))
            results['blur_score'].append(compute_blur_score(img_bgr))
            results['colorfulness'].append(compute_colorfulness(img_bgr))
            results['saturation'].append(compute_saturation(img_bgr))
            results['entropy'].append(compute_entropy(img_bgr))

            d, b = compute_exposure_quality(img_bgr)
            results['exposure_dark'].append(d)
            results['exposure_bright'].append(b)

            results['edge_density'].append(compute_edge_density(img_bgr))
            results['noise_estimate'].append(compute_noise_estimate(img_bgr))

        except Exception:
            widths.append(np.nan)
            heights.append(np.nan)
            aspect_ratios.append(np.nan)
            file_sizes.append(np.nan)

            for key in results.keys():
                results[key].append(np.nan)

    # assign to df
    df['image_width'] = widths
    df['image_height'] = heights
    df['aspect_ratio'] = aspect_ratios
    df['file_size_kb'] = file_sizes

    for k, v in results.items():
        df[k] = v

    os.makedirs(output_dir, exist_ok=True)
    df.to_csv(os.path.join(output_dir, "df_eda_extended.csv"), index=False)
    return df


# ============================================================
#                         PLOTTING
# ============================================================

def save_plot(fig, output_dir, name):
    os.makedirs(output_dir, exist_ok=True)
    fig.write_html(os.path.join(output_dir, f"{name}.html"))


def plot_iqa_histograms(df, output_dir):
    metrics = [
        "brightness", "contrast", "sharpness", "blur_score", "colorfulness",
        "saturation", "entropy", "edge_density", "noise_estimate",
        "exposure_dark", "exposure_bright"
    ]
    for m in metrics:
        fig = px.histogram(df, x=m, color='category', title=f"{m} Distribution")
        save_plot(fig, output_dir, m)


def plot_scatter_iqa(df, output_dir):
    important_pairs = [
        ("brightness", "plate_ap"),
        ("contrast", "plate_ap"),
        ("sharpness", "plate_ap"),
        ("colorfulness", "plate_ap"),
        ("entropy", "plate_ap"),
        ("saturation", "plate_confidence"),
        ("blur_score", "plate_max_iou")
    ]

    for x, y in important_pairs:
        fig = px.scatter(df, x=x, y=y, color='category',
                         hover_data=['image_path'], title=f"{x} vs {y}")
        save_plot(fig, output_dir, f"{x}_vs_{y}")


# ============================================================
#                          MAIN
# ============================================================

def run_eda(metrics_csv_path, image_base_dir, output_dir):

    df = pd.read_csv(metrics_csv_path)

    df = enhance_metrics(df, image_base_dir, output_dir)

    # IQA histograms
    plot_iqa_histograms(df, os.path.join(output_dir, "iqa_histograms"))

    # IQA scatter relations
    plot_scatter_iqa(df, os.path.join(output_dir, "iqa_scatter"))

    print("EDA Completed. Results saved to:", output_dir)


# ============================================================
# EXAMPLE USAGE
# ============================================================

run_eda(
    r"D:\hami_system_sharif\rex-omni\plate_test_results\per_sample_metrics.csv",
    r"C:\Users\Home\Downloads\car_img-test\test",
    r"D:\hami_system_sharif\rex-omni\plate_test_results\EDA"
)