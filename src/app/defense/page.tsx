"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingDown, BarChart3, Zap, Target } from "lucide-react";

interface DefenseComparison {
  strategy: string;
  riskBefore: number;
  riskAfter: number;
  utilityRetained: number;
  privacyImprovement: number;
}

const STRATEGY_LABELS: Record<string, string> = {
  none: "None (Baseline)", timestamp_bucketing: "Timestamp Bucketing",
  location_generalization: "Location Generalization", aggregation: "Category Aggregation",
  suppression: "Low-Frequency Suppression", noise: "Noise Injection",
  k_anonymity: "K-Anonymity (k=5)", differential_privacy: "Differential Privacy (ε=1.0)",
  combined: "Combined Defense",
};

function getRiskColor(score: number) {
  if (score <= 30) return "text-risk-low";
  if (score <= 60) return "text-risk-medium";
  if (score <= 80) return "text-risk-high";
  return "text-risk-critical";
}

export default function DefensePage() {
  const [comparisons, setComparisons] = useState<DefenseComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<DefenseComparison | null>(null);

  const compareDefenses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setComparisons(data.comparisons || []);
    } catch (e) {
      console.error("Defense error:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyDefense = async (strategy: string) => {
    try {
      const res = await fetch("/api/defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy }),
      });
      const data = await res.json();
      setApplied(data.result);
    } catch (e) {
      console.error("Apply defense error:", e);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-px-emerald" />
          Defense Engine
        </h1>
        <p className="text-sm text-px-text-secondary mt-1">Compare and apply privacy-preserving transformations</p>
      </div>

      {/* Compare Button */}
      <button onClick={compareDefenses} disabled={loading}
        className="btn-success w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50">
        <BarChart3 className="w-5 h-5" />
        {loading ? "Comparing..." : "Compare All Defenses"}
      </button>

      {/* Comparison Table */}
      {comparisons.length > 0 && (
        <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="p-4 border-b border-px-border">
            <h2 className="font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-px-cyan" />
              Defense Strategy Comparison
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-px-border text-xs text-px-text-muted uppercase tracking-wider">
                  <th className="text-left p-4">Strategy</th>
                  <th className="text-center p-4">Risk Before</th>
                  <th className="text-center p-4">Risk After</th>
                  <th className="text-center p-4">Reduction</th>
                  <th className="text-center p-4">Utility</th>
                  <th className="text-center p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c, i) => (
                  <motion.tr
                    key={c.strategy}
                    className="border-b border-px-border/50 hover:bg-px-surface/30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="p-4 text-sm font-medium">{STRATEGY_LABELS[c.strategy] || c.strategy}</td>
                    <td className={`p-4 text-center text-sm font-bold ${getRiskColor(c.riskBefore)}`}>{c.riskBefore}</td>
                    <td className={`p-4 text-center text-sm font-bold ${getRiskColor(c.riskAfter)}`}>{c.riskAfter}</td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-bold text-px-emerald flex items-center justify-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {c.privacyImprovement}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm">{c.utilityRetained}%</td>
                    <td className="p-4 text-center">
                      {c.strategy !== "none" && (
                        <button onClick={() => applyDefense(c.strategy)}
                          className="text-xs text-px-cyan hover:text-px-cyan/80 font-medium">
                          Apply
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Privacy/Utility Frontier */}
      {comparisons.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-px-amber" />
            Privacy / Utility Frontier
          </h2>
          <div className="relative h-64 border-l-2 border-b-2 border-px-border ml-8 mb-8">
            <div className="absolute -left-12 top-0 text-xs text-px-text-muted">Risk</div>
            <div className="absolute bottom-[-24px] right-0 text-xs text-px-text-muted">Utility</div>
            {comparisons.map((c, i) => {
              const x = (c.utilityRetained / 100) * 100;
              const y = 100 - c.riskAfter;
              return (
                <motion.div
                  key={c.strategy}
                  className="absolute w-3 h-3 rounded-full bg-px-cyan cursor-pointer group"
                  style={{ left: `${x}%`, bottom: `${y}%` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  title={`${STRATEGY_LABELS[c.strategy]}: Risk ${c.riskAfter}, Utility ${c.utilityRetained}%`}
                >
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-px-bg-tertiary border border-px-border px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {STRATEGY_LABELS[c.strategy]}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Applied Defense */}
      {applied && (
        <motion.div className="glass-card p-6 border-px-emerald/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-bold mb-4 text-px-emerald flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Defense Applied
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-px-text-muted">Risk Before</div>
              <div className={`text-2xl font-bold ${getRiskColor(applied.riskBefore)}`}>{applied.riskBefore}</div>
            </div>
            <div>
              <div className="text-xs text-px-text-muted">Risk After</div>
              <div className={`text-2xl font-bold ${getRiskColor(applied.riskAfter)}`}>{applied.riskAfter}</div>
            </div>
            <div>
              <div className="text-xs text-px-text-muted">Improvement</div>
              <div className="text-2xl font-bold text-px-emerald">+{applied.privacyImprovement}</div>
            </div>
            <div>
              <div className="text-xs text-px-text-muted">Utility Retained</div>
              <div className="text-2xl font-bold text-px-cyan">{applied.utilityRetained}%</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a href="/attack" className="btn-danger text-xs inline-flex items-center gap-2">
              <Target className="w-4 h-4" /> Re-Attack to Validate
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
