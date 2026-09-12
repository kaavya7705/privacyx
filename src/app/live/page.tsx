"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Activity } from "lucide-react";

interface LiveEvent {
  _id: string;
  category: string;
  domainCategory: string;
  timeBucket: string;
  source: string;
  sensitivity: number;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  technology: "💻", developer_tools: "🛠️", education: "📚", career: "💼",
  finance: "💰", healthcare: "🏥", shopping: "🛒", entertainment: "🎬",
  social: "👥", travel: "✈️", news: "📰", sports: "⚽", gaming: "🎮",
  search: "🔍", location: "📍", unknown: "📌",
};

export default function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (isPaused) return;
    try {
      const res = await fetch("/api/events?limit=30");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) { console.error(e); }
  }, [isPaused]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Radio className="w-8 h-8 text-px-emerald" />
            Live Privacy Activity
          </h1>
          <p className="text-sm text-px-text-secondary mt-1">Real-time minimized privacy signals</p>
        </div>
        <button onClick={() => setIsPaused(!isPaused)}
          className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
            isPaused ? "border-px-emerald text-px-emerald" : "border-px-amber text-px-amber"
          }`}>
          {isPaused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className={`pulse-dot ${isPaused ? "opacity-30" : ""}`} />
          <span className="text-xs text-px-text-muted uppercase tracking-wider">
            {isPaused ? "FEED PAUSED" : "LIVE FEED"}
          </span>
          <span className="text-xs text-px-text-muted ml-auto">{events.length} events</span>
        </div>

        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
          <AnimatePresence>
            {events.map((event, i) => (
              <motion.div
                key={event._id}
                className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-px-surface/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <div className="text-xs text-px-text-muted font-mono w-16">
                  {event.timeBucket?.split("-")[0] || "—"}
                </div>
                <span className="text-lg">{CATEGORY_ICONS[event.category] || "📌"}</span>
                <div className="flex-1">
                  <span className="text-sm capitalize">{event.category.replace(/_/g, " ")} activity detected</span>
                </div>
                <Activity className={`w-3 h-3 ${event.sensitivity > 0.5 ? "text-risk-high" : "text-px-text-muted"}`} />
              </motion.div>
            ))}
          </AnimatePresence>
          {events.length === 0 && (
            <div className="text-center py-12 text-px-text-muted text-sm">
              No events yet. Generate test data or install the browser extension.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
