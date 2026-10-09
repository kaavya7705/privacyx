"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Shield, Crosshair, Brain, BarChart3, Eye, CheckCircle,
  AlertTriangle, ChevronDown, Sparkles, Cpu, Bot, ShieldCheck,
  ShieldAlert, RefreshCw, ArrowRight, TrendingDown, Layers, Zap
} from "lucide-react";
import Link from "next/link";

type AdversaryProfile = "weak" | "moderate" | "strong" | "targeted";

const PROFILES: Record<AdversaryProfile, { label: string; desc: string; color: string }> = {
  weak: { label: "Weak", desc: "Only observes raw telemetry data", color: "text-risk-low" },
  moderate: { label: "Moderate", desc: "Telemetry + temporal inference", color: "text-risk-medium" },
  strong: { label: "Strong", desc: "Telemetry + ML pattern classifiers", color: "text-risk-high" },
  targeted: { label: "Targeted", desc: "Multi-vector ML re-identification", color: "text-risk-critical" },
};

const ATTACK_STEPS = [
  { icon: Eye, label: "Scanning authorized telemetry events", duration: 700 },
  { icon: BarChart3, label: "Extracting temporal, behavioral & identity features", duration: 600 },
  { icon: Brain, label: "Executing Python ML ensemble (IsolationForest & Autoencoder)", duration: 900 },
  { icon: Crosshair, label: "Evaluating active privacy defenses & data obfuscation", duration: 700 },
  { icon: Target, label: "Testing 9 adversarial re-identification attack vectors", duration: 800 },
  { icon: Shield, label: "Computing differential risk mitigation metrics", duration: 500 },
  { icon: BarChart3, label: "Constructing attack evidence dependency graph", duration: 500 },
  { icon: Sparkles, label: "Generating AI adversarial threat report (openai/gpt-oss-20b)", duration: 600 },
];

interface AttackResult {
  type: string;
  confidence: number;
  risk: number;
  evidenceCount: number;
  evidence: Array<{ id: string; description: string; strength: number }>;
  assumptions: string[];
  alternatives: string[];
  details: Record<string, unknown>;
}

interface ActiveDefenseInfo {
  strategy: string;
  strategyName: string;
  appliedAt?: string | Date;
  riskBeforeDefense?: number;
  riskAfterDefense?: number;
  transformationLog?: Array<{
    field: string;
    action: string;
    eventCount: number;
    description: string;
  }>;
  mlRiskReduction?: number;
  mlModelsUsed?: string[];
}

function getRiskColor(score: number) {
  if (score <= 30) return "text-risk-low";
  if (score <= 60) return "text-risk-medium";
  if (score <= 80) return "text-risk-high";
  return "text-risk-critical";
}

function getRiskBadge(score: number) {
  if (score <= 30) return "risk-badge-low";
  if (score <= 60) return "risk-badge-medium";
  if (score <= 80) return "risk-badge-high";
  return "risk-badge-critical";
}

export default function AttackPage() {
  const [profile, setProfile] = useState<AdversaryProfile>("moderate");
  const [phase, setPhase] = useState<"idle" | "running" | "complete">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<AttackResult[]>([]);
  const [overallRisk, setOverallRisk] = useState(0);
  const [expandedAttack, setExpandedAttack] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [mlUsed, setMlUsed] = useState(false);
  const [mlStats, setMlStats] = useState<{
    anomalyCount?: number;
    anomalyPercentage?: number;
    routineCount?: number;
    reidRisk?: number;
  } | null>(null);

  // Defense status tracking
  const [activeDefense, setActiveDefense] = useState<ActiveDefenseInfo | null>(null);
  const [defenseLoading, setDefenseLoading] = useState(false);
  const [resettingDefense, setResettingDefense] = useState(false);

  const [explaining, setExplaining] = useState<Record<string, boolean>>({});
  const [explanations, setExplanations] = useState<Record<string, {
    attackNarrative: string;
    evidenceExplanation: string;
    remediation: string;
    summary: string;
  }>>({});

  // Check active defense status on mount
  const checkDefenseStatus = useCallback(async () => {
    try {
      setDefenseLoading(true);
      const res = await fetch("/api/defense");
      const data = await res.json();
      if (data.activeDefense) {
        setActiveDefense({
          strategy: data.activeDefense.selectedStrategy,
          strategyName: data.activeDefense.strategies?.[0]?.name || data.activeDefense.selectedStrategy,
          appliedAt: data.activeDefense.createdAt,
          riskBeforeDefense: data.activeDefense.riskBefore,
          riskAfterDefense: data.activeDefense.riskAfter,
          transformationLog: data.activeDefense.transformationLog || [],
          mlRiskReduction: data.activeDefense.mlRiskReduction || 0,
          mlModelsUsed: data.activeDefense.mlModelsUsed || [],
        });
      } else {
        setActiveDefense(null);
      }
    } catch (e) {
      console.warn("Failed to check defense status:", e);
    } finally {
      setDefenseLoading(false);
    }
  }, []);

  useEffect(() => {
    checkDefenseStatus();
  }, [checkDefenseStatus]);

  // Reset defense / revert back to baseline
  const resetDefense = async () => {
    setResettingDefense(true);
    try {
      const res = await fetch("/api/defense", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActiveDefense(null);
        setPhase("idle");
      }
    } catch (e) {
      console.error("Failed to reset defense:", e);
    } finally {
      setResettingDefense(false);
    }
  };

  const runAttack = useCallback(async () => {
    setPhase("running");
    setCurrentStep(0);
    setResults([]);
    setAiReport(null);
    setMlUsed(false);
    setMlStats(null);

    // Animate through attack steps
    for (let i = 0; i < ATTACK_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, ATTACK_STEPS[i].duration));
    }

    try {
      const res = await fetch("/api/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackProfile: profile }),
      });
      const data = await res.json();
      setResults(data.attacks || []);
      setOverallRisk(data.overallRisk || 0);
      setAiReport(data.aiReport || null);
      setMlUsed(Boolean(data.mlServiceUsed));
      setMlStats(data.mlStats || null);

      if (data.activeDefense) {
        setActiveDefense(data.activeDefense);
      } else if (data.defenseActive === false) {
        setActiveDefense(null);
      }
    } catch (e) {
      console.error("Attack error:", e);
    }

    setPhase("complete");
  }, [profile]);

  const getExplanation = async (attack: AttackResult) => {
    if (explanations[attack.type]) return;
    setExplaining((prev) => ({ ...prev, [attack.type]: true }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attack: {
            ...attack,
            adversaryProfile: profile,
          },
        }),
      });
      const data = await res.json();
      if (data.explanation) {
        setExplanations((prev) => ({ ...prev, [attack.type]: data.explanation }));
      }
    } catch (e) {
      console.error("Failed to get explanation:", e);
    } finally {
      setExplaining((prev) => ({ ...prev, [attack.type]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-px-magenta" />
            Adversarial Attack Simulator
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Simulate realistic privacy attacks against your telemetry — powered by Scikit-Learn ML and Groq LLMs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/defense"
            className="btn-secondary text-xs flex items-center gap-2 py-2 px-3 border border-px-cyan/30 text-px-cyan hover:bg-px-cyan/10"
          >
            <ShieldCheck className="w-4 h-4" /> Defense Center
          </Link>
        </div>
      </div>

      {/* ACTIVE DEFENSE STATUS BANNER */}
      {activeDefense ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-px-emerald/40 bg-gradient-to-r from-px-surface via-px-surface-light to-px-surface p-5 shadow-lg shadow-px-emerald/5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-px-emerald/20 text-px-emerald border border-px-emerald/40 animate-pulse">
                  <ShieldCheck className="w-4 h-4" /> ACTIVE DEFENSE DEPLOYED
                </span>
                <span className="text-xs font-mono text-px-text-muted">
                  Strategy: <strong className="text-px-text">{activeDefense.strategyName}</strong>
                </span>
              </div>

              <div className="text-sm text-px-text-secondary flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  Telemetry Status: <strong className="text-px-emerald">Masked in MongoDB</strong>
                </span>
                {activeDefense.riskBeforeDefense !== undefined && activeDefense.riskAfterDefense !== undefined && (
                  <span>
                    Baseline Risk: <span className="line-through text-px-text-muted">{activeDefense.riskBeforeDefense}%</span>{" "}
                    → Protected: <strong className="text-px-emerald font-bold">{activeDefense.riskAfterDefense}%</strong>{" "}
                    <span className="text-xs text-px-emerald font-semibold">
                      (-{activeDefense.riskBeforeDefense - activeDefense.riskAfterDefense} pts)
                    </span>
                  </span>
                )}
                {activeDefense.transformationLog && activeDefense.transformationLog.length > 0 && (
                  <span className="text-xs text-px-cyan">
                    • {activeDefense.transformationLog.reduce((s, t) => s + t.eventCount, 0)} events transformed
                  </span>
                )}
              </div>

              <p className="text-xs text-px-text-muted">
                Any attacks executed now will encounter obfuscated, differentially private telemetry data.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={resetDefense}
                disabled={resettingDefense}
                className="btn-secondary text-xs flex items-center gap-2 py-2 px-3 border border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 disabled:opacity-50"
                title="Deactivate defense to test unprotected attack against raw telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resettingDefense ? "animate-spin" : ""}`} />
                {resettingDefense ? "Restoring Baseline..." : "Reset to Unprotected"}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-risk-high/30 bg-risk-high/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-risk-high flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-risk-high uppercase tracking-wide">Telemetry Unprotected: </span>
              <span className="text-px-text-secondary">
                Raw database events are exposed with 0 defenses active. Adversarial ML models can reconstruct routine & identity.
              </span>
            </div>
          </div>
          <Link
            href="/defense"
            className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 self-start sm:self-auto flex-shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-px-cyan" /> Apply Defense First
          </Link>
        </div>
      )}

      {/* Adversary Profile Selector */}
      <div className="glass-card p-6">
        <h2 className="text-sm text-px-text-muted uppercase tracking-wider mb-4 font-medium flex items-center justify-between">
          <span>Attacker Capability Profile</span>
          <span className="text-xs normal-case text-px-text-secondary">Select adversarial strength</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PROFILES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setProfile(key as AdversaryProfile)}
              className={`p-4 rounded-lg border transition-all text-left ${
                profile === key
                  ? "border-px-cyan bg-px-cyan/10 shadow-sm shadow-px-cyan/20"
                  : "border-px-border hover:border-px-border-light hover:bg-px-surface/40"
              }`}
            >
              <div className={`text-sm font-bold ${p.color}`}>{p.label}</div>
              <div className="text-xs text-px-text-muted mt-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Run Button */}
      {phase === "idle" && (
        <motion.button
          onClick={runAttack}
          className="btn-danger w-full py-5 text-lg flex items-center justify-center gap-3 font-bold shadow-lg shadow-risk-critical/20"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Target className="w-6 h-6" />
          {activeDefense ? "TEST ATTACK AGAINST PROTECTED DATA" : "RUN PRIVACY ATTACK (UNPROTECTED)"}
        </motion.button>
      )}

      {/* Attack Progress Animation */}
      {phase === "running" && (
        <div className="glass-card p-8">
          <div className="space-y-4">
            {ATTACK_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                className="flex items-center gap-4"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: i <= currentStep ? 1 : 0.3 }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    i < currentStep
                      ? "border-px-emerald bg-px-emerald/20 text-px-emerald"
                      : i === currentStep
                      ? "border-px-cyan bg-px-cyan/20 text-px-cyan animate-pulse shadow-md shadow-px-cyan/30"
                      : "border-px-border text-px-text-muted"
                  }`}
                >
                  {i < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    i <= currentStep ? "text-px-text" : "text-px-text-muted"
                  }`}
                >
                  {step.label}
                </span>
                {i === currentStep && (
                  <div className="ml-auto flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Results Screen */}
      {phase === "complete" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Overall Result & Defense Impact Card */}
          <div className="glass-card p-8 text-center relative overflow-hidden">
            {/* Active Defense Badge inside result */}
            {activeDefense ? (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-px-emerald/15 border border-px-emerald/30 text-px-emerald text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Protected by {activeDefense.strategyName}</span>
              </div>
            ) : (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-risk-high/15 border border-risk-high/30 text-risk-high text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>No Defense Active — Raw Telemetry Inferred</span>
              </div>
            )}

            <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
              Attack Run Complete — Final Risk Score
            </div>

            <div className="flex items-center justify-center gap-6 my-2">
              {activeDefense && activeDefense.riskBeforeDefense ? (
                <div className="flex items-center gap-4">
                  <div className="text-center opacity-50">
                    <div className="text-xs text-px-text-muted uppercase">Before Defense</div>
                    <div className="text-4xl font-bold line-through text-px-text-muted">
                      {activeDefense.riskBeforeDefense}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-px-emerald" />
                  <div className="text-center">
                    <div className="text-xs text-px-emerald font-bold uppercase">Defended Risk</div>
                    <div className={`text-7xl font-black ${getRiskColor(overallRisk)}`}>
                      {overallRisk}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`text-7xl font-black ${getRiskColor(overallRisk)}`}>
                  {overallRisk}
                </div>
              )}
            </div>

            <div className="text-lg text-px-text-secondary">/100</div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={getRiskBadge(overallRisk)}>
                {overallRisk <= 30
                  ? "LOW RISK — PROTECTED"
                  : overallRisk <= 60
                  ? "MEDIUM RISK"
                  : overallRisk <= 80
                  ? "HIGH RISK"
                  : "CRITICAL RISK"}
              </span>

              {activeDefense && (
                <span className="text-xs font-bold text-px-emerald bg-px-emerald/10 border border-px-emerald/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Protected by Active Defense
                </span>
              )}
            </div>

            {/* Microservice & ML Engine Status Indicators */}
            <div className="mt-6 pt-6 border-t border-px-border flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-px-surface border border-px-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    mlUsed ? "bg-px-emerald animate-pulse" : "bg-px-amber"
                  }`}
                />
                <Cpu className="w-3.5 h-3.5 text-px-purple" />
                <span>
                  Python ML Service (FastAPI :8000): <strong>{mlUsed ? "Active & Ensembled" : "Heuristic"}</strong>
                </span>
                {mlStats && (
                  <span className="text-px-text-muted">
                    ({mlStats.anomalyCount} anomalies, {mlStats.routineCount} routines)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-px-surface border border-px-border">
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiReport ? "bg-px-cyan animate-pulse" : "bg-px-text-muted"
                  }`}
                />
                <Sparkles className="w-3.5 h-3.5 text-px-cyan" />
                <span>AI Reasoner: <strong>openai/gpt-oss-20b (Groq)</strong></span>
              </div>

              {activeDefense && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-px-emerald/10 border border-px-emerald/30 text-px-emerald">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Defense Verified: <strong>{activeDefense.strategyName}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* AI Threat Report */}
          {aiReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-px-cyan/30 bg-gradient-to-r from-px-surface via-px-card to-px-surface"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-px-cyan font-bold text-base">
                  <Bot className="w-5 h-5" />
                  <span>AI Adversarial Assessment Report</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-px-cyan/20 text-px-cyan font-mono font-normal">
                    openai/gpt-oss-20b
                  </span>
                </div>
                <div className="text-xs text-px-text-muted flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-px-emerald" /> Verified by PrivacyX Engine
                </div>
              </div>
              <div className="text-sm text-px-text-secondary whitespace-pre-line leading-relaxed bg-px-bg/50 p-4 rounded-lg border border-px-border">
                {aiReport}
              </div>
            </motion.div>
          )}

          {/* Individual Attacks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-px-text-muted uppercase tracking-wider px-1">
              <span>9 Adversarial Attack Vectors Evaluated</span>
              <span>Confidence & Risk</span>
            </div>

            {results.map((attack, i) => {
              const isMitigated = activeDefense && attack.risk <= 35;
              return (
                <motion.div
                  key={attack.type}
                  className="glass-card overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => setExpandedAttack(expandedAttack === attack.type ? null : attack.type)}
                    className="w-full p-5 flex items-center justify-between hover:bg-px-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          attack.risk > 60
                            ? "bg-risk-critical"
                            : attack.risk > 35
                            ? "bg-risk-medium"
                            : "bg-risk-low"
                        }`}
                      />
                      <div className="text-left">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span>{attack.type.replace(/_/g, " ")}</span>
                          {isMitigated && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-px-emerald/20 text-px-emerald border border-px-emerald/30 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Mitigated
                            </span>
                          )}
                          {attack.type.includes("ANOMALY") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-px-purple/20 text-px-purple font-mono">
                              IsolationForest ML
                            </span>
                          )}
                          {attack.type.includes("REIDENTIFICATION") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-px-cyan/20 text-px-cyan font-mono">
                              Classifier ML
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-px-text-muted">
                          {attack.evidenceCount} evidence signals captured
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold font-mono ${getRiskColor(attack.risk)}`}>
                        {attack.confidence}%
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-px-text-muted transition-transform ${
                          expandedAttack === attack.type ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedAttack === attack.type && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-px-border"
                      >
                        <div className="p-5 space-y-4">
                          {/* Evidence */}
                          <div>
                            <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
                              Observed Evidence Signals
                            </div>
                            {attack.evidence.map((e) => (
                              <div key={e.id} className="flex items-start gap-2 py-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-px-amber mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-px-text-secondary">{e.description}</span>
                              </div>
                            ))}
                          </div>

                          {/* Assumptions */}
                          {attack.assumptions.length > 0 && (
                            <div>
                              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
                                Adversarial Assumptions
                              </div>
                              {attack.assumptions.map((a, j) => (
                                <div key={j} className="text-xs text-px-text-muted py-0.5">
                                  • {a}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Alternatives */}
                          {attack.alternatives.length > 0 && (
                            <div>
                              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">
                                Alternative Explanations
                              </div>
                              {attack.alternatives.map((a, j) => (
                                <div key={j} className="text-xs text-px-text-muted py-0.5">
                                  • {a}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* AI Deep Explainer */}
                          <div className="pt-3 border-t border-px-border/50">
                            {!explanations[attack.type] ? (
                              <button
                                onClick={() => getExplanation(attack)}
                                disabled={explaining[attack.type]}
                                className="btn-primary text-xs flex items-center gap-2 py-2 px-3 disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {explaining[attack.type]
                                  ? "Generating AI Narrative (openai/gpt-oss-20b)..."
                                  : "🤖 Explain with AI & Recommend Remediations"}
                              </button>
                            ) : (
                              <div className="p-4 rounded-lg bg-px-bg border border-px-cyan/30 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-px-cyan">
                                  <Bot className="w-4 h-4" />
                                  <span>AI Threat Analysis (openai/gpt-oss-20b)</span>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-wider text-px-text-muted">
                                    Adversary Narrative
                                  </div>
                                  <p className="text-sm text-px-text mt-1">
                                    {explanations[attack.type].attackNarrative}
                                  </p>
                                </div>
                                <div>
                                  <div className="text-[11px] uppercase tracking-wider text-px-text-muted">
                                    Evidence Evaluation
                                  </div>
                                  <p className="text-xs text-px-text-secondary whitespace-pre-line mt-1">
                                    {explanations[attack.type].evidenceExplanation}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded bg-px-emerald/10 border border-px-emerald/30">
                                  <div className="text-[11px] uppercase tracking-wider text-px-emerald font-bold">
                                    Recommended Remediation
                                  </div>
                                  <p className="text-xs text-px-text-secondary mt-1">
                                    {explanations[attack.type].remediation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => runAttack()}
              className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 font-bold"
            >
              <Target className="w-5 h-5" />
              Re-Run Attack Battery
            </button>
            <Link
              href="/defense"
              className="btn-secondary py-4 px-6 flex items-center justify-center gap-2 text-px-cyan border border-px-cyan/30 hover:bg-px-cyan/10"
            >
              <ShieldCheck className="w-5 h-5" />
              Tune / Change Defense Strategy
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
