"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Target, ShieldCheck, ChevronDown, ArrowRight, Sparkles, Filter, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryRun {
  _id: string;
  status: string;
  attackProfile: string;
  riskBefore: number;
  riskAfter: number;
  isReattack: boolean;
  duration: number;
  createdAt: string;
  attacks: Array<{ type: string; confidence: number; risk: number }>;
}

function getRiskColor(s: number) {
  if (s <= 30) return "text-risk-low";
  if (s <= 60) return "text-risk-medium";
  if (s <= 80) return "text-risk-high";
  return "text-risk-critical";
}

function getRiskBadge(s: number) {
  if (s <= 30) return "bg-risk-low/20 text-risk-low border-risk-low/30";
  if (s <= 60) return "bg-risk-medium/20 text-risk-medium border-risk-medium/30";
  if (s <= 80) return "bg-risk-high/20 text-risk-high border-risk-high/30";
  return "bg-risk-critical/20 text-risk-critical border-risk-critical/30";
}

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "attack" | "reattack">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attack?limit=50");
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (e) {
      console.error("Failed to fetch attack history:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const filteredRuns = runs.filter((r) => {
    if (filter === "reattack") return r.isReattack;
    if (filter === "attack") return !r.isReattack;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-px-cyan" />
            Adversarial Audit Trail
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Historical log of all penetration test simulations, re-attacks, and ML evaluations.
          </p>
        </div>

        <button
          onClick={fetchRuns}
          className="btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-px-border pb-3">
        <Filter className="w-4 h-4 text-px-text-muted mr-1" />
        <span className="text-xs text-px-text-muted mr-2">Filter:</span>
        {(
          [
            { key: "all", label: `All Runs (${runs.length})` },
            { key: "attack", label: `Initial Attacks (${runs.filter((r) => !r.isReattack).length})` },
            { key: "reattack", label: `Defense Validations (${runs.filter((r) => r.isReattack).length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === tab.key
                ? "bg-px-cyan/15 text-px-cyan border border-px-cyan/30"
                : "text-px-text-secondary hover:text-white hover:bg-px-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="glass-card p-12 text-center text-px-text-secondary flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading historical records...</span>
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-px-cyan/10 border border-px-cyan/20 flex items-center justify-center mx-auto text-px-cyan">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">No attack records found</h3>
            <p className="text-xs text-px-text-muted max-w-sm mx-auto">
              Simulate an adversarial attack battery to start generating audit history and vulnerability trails.
            </p>
          </div>
          <Link href="/attack" className="btn-primary inline-flex items-center gap-2 text-xs">
            <Target className="w-4 h-4" />
            <span>Launch Attack Battery</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRuns.map((run, i) => {
            const isExpanded = expandedId === run._id;
            const formattedDate = mounted
              ? new Date(run.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <motion.div
                key={run._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden hover:border-px-cyan/30 transition-colors"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : run._id)}
                  className="p-4 sm:p-5 flex items-center gap-4 cursor-pointer select-none"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      run.isReattack
                        ? "bg-px-emerald/10 border-px-emerald/30 text-px-emerald"
                        : "bg-px-magenta/10 border-px-magenta/30 text-px-magenta"
                    }`}
                  >
                    {run.isReattack ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Target className="w-5 h-5" />
                    )}
                  </div>

                  {/* Main Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        {run.isReattack ? "Post-Defense Validation" : "Baseline Penetration Test"}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-px-surface border border-px-border text-px-text-secondary">
                        {run.attackProfile} profile
                      </span>
                    </div>
                    <div className="text-xs text-px-text-muted mt-0.5 flex items-center gap-2">
                      <span>{formattedDate}</span>
                      <span>·</span>
                      <span>{run.duration}ms duration</span>
                      <span>·</span>
                      <span>{run.attacks?.length || 0} vectors</span>
                    </div>
                  </div>

                  {/* Risk Score Pill */}
                  <div className="text-right flex items-center gap-3 flex-shrink-0">
                    <div>
                      <div className={`text-2xl font-bold font-mono ${getRiskColor(run.riskAfter)}`}>
                        {run.riskAfter}
                      </div>
                      <div className="text-[10px] text-px-text-muted uppercase">Risk Score</div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-px-text-muted transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-px-border/80 bg-px-bg/40 px-5 py-4 space-y-3"
                    >
                      <div className="text-xs font-semibold text-px-text uppercase tracking-wider">
                        Attacks Evaluated ({run.attacks?.length || 0})
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {run.attacks?.map((atk, j) => (
                          <div
                            key={j}
                            className="p-2.5 rounded-lg border border-px-border bg-px-surface/30 flex items-center justify-between text-xs"
                          >
                            <span className="capitalize truncate max-w-[140px]">
                              {atk.type.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${getRiskBadge(atk.risk)}`}>
                              {atk.risk} pts
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Link
                          href="/attack"
                          className="text-xs text-px-cyan hover:underline inline-flex items-center gap-1"
                        >
                          <span>Simulate Re-run in Attack Center</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
