"use client";

import { useState, useEffect } from "react";
import {
  Settings, Trash2, Pause, Play, Save, CheckCircle, AlertTriangle, Shield,
  Globe, Search, MapPin, Laptop, Brain, Sparkles, Database, Key, Copy, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MonitoringConfig {
  browser: boolean;
  websiteCategories: boolean;
  searchCategories: boolean;
  location: boolean;
  desktop: boolean;
}

const MONITORING_ITEMS: Array<{
  key: keyof MonitoringConfig;
  title: string;
  desc: string;
  icon: typeof Globe;
  color: string;
}> = [
  {
    key: "browser",
    title: "Browser Navigation",
    desc: "Domain category logging with URL stripping and query normalization",
    icon: Globe,
    color: "text-px-cyan",
  },
  {
    key: "websiteCategories",
    title: "Content Category Classification",
    desc: "Heuristic classification (e.g. developer_tools, streaming, finance)",
    icon: Shield,
    color: "text-px-purple",
  },
  {
    key: "searchCategories",
    title: "Search Query Topics",
    desc: "Topic extraction without storing the exact raw query string",
    icon: Search,
    color: "text-px-amber",
  },
  {
    key: "location",
    title: "Coarse Geolocation Bucketing",
    desc: "Metropolitan level geo-hashing (never exact latitude/longitude coordinates)",
    icon: MapPin,
    color: "text-px-emerald",
  },
  {
    key: "desktop",
    title: "Desktop Application Activity",
    desc: "Active process category via PrivacyX Desktop Agent daemon",
    icon: Laptop,
    color: "text-px-cyan",
  },
];

export default function SettingsPage() {
  const [monitoring, setMonitoring] = useState<MonitoringConfig>({
    browser: true,
    websiteCategories: true,
    searchCategories: false,
    location: false,
    desktop: false,
  });
  const [retention, setRetention] = useState(7);
  const [aiExplanations, setAiExplanations] = useState(true);
  const [rawDataToAI, setRawDataToAI] = useState(false);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [apiToken, setApiToken] = useState<string>("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);

  useEffect(() => {
    fetch("/api/user/token")
      .then((r) => r.json())
      .then((data) => {
        if (data.token) setApiToken(data.token);
      })
      .catch(() => null);
  }, []);

  const copyToken = () => {
    if (apiToken) {
      navigator.clipboard.writeText(apiToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const regenerateToken = async () => {
    if (!confirm("Regenerate extension API token? Existing extension connections will need to be updated.")) return;
    setRegeneratingToken(true);
    try {
      const res = await fetch("/api/user/token", { method: "POST" });
      const data = await res.json();
      if (data.token) {
        setApiToken(data.token);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Regenerate error:", e);
    } finally {
      setRegeneratingToken(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  };

  const deleteAll = async () => {
    setDeleting(true);
    try {
      await fetch("/api/user/data", { method: "DELETE" });
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
      setShowConfirmModal(false);
    }
  };

  const toggleMonitoring = (key: keyof MonitoringConfig) => {
    setMonitoring((prev: MonitoringConfig) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-px-cyan" />
            Security & Telemetry Controls
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Fine-tune data minimization policies, local AI redactions, and retention limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-px-emerald bg-px-emerald/10 border border-px-emerald/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Settings Synced!
            </motion.span>
          )}
        </div>
      </div>

      {/* Extension API Token & Connection */}
      <div className="glass-card p-6 space-y-4 border-px-cyan/30 bg-px-cyan/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-px-cyan" />
              Browser Extension API Token
            </h2>
            <p className="text-xs text-px-text-muted mt-0.5">
              Connect the PrivacyX Shield Chrome/Firefox extension to stream telemetry and block live PII leaks.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-px-cyan/15 text-px-cyan border border-px-cyan/30">
            EXTENSION V2.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiToken || "Loading token..."}
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-px-bg border border-px-border text-xs font-mono text-px-text select-all focus:outline-none focus:border-px-cyan"
          />
          <button
            onClick={copyToken}
            disabled={!apiToken}
            className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5"
          >
            {copiedToken ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </>
            )}
          </button>
          <button
            onClick={regenerateToken}
            disabled={regeneratingToken}
            className="px-3 py-2.5 rounded-lg border border-px-border bg-px-surface hover:bg-px-surface/80 text-px-text-secondary hover:text-white text-xs flex items-center gap-1.5 transition-all"
            title="Regenerate token"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regeneratingToken ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="text-[11px] text-px-text-muted bg-px-bg/60 p-3 rounded-lg border border-px-border/60 space-y-1">
          <p className="font-semibold text-px-text-secondary">💡 How to connect your extension in 2 steps:</p>
          <p>1. Open Chrome &rarr; <code>chrome://extensions</code> &rarr; Enable <strong>Developer mode</strong> &rarr; Click <strong>Load unpacked</strong> &rarr; Select the <code>extension</code> folder in this project.</p>
          <p>2. Open the PrivacyX popup in your browser toolbar &rarr; Click <strong>&quot;Quick Auto-Connect&quot;</strong> or paste this token into the API Token field.</p>
        </div>
      </div>

      {/* Monitoring Controls */}
      <div className="glass-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-px-text-secondary flex items-center gap-2">
            <Shield className="w-4 h-4 text-px-cyan" />
            Active Surveillance Minimization
          </h2>
          <p className="text-xs text-px-text-muted mt-0.5">
            PrivacyX only captures sanitized buckets for the categories enabled below.
          </p>
        </div>

        <div className="divide-y divide-px-border/50">
          {MONITORING_ITEMS.map((item) => {
            const Icon = item.icon;
            const isEnabled = monitoring[item.key];
            return (
              <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-px-surface border border-px-border mt-0.5 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{item.title}</span>
                      {isEnabled && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-px-cyan/15 text-px-cyan border border-px-cyan/30">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-px-text-muted mt-0.5">{item.desc}</div>
                  </div>
                </div>

                {/* Cute iOS-style Switch */}
                <button
                  type="button"
                  onClick={() => toggleMonitoring(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 flex-shrink-0 cursor-pointer ${
                    isEnabled ? "bg-px-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]" : "bg-px-surface border border-px-border"
                  }`}
                  aria-label={`Toggle ${item.title}`}
                >
                  <motion.div
                    animate={{ x: isEnabled ? 24 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-5 h-5 rounded-full ${isEnabled ? "bg-px-bg" : "bg-px-text-muted"} shadow-sm`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retention Grid */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-px-text-secondary flex items-center gap-2">
            <Database className="w-4 h-4 text-px-purple" />
            Automatic Data Expiry & Pruning
          </h2>
          <p className="text-xs text-px-text-muted mt-0.5">
            Raw minimized events are permanently purged from MongoDB after this timeframe.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { days: 7, label: "7 Days", desc: "Strict Privacy (Recommended)" },
            { days: 30, label: "30 Days", desc: "Balanced Analytics" },
            { days: 90, label: "90 Days", desc: "Longitudinal Defense Study" },
          ].map((r) => {
            const isSelected = retention === r.days;
            return (
              <button
                key={r.days}
                onClick={() => setRetention(r.days)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-px-cyan bg-px-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-px-cyan/30"
                    : "border-px-border bg-px-surface/40 hover:bg-px-surface"
                }`}
              >
                <div className="text-lg font-bold text-white">{r.label}</div>
                <div className="text-xs text-px-text-muted mt-1">{r.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Controls */}
      <div className="glass-card p-6 space-y-5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-px-text-secondary flex items-center gap-2">
            <Brain className="w-4 h-4 text-px-amber" />
            AI Explanation Engine Policies
          </h2>
          <p className="text-xs text-px-text-muted mt-0.5">
            Govern how PrivacyX interacts with AI LLM threat interpreters.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-px-border/50">
          <div className="flex items-center justify-between gap-4 pt-1">
            <div>
              <span className="text-sm font-semibold text-white">Generate Rich AI Explanations</span>
              <p className="text-xs text-px-text-muted">
                Translates machine learning inference results into clear adversary narratives and remediation steps.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiExplanations(!aiExplanations)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 flex-shrink-0 cursor-pointer ${
                aiExplanations ? "bg-px-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)]" : "bg-px-surface border border-px-border"
              }`}
            >
              <motion.div
                animate={{ x: aiExplanations ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-5 h-5 rounded-full ${aiExplanations ? "bg-px-bg" : "bg-px-text-muted"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4">
            <div>
              <span className="text-sm font-semibold text-white">Transmit Raw Events to External Models</span>
              <p className="text-xs text-risk-critical/90">
                Disabled by default. When off, only abstract statistical signals are shared.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRawDataToAI(!rawDataToAI)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 flex-shrink-0 cursor-pointer ${
                rawDataToAI ? "bg-risk-critical" : "bg-px-surface border border-px-border"
              }`}
            >
              <motion.div
                animate={{ x: rawDataToAI ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-5 h-5 rounded-full ${rawDataToAI ? "bg-px-bg" : "bg-px-text-muted"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Save & Pause Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Policy Configuration</span>
            </>
          )}
        </button>

        <button
          onClick={() => setPaused(!paused)}
          className={`px-6 py-3.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            paused
              ? "border-px-emerald bg-px-emerald/15 text-px-emerald"
              : "border-px-amber bg-px-amber/15 text-px-amber"
          }`}
        >
          {paused ? (
            <>
              <Play className="w-4 h-4" />
              <span>Resume Signal Monitoring</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              <span>Temporarily Pause Daemon</span>
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-risk-critical/30 space-y-3">
        <div className="flex items-center gap-2 text-risk-critical font-bold text-sm uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Irreversible Purge</span>
        </div>
        <p className="text-xs text-px-text-secondary">
          Permanently delete your user profile, all recorded browser telemetry, cached evidence graphs, and attack reports from the system.
        </p>
        <button
          onClick={() => setShowConfirmModal(true)}
          className="btn-danger text-xs py-2.5 px-4 flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purge All Records Permanently</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full border-risk-critical/40 space-y-4"
            >
              <div className="flex items-center gap-3 text-risk-critical">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="font-bold text-lg text-white">Confirm Total Deletion</h3>
              </div>
              <p className="text-xs text-px-text-secondary leading-relaxed">
                This will erase all synthetic events, captured browser telemetry, and adversarial inference scores immediately. This action cannot be reversed.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-px-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAll}
                  disabled={deleting}
                  className="btn-danger text-xs py-2.5 px-4 font-bold flex items-center gap-2"
                >
                  {deleting ? "Purging..." : "Yes, Purge Everything"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
