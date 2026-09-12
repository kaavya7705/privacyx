/**
 * PrivacyX ML Service Client
 * Connects Next.js to the Python FastAPI ML microservice (DBSCAN, Isolation Forest, Random Forest)
 */

import type { IEvent } from "@/lib/models/Event";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

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
  url: string;
}

/** Check if the Python ML microservice is online */
export async function checkMLHealth(): Promise<MLHealthStatus> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { online: false, url: ML_SERVICE_URL };
    const data = await res.json();
    return { online: true, service: data.service, url: ML_SERVICE_URL };
  } catch {
    return { online: false, url: ML_SERVICE_URL };
  }
}

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

/** Run DBSCAN clustering on temporal/behavioral feature vectors */
export async function runMLClustering(
  features: number[][],
  algorithm: "dbscan" | "kmeans" = "dbscan",
  eps = 0.35,
  min_samples = 3
): Promise<ClusterResult | null> {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/cluster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, algorithm, eps, min_samples }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
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
    const res = await fetch(`${ML_SERVICE_URL}/anomaly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, contamination }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
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
    const res = await fetch(`${ML_SERVICE_URL}/reidentification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, labels }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
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
    const res = await fetch(`${ML_SERVICE_URL}/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, algorithm: "dbscan", eps, min_samples }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as RoutineResult;
  } catch (e) {
    console.warn("ML Service routine error:", e);
    return null;
  }
}
