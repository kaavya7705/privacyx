"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  ShieldAlert, Shield, Bug, Globe, Eye, Lock, AlertTriangle,
  Radio, TrendingUp, Filter, RefreshCw,
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

export default function LeaksPage() {
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [stats, setStats] = useState<LeakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

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

  useEffect(() => { fetchLeaks(); }, [fetchLeaks]);

  const typeChartData = stats ? Object.entries(stats.byType).map(([type, count]) => ({
    name: TYPE_LABELS[type] || type,
    count,
    fill: type === "data_broker" ? "#dc2626" : type === "tracker" ? "#ff006e" : type.includes("pii") ? "#ffb800" : "#9945ff",
  })) : [];

  const severityPieData = stats ? [
    { name: "Low", value: stats.bySeverity.low || 0, fill: SEVERITY_COLORS.low },
    { name: "Medium", value: stats.bySeverity.medium || 0, fill: SEVERITY_COLORS.medium },
    { name: "High", value: stats.bySeverity.high || 0, fill: SEVERITY_COLORS.high },
    { name: "Critical", value: stats.bySeverity.critical || 0, fill: SEVERITY_COLORS.critical },
  ].filter(d => d.value > 0) : [];

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
            Real-time monitoring of trackers, data brokers, and PII exposure
          </p>
        </div>
        <button onClick={() => { setLoading(true); fetchLeaks(); }} className="btn-primary text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Detected", value: stats.total, icon: ShieldAlert, color: "text-risk-critical", bg: "bg-risk-critical/10 border-risk-critical/20" },
            { label: "Blocked", value: stats.blocked, icon: Shield, color: "text-px-emerald", bg: "bg-px-emerald/10 border-px-emerald/20" },
            { label: "Last 24h", value: stats.last24h, icon: TrendingUp, color: "text-px-amber", bg: "bg-px-amber/10 border-px-amber/20" },
            { label: "Last 7 Days", value: stats.last7d, icon: Radio, color: "text-px-purple", bg: "bg-px-purple/10 border-px-purple/20" },
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
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">By Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#243056" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: "#1a2342", border: "1px solid #243056", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {typeChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Severity Distribution */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">By Severity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {severityPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a2342", border: "1px solid #243056", borderRadius: 8, color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Domains */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-px-text-secondary">Top Domains</h3>
            <div className="space-y-3">
              {(stats.topDomains || []).slice(0, 7).map((d, i) => (
                <div key={d.domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-px-text-muted w-4">{i + 1}.</span>
                    <span className="text-sm text-px-text-secondary truncate max-w-[150px]">{d.domain}</span>
                  </div>
                  <span className="text-sm font-bold text-risk-high">{d.count}</span>
                </div>
              ))}
              {(!stats.topDomains || stats.topDomains.length === 0) && (
                <div className="text-sm text-px-text-muted text-center py-4">No domains recorded</div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-px-text-muted" />
        {["all", "tracker", "data_broker", "pii_in_url", "pii_in_form", "pii_in_request"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
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
      <motion.div className="glass-card p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-lg font-bold mb-4">Recent Detections</h2>
        {leaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-px-text-muted">
            <Lock className="w-12 h-12 mb-4 text-px-emerald/30" />
            <p className="text-lg font-medium">No data leaks detected</p>
            <p className="text-sm mt-2">Install the PrivacyX Shield extension to start monitoring for trackers, data brokers, and PII exposure.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaks.map((leak, i) => {
              const TypeIcon = TYPE_ICONS[leak.type] || Bug;
              return (
                <motion.div
                  key={leak._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-px-surface/50 transition-colors border border-transparent hover:border-px-border/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${leak.severity === "critical" ? "bg-red-500/10" : leak.severity === "high" ? "bg-risk-high/10" : "bg-px-amber/10"}`}>
                      <TypeIcon className="w-4 h-4" style={{ color: SEVERITY_COLORS[leak.severity] || "#94a3b8" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{TYPE_LABELS[leak.type] || leak.type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase`} style={{
                          background: `${SEVERITY_COLORS[leak.severity]}15`,
                          color: SEVERITY_COLORS[leak.severity],
                          border: `1px solid ${SEVERITY_COLORS[leak.severity]}30`,
                        }}>
                          {leak.severity}
                        </span>
                        {leak.blocked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-px-emerald/15 text-px-emerald border border-px-emerald/30">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-px-text-muted mt-0.5">
                        {leak.domain}
                        {leak.piiDetail?.label && ` · ${leak.piiDetail.label}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-px-text-muted">
                    {new Date(leak.createdAt).toLocaleString()}
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
