"""
PrivacyX ML Service — FastAPI-based machine learning engine
Provides clustering, anomaly detection, routine detection, and re-identification risk scoring
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
from typing import Optional
import json

app = FastAPI(title="PrivacyX ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClusterRequest(BaseModel):
    features: list[list[float]]
    algorithm: str = "dbscan"  # dbscan or kmeans
    eps: float = 0.5
    min_samples: int = 5
    n_clusters: int = 5


class AnomalyRequest(BaseModel):
    features: list[list[float]]
    contamination: float = 0.1


class ReidentificationRequest(BaseModel):
    features: list[list[float]]
    labels: Optional[list[int]] = None


class EvaluationRequest(BaseModel):
    y_true: list[int]
    y_pred: list[int]
    y_scores: Optional[list[float]] = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "privacyx-ml"}


@app.post("/cluster")
def cluster(req: ClusterRequest):
    """Run DBSCAN or K-Means clustering on behavioral features"""
    X = np.array(req.features)

    if X.shape[0] < 2:
        return {"labels": [], "n_clusters": 0, "message": "Need at least 2 samples"}

    if req.algorithm == "dbscan":
        model = DBSCAN(eps=req.eps, min_samples=req.min_samples)
        labels = model.fit_predict(X)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    else:
        n_clusters = min(req.n_clusters, X.shape[0])
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(X)

    # Compute cluster statistics
    cluster_stats = {}
    for label in set(labels):
        if label == -1:
            continue
        mask = labels == label
        cluster_features = X[mask]
        cluster_stats[int(label)] = {
            "size": int(mask.sum()),
            "centroid": cluster_features.mean(axis=0).tolist(),
            "std": cluster_features.std(axis=0).tolist(),
        }

    return {
        "labels": labels.tolist(),
        "n_clusters": n_clusters,
        "cluster_stats": cluster_stats,
        "noise_points": int((labels == -1).sum()) if req.algorithm == "dbscan" else 0,
    }


@app.post("/anomaly")
def anomaly_detection(req: AnomalyRequest):
    """Run Isolation Forest anomaly detection"""
    X = np.array(req.features)

    if X.shape[0] < 5:
        return {"predictions": [], "anomaly_count": 0, "message": "Need at least 5 samples"}

    model = IsolationForest(
        contamination=req.contamination,
        random_state=42,
        n_estimators=100,
    )
    predictions = model.fit_predict(X)
    scores = model.decision_function(X)

    anomaly_indices = np.where(predictions == -1)[0]

    return {
        "predictions": predictions.tolist(),
        "scores": scores.tolist(),
        "anomaly_count": int((predictions == -1).sum()),
        "anomaly_indices": anomaly_indices.tolist(),
        "anomaly_percentage": float((predictions == -1).mean() * 100),
    }


@app.post("/reidentification")
def reidentification_risk(req: ReidentificationRequest):
    """Assess re-identification risk using Random Forest on behavioral features"""
    X = np.array(req.features)

    if X.shape[0] < 10:
        # Not enough data for training — return heuristic score
        uniqueness = np.std(X, axis=0).mean() if X.shape[0] > 0 else 0
        risk = min(100, int(uniqueness * 100))
        return {
            "risk_score": risk,
            "method": "heuristic",
            "message": "Insufficient data for ML model, using heuristic",
            "feature_importance": {},
        }

    if req.labels:
        # Supervised mode
        y = np.array(req.labels)
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)

        feature_importance = dict(
            zip(
                [f"feature_{i}" for i in range(X.shape[1])],
                model.feature_importances_.tolist(),
            )
        )

        predictions = model.predict_proba(X)
        risk_scores = predictions[:, 1] if predictions.shape[1] > 1 else predictions[:, 0]

        return {
            "risk_score": int(risk_scores.mean() * 100),
            "risk_scores": risk_scores.tolist(),
            "feature_importance": feature_importance,
            "method": "random_forest",
        }
    else:
        # Unsupervised: use uniqueness-based heuristic
        feature_variances = np.var(X, axis=0)
        normalized_variance = feature_variances / (feature_variances.max() + 1e-8)
        uniqueness_score = normalized_variance.mean()

        feature_importance = dict(
            zip(
                [f"feature_{i}" for i in range(X.shape[1])],
                normalized_variance.tolist(),
            )
        )

        return {
            "risk_score": int(uniqueness_score * 100),
            "feature_importance": feature_importance,
            "method": "unsupervised_uniqueness",
        }


@app.post("/evaluate")
def evaluate_model(req: EvaluationRequest):
    """Evaluate model performance metrics"""
    y_true = np.array(req.y_true)
    y_pred = np.array(req.y_pred)

    metrics = {
        "precision": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
    }

    if req.y_scores and len(set(y_true)) == 2:
        y_scores = np.array(req.y_scores)
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_scores))

    # False positive rate
    fp = np.sum((y_pred == 1) & (y_true == 0))
    tn = np.sum((y_pred == 0) & (y_true == 0))
    metrics["false_positive_rate"] = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    return {"metrics": metrics}


@app.post("/routine")
def detect_routines(req: ClusterRequest):
    """Detect recurring behavioral routines via temporal clustering"""
    X = np.array(req.features)

    if X.shape[0] < 5:
        return {"routines": [], "routine_count": 0}

    # Use DBSCAN to find temporal clusters (routines)
    model = DBSCAN(eps=req.eps, min_samples=max(2, req.min_samples))
    labels = model.fit_predict(X)

    routines = []
    for label in sorted(set(labels)):
        if label == -1:
            continue
        mask = labels == label
        cluster_data = X[mask]
        centroid = cluster_data.mean(axis=0)

        routines.append({
            "id": int(label),
            "size": int(mask.sum()),
            "centroid": centroid.tolist(),
            "consistency": float(1 - cluster_data.std(axis=0).mean()),
        })

    return {
        "routines": routines,
        "routine_count": len(routines),
        "noise_ratio": float((labels == -1).sum() / len(labels)) if len(labels) > 0 else 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
