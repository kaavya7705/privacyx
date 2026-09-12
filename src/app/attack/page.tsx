"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Shield, Crosshair, Brain, BarChart3, Eye, CheckCircle,
  AlertTriangle, ChevronDown, Sparkles, Cpu, Bot, FileText
} from "lucide-react";

type AdversaryProfile = "weak" | "moderate" | "strong" | "targeted";

const PROFILES: Record<AdversaryProfile, { label: string; desc: string; color: string }> = {
  weak: { label: "Weak", desc: "Only observes telemetry data", color: "text-risk-low" },
  moderate: { label: "Moderate", desc: "Telemetry + public context", color: "text-risk-medium" },
  strong: { label: "Strong", desc: "Telemetry + external datasets", color: "text-risk-high" },
  targeted: { label: "Targeted", desc: "Telemetry + prior knowledge", color: "text-risk-critical" },
};

const ATTACK_STEPS = [
  { icon: Eye, label: "Collecting authorized evidence", duration: 800 },
  { icon: BarChart3, label: "Extracting features", duration: 600 },
  { icon: Brain, label: "Running Python ML pattern detection (Scikit-Learn)", duration: 1000 },
  { icon: Crosshair, label: "Finding correlations", duration: 700 },
  { icon: Target, label: "Testing attack models", duration: 900 },
  { icon: Shield, label: "Calculating risk", duration: 500 },
  { icon: BarChart3, label: "Building evidence graph", duration: 600 },
  { icon: Sparkles, label: "Generating AI explanation (openai/gpt-oss-20b)", duration: 600 },
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
  const [explaining, setExplaining] = useState<Record<string, boolean>>({});
  const [explanations, setExplanations] = useState<Record<string, {
    attackNarrative: string;
    evidenceExplanation: string;
    remediation: string;
    summary: string;
  }>>({});

  const runAttack = useCallback(async () => {
    setPhase("running");
    setCurrentStep(0);
    setResults([]);
    setAiReport(null);
    setMlUsed(false);
    setMlStats(null);

    // Animate through steps
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-px-magenta" />
            Privacy Attack
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">Simulate adversarial privacy analysis on your digital traces</p>
        </div>
      </div>

      {/* Adversary Profile Selector */}
      <div className="glass-card p-6">
        <h2 className="text-sm text-px-text-muted uppercase tracking-wider mb-4 font-medium">Attacker Profile</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PROFILES).map(([key, p]) => (
            <button key={key} onClick={() => setProfile(key as AdversaryProfile)}
              className={`p-4 rounded-lg border transition-all text-left ${
                profile === key
                  ? "border-px-cyan bg-px-cyan/10"
                  : "border-px-border hover:border-px-border-light"
              }`}>
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
          className="btn-danger w-full py-5 text-lg flex items-center justify-center gap-3"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Target className="w-6 h-6" />
          RUN PRIVACY ATTACK
        </motion.button>
      )}

      {/* Attack Progress */}
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                  i < currentStep ? "border-px-emerald bg-px-emerald/20" :
                  i === currentStep ? "border-px-cyan bg-px-cyan/20 animate-pulse" :
                  "border-px-border"
                }`}>
                  {i < currentStep ? <CheckCircle className="w-4 h-4 text-px-emerald" /> :
                   i === currentStep ? <step.icon className="w-4 h-4 text-px-cyan" /> :
                   <step.icon className="w-4 h-4 text-px-text-muted" />}
                </div>
                <span className={`text-sm ${i <= currentStep ? "text-px-text" : "text-px-text-muted"}`}>
                  {step.label}
                </span>
                {i === currentStep && (
                  <div className="ml-auto flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-px-cyan animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "complete" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Overall Result */}
          <div className="glass-card p-8 text-center relative overflow-hidden">
            <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Attack Complete — Overall Risk</div>
            <div className={`text-7xl font-black ${getRiskColor(overallRisk)}`}>{overallRisk}</div>
            <div className="text-lg text-px-text-secondary">/100</div>
            <div className="mt-3">
              <span className={getRiskBadge(overallRisk)}>
                {overallRisk <= 30 ? "LOW" : overallRisk <= 60 ? "MEDIUM" : overallRisk <= 80 ? "HIGH" : "CRITICAL"}
              </span>
            </div>

            {/* Microservice & AI Engine Status Indicators */}
            <div className="mt-6 pt-6 border-t border-px-border flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-px-surface border border-px-border">
                <span className={`w-2 h-2 rounded-full ${mlUsed ? "bg-px-emerald animate-pulse" : "bg-px-amber"}`} />
                <Cpu className="w-3.5 h-3.5 text-px-purple" />
                <span>Python ML (FastAPI :8000): <strong>{mlUsed ? "Active" : "Heuristic Fallback"}</strong></span>
                {mlStats && (
                  <span className="text-px-text-muted">
                    ({mlStats.anomalyCount} anomalies, {mlStats.routineCount} routines)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-px-surface border border-px-border">
                <span className={`w-2 h-2 rounded-full ${aiReport ? "bg-px-cyan animate-pulse" : "bg-px-text-muted"}`} />
                <Sparkles className="w-3.5 h-3.5 text-px-cyan" />
                <span>AI Model: <strong>openai/gpt-oss-20b (Groq)</strong></span>
              </div>
            </div>
          </div>

          {/* AI Executive Privacy Risk Report */}
          {aiReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-px-cyan/30 bg-gradient-to-r from-px-surface via-px-card to-px-surface"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-px-cyan font-bold text-base">
                  <Bot className="w-5 h-5" />
                  <span>AI Executive Threat Report</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-px-cyan/20 text-px-cyan font-mono font-normal">openai/gpt-oss-20b</span>
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

          {/* Individual Attacks */}
          <div className="space-y-3">
            {results.map((attack, i) => (
              <motion.div
                key={attack.type}
                className="glass-card overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setExpandedAttack(expandedAttack === attack.type ? null : attack.type)}
                  className="w-full p-5 flex items-center justify-between hover:bg-px-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${attack.risk > 60 ? "bg-risk-critical" : attack.risk > 40 ? "bg-risk-medium" : "bg-risk-low"}`} />
                    <div className="text-left">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span>{attack.type.replace(/_/g, " ")}</span>
                        {attack.type.includes("ANOMALY") && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-px-purple/20 text-px-purple font-mono">Scikit-Learn ML</span>
                        )}
                      </div>
                      <div className="text-xs text-px-text-muted">{attack.evidenceCount} evidence signals</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${getRiskColor(attack.risk)}`}>{attack.confidence}%</div>
                    <ChevronDown className={`w-4 h-4 text-px-text-muted transition-transform ${expandedAttack === attack.type ? "rotate-180" : ""}`} />
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
                          <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Evidence</div>
                          {attack.evidence.map((e) => (
                            <div key={e.id} className="flex items-start gap-2 py-1.5">
                              <AlertTriangle className="w-3 h-3 text-px-amber mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-px-text-secondary">{e.description}</span>
                            </div>
                          ))}
                        </div>

                        {/* Assumptions */}
                        <div>
                          <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Assumptions</div>
                          {attack.assumptions.map((a, j) => (
                            <div key={j} className="text-sm text-px-text-muted py-0.5">• {a}</div>
                          ))}
                        </div>

                        {/* Alternatives */}
                        <div>
                          <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Alternative Explanations</div>
                          {attack.alternatives.map((a, j) => (
                            <div key={j} className="text-sm text-px-text-muted py-0.5">• {a}</div>
                          ))}
                        </div>

                        {/* AI Deep Explainer Card */}
                        <div className="pt-3 border-t border-px-border/50">
                          {!explanations[attack.type] ? (
                            <button
                              onClick={() => getExplanation(attack)}
                              disabled={explaining[attack.type]}
                              className="btn-primary text-xs flex items-center gap-2 py-2 px-3 disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {explaining[attack.type] ? "Generating AI Narrative (openai/gpt-oss-20b)..." : "🤖 Explain with AI & Recommend Remediations"}
                            </button>
                          ) : (
                            <div className="p-4 rounded-lg bg-px-bg border border-px-cyan/30 space-y-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-px-cyan">
                                <Bot className="w-4 h-4" />
                                <span>AI Threat Analysis (openai/gpt-oss-20b)</span>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wider text-px-text-muted">Adversary Narrative</div>
                                <p className="text-sm text-px-text mt-1">{explanations[attack.type].attackNarrative}</p>
                              </div>
                              <div>
                                <div className="text-[11px] uppercase tracking-wider text-px-text-muted">Evidence Evaluation</div>
                                <p className="text-xs text-px-text-secondary whitespace-pre-line mt-1">{explanations[attack.type].evidenceExplanation}</p>
                              </div>
                              <div className="p-2.5 rounded bg-px-emerald/10 border border-px-emerald/30">
                                <div className="text-[11px] uppercase tracking-wider text-px-emerald font-bold">Recommended Remediation</div>
                                <p className="text-xs text-px-text-secondary mt-1">{explanations[attack.type].remediation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Run Again */}
          <button onClick={() => setPhase("idle")} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
            <Target className="w-5 h-5" />
            Run Another Attack
          </button>
        </motion.div>
      )}
    </div>
  );
}
