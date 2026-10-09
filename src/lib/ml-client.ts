/**
 * PrivacyX ML Service Client v2.0
 * Connects Next.js to the Python FastAPI ML microservice
 * Now supports: persistent model training, risk prediction, model status, and health monitoring
 */

import type { IEvent } from "@/lib/models/Event";

const DEFAULT_ML_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const ML_HOSTS = Array.from(
  new Set([
    DEFAULT_ML_URL,
    "http://127.0.0.1:8000",
    "http://localhost:8000",
  ])
);

async function fetchFromML(path: string, options: RequestInit = {}): Promise<Response> {
  let lastError: unknown = null;
  for (const base of ML_HOSTS) {
    try {
      const url = `${base.replace(/\/$/, "")}${path}`;
      const res = await fetch(url, options);
      if (res.ok) return res;
      // If server responded with error status, capture and continue
      const errBody = await res.text().catch(() => "");
      lastError = new Error(`ML Server (${base}${path}) responded ${res.status}: ${errBody}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error(`Could not connect to ML service at any host: ${ML_HOSTS.join(", ")}`);
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ClusterResult {
  labels: number[];
  n_clusters: number;
  cluster_stats: Record<number, { size: number; centroid: number[]; std: number[] }>;
  noise_points: number;
}

export interface AnomalyResult {
  predictions: number[];
  scores: number[];
  anomaly_count: number;
  anomaly_indices: number[];
  anomaly_percentage: number;
}

export interface ReidentificationResult {
  risk_score: number;
  feature_importance: Record<string, number>;
  method: string;
  risk_scores?: number[];
}

export interface RoutineResult {
  routines: Array<{
    id: number;
    size: number;
    centroid: number[];
    consistency: number;
  }>;
  routine_count: number;
  noise_ratio: number;
}

export interface MLHealthStatus {
  online: boolean;
  service?: string;
  version?: string;
  models_loaded?: number;
  model_names?: string[];
  url: string;
}

export interface TrainResult {
  status: string;
  trained_models: Record<string, {
    model_name: string;
    status: string;
    cv_accuracy?: number;
    anomaly_count?: number;
    anomaly_rate?: number;
    n_clusters?: number;
    silhouette_score?: number | null;
    feature_importance?: Record<string, number>;
    threshold?: number;
  }>;
  total_samples: number;
  timestamp: string;
}

export interface ModelInfo {
  name: string;
  type: string;
  trained_at: string;
  sample_count: number;
  feature_count: number;
  metrics: Record<string, unknown>;
  version: string;
}

export interface MLRiskPrediction {
  risk_score: number;
  method: string;
  components: Record<string, number>;
  weights?: Record<string, number>;
  models_used?: string[];
  message?: string;
}

export interface PredictResult {
  results: {
    anomaly?: {
      predictions: number[];
      scores: number[];
      anomaly_count: number;
      anomaly_indices: number[];
      anomaly_percentage: number;
      model_name: string;
      trained_at: string;
    };
    autoencoder?: {
      reconstruction_errors: number[];
      anomaly_flags: number[];
      anomaly_count: number;
      threshold: number;
      model_name: string;
      trained_at: string;
    };
    classifier?: {
      predictions: number[];
      risk_scores: number[];
      mean_risk: number;
      feature_importance: Record<string, number>;
      model_name: string;
      trained_at: string;
    };
  };
  sample_count: number;
}

// ---------------------------------------------------------------------------
// Health & Status
// ---------------------------------------------------------------------------

/** Check if the Python ML microservice is online */
export async function checkMLHealth(): Promise<MLHealthStatus> {
  for (const base of ML_HOSTS) {
    try {
      const res = await fetch(`${base}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          service: data.service,
          version: data.version,
          models_loaded: data.models_loaded,
          model_names: data.model_names,
          url: base,
        };
      }
    } catch {
      // try next
    }
  }
  return { online: false, url: DEFAULT_ML_URL };
}

/** List all trained models */
export async function listModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetchFromML(`/models`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data.models || [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Feature Extraction
// ---------------------------------------------------------------------------

/** Convert raw privacy events into normalized numerical feature vectors for Scikit-Learn */
export function eventsToFeatureVectors(events: IEvent[]): number[][] {
  const CATEGORY_MAP: Record<string, number> = {
    technology: 1, developer_tools: 2, education: 3, career: 4,
    finance: 5, healthcare: 6, shopping: 7, entertainment: 8,
    social: 9, travel: 10, news: 11, sports: 12, gaming: 13, search: 14,
  };

  return events.map((event) => {
    const hour = typeof event.hourOfDay === "number" ? event.hourOfDay / 24 : 0.5;
    const day = typeof event.dayOfWeek === "number" ? event.dayOfWeek / 7 : 0.5;
    const catCode = (CATEGORY_MAP[event.category || ""] || 0) / 14;
    const sensitivity = typeof event.sensitivity === "number" ? event.sensitivity : 0.5;
    const isBrowser = event.source === "browser" ? 1.0 : 0.0;

    return [hour, day, catCode, sensitivity, isBrowser];
  });
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

/** Train ML models on user behavioral data (persisted to disk) */
export async function trainModels(
  features: number[][],
  labels?: number[],
  modelType: string = "all",
  userId?: string
): Promise<TrainResult | null> {
  try {
    const res = await fetchFromML(`/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features,
        labels: labels || null,
        model_type: modelType,
        user_id: userId,
      }),
      signal: AbortSignal.timeout(30000),
    });
    return (await res.json()) as TrainResult;
  } catch (e) {
    console.warn("ML Service train error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Prediction (uses persisted models)
// ---------------------------------------------------------------------------

/** Run predictions using persisted models */
export async function runMLPredict(
  features: number[][],
  modelName?: string
): Promise<PredictResult | null> {
  try {
    const res = await fetchFromML(`/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, model_name: modelName }),
      signal: AbortSignal.timeout(10000),
    });
    return (await res.json()) as PredictResult;
  } catch (e) {
    console.warn("ML Service predict error:", e);
    return null;
  }
}

/** Get unified ML risk score (combines anomaly + classifier + autoencoder) */
export async function runMLRiskPrediction(
  features: number[][],
  userId?: string
): Promise<MLRiskPrediction | null> {
  try {
    const res = await fetchFromML(`/predict/risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, user_id: userId }),
      signal: AbortSignal.timeout(10000),
    });
    return (await res.json()) as MLRiskPrediction;
  } catch (e) {
    console.warn("ML Service risk prediction error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Original endpoints (backward compatible)
// ---------------------------------------------------------------------------

/** Run DBSCAN clustering on temporal/behavioral feature vectors */
export async function runMLClustering(
  features: number[][],
  algorithm: "dbscan" | "kmeans" = "dbscan",
  eps = 0.35,
  min_samples = 3
): Promise<ClusterResult | null> {
  try {
    const res = await fetchFromML(`/cluster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, algorithm, eps, min_samples }),
      signal: AbortSignal.timeout(5000),
    });
    return (await res.json()) as ClusterResult;
  } catch (e) {
    console.warn("ML Service cluster error:", e);
    return null;
  }
}

/** Run Isolation Forest anomaly detection */
export async function runMLAnomalyDetection(
  features: number[][],
  contamination = 0.08
): Promise<AnomalyResult | null> {
  try {
    const res = await fetchFromML(`/anomaly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, contamination }),
      signal: AbortSignal.timeout(5000),
    });
    return (await res.json()) as AnomalyResult;
  } catch (e) {
    console.warn("ML Service anomaly error:", e);
    return null;
  }
}

/** Assess ML re-identification risk via Random Forest / Feature Variance */
export async function runMLReidentification(
  features: number[][],
  labels?: number[]
): Promise<ReidentificationResult | null> {
  try {
    const res = await fetchFromML(`/reidentification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, labels }),
      signal: AbortSignal.timeout(5000),
    });
    return (await res.json()) as ReidentificationResult;
  } catch (e) {
    console.warn("ML Service re-identification error:", e);
    return null;
  }
}

/** Detect routines with temporal DBSCAN */
export async function runMLRoutineDetection(
  features: number[][],
  eps = 0.3,
  min_samples = 2
): Promise<RoutineResult | null> {
  try {
    const res = await fetchFromML(`/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, algorithm: "dbscan", eps, min_samples }),
      signal: AbortSignal.timeout(5000),
    });
    return (await res.json()) as RoutineResult;
  } catch (e) {
    console.warn("ML Service routine error:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Defense ML Prediction (uses new /predict/defense endpoint)
// ---------------------------------------------------------------------------

export interface MLModelAssessment {
  model_type: string;
  risk_before: number;
  risk_after: number;
  reduction: number;
  effective: boolean;
  anomalies_before?: number;
  anomalies_after?: number;
  anomaly_reduction?: number;
  flagged_before?: number;
  flagged_after?: number;
  threshold?: number;
}

export interface MLDefensePrediction {
  defense_effective: boolean;
  risk_before: number;
  risk_after: number;
  ml_risk_reduction: number;
  model_assessments: Record<string, MLModelAssessment>;
  models_used: string[];
  defense_strategy: string;
  samples_before: number;
  samples_after: number;
  message?: string;
}

/** Get ML-powered defense effectiveness evaluation (compares pre/post defense features through trained models) */
export async function runMLDefensePrediction(
  featuresBefore: number[][],
  featuresAfter: number[][],
  defenseStrategy: string,
  userId?: string
): Promise<MLDefensePrediction | null> {
  try {
    const res = await fetchFromML(`/predict/defense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features_before: featuresBefore,
        features_after: featuresAfter,
        defense_strategy: defenseStrategy,
        user_id: userId,
      }),
      signal: AbortSignal.timeout(15000),
    });
    return (await res.json()) as MLDefensePrediction;
  } catch (e) {
    console.warn("ML Service defense prediction error:", e);
    return null;
  }
}
