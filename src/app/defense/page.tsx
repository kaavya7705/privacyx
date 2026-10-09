"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, TrendingDown, BarChart3, Zap, Target, ChevronDown,
  ArrowRight, Info, Shield, Loader2, Sparkles, CheckCircle2,
  Database, Cpu, RefreshCw, AlertTriangle, Layers, FileCheck, ExternalLink
} from "lucide-react";
import Link from "next/link";

interface AttackComparison {
  type: string;
  riskBefore: number;
  riskAfter: number;
  reduction: number;
}

interface TransformationDetail {
  field: string;
  action: string;
  eventCount: number;
  description: string;
}

interface MLModelAssessment {
  model_type?: string;
  risk_before?: number;
  risk_after?: number;
  reduction?: number;
  effective?: boolean;
  [key: string]: unknown;
}

interface MLDefenseResult {
  defenseEffective: boolean;
  riskBefore: number;
  riskAfter: number;
  mlRiskReduction: number;
  modelAssessments?: Record<string, MLModelAssessment>;
  modelsUsed?: string[];
}

interface DefenseResultData {
  strategy: string;
  strategyName: string;
  strategyDescription: string;
  riskBefore: number;
  riskAfter: number;
  utilityRetained: number;
  privacyImprovement: number;
  attackComparisons: AttackComparison[];
  eventCountBefore: number;
  eventCountAfter: number;
  transformationLog?: TransformationDetail[];
  mlDefenseResult?: MLDefenseResult | null;
  mlServiceUsed?: boolean;
  eventsPersisted?: boolean;
}

interface DefenseComparison extends DefenseResultData {}

interface AutoDefenseData {
  recommendedStrategy: string;
  recommendedStrategyName: string;
  rationale: string[];
  threatVector: string;
  expectedRiskReduction: number;
  utilityRetained: number;
  comparison?: DefenseComparison;
}

interface ActiveDefenseState {
  selectedStrategy: string;
  createdAt?: string | Date;
  riskBefore?: number;
  riskAfter?: number;
  strategies?: Array<{ name: string; strategy: string }>;
  transformationLog?: TransformationDetail[];
  eventsModified?: number;
}

const ATTACK_LABELS: Record<string, string> = {
  HOME_LOCATION_INFERENCE: "🏠 Home Schedule",
  WORK_LOCATION_INFERENCE: "💼 Work/School Pattern",
  ROUTINE_INFERENCE: "🔄 Daily Routine",
  INTEREST_INFERENCE: "🎯 Interest Profile",
  BEHAVIORAL_FINGERPRINT: "🔍 Behavioral Fingerprint",
  REIDENTIFICATION: "👤 Re-identification",
  CROSS_SOURCE_CORRELATION: "🔗 Cross-Source Link",
  TEMPORAL_INFERENCE: "🕐 Time Pattern",
  ANOMALY_EXPLOITATION: "⚠️ Anomaly Detection",
};

function getRiskColor(score: number) {
  if (score <= 30) return "text-risk-low";
  if (score <= 60) return "text-risk-medium";
  if (score <= 80) return "text-risk-high";
  return "text-risk-critical";
}

function getRiskBg(score: number) {
  if (score <= 30) return "bg-risk-low";
  if (score <= 60) return "bg-risk-medium";
  if (score <= 80) return "bg-risk-high";
  return "bg-risk-critical";
}

export default function DefensePage() {
  const [comparisons, setComparisons] = useState<DefenseComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<DefenseResultData | null>(null);
  const [applyingStrategy, setApplyingStrategy] = useState<string | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [autoDefense, setAutoDefense] = useState<AutoDefenseData | null>(null);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  // Active Defense Status
  const [activeDefense, setActiveDefense] = useState<ActiveDefenseState | null>(null);
  const [resettingDefense, setResettingDefense] = useState(false);
  const [activeTab, setActiveTab] = useState<"attacks" | "transformations" | "ml">("transformations");

  const fetchActiveDefense = useCallback(async () => {
    try {
      const res = await fetch("/api/defense");
      const data = await res.json();
      if (data.activeDefense) {
        setActiveDefense(data.activeDefense);
      } else {
        setActiveDefense(null);
      }
    } catch (e) {
      console.warn("Failed to fetch active defense:", e);
    }
  }, []);

  const fetchAutoDefenseRecommendation = useCallback(async () => {
    try {
      const res = await fetch("/api/auto-defense");
      const data = await res.json();
      if (data.recommendation) {
        setAutoDefense(data.recommendation);
      }
      if (data.activeDefense) {
        setActiveDefense(data.activeDefense);
      }
    } catch (e) {
      console.error("Failed to fetch auto defense recommendation:", e);
    }
  }, []);

  useEffect(() => {
    fetchActiveDefense();
    fetchAutoDefenseRecommendation();
  }, [fetchActiveDefense, fetchAutoDefenseRecommendation]);

  const resetDefense = async () => {
    setResettingDefense(true);
    try {
      const res = await fetch("/api/defense", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActiveDefense(null);
        setApplied(null);
        setAutoApplied(false);
        setComparisons([]);
      }
    } catch (e) {
      console.error("Failed to reset defense:", e);
    } finally {
      setResettingDefense(false);
    }
  };

  const applyAutoDefense = async () => {
    setLoadingAuto(true);
    try {
      const res = await fetch("/api/auto-defense", { method: "POST" });
      const data = await res.json();
      if (data.result) {
        setApplied(data.result);
        setAutoApplied(true);
        fetchActiveDefense();
      } else if (data.recommendation?.comparison) {
        setApplied(data.recommendation.comparison);
        setAutoApplied(true);
        fetchActiveDefense();
      }
    } catch (e) {
      console.error("Failed to apply auto defense:", e);
    } finally {
      setLoadingAuto(false);
    }
  };

  const compareDefenses = async () => {
    setLoading(true);
    setApplied(null);
    try {
      const res = await fetch("/api/defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setComparisons(data.comparisons || []);
      if (data.activeDefense) {
        setActiveDefense(data.activeDefense);
      }
    } catch (e) {
      console.error("Defense comparison error:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyDefense = async (strategy: string) => {
    setApplyingStrategy(strategy);
    try {
      const res = await fetch("/api/defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const data = await res.json();
      if (data.result) {
        setApplied(data.result);
        fetchActiveDefense();
      }
    } catch (e) {
      console.error("Apply defense error:", e);
    } finally {
      setApplyingStrategy(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-px-emerald" />
            Privacy Defense Center
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Transform and persist obfuscated telemetry in MongoDB — verified by Python ML and adversarial attack simulation.
          </p>
        </div>

        <Link
          href="/attack"
          className="btn-danger text-xs flex items-center gap-2 py-2 px-3 self-start sm:self-auto"
        >
          <Target className="w-4 h-4" /> Go to Attack Simulator
        </Link>
      </div>

      {/* ACTIVE DEFENSE STATUS BAR */}
      {activeDefense ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-px-emerald/40 bg-gradient-to-r from-px-surface via-px-surface-light to-px-surface p-5 shadow-lg shadow-px-emerald/5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-px-emerald/20 text-px-emerald border border-px-emerald/40 animate-pulse">
                  <ShieldCheck className="w-4 h-4" /> ACTIVE DEFENSE RUNNING
                </span>
                <span className="text-xs font-mono text-px-text-muted">
                  Strategy: <strong className="text-px-text">{activeDefense.strategies?.[0]?.name || activeDefense.selectedStrategy}</strong>
                </span>
              </div>
              <div className="text-sm text-px-text-secondary">
                Database events are currently defended in MongoDB. Any re-attack will analyze protected data.
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={resetDefense}
                disabled={resettingDefense}
                className="btn-secondary text-xs flex items-center gap-2 py-2 px-3 border border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resettingDefense ? "animate-spin" : ""}`} />
                {resettingDefense ? "Restoring Baseline..." : "Deactivate & Restore Baseline"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-risk-high/30 bg-risk-high/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <Shield className="w-5 h-5 text-risk-high flex-shrink-0" />
            <span className="text-px-text-secondary">
              <strong className="text-risk-high">No Defense Active:</strong> Telemetry in the database is unmasked. Select or activate a defense below to transform your data.
            </span>
          </div>
        </div>
      )}

      {/* Auto-Defense Recommendation Card */}
      {autoDefense && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-px-cyan/30 bg-gradient-to-r from-px-surface to-px-surface-light p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-px-cyan/10 text-px-cyan border border-px-cyan/30">
                  <Sparkles className="w-3.5 h-3.5" /> AI Recommended Defense
                </span>
                <span className="text-xs text-px-text-muted">
                  Targeting: <strong className="text-px-text">{autoDefense.threatVector}</strong>
                </span>
              </div>
              <h3 className="text-xl font-bold text-px-text">
                {autoDefense.recommendedStrategyName}
              </h3>
              <ul className="text-xs text-px-text-secondary space-y-1">
                {autoDefense.rationale.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-px-cyan" />
                    {r}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 text-xs font-medium text-px-text-muted pt-1">
                <span>
                  Expected Reduction: <strong className="text-px-emerald">-{autoDefense.expectedRiskReduction} pts</strong>
                </span>
                <span>
                  Utility Retained: <strong className="text-px-cyan">{autoDefense.utilityRetained}%</strong>
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={applyAutoDefense}
                disabled={loadingAuto || autoApplied}
                className="btn-primary py-3 px-6 flex items-center gap-2 font-bold shadow-lg shadow-px-cyan/20 disabled:opacity-60"
              >
                {loadingAuto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : autoApplied ? (
                  <CheckCircle2 className="w-4 h-4 text-px-emerald" />
                ) : (
                  <Zap className="w-4 h-4 text-px-cyan" />
                )}
                {loadingAuto
                  ? "Transforming & Persisting..."
                  : autoApplied
                  ? "Optimal Defense Active"
                  : "⚡ Activate Auto-Defense & Persist"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Compare Defenses Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={compareDefenses}
          disabled={loading}
          className="btn-success py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
          {loading ? "Simulating all defenses against ML battery..." : "Compare All 6 Defense Strategies"}
        </button>
        <button
          onClick={fetchAutoDefenseRecommendation}
          disabled={loadingAuto}
          className="btn-secondary py-3.5 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 text-px-cyan" />
          Re-evaluate Optimal Strategy
        </button>
      </div>

      {/* APPLIED DEFENSE RESULT CARD (WHAT HAS BEEN DONE) */}
      {applied && (
        <motion.div
          className="glass-card p-6 border-px-emerald/40 bg-gradient-to-b from-px-surface to-px-bg space-y-6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-px-border pb-4">
            <div>
              <div className="flex items-center gap-2 text-px-emerald">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-xl font-bold">
                  Defense Applied & Persisted — {applied.strategyName}
                </h2>
              </div>
              <p className="text-xs text-px-text-secondary mt-1">
                {applied.strategyDescription}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded bg-px-emerald/10 text-px-emerald border border-px-emerald/30 font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Saved to MongoDB
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-px-surface/40 border border-px-border">
              <div className="text-xs text-px-text-muted">Risk Before</div>
              <div className={`text-2xl font-bold ${getRiskColor(applied.riskBefore)}`}>
                {applied.riskBefore}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-px-surface/40 border border-px-border">
              <div className="text-xs text-px-text-muted">Risk After (Defended)</div>
              <div className={`text-2xl font-bold ${getRiskColor(applied.riskAfter)}`}>
                {applied.riskAfter}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-px-surface/40 border border-px-border">
              <div className="text-xs text-px-text-muted">Risk Reduction</div>
              <div className="text-2xl font-bold text-px-emerald">
                +{applied.privacyImprovement} pts
              </div>
            </div>
            <div className="p-3 rounded-lg bg-px-surface/40 border border-px-border">
              <div className="text-xs text-px-text-muted">Utility Preserved</div>
              <div className="text-2xl font-bold text-px-cyan">
                {applied.utilityRetained}%
              </div>
            </div>
          </div>

          {/* Tab Selector: Transformation Log vs Attack Breakdown vs ML Verification */}
          <div className="border-b border-px-border flex gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("transformations")}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "transformations"
                  ? "border-px-cyan text-px-cyan"
                  : "border-transparent text-px-text-muted hover:text-px-text"
              }`}
            >
              <Database className="w-4 h-4" />
              What Was Done (Database Transformations)
              {applied.transformationLog && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-px-cyan/20 text-px-cyan">
                  {applied.transformationLog.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("attacks")}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "attacks"
                  ? "border-px-cyan text-px-cyan"
                  : "border-transparent text-px-text-muted hover:text-px-text"
              }`}
            >
              <Target className="w-4 h-4" />
              Per-Attack Impact (9 Vectors)
            </button>

            {applied.mlDefenseResult && (
              <button
                onClick={() => setActiveTab("ml")}
                className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
                  activeTab === "ml"
                    ? "border-px-purple text-px-purple"
                    : "border-transparent text-px-text-muted hover:text-px-text"
                }`}
              >
                <Cpu className="w-4 h-4" />
                Python ML Model Verification
              </button>
            )}
          </div>

          {/* TAB 1: EXACT TRANSFORMATIONS LOG */}
          {activeTab === "transformations" && (
            <div className="space-y-3">
              <div className="text-xs text-px-text-secondary">
                The defense engine transformed the following database attributes before persisting back to MongoDB:
              </div>

              {applied.transformationLog && applied.transformationLog.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {applied.transformationLog.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-px-border bg-px-surface/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-px-cyan bg-px-cyan/10 px-2 py-0.5 rounded border border-px-cyan/20">
                          {t.field}
                        </span>
                        <span className="text-xs font-semibold text-px-emerald">
                          {t.eventCount} events modified
                        </span>
                      </div>
                      <div className="text-xs font-medium text-px-text">
                        Action: <strong>{t.action}</strong>
                      </div>
                      <div className="text-xs text-px-text-muted leading-relaxed">
                        {t.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-px-text-muted p-4 text-center rounded border border-px-border">
                  Standard privacy filters and normalization applied across all telemetry events.
                </div>
              )}

              <div className="p-3 rounded-lg bg-px-emerald/10 border border-px-emerald/30 text-xs text-px-emerald flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Persistence Verified:</strong> When you re-run an adversarial attack, the attacker will read these {applied.eventCountAfter} modified events instead of the raw data.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: ATTACK COMPARISONS */}
          {activeTab === "attacks" && (
            <div className="space-y-3">
              <div className="text-xs text-px-text-muted uppercase tracking-wider">
                Simulated Attack Battery Before vs After Defense
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {applied.attackComparisons?.map((ac) => (
                  <div
                    key={ac.type}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-px-surface/50 border border-px-border"
                  >
                    <span className="text-xs truncate w-36" title={ac.type}>
                      {ATTACK_LABELS[ac.type] || ac.type.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono ${getRiskColor(ac.riskBefore)}`}>
                        {ac.riskBefore}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-px-text-muted" />
                      <span className={`text-xs font-mono font-bold ${getRiskColor(ac.riskAfter)}`}>
                        {ac.riskAfter}
                      </span>
                      {ac.reduction > 0 && (
                        <span className="text-[10px] text-px-emerald font-bold">
                          (-{ac.reduction})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PYTHON ML MODEL VERIFICATION */}
          {activeTab === "ml" && applied.mlDefenseResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-px-text-secondary">
                <span>FastAPI Python Service (:8000) Defense Predictor Assessment</span>
                <span className="font-mono text-px-purple font-bold">
                  ML Risk Reduction: {applied.mlDefenseResult.mlRiskReduction}%
                </span>
              </div>

              {applied.mlDefenseResult.modelAssessments && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(applied.mlDefenseResult.modelAssessments).map(([name, assess]) => (
                    <div
                      key={name}
                      className="p-3.5 rounded-lg border border-px-border bg-px-surface/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-px-purple flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" />
                          {name.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            assess.effective
                              ? "bg-px-emerald/20 text-px-emerald"
                              : "bg-px-amber/20 text-px-amber"
                          }`}
                        >
                          {assess.effective ? "Effective Defense" : "Partial Mitigation"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-px-text-secondary pt-1">
                        <span>Pre-Defense Risk: <strong>{assess.risk_before}%</strong></span>
                        <span>Post-Defense Risk: <strong className="text-px-emerald">{assess.risk_after}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Re-Attack Validation CTA */}
          <div className="pt-2 border-t border-px-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-px-text-muted">
              Ready to verify? The Attack Simulator will now evaluate your protected data.
            </div>

            <Link
              href="/attack"
              className="btn-danger text-xs px-5 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-risk-critical/20"
            >
              <Target className="w-4 h-4" /> Re-Attack to Validate Defense
            </Link>
          </div>
        </motion.div>
      )}

      {/* Comparisons List (When user clicks 'Compare All Defenses') */}
      {comparisons.length > 0 && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-px-cyan" />
              <h2 className="font-bold text-sm">
                Strategy Comparison — Pre-Attack Simulation Matrix
              </h2>
            </div>
            <span className="text-xs text-px-text-muted">Click any strategy to inspect or apply</span>
          </div>

          {comparisons.map((c, i) => (
            <motion.div
              key={c.strategy}
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div
                onClick={() =>
                  setExpandedStrategy(expandedStrategy === c.strategy ? null : c.strategy)
                }
                className="w-full p-5 flex items-center justify-between hover:bg-px-surface/50 transition-colors cursor-pointer"
              >
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <span>{c.strategyName || c.strategy}</span>
                    {activeDefense?.selectedStrategy === c.strategy && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-px-emerald/20 text-px-emerald border border-px-emerald/30 font-bold">
                        ACTIVE IN DB
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-px-text-muted mt-0.5">
                    {c.strategyDescription}
                  </div>
                </div>

                <div className="flex items-center gap-5 ml-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-bold ${getRiskColor(c.riskBefore)}`}>{c.riskBefore}</span>
                    <ArrowRight className="w-3 h-3 text-px-text-muted" />
                    <span className={`font-bold ${getRiskColor(c.riskAfter)}`}>{c.riskAfter}</span>
                  </div>

                  {c.privacyImprovement > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-px-emerald bg-px-emerald/10 px-2 py-1 rounded-full">
                      <TrendingDown className="w-3 h-3" />
                      -{c.privacyImprovement}
                    </span>
                  ) : (
                    <span className="text-xs text-px-text-muted px-2 py-1">baseline</span>
                  )}

                  <span className="text-xs text-px-text-muted">{c.utilityRetained}% utility</span>

                  {c.strategy !== "none" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyDefense(c.strategy);
                      }}
                      disabled={applyingStrategy === c.strategy}
                      className="text-xs text-px-cyan hover:text-px-cyan/80 font-medium border border-px-cyan/30 px-3 py-1.5 rounded-lg hover:bg-px-cyan/10 transition-all disabled:opacity-50"
                    >
                      {applyingStrategy === c.strategy ? "Applying..." : "Apply & Persist"}
                    </button>
                  )}

                  <ChevronDown
                    className={`w-4 h-4 text-px-text-muted transition-transform ${
                      expandedStrategy === c.strategy ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedStrategy === c.strategy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-px-border p-5 space-y-4"
                  >
                    {/* Transformation Preview */}
                    {c.transformationLog && c.transformationLog.length > 0 && (
                      <div>
                        <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
                          Transformations That Will Be Applied:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {c.transformationLog.map((t, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded bg-px-surface/40 border border-px-border text-xs"
                            >
                              <div className="font-semibold text-px-cyan">{t.field}</div>
                              <div className="text-px-text-secondary">{t.action}</div>
                              <div className="text-[11px] text-px-text-muted mt-0.5">{t.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-attack breakdown */}
                    {c.attackComparisons && (
                      <div>
                        <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
                          Per-Attack Risk Reduction:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {c.attackComparisons.map((ac) => (
                            <div
                              key={ac.type}
                              className="flex items-center justify-between p-2 rounded bg-px-surface/30 text-xs"
                            >
                              <span className="truncate w-32">
                                {ATTACK_LABELS[ac.type] || ac.type.replace(/_/g, " ")}
                              </span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className={getRiskColor(ac.riskBefore)}>{ac.riskBefore}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-px-text-muted" />
                                <span className={`font-bold ${getRiskColor(ac.riskAfter)}`}>
                                  {ac.riskAfter}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Privacy / Utility Frontier Graphic */}
      {comparisons.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-px-amber" />
            Privacy / Utility Frontier Matrix
          </h2>
          <p className="text-xs text-px-text-muted mb-4">
            Each dot represents a defense strategy. The optimal Pareto frontier balances low risk with high data utility (bottom-right).
          </p>
          <div className="relative h-64 border-l-2 border-b-2 border-px-border ml-8 mb-8">
            <div className="absolute -left-12 top-0 text-xs text-px-text-muted">Risk ↑</div>
            <div className="absolute bottom-[-24px] right-0 text-xs text-px-text-muted">Utility →</div>
            {comparisons.map((c, i) => {
              const x = (c.utilityRetained / 100) * 100;
              const y = 100 - c.riskAfter;
              return (
                <motion.div
                  key={c.strategy}
                  className="absolute w-3.5 h-3.5 rounded-full bg-px-cyan cursor-pointer group shadow-sm shadow-px-cyan/50"
                  style={{ left: `${x}%`, bottom: `${y}%` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-px-bg-tertiary border border-px-border px-2.5 py-1.5 rounded text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                    <div className="font-bold text-px-text">{c.strategyName}</div>
                    <div className="text-px-text-secondary">
                      Risk: {c.riskAfter} · Utility: {c.utilityRetained}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
