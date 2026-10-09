"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Shield, Target, ShieldCheck, MapPin, Activity, Fingerprint,
  Eye, AlertTriangle, TrendingUp, TrendingDown, Zap, RefreshCw,
  Database, Brain, Trash2, Wifi, WifiOff, Lock, ShieldAlert,
  Bug, Radio, Cpu,
} from "lucide-react";

interface RiskData {
  overall: number;
  location: number;
  behavior: number;
  identity: number;
  interest: number;
  reidentification: number;
}

interface AttackFinding {
  type: string;
  confidence: number;
  risk: number;
  evidenceCount: number;
}

interface RiskHistory {
  date: string;
  overall: number;
  location: number;
  behavior: number;
  identity: number;
}

interface MLStatus {
  online: boolean;
  version?: string;
  models_loaded?: number;
  model_names?: string[];
}

interface LeakStats {
  total: number;
  blocked: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  last24h: number;
  last7d: number;
}

function getRiskColor(score: number) {
  if (score <= 30) return "text-risk-low";
  if (score <= 60) return "text-risk-medium";
  if (score <= 80) return "text-risk-high";
  return "text-risk-critical";
}

function getRiskBg(score: number) {
  if (score <= 30) return "from-risk-low/20 to-risk-low/5";
  if (score <= 60) return "from-risk-medium/20 to-risk-medium/5";
  if (score <= 80) return "from-risk-high/20 to-risk-high/5";
  return "from-risk-critical/20 to-risk-critical/5";
}

function getRiskBadge(score: number) {
  if (score <= 30) return "risk-badge-low";
  if (score <= 60) return "risk-badge-medium";
  if (score <= 80) return "risk-badge-high";
  return "risk-badge-critical";
}

function getRiskLabel(score: number) {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

const RISK_CHART_COLORS = {
  overall: "#00f0ff",
  location: "#ff006e",
  behavior: "#9945ff",
  identity: "#ffb800",
};

const LEAK_COLORS = {
  tracker: "#ff006e",
  data_broker: "#dc2626",
  pii_in_url: "#ffb800",
  pii_in_form: "#f97316",
  pii_in_request: "#eab308",
  fingerprinting: "#9945ff",
};

const PIE_SEVERITY_COLORS = ["#00ff88", "#ffb800", "#ff006e", "#dc2626"];

export default function DashboardPage() {
  const [risk, setRisk] = useState<RiskData>({ overall: 0, location: 0, behavior: 0, identity: 0, interest: 0, reidentification: 0 });
  const [findings, setFindings] = useState<AttackFinding[]>([]);
  const [riskHistory, setRiskHistory] = useState<RiskHistory[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [mlStatus, setMLStatus] = useState<MLStatus>({ online: false });
  const [leakStats, setLeakStats] = useState<LeakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [mlEnhanced, setMlEnhanced] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [riskRes, eventsRes, mlRes, leaksRes, historyRes] = await Promise.all([
        fetch("/api/risk"),
        fetch("/api/events?limit=1"),
        fetch("/api/ml/status"),
        fetch("/api/leaks").catch(() => null),
        fetch("/api/risk?history=true").catch(() => null),
      ]);

      const riskData = await riskRes.json();
      const eventsData = await eventsRes.json();
      const mlData = await mlRes.json();

      setRisk({
        overall: riskData.overall || 0,
        location: riskData.location || 0,
        behavior: riskData.behavior || 0,
        identity: riskData.identity || 0,
        interest: riskData.interest || 0,
        reidentification: riskData.reidentification || 0,
      });
      setEventCount(eventsData.total || 0);
      setMLStatus(mlData);

      // Leak stats
      if (leaksRes && leaksRes.ok) {
        const leakData = await leaksRes.json();
        setLeakStats(leakData.stats || null);
      }

      // Risk history
      if (historyRes && historyRes.ok) {
        const histData = await historyRes.json();
        if (histData.history) {
          setRiskHistory(histData.history.map((h: Record<string, unknown>) => ({
            date: new Date(h.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            overall: h.overall || 0,
            location: h.location || 0,
            behavior: h.behavior || 0,
            identity: h.identity || 0,
          })).reverse());
        }
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateData = async () => {
    setGenerating(true);
    try {
      await fetch("/api/synthetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: "software_engineer", days: 14, eventsPerDay: 25 }),
      });
      await fetchData();
    } catch (e) {
      console.error("Generate error:", e);
    } finally {
      setGenerating(false);
    }
  };

  const clearData = async () => {
    if (!confirm("Are you sure you want to clear all test events and attack results?")) return;
    setClearing(true);
    try {
      await fetch("/api/synthetic", { method: "DELETE" });
      setFindings([]);
      setRiskHistory([]);
      await fetchData();
    } catch (e) {
      console.error("Clear error:", e);
    } finally {
      setClearing(false);
    }
  };

  const runAttack = async () => {
    setAttacking(true);
    setFindings([]);
    try {
      const res = await fetch("/api/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackProfile: "moderate" }),
      });
      const data = await res.json();
      if (data.attacks) setFindings(data.attacks);
      setMlEnhanced(data.mlEnhanced || false);
      await fetchData();
    } catch (e) {
      console.error("Attack error:", e);
    } finally {
      setAttacking(false);
    }
  };

  const RISK_CATEGORIES = [
    { key: "location", label: "Location", icon: MapPin, value: risk.location },
    { key: "behavior", label: "Behavior", icon: Activity, value: risk.behavior },
    { key: "identity", label: "Identity", icon: Fingerprint, value: risk.identity },
    { key: "interest", label: "Interest", icon: Eye, value: risk.interest },
    { key: "reidentification", label: "Re-ID", icon: AlertTriangle, value: risk.reidentification },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-px-text-secondary">
          <div className="w-5 h-5 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  // Leak pie chart data
  const leakPieData = leakStats ? [
    { name: "Low", value: leakStats.bySeverity.low || 0 },
    { name: "Medium", value: leakStats.bySeverity.medium || 0 },
    { name: "High", value: leakStats.bySeverity.high || 0 },
    { name: "Critical", value: leakStats.bySeverity.critical || 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-px-cyan" />
            Privacy Dashboard
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Your digital footprint attack surface overview
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={generateData} disabled={generating || clearing} className="btn-primary text-xs flex items-center gap-2 disabled:opacity-50">
            <Database className="w-4 h-4" />
            {generating ? "Generating..." : "Generate Test Data"}
          </button>
          {eventCount > 0 && (
            <button onClick={clearData} disabled={clearing || generating} className="px-3 py-2 rounded-lg bg-px-card border border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 text-xs flex items-center gap-2 transition disabled:opacity-50" title="Clear all test events and reset risk">
              <Trash2 className="w-4 h-4" />
              {clearing ? "Clearing..." : "Clear Data"}
            </button>
          )}
          <button onClick={runAttack} disabled={attacking || clearing} className="btn-danger text-xs flex items-center gap-2 disabled:opacity-50">
            <Target className="w-4 h-4" />
            {attacking ? "Attacking..." : "Run Attack"}
          </button>
        </div>
      </div>

      {/* ML Status Banner */}
      <motion.div
        className={`glass-card p-4 flex items-center justify-between ${mlStatus.online ? "border-px-emerald/30" : "border-risk-high/30"}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${mlStatus.online ? "bg-px-emerald/10" : "bg-risk-high/10"}`}>
            {mlStatus.online ? <Cpu className="w-5 h-5 text-px-emerald" /> : <WifiOff className="w-5 h-5 text-risk-high" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">ML Service</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${mlStatus.online ? "bg-px-emerald/15 text-px-emerald border border-px-emerald/30" : "bg-risk-high/15 text-risk-high border border-risk-high/30"}`}>
                {mlStatus.online ? "ONLINE" : "OFFLINE"}
              </span>
              {mlEnhanced && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-px-purple/15 text-px-purple border border-px-purple/30">
                  ML-ENHANCED
                </span>
              )}
            </div>
            <p className="text-xs text-px-text-muted mt-0.5">
              {mlStatus.online
                ? `v${mlStatus.version || "2.0"} · ${mlStatus.models_loaded || 0} models loaded · ${(mlStatus.model_names || []).join(", ") || "ready to train"}`
                : "Start the ML service: cd ml-service && python main.py"}
            </p>
          </div>
        </div>
        {mlStatus.online && (
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-px-purple" />
            <span className="text-xs text-px-text-secondary">{mlStatus.models_loaded || 0} models</span>
          </div>
        )}
      </motion.div>

      {/* Main Risk Gauge + Risk History Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Gauge */}
        <motion.div
          className="glass-card p-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 50% 80%, ${risk.overall > 60 ? 'rgba(255,0,110,0.15)' : 'rgba(0,240,255,0.15)'} 0%, transparent 60%)`
          }} />
          <div className="relative z-10">
            <div className="text-xs text-px-text-muted uppercase tracking-[0.2em] mb-4 font-medium">
              Live Privacy Risk
            </div>
            <div className={`text-8xl font-black ${getRiskColor(risk.overall)} mb-2`}>
              {risk.overall}
            </div>
            <div className="text-xl text-px-text-secondary">/100</div>
            <div className={`mt-4 inline-block ${getRiskBadge(risk.overall)}`}>
              {getRiskLabel(risk.overall)}
            </div>
            <div className="mt-4 text-xs text-px-text-muted">
              {eventCount} events analyzed · moderate attacker model
              {mlEnhanced && " · ML-enhanced"}
            </div>
          </div>
        </motion.div>

        {/* Risk History Chart */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-px-cyan" />
            Risk History
          </h2>
          {riskHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={riskHistory}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243056" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1a2342", border: "1px solid #243056", borderRadius: 8, color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Area type="monotone" dataKey="overall" stroke="#00f0ff" fill="url(#riskGrad)" strokeWidth={2} name="Overall" />
                <Line type="monotone" dataKey="location" stroke="#ff006e" strokeWidth={1.5} dot={false} name="Location" />
                <Line type="monotone" dataKey="behavior" stroke="#9945ff" strokeWidth={1.5} dot={false} name="Behavior" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-px-text-muted">
              Run attacks to build risk history
            </div>
          )}
        </motion.div>
      </div>

      {/* Risk Categories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {RISK_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.key}
            className="glass-card-hover p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <cat.icon className={`w-5 h-5 ${getRiskColor(cat.value)} mb-3`} />
            <div className="text-xs text-px-text-muted uppercase tracking-wider mb-1">{cat.label}</div>
            <div className={`text-3xl font-bold ${getRiskColor(cat.value)}`}>{cat.value}</div>
            <div className="mt-2 h-1.5 bg-px-bg rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getRiskBg(cat.value)}`}
                initial={{ width: 0 }}
                animate={{ width: `${cat.value}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data Leak Stats + Attack Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Leak Alerts */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-risk-critical" />
            Data Leak Detection
          </h2>
          {leakStats && leakStats.total > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-risk-critical/5 border border-risk-critical/20">
                  <div className="text-2xl font-bold text-risk-critical">{leakStats.total}</div>
                  <div className="text-xs text-px-text-muted">Total Detected</div>
                </div>
                <div className="p-3 rounded-lg bg-px-emerald/5 border border-px-emerald/20">
                  <div className="text-2xl font-bold text-px-emerald">{leakStats.blocked}</div>
                  <div className="text-xs text-px-text-muted">Blocked</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(leakStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: LEAK_COLORS[type as keyof typeof LEAK_COLORS] || "#94a3b8" }} />
                      <span className="text-px-text-secondary capitalize">{type.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
              {leakPieData.length > 0 && (
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={leakPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                      {leakPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_SEVERITY_COLORS[i % PIE_SEVERITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a2342", border: "1px solid #243056", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <Link href="/leaks" className="block text-center text-xs text-px-cyan hover:underline mt-2">
                View All Leaks →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-px-text-muted">
              <Lock className="w-8 h-8 mb-3 text-px-emerald/50" />
              <p>No leaks detected yet</p>
              <p className="text-xs mt-1">Install the extension to start monitoring</p>
            </div>
          )}
        </motion.div>

        {/* Findings */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-px-purple" />
            Attack Findings
          </h2>
          {findings.length === 0 ? (
            <div className="text-sm text-px-text-muted py-8 text-center">
              No findings yet. Run an attack to discover privacy risks.
            </div>
          ) : (
            <div className="space-y-3">
              {findings.slice(0, 7).map((f, i) => (
                <motion.div
                  key={f.type}
                  className="flex items-center justify-between py-2 border-b border-px-border/50 last:border-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${f.risk > 60 ? "bg-risk-critical" : f.risk > 40 ? "bg-risk-medium" : "bg-risk-low"}`} />
                    <span className="text-sm">{f.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getRiskColor(f.risk)}`}>{f.confidence}%</span>
                    {f.risk > 60 ? <TrendingUp className="w-3 h-3 text-risk-critical" /> : <TrendingDown className="w-3 h-3 text-risk-low" />}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-px-amber" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              { href: "/attack", icon: Target, label: "Run Privacy Attack", desc: "Full attack battery simulation", color: "text-px-magenta" },
              { href: "/defense", icon: ShieldCheck, label: "Apply Defense", desc: "Compare privacy strategies", color: "text-px-emerald" },
              { href: "/leaks", icon: ShieldAlert, label: "Data Leaks", desc: "View detected leaks & trackers", color: "text-risk-critical" },
              { href: "/regression", icon: RefreshCw, label: "Regression Test", desc: "Test privacy after changes", color: "text-px-amber" },
              { href: "/graph", icon: Brain, label: "Evidence Graph", desc: "Visualize attack evidence", color: "text-px-purple" },
              { href: "/inferences", icon: Bug, label: "Inferences", desc: "What attackers could learn", color: "text-px-cyan" },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-px-surface transition-colors group"
              >
                <action.icon className={`w-5 h-5 ${action.color}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium group-hover:text-px-text">{action.label}</div>
                  <div className="text-xs text-px-text-muted">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
