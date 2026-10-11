"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Activity, Filter, Play, Pause, Sparkles, Database, Shield, Zap,
  Clock, RefreshCw, Key, CheckCircle, ExternalLink, Trash2
} from "lucide-react";

interface LiveEvent {
  _id: string;
  domain?: string;
  category: string;
  domainCategory: string;
  timeBucket: string;
  source: string;
  sensitivity: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const CATEGORY_ICONS: Record<string, string> = {
  technology: "💻",
  developer_tools: "🛠️",
  education: "📚",
  career: "💼",
  finance: "💰",
  healthcare: "🏥",
  shopping: "🛒",
  entertainment: "🎬",
  social: "👥",
  travel: "✈️",
  news: "📰",
  sports: "⚽",
  gaming: "🎮",
  search: "🔍",
  location: "📍",
  unknown: "📌",
};

function formatEventTime(createdAtStr?: string) {
  if (!createdAtStr) return { time: "--:--:--", relative: "Recent" };
  const d = new Date(createdAtStr);
  if (isNaN(d.getTime())) return { time: "--:--:--", relative: "Recent" };

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  let relative = "Just now";
  if (diffSec < 15) relative = "Just now";
  else if (diffSec < 60) relative = `${diffSec}s ago`;
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else relative = d.toLocaleDateString([], { month: "short", day: "numeric" });

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { time, relative };
}

export default function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [simulating, setSimulating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch token for quick setup
  useEffect(() => {
    fetch("/api/user/token")
      .then((r) => r.json())
      .then((data) => {
        if (data.token) setApiToken(data.token);
      })
      .catch(() => null);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (isPaused) return;
    try {
      const res = await fetch("/api/events?limit=50");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error("Live fetch error:", e);
    }
  }, [isPaused]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Inject sample live telemetry to test stream
  const triggerSimulation = async () => {
    setSimulating(true);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate: true, count: 5 }),
      });
      await fetchEvents();
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulating(false);
    }
  };

  // Clear live stream
  const clearStream = async () => {
    if (!confirm("Clear current telemetry stream events?")) return;
    setClearing(true);
    try {
      await fetch("/api/events", { method: "DELETE" });
      setEvents([]);
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

  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "sensitive") return ev.sensitivity > 0.5;
    return ev.category === selectedFilter;
  });

  const uniqueCategories = Array.from(new Set(events.map((e) => e.category)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Radio className="w-8 h-8 text-px-emerald animate-pulse" />
            Live Telemetry Stream
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">
            Real-time feed of minimized, bucketed digital footprints captured locally with accurate timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Token Copy */}
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

          {/* Test Live Telemetry Generator */}
          <button
            onClick={triggerSimulation}
            disabled={simulating}
            className="px-3.5 py-2 rounded-lg text-xs font-bold border border-px-purple/40 bg-px-purple/15 text-px-purple hover:bg-px-purple/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {simulating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Send Test Telemetry</span>
          </button>

          {/* Clear stream */}
          {events.length > 0 && (
            <button
              onClick={clearStream}
              disabled={clearing}
              className="p-2 rounded-lg text-px-text-muted hover:text-risk-high hover:bg-risk-high/10 border border-transparent hover:border-risk-high/30 transition-all"
              title="Clear telemetry stream"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
              isPaused
                ? "border-px-emerald bg-px-emerald/15 text-px-emerald"
                : "border-px-amber bg-px-amber/15 text-px-amber"
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Feed</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Stream Card */}
      <div className="glass-card p-5 space-y-4">
        {/* Status bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-px-border/60">
          <div className="flex items-center gap-3">
            <div className={`pulse-dot ${isPaused ? "opacity-30" : ""}`} />
            <span className="text-xs font-mono font-bold text-white tracking-wider flex items-center gap-1.5">
              <span>{isPaused ? "STREAM PAUSED" : "POLLING LIVE (3s)"}</span>
              <span className="text-[10px] text-px-text-muted font-normal">
                (synced {formatEventTime(lastRefreshed.toISOString()).time})
              </span>
            </span>
            <span className="text-xs text-px-text-muted">
              · {events.length} signals monitored
            </span>
          </div>

          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-px-cyan/20 text-px-cyan border border-px-cyan/40"
                  : "text-px-text-muted hover:text-white"
              }`}
            >
              All Signals ({events.length})
            </button>
            <button
              onClick={() => setSelectedFilter("sensitive")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedFilter === "sensitive"
                  ? "bg-risk-high/20 text-risk-high border border-risk-high/40"
                  : "text-px-text-muted hover:text-white"
              }`}
            >
              High Risk ({events.filter((e) => e.sensitivity > 0.5).length})
            </button>
            {uniqueCategories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${
                  selectedFilter === cat
                    ? "bg-px-purple/20 text-px-purple border border-px-purple/40"
                    : "text-px-text-muted hover:text-white"
                }`}
              >
                {CATEGORY_ICONS[cat] || "📌"} {cat.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Stream List */}
        <div className="space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence>
            {filteredEvents.map((event, i) => {
              const domainName = event.domain || (typeof event.metadata?.domain === "string" ? event.metadata.domain : "");
              const rawCategory = (event.category || "").toLowerCase();
              const category = rawCategory && rawCategory !== "unknown"
                ? rawCategory
                : domainName
                ? `${domainName.replace(/^www\./, "").split(".")[0]}_web`
                : "general_web";

              const isHigh = event.sensitivity >= 0.70;
              const isMedium = !isHigh && event.sensitivity >= 0.50;
              const { time, relative } = formatEventTime(event.createdAt);
              const bucketText = event.timeBucket || "15m-bucket";

              return (
                <motion.div
                  key={event._id || i}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-px-surface/40 hover:bg-px-surface/80 border border-px-border/50 hover:border-px-border transition-all"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.2) }}
                >
                  {/* Timestamp & Relative Time Block */}
                  <div className="flex flex-col items-center justify-center w-20 flex-shrink-0">
                    <span className="text-[11px] font-mono font-bold text-px-cyan">
                      {time}
                    </span>
                    <span className="text-[9px] font-mono text-px-text-muted">
                      {relative}
                    </span>
                  </div>

                  {/* Icon */}
                  <span className="text-xl flex-shrink-0">
                    {CATEGORY_ICONS[category] || CATEGORY_ICONS[event.category] || "🌐"}
                  </span>

                  {/* Domain & AI Classification Description */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center gap-2 flex-wrap">
                      {domainName ? (
                        <span className="font-mono text-xs font-bold text-white hover:text-px-cyan transition-colors">
                          {domainName}
                        </span>
                      ) : (
                        <span className="capitalize">{category.replace(/_/g, " ")}</span>
                      )}

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-px-cyan/15 text-px-cyan border border-px-cyan/30 capitalize">
                        AI: {category.replace(/_/g, " ")}
                      </span>

                      {Boolean(event.metadata?.classifiedBy) && (
                        <span className="text-[9px] text-px-text-muted font-mono">
                          ({String(event.metadata?.classifiedBy)})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-px-text-muted flex items-center gap-2 flex-wrap mt-0.5">
                      <span>Source: {event.source || "browser"}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px] text-px-amber/90">
                        Bucket: {bucketText}
                      </span>
                    </div>
                  </div>

                  {/* Sensitivity & Risk Pill */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isHigh
                          ? "bg-risk-high/15 text-risk-high border-risk-high/30"
                          : isMedium
                          ? "bg-px-amber/15 text-px-amber border-px-amber/30"
                          : "bg-px-emerald/10 text-px-emerald border-px-emerald/20"
                      }`}
                    >
                      {isHigh ? "High Privacy Risk" : isMedium ? "Elevated Risk" : "Minimized"}
                    </span>
                    <Activity
                      className={`w-3.5 h-3.5 ${
                        isHigh ? "text-risk-high animate-pulse" : isMedium ? "text-px-amber" : "text-px-text-muted"
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 rounded-full bg-px-surface border border-px-border flex items-center justify-center mx-auto text-px-text-muted">
                <Radio className="w-7 h-7 opacity-40" />
              </div>
              <div className="space-y-1">
                <p className="text-base text-white font-medium">
                  No telemetry signals captured yet
                </p>
                <p className="text-xs text-px-text-muted max-w-md mx-auto">
                  Click <strong>&quot;Send Test Telemetry&quot;</strong> above to generate real-time test signals, or load the PrivacyX Shield extension in Chrome/Firefox to monitor real web browsing.
                </p>
              </div>
              <button
                onClick={triggerSimulation}
                disabled={simulating}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2 mx-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Inject Test Telemetry Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
