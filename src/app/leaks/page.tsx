"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ShieldAlert, Shield, Bug, Globe, Eye, Lock, AlertTriangle,
  Radio, TrendingUp, Filter, RefreshCw, Sparkles, Key, CheckCircle, Trash2
} from "lucide-react";

interface Leak {
  _id: string;
  type: string;
  domain: string;
  severity: string;
  blocked: boolean;
  piiDetail: { type?: string; label?: string; count?: number } | null;
  createdAt: string;
}

interface LeakStats {
  total: number;
  blocked: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  topDomains: Array<{ domain: string; count: number }>;
  last24h: number;
  last7d: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#00ff88",
  medium: "#ffb800",
  high: "#ff006e",
  critical: "#dc2626",
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  tracker: Radio,
  data_broker: Globe,
  pii_in_url: Eye,
  pii_in_form: AlertTriangle,
  pii_in_request: Bug,
  fingerprinting: Shield,
};

const TYPE_LABELS: Record<string, string> = {
  tracker: "Tracker",
  data_broker: "Data Broker",
  pii_in_url: "PII in URL",
  pii_in_form: "PII in Form",
  pii_in_request: "PII in Request",
  fingerprinting: "Fingerprinting",
};

function formatLeakTime(createdAtStr?: string) {
  if (!createdAtStr) return { dateStr: "--", relative: "Recent" };
  const d = new Date(createdAtStr);
  if (isNaN(d.getTime())) return { dateStr: "--", relative: "Recent" };

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  let relative = "Just now";
  if (diffSec < 20) relative = "Just now";
  else if (diffSec < 60) relative = `${diffSec}s ago`;
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else relative = d.toLocaleDateString([], { month: "short", day: "numeric" });

  const dateStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { dateStr, relative };
}

export default function LeaksPage() {
  const [mounted, setMounted] = useState(false);
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [stats, setStats] = useState<LeakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/user/token")
      .then((r) => r.json())
      .then((data) => {
        if (data.token) setApiToken(data.token);
      })
      .catch(() => null);
  }, []);

  const fetchLeaks = useCallback(async () => {
    try {
      const params = filter !== "all" ? `?type=${filter}` : "";
      const res = await fetch(`/api/leaks${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeaks(data.leaks || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Fetch leaks error:", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaks();
  }, [fetchLeaks]);

  const simulateLeaks = async () => {
    setSimulating(true);
    try {
      await fetch("/api/leaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true }),
      });
      await fetchLeaks();
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulating(false);
    }
  };

  const clearLeaks = async () => {
    if (!confirm("Are you sure you want to clear detected leaks history?")) return;
    setClearing(true);
    try {
      await fetch("/api/leaks", { method: "DELETE" });
      setLeaks([]);
      setStats(null);
    } catch (e) {
      console.error("Clear error:", e);
    } finally {
      setClearing(false);
    }
  };

  const copyToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const typeChartData = stats
    ? Object.entries(stats.byType).map(([type, count]) => ({
        name: TYPE_LABELS[type] || type,
        count,
        fill:
          type === "data_broker"
            ? "#dc2626"
            : type === "tracker"
            ? "#ff006e"
            : type.includes("pii")
            ? "#ffb800"
            : "#9945ff",
      }))
    : [];

  const severityPieData = stats
    ? [
        { name: "Low", value: stats.bySeverity.low || 0, fill: SEVERITY_COLORS.low },
        { name: "Medium", value: stats.bySeverity.medium || 0, fill: SEVERITY_COLORS.medium },
        { name: "High", value: stats.bySeverity.high || 0, fill: SEVERITY_COLORS.high },
        { name: "Critical", value: stats.bySeverity.critical || 0, fill: SEVERITY_COLORS.critical },
      ].filter((d) => d.value > 0)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-px-text-secondary">
          <div className="w-5 h-5 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
          Loading leak data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-risk-critical" />
            Data Leak Detection
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Real-time monitoring of trackers, data brokers, and PII exposure with defensive interception.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {apiToken && (
            <button
              onClick={copyToken}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-px-cyan/30 bg-px-cyan/10 text-px-cyan hover:bg-px-cyan/20 transition-all flex items-center gap-1.5"
              title="Copy Extension API Token"
            >
              {copiedToken ? <CheckCircle className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              <span>{copiedToken ? "Copied!" : "Extension Token"}</span>
            </button>
          )}

          <button
            onClick={simulateLeaks}
            disabled={simulating}
            className="px-3.5 py-2 rounded-lg text-xs font-bold border border-risk-critical/40 bg-risk-critical/15 text-risk-critical hover:bg-risk-critical/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulating ? "Generating..." : "Simulate Threats"}</span>
          </button>

          {leaks.length > 0 && (
            <button
              onClick={clearLeaks}
              disabled={clearing}
              className="p-2 rounded-lg text-px-text-muted hover:text-risk-high hover:bg-risk-high/10 border border-transparent hover:border-risk-high/30 transition-all"
              title="Clear leaks history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setLoading(true);
              fetchLeaks();
            }}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Detected",
              value: stats.total,
              icon: ShieldAlert,
              color: "text-risk-critical",
              bg: "bg-risk-critical/10 border-risk-critical/20",
            },
            {
              label: "Blocked Defensively",
              value: stats.blocked,
              icon: Shield,
              color: "text-px-emerald",
              bg: "bg-px-emerald/10 border-px-emerald/20",
            },
            {
              label: "Last 24 Hours",
              value: stats.last24h,
              icon: TrendingUp,
              color: "text-px-amber",
              bg: "bg-px-amber/10 border-px-amber/20",
            },
            {
              label: "Last 7 Days",
              value: stats.last7d,
              icon: Radio,
              color: "text-px-purple",
              bg: "bg-px-purple/10 border-px-purple/20",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`glass-card p-5 border ${stat.bg}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-px-text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Type Distribution */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">
              By Threat Category
            </h3>
            {mounted && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#243056" />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a2342",
                      border: "1px solid #243056",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Severity Distribution */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">
              By Severity Level
            </h3>
            {mounted && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {severityPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1a2342",
                      border: "1px solid #243056",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Top Domains */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">
              Top Intercepted Domains
            </h3>
            <div className="space-y-3">
              {(stats.topDomains || []).slice(0, 7).map((d, i) => (
                <div key={d.domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-px-text-muted w-4">{i + 1}.</span>
                    <span className="text-sm text-px-text-secondary truncate max-w-[150px]">
                      {d.domain}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-risk-high">{d.count}</span>
                </div>
              ))}
              {(!stats.topDomains || stats.topDomains.length === 0) && (
                <div className="text-sm text-px-text-muted text-center py-4">
                  No domains recorded
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-px-text-muted" />
        {[
          "all",
          "tracker",
          "data_broker",
          "pii_in_url",
          "pii_in_form",
          "pii_in_request",
        ].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setLoading(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? "bg-px-cyan/15 text-px-cyan border border-px-cyan/30"
                : "bg-px-surface text-px-text-muted hover:text-px-text border border-px-border"
            }`}
          >
            {f === "all" ? "All" : TYPE_LABELS[f] || f}
          </button>
        ))}
      </div>

      {/* Leak List */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-lg font-bold mb-4">Recent Detections & Interceptions</h2>
        {leaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-px-text-muted space-y-3">
            <Lock className="w-12 h-12 text-px-emerald/40" />
            <p className="text-lg font-medium text-white">No data leaks detected yet</p>
            <p className="text-xs text-px-text-muted max-w-md text-center">
              Click <strong>&quot;Simulate Threats&quot;</strong> above to generate test trackers and PII leak events, or load the PrivacyX Shield extension to protect real browsing.
            </p>
            <button
              onClick={simulateLeaks}
              disabled={simulating}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Sample Detections Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {leaks.map((leak, i) => {
              const TypeIcon = TYPE_ICONS[leak.type] || Bug;
              const { dateStr, relative } = formatLeakTime(leak.createdAt);

              return (
                <motion.div
                  key={leak._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-px-surface/50 transition-colors border border-transparent hover:border-px-border/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.2) }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        leak.severity === "critical"
                          ? "bg-red-500/10"
                          : leak.severity === "high"
                          ? "bg-risk-high/10"
                          : "bg-px-amber/10"
                      }`}
                    >
                      <TypeIcon
                        className="w-4 h-4"
                        style={{ color: SEVERITY_COLORS[leak.severity] || "#94a3b8" }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {TYPE_LABELS[leak.type] || leak.type}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{
                            background: `${SEVERITY_COLORS[leak.severity]}15`,
                            color: SEVERITY_COLORS[leak.severity],
                            border: `1px solid ${SEVERITY_COLORS[leak.severity]}30`,
                          }}
                        >
                          {leak.severity}
                        </span>
                        {leak.blocked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-px-emerald/15 text-px-emerald border border-px-emerald/30">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-px-text-muted mt-0.5 font-mono">
                        {leak.domain}
                        {leak.piiDetail?.label && ` · ${leak.piiDetail.label}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-mono text-px-cyan">{dateStr}</span>
                    <span className="text-[10px] font-mono text-px-text-muted">{relative}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
