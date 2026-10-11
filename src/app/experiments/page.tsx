"use client";

import { FlaskConical, Database, Brain, Sparkles, Target, Shield, CheckCircle, ChevronDown, Code, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  vulnerabilityFocus: string;
}

const PROFILES: ProfileOption[] = [
  {
    id: "software_engineer",
    name: "Software Engineer",
    emoji: "👩‍💻",
    description: "Heavy GitHub, StackOverflow, AWS, and late-night coding telemetry",
    vulnerabilityFocus: "Work schedule & Tech stack fingerprint",
  },
  {
    id: "student",
    name: "University Student",
    emoji: "🎓",
    description: "Irregular study hours, campus portals, research journals, Discord",
    vulnerabilityFocus: "Campus routine & Social graph correlation",
  },
  {
    id: "remote_worker",
    name: "Remote Worker",
    emoji: "🏡",
    description: "Home IP telemetry, constant Slack/Zoom, daytime errand browsing",
    vulnerabilityFocus: "Home location inference & Sleep cycles",
  },
  {
    id: "office_worker",
    name: "Corporate Executive",
    emoji: "💼",
    description: "Strict 9-to-5 corporate network, LinkedIn, financial news",
    vulnerabilityFocus: "Employer identity & Commute patterns",
  },
  {
    id: "frequent_traveler",
    name: "Digital Nomad",
    emoji: "✈️",
    description: "Shifting timezones, booking sites, hotel Wi-Fi, travel apps",
    vulnerabilityFocus: "Location trace correlation & Anomaly spikes",
  },
  {
    id: "researcher",
    name: "Academic Researcher",
    emoji: "🔬",
    description: "ArXiv, clinical databases, deep technical literature",
    vulnerabilityFocus: "Niche interest profiling & Re-identification",
  },
];

interface AttackResultSummary {
  type: string;
  confidence: number;
  risk: number;
  evidence?: Array<{ description: string }>;
}

export default function ExperimentsPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("software_engineer");
  const [showRawJson, setShowRawJson] = useState(false);

  const runExperiment = async () => {
    setRunning(true);
    try {
      // 1. Generate synthetic data for the selected profile
      const genRes = await fetch("/api/synthetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: selectedProfile, days: 14, eventsPerDay: 25 }),
      });
      const genData = await genRes.json();

      // 2. Run attack simulation on generated data
      const attackRes = await fetch("/api/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackProfile: "moderate" }),
      });
      const attackData = await attackRes.json();

      setResults({ ...genData, ...attackData });
    } catch (e) {
      console.error("Experiment failed:", e);
    } finally {
      setRunning(false);
    }
  };

  const currentProfile = PROFILES.find((p) => p.id === selectedProfile) || PROFILES[0];
  const attacks = (results?.attacks as AttackResultSummary[]) || [];
  const eventCount = (results?.count as number) || (results?.totalEvents as number) || 350;
  const overallRisk = (results?.overallRisk as number) || (attacks.length > 0 ? Math.round(attacks.reduce((a, b) => a + b.risk, 0) / attacks.length) : null);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-px-purple" />
            ML Privacy Sandbox
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Simulate realistic persona footprints and benchmark ML adversary models in an isolated environment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-px-purple/10 text-px-purple border border-px-purple/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Synthetic Benchmarking
          </span>
        </div>
      </div>

      {/* Profile Selector Card */}
      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-px-text-secondary flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-px-cyan" />
            1. Select Behavioral Archetype
          </h2>
          <p className="text-xs text-px-text-muted">
            Choose a persona to synthesize 14 days of realistic browsing and timestamp patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROFILES.map((p) => {
            const isSelected = selectedProfile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 relative group ${
                  isSelected
                    ? "border-px-cyan bg-px-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.15)] ring-1 ring-px-cyan/40"
                    : "border-px-border bg-px-surface/40 hover:bg-px-surface/80 hover:border-px-border-light"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-1.5 bg-px-bg/80 rounded-lg border border-px-border/50">
                    {p.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white group-hover:text-px-cyan transition-colors">
                        {p.name}
                      </span>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-px-cyan flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-px-text-muted mt-1 leading-snug line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-2 text-[10px] text-px-amber font-mono">
                      Target: {p.vulnerabilityFocus}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-px-border/60">
          <div className="text-xs text-px-text-secondary flex items-center gap-2">
            <span>Selected Archetype:</span>
            <strong className="text-px-cyan font-semibold flex items-center gap-1">
              <span>{currentProfile.emoji}</span>
              <span>{currentProfile.name}</span>
            </strong>
          </div>

          <button
            onClick={runExperiment}
            disabled={running}
            className="btn-primary py-3 px-6 flex items-center justify-center gap-2 font-bold shadow-lg shadow-px-cyan/20 disabled:opacity-50"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
                <span>Simulating ML Battery (14 Days)...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Run Synthetic ML Experiment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 border-px-cyan/30">
              <div className="text-[11px] text-px-text-muted uppercase tracking-wider mb-1">
                Telemetry Generated
              </div>
              <div className="text-2xl font-bold text-px-cyan font-mono">
                {eventCount} events
              </div>
              <div className="text-[10px] text-px-text-muted mt-1">14-day temporal span</div>
            </div>

            <div className="glass-card p-4 border-risk-high/30">
              <div className="text-[11px] text-px-text-muted uppercase tracking-wider mb-1">
                Adversary Exposure
              </div>
              <div className="text-2xl font-bold text-risk-high font-mono">
                {overallRisk !== null ? `${overallRisk}/100` : "Calculated"}
              </div>
              <div className="text-[10px] text-px-text-muted mt-1">Simulated risk score</div>
            </div>

            <div className="glass-card p-4 border-px-purple/30">
              <div className="text-[11px] text-px-text-muted uppercase tracking-wider mb-1">
                Inferences Deduced
              </div>
              <div className="text-2xl font-bold text-px-purple font-mono">
                {attacks.length} findings
              </div>
              <div className="text-[10px] text-px-text-muted mt-1">Attack vectors succeeded</div>
            </div>

            <div className="glass-card p-4 border-px-emerald/30">
              <div className="text-[11px] text-px-text-muted uppercase tracking-wider mb-1">
                Environment
              </div>
              <div className="text-2xl font-bold text-px-emerald flex items-center gap-1.5 text-lg">
                <Shield className="w-5 h-5" />
                <span>Isolated</span>
              </div>
              <div className="text-[10px] text-px-text-muted mt-1">Safe sandbox execution</div>
            </div>
          </div>

          {/* Detailed Attack Findings */}
          {attacks.length > 0 && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-px-magenta" />
                Discovered Vulnerability Vectors
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attacks.map((atk, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-px-border bg-px-surface/40 space-y-2 hover:border-px-cyan/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-px-text capitalize">
                        {atk.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          atk.risk > 60
                            ? "bg-risk-critical/20 text-risk-critical"
                            : atk.risk > 40
                            ? "bg-risk-medium/20 text-risk-medium"
                            : "bg-risk-low/20 text-risk-low"
                        }`}
                      >
                        Risk {atk.risk}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-px-text-secondary">
                      <span>Model Confidence: {Math.round(atk.confidence * 100)}%</span>
                      {atk.evidence && (
                        <span>· {atk.evidence.length} evidence signals</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON inspection toggle */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-px-text">
                <Code className="w-4 h-4 text-px-cyan" />
                <span>Raw Diagnostic JSON</span>
              </div>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs text-px-cyan hover:underline flex items-center gap-1"
              >
                <span>{showRawJson ? "Hide JSON" : "Inspect Raw Payloads"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRawJson ? "rotate-180" : ""}`} />
              </button>
            </div>

            <AnimatePresence>
              {showRawJson && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <pre className="text-xs text-px-cyan/90 bg-px-bg/90 border border-px-border/80 p-4 rounded-lg overflow-x-auto max-h-96 font-mono custom-scrollbar">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
