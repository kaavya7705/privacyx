"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, AlertTriangle, TrendingUp, ArrowRight, Database } from "lucide-react";

interface RegressionResult {
  baselineRisks: Record<string, number>;
  newRisks: Record<string, number>;
  regressions: Array<{
    category: string;
    before: number;
    after: number;
    delta: number;
    severity: string;
    cause?: string;
  }>;
  totalRegression: number;
  hasRegression: boolean;
  newDataSource: string;
}

function getRiskColor(score: number) {
  if (score <= 30) return "text-risk-low";
  if (score <= 60) return "text-risk-medium";
  if (score <= 80) return "text-risk-high";
  return "text-risk-critical";
}

function getSeverityColor(severity: string) {
  if (severity === "critical") return "text-risk-critical bg-risk-critical/10 border-risk-critical/30";
  if (severity === "major") return "text-risk-high bg-risk-high/10 border-risk-high/30";
  if (severity === "minor") return "text-risk-medium bg-risk-medium/10 border-risk-medium/30";
  return "text-risk-low bg-risk-low/10 border-risk-low/30";
}

export default function RegressionPage() {
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("location");

  const runRegression = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/regression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDataSource: source }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Regression error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-px-amber" />
          Privacy Regression Testing
        </h1>
        <p className="text-sm text-px-text-secondary mt-1">
          Test how adding new data sources affects your privacy risk
        </p>
      </div>

      {/* Data Source Selector */}
      <div className="glass-card p-6">
        <h2 className="text-sm text-px-text-muted uppercase tracking-wider mb-4 font-medium">
          Simulate Adding New Data Source
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { key: "location", label: "Location Data", icon: "📍" },
            { key: "search", label: "Search Categories", icon: "🔍" },
            { key: "desktop", label: "Desktop Activity", icon: "🖥️" },
            { key: "social", label: "Social Metadata", icon: "👥" },
          ].map((s) => (
            <button key={s.key} onClick={() => setSource(s.key)}
              className={`p-4 rounded-lg border transition-all text-left ${
                source === s.key ? "border-px-cyan bg-px-cyan/10" : "border-px-border hover:border-px-border-light"
              }`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-sm font-medium">{s.label}</div>
            </button>
          ))}
        </div>

        <button onClick={runRegression} disabled={loading}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50">
          <Database className="w-5 h-5" />
          {loading ? "Running regression test..." : "Run Privacy Regression Test"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Regression Alert */}
          {result.hasRegression && (
            <motion.div
              className="glass-card p-6 border-risk-critical/30 bg-risk-critical/5"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-risk-critical" />
                <h2 className="text-xl font-bold text-risk-critical">🚨 PRIVACY REGRESSION DETECTED</h2>
              </div>
              <p className="text-sm text-px-text-secondary">
                Adding <span className="text-px-cyan font-semibold">{result.newDataSource}</span> data
                increased total privacy risk by <span className="text-risk-critical font-bold">{result.totalRegression}</span> points.
              </p>
            </motion.div>
          )}

          {/* Before / After Comparison */}
          <div className="glass-card p-6">
            <h2 className="font-bold mb-6 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-px-amber" />
              Before vs. After Adding {result.newDataSource}
            </h2>
            <div className="space-y-4">
              {result.regressions.map((r, i) => (
                <motion.div
                  key={r.category}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-32 text-sm font-medium capitalize">{r.category}</div>
                  <div className={`w-12 text-right text-sm font-bold ${getRiskColor(r.before)}`}>{r.before}</div>
                  <ArrowRight className="w-4 h-4 text-px-text-muted" />
                  <div className={`w-12 text-sm font-bold ${getRiskColor(r.after)}`}>{r.after}</div>
                  <div className="flex-1 h-2 bg-px-bg rounded-full overflow-hidden flex">
                    <div className="h-full bg-px-cyan/30 transition-all" style={{ width: `${r.before}%` }} />
                    <div className={`h-full transition-all ${r.delta > 0 ? "bg-risk-critical/50" : "bg-risk-low/50"}`}
                      style={{ width: `${Math.abs(r.delta)}%` }} />
                  </div>
                  {r.delta > 0 ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-risk-critical" />
                      <span className="text-sm font-bold text-risk-critical">+{r.delta}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-px-text-muted">—</span>
                  )}
                  {r.severity !== "none" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityColor(r.severity)}`}>
                      {r.severity}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cause Analysis */}
          {result.regressions.filter((r) => r.cause).length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-bold mb-4">Regression Causes</h2>
              <div className="space-y-2">
                {result.regressions.filter((r) => r.cause).map((r) => (
                  <div key={r.category} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-px-amber mt-0.5 flex-shrink-0" />
                    <span className="text-px-text-secondary">
                      <span className="text-px-text font-medium capitalize">{r.category}</span>: {r.cause}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
