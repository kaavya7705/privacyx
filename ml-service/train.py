"""
PrivacyX ML Engine — Offline & Batch Model Training Script
Trains production machine learning models for anomaly detection, behavioral profiling,
and re-identification risk evaluation. Saves artifacts to ml-service/models/.

Usage:
    python train.py [--samples 600] [--output-dir ./models]
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from pathlib import Path

import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    silhouette_score,
)
from sklearn.model_selection import cross_val_score

try:
    import joblib
except ImportError:
    from sklearn.externals import joblib  # type: ignore


def generate_synthetic_features(n_samples: int = 600, n_features: int = 5, seed: int = 42):
    """
    Generates realistic behavioral feature matrices aligned with PrivacyX event schema:
    [0] hourOfDay (normalized 0-1)
    [1] dayOfWeek (normalized 0-1)
    [2] domainCategory code (normalized 0-1)
    [3] sensitivity score (0-1)
    [4] isBrowser source (0 or 1)
    """
    np.random.seed(seed)
    n_anomalies = int(n_samples * 0.12)
    n_normal = n_samples - n_anomalies

    # Normal users (clustered patterns)
    normal_features = np.random.normal(loc=0.35, scale=0.15, size=(n_normal, n_features))
    normal_features = np.clip(normal_features, 0.0, 1.0)
    normal_labels = np.zeros(n_normal, dtype=int)

    # Anomaly / high risk (irregular spikes, out of bounds)
    anomaly_features = np.random.uniform(low=0.7, high=1.0, size=(n_anomalies, n_features))
    anomaly_features += np.random.normal(loc=0.1, scale=0.2, size=(n_anomalies, n_features))
    anomaly_features = np.clip(anomaly_features, 0.0, 1.0)
    anomaly_labels = np.ones(n_anomalies, dtype=int)

    X = np.vstack([normal_features, anomaly_features])
    y = np.concatenate([normal_labels, anomaly_labels])

    # Shuffle
    shuffle_idx = np.random.permutation(n_samples)
    return X[shuffle_idx], y[shuffle_idx]


def train_models(output_dir: Path, n_samples: int = 600):
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"[*] Generating {n_samples} training feature vectors across 5 core event dimensions...")
    X, y = generate_synthetic_features(n_samples=n_samples, n_features=5)

    # 1. Feature Scaler
    print("[*] Fitting StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    timestamp = datetime.utcnow().isoformat() + "Z"
    metadata = {
        "trained_at": timestamp,
        "n_samples": n_samples,
        "n_features": X.shape[1],
        "models": {}
    }

    # 2. Isolation Forest (Anomaly Detector)
    print("[*] Training Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.12,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)
    iso_scores = iso_forest.decision_function(X_scaled)
    iso_preds = iso_forest.predict(X_scaled)
    iso_binary = np.where(iso_preds == -1, 1, 0)
    iso_prec = float(precision_score(y, iso_binary, zero_division=0))
    iso_rec = float(recall_score(y, iso_binary, zero_division=0))
    iso_f1 = float(f1_score(y, iso_binary, zero_division=0))

    anomaly_model_data = {
        "model": iso_forest,
        "scaler": scaler,
        "model_type": "IsolationForest",
        "trained_at": timestamp,
        "sample_count": n_samples,
        "feature_count": X.shape[1],
        "version": "2.0",
        "metrics": {
            "precision": round(iso_prec, 4),
            "recall": round(iso_rec, 4),
            "f1": round(iso_f1, 4),
            "anomaly_rate": float(iso_binary.mean()),
            "mean_decision_score": float(iso_scores.mean()),
        },
    }
    joblib.dump(anomaly_model_data, output_dir / "anomaly_detector.joblib")
    metadata["models"]["anomaly_detector"] = anomaly_model_data["metrics"]
    print(f"    -> Anomaly Detector F1: {iso_f1:.4f} | Precision: {iso_prec:.4f} | Recall: {iso_rec:.4f}")

    # 3. Statistical Autoencoder (Reconstruction Error)
    print("[*] Fitting Statistical Autoencoder baseline...")
    feature_means = X_scaled.mean(axis=0)
    feature_stds = X_scaled.std(axis=0) + 1e-8
    reconstruction_errors = np.sqrt(((X_scaled - feature_means) ** 2).mean(axis=1))
    threshold = float(np.percentile(reconstruction_errors, 92))

    autoencoder_data = {
        "model": {
            "means": feature_means.tolist(),
            "stds": feature_stds.tolist(),
            "threshold": threshold,
        },
        "scaler": scaler,
        "model_type": "StatisticalAutoencoder",
        "trained_at": timestamp,
        "sample_count": n_samples,
        "feature_count": X.shape[1],
        "version": "2.0",
        "metrics": {
            "threshold": round(threshold, 4),
            "mean_reconstruction_error": round(float(reconstruction_errors.mean()), 4),
        },
    }
    joblib.dump(autoencoder_data, output_dir / "autoencoder.joblib")
    metadata["models"]["autoencoder"] = autoencoder_data["metrics"]
    print(f"    -> Autoencoder anomaly threshold: {threshold:.4f}")

    # 4. Random Forest Classifier (Re-identification & Risk Classifier)
    print("[*] Training Random Forest Risk Classifier...")
    rf_clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        random_state=42,
        n_jobs=-1
    )
    rf_clf.fit(X_scaled, y)
    cv_scores = cross_val_score(rf_clf, X_scaled, y, cv=5, scoring="f1")
    rf_preds = rf_clf.predict(X_scaled)
    rf_probs = rf_clf.predict_proba(X_scaled)[:, 1]

    rf_f1 = float(f1_score(y, rf_preds, zero_division=0))
    rf_auc = float(roc_auc_score(y, rf_probs))

    classifier_data = {
        "model": rf_clf,
        "scaler": scaler,
        "model_type": "RandomForest",
        "trained_at": timestamp,
        "sample_count": n_samples,
        "feature_count": X.shape[1],
        "version": "2.0",
        "metrics": {
            "cv_f1_mean": round(float(np.mean(cv_scores)), 4),
            "f1": round(rf_f1, 4),
            "roc_auc": round(rf_auc, 4),
        },
    }
    joblib.dump(classifier_data, output_dir / "risk_classifier.joblib")
    metadata["models"]["risk_classifier"] = classifier_data["metrics"]
    print(f"    -> Risk Classifier AUC: {rf_auc:.4f} | CV F1: {np.mean(cv_scores):.4f}")

    # 5. KMeans Clustering (Routine Discovery)
    print("[*] Fitting Routine Clusterer (KMeans k=5)...")
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    sil_score = float(silhouette_score(X_scaled, clusters))

    clusterer_data = {
        "model": kmeans,
        "scaler": scaler,
        "model_type": "KMeans",
        "trained_at": timestamp,
        "sample_count": n_samples,
        "feature_count": X.shape[1],
        "version": "2.0",
        "metrics": {
            "n_clusters": 5,
            "silhouette_score": round(sil_score, 4),
        },
    }
    joblib.dump(clusterer_data, output_dir / "routine_clusterer.joblib")
    metadata["models"]["routine_clusterer"] = clusterer_data["metrics"]
    print(f"    -> Routine Clusterer Silhouette Score: {sil_score:.4f}")

    # 6. Write metadata
    meta_path = output_dir / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] All 4 models trained & persisted in {output_dir}")
    print(f"[+] Metadata written to {meta_path}")

    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PrivacyX ML Model Trainer")
    parser.add_argument("--samples", type=int, default=600, help="Number of synthetic samples")
    parser.add_argument("--output-dir", type=str, default=str(Path(__file__).parent / "models"), help="Output directory")
    args = parser.parse_args()

    train_models(Path(args.output_dir), n_samples=args.samples)
