"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Target, ShieldCheck, MapPin, Activity, Fingerprint,
  Eye, AlertTriangle, TrendingUp, TrendingDown, Zap, RefreshCw,
  Database, Brain, Trash2,
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

export default function DashboardPage() {
  const [risk, setRisk] = useState<RiskData>({ overall: 0, location: 0, behavior: 0, identity: 0, interest: 0, reidentification: 0 });
  const [findings, setFindings] = useState<AttackFinding[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [riskRes, eventsRes] = await Promise.all([
        fetch("/api/risk"),
        fetch("/api/events?limit=1"),
      ]);
      const riskData = await riskRes.json();
      const eventsData = await eventsRes.json();
      setRisk({
        overall: riskData.overall || 0,
        location: riskData.location || 0,
        behavior: riskData.behavior || 0,
        identity: riskData.identity || 0,
        interest: riskData.interest || 0,
        reidentification: riskData.reidentification || 0,
      });
      setEventCount(eventsData.total || 0);
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
        <div className="text-px-text-secondary animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-px-cyan" />
            Privacy Dashboard
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Your digital footprint attack surface overview
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Main Risk Gauge */}
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
          </div>
        </div>
      </motion.div>

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
              <div className={`h-full rounded-full bg-gradient-to-r ${getRiskBg(cat.value)}`}
                style={{ width: `${cat.value}%` }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attack Findings & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Findings */}
        <div className="glass-card p-6">
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
              {findings.slice(0, 6).map((f, i) => (
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
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-px-amber" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              { href: "/attack", icon: Target, label: "Run Privacy Attack", desc: "Full attack battery simulation", color: "text-px-magenta" },
              { href: "/defense", icon: ShieldCheck, label: "Apply Defense", desc: "Compare privacy strategies", color: "text-px-emerald" },
              { href: "/regression", icon: RefreshCw, label: "Regression Test", desc: "Test privacy after changes", color: "text-px-amber" },
              { href: "/graph", icon: Brain, label: "Evidence Graph", desc: "Visualize attack evidence", color: "text-px-purple" },
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
        </div>
      </div>
    </div>
  );
}
