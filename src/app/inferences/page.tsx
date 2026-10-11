"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import {
  Brain, AlertTriangle, Eye, Shield, Database, Clock, Globe,
  Home, Briefcase, Repeat, Target, Fingerprint, Link2, Activity,
  Zap, ChevronDown, Info, BarChart3,
} from "lucide-react";

interface InferenceData {
  _id: string;
  type: string;
  confidence: number;
  risk: number;
  attackProfile: string;
  evidence: Array<{ id: string; description: string; strength: number }>;
  assumptions: string[];
  alternatives: string[];
  createdAt: string;
}

interface EventSummary {
  total: number;
  events: Array<{
    category: string;
    source: string;
    timeBucket: string;
    sensitivity: number;
    createdAt: string;
  }>;
}

// Plain-language metadata for each inference type
const INFERENCE_META: Record<string, {
  icon: typeof Brain;
  title: string;
  whatItMeans: string;
  whyItMatters: string;
  whatYouCanDo: string;
  color: string;
}> = {
  LIKELY_HOME_AREA: {
    icon: Home,
    title: "Your Home Schedule",
    whatItMeans: "By looking at when you browse late at night and early morning, someone could figure out your sleep schedule and when you're likely at home.",
    whyItMatters: "Knowing when someone is home (or not) is sensitive — it reveals living patterns and could be used for physical surveillance or social engineering.",
    whatYouCanDo: "Use timestamp bucketing to blur your exact schedule, or add noise events during off-hours.",
    color: "text-px-cyan",
  },
  LIKELY_WORK_AREA: {
    icon: Briefcase,
    title: "Your Work/School Pattern",
    whatItMeans: "Your activity during business hours, combined with education and career-related browsing, reveals when and where you likely work or study.",
    whyItMatters: "Work schedule patterns can expose your employer, commute times, and professional role even without directly sharing that information.",
    whatYouCanDo: "Apply category aggregation to merge career/education into broader groups, or suppress infrequent professional categories.",
    color: "text-px-amber",
  },
  PREDICTABLE_ROUTINE: {
    icon: Repeat,
    title: "Your Daily Routine",
    whatItMeans: "You tend to visit the same types of websites at the same times each day. This recurring pattern makes your behavior predictable.",
    whyItMatters: "A predictable routine is a privacy risk because it lets someone anticipate your actions, preferences, and availability.",
    whatYouCanDo: "Noise injection is the most effective defense — it adds random events to break routine patterns.",
    color: "text-px-purple",
  },
  INTEREST_PROFILE: {
    icon: Target,
    title: "Your Interests & Preferences",
    whatItMeans: "Your browsing categories reveal what topics you care about — from technology to health to finance to entertainment.",
    whyItMatters: "An interest profile can be used for targeted advertising, discrimination (e.g., insurance based on health browsing), or social manipulation.",
    whatYouCanDo: "Category aggregation hides specific interests by grouping them into broader categories.",
    color: "text-px-magenta",
  },
  BEHAVIORAL_FINGERPRINT: {
    icon: Fingerprint,
    title: "Your Unique Digital Fingerprint",
    whatItMeans: "The combination of WHEN you browse, WHAT categories you visit, and HOW consistently you do it creates a unique behavioral signature — like a fingerprint.",
    whyItMatters: "Even without your name, this fingerprint could identify you across different devices, browsers, or accounts.",
    whatYouCanDo: "Combined defense (bucketing + suppression + noise) is most effective at reducing fingerprint uniqueness.",
    color: "text-risk-high",
  },
  REIDENTIFICATION_RISK: {
    icon: Eye,
    title: "Could Someone Identify You?",
    whatItMeans: "If someone had access to both this anonymous data and another dataset (e.g., social media), they might be able to link them back to you.",
    whyItMatters: "Re-identification means your 'anonymous' data could be traced back to your real identity, defeating the purpose of anonymization.",
    whatYouCanDo: "K-anonymity ensures you blend in with at least 5 other users. Differential privacy adds mathematical noise guarantees.",
    color: "text-risk-critical",
  },
  CROSS_SOURCE_CORRELATION: {
    icon: Link2,
    title: "Cross-Device/Source Linking",
    whatItMeans: "If data comes from multiple sources (browser, location, desktop), the overlapping timestamps and categories can be used to link them as belonging to one person.",
    whyItMatters: "Linking data across sources creates a more complete picture of your life than any single source alone.",
    whatYouCanDo: "Reduce the number of data sources, or apply different timestamp offsets to each source.",
    color: "text-px-emerald",
  },
  TEMPORAL_PATTERN: {
    icon: Clock,
    title: "Your Time-of-Day Patterns",
    whatItMeans: "Your browsing activity clusters around specific hours, revealing your timezone, work schedule, and daily rhythm.",
    whyItMatters: "Time patterns alone can reveal your geographic region, occupation type (shift worker vs 9-5), and lifestyle.",
    whatYouCanDo: "Timestamp bucketing rounds times to the nearest hour, and differential privacy adds random time shifts.",
    color: "text-px-cyan",
  },
  ANOMALY_EXPLOITATION: {
    icon: Zap,
    title: "Unusual Activity Spikes",
    whatItMeans: "Unusual deviations from your normal pattern (e.g., browsing health sites at 3 AM) stand out and could reveal sensitive life events.",
    whyItMatters: "Anomalies are highly informative — a sudden spike in healthcare browsing could indicate a health concern, or late-night finance browsing could indicate financial stress.",
    whatYouCanDo: "Low-frequency suppression removes rare outlier events. Noise injection dilutes the signal of anomalies.",
    color: "text-px-amber",
  },
};

const CATEGORY_INFO: Record<string, { icon: string; label: string; sensitivity: string; whatItReveals: string }> = {
  technology: { icon: "💻", label: "Technology", sensitivity: "Low", whatItReveals: "Your technical skills, programming interests, tools you use" },
  developer_tools: { icon: "🛠️", label: "Developer Tools", sensitivity: "Low", whatItReveals: "That you're likely a software developer and which tools/languages you prefer" },
  education: { icon: "📚", label: "Education", sensitivity: "Low", whatItReveals: "What subjects you're studying, your education level, career aspirations" },
  career: { icon: "💼", label: "Career & Jobs", sensitivity: "High", whatItReveals: "That you may be job searching, your industry, salary range expectations" },
  finance: { icon: "💰", label: "Finance & Banking", sensitivity: "Very High", whatItReveals: "Financial interests, investment behavior, potential income bracket" },
  healthcare: { icon: "🏥", label: "Healthcare", sensitivity: "Very High", whatItReveals: "Health concerns, medical conditions being researched, wellness interests" },
  shopping: { icon: "🛒", label: "Shopping", sensitivity: "Medium", whatItReveals: "Purchase interests, lifestyle preferences, spending patterns" },
  entertainment: { icon: "🎬", label: "Entertainment", sensitivity: "Low", whatItReveals: "Media preferences, entertainment habits, free time activities" },
  social: { icon: "👥", label: "Social Media", sensitivity: "Medium", whatItReveals: "Social network usage, communication patterns, community involvement" },
  travel: { icon: "✈️", label: "Travel", sensitivity: "Medium", whatItReveals: "Travel interests, destinations researched, upcoming trip planning" },
  news: { icon: "📰", label: "News", sensitivity: "Low", whatItReveals: "News preferences, political interests, current event awareness" },
  sports: { icon: "⚽", label: "Sports", sensitivity: "Low", whatItReveals: "Sports interests, favorite teams, physical activity level" },
  gaming: { icon: "🎮", label: "Gaming", sensitivity: "Low", whatItReveals: "Gaming platforms used, genre preferences, time spent gaming" },
  search: { icon: "🔍", label: "Search Engines", sensitivity: "Medium", whatItReveals: "General search behavior — what you're looking for but not finding directly" },
  unknown: { icon: "📌", label: "Other", sensitivity: "Unknown", whatItReveals: "Uncategorized activity" },
};

function getRiskColor(s: number) {
  return s <= 30 ? "text-risk-low" : s <= 60 ? "text-risk-medium" : s <= 80 ? "text-risk-high" : "text-risk-critical";
}

function getRiskLabel(s: number) {
  return s <= 30 ? "Low" : s <= 60 ? "Medium" : s <= 80 ? "High" : "Critical";
}

function getRiskBadge(s: number) {
  const base = "text-xs font-bold px-2.5 py-1 rounded-full";
  if (s <= 30) return `${base} bg-risk-low/20 text-risk-low`;
  if (s <= 60) return `${base} bg-risk-medium/20 text-risk-medium`;
  if (s <= 80) return `${base} bg-risk-high/20 text-risk-high`;
  return `${base} bg-risk-critical/20 text-risk-critical`;
}

function getSensitivityColor(s: string) {
  if (s === "Very High") return "text-risk-critical";
  if (s === "High") return "text-risk-high";
  if (s === "Medium") return "text-risk-medium";
  return "text-risk-low";
}

export default function InferencesPage() {
  const [inferences, setInferences] = useState<InferenceData[]>([]);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [expandedInference, setExpandedInference] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"collected" | "inferred">("collected");

  const fetchData = useCallback(async () => {
    try {
      const [infRes, evtRes] = await Promise.all([
        fetch("/api/inferences?limit=50"),
        fetch("/api/events?limit=200"),
      ]);
      const infData = await infRes.json();
      const evtData = await evtRes.json();
      setInferences(infData.inferences || []);
      setEventSummary(evtData);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute category distribution from events
  const categoryStats = eventSummary?.events
    ? Object.entries(
        eventSummary.events.reduce((acc: Record<string, number>, e) => {
          acc[e.category] = (acc[e.category] || 0) + 1;
          return acc;
        }, {})
      )
        .map(([category, count]) => ({
          category,
          count: count as number,
          percentage: Math.round(((count as number) / eventSummary.events.length) * 100),
          ...(CATEGORY_INFO[category] || CATEGORY_INFO.unknown),
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  // Compute time distribution
  const hourStats = eventSummary?.events
    ? (() => {
        const hours = new Array(24).fill(0);
        eventSummary.events.forEach((e) => {
          const hour = parseInt(e.timeBucket?.split(":")[0] || "0");
          if (!isNaN(hour)) hours[hour]++;
        });
        return hours;
      })()
    : new Array(24).fill(0);
  const maxHourCount = Math.max(...hourStats, 1);
  const peakHour = hourStats.indexOf(Math.max(...hourStats));

  // Deduplicate inferences — take the latest of each type
  const uniqueInferences = inferences.reduce((acc: InferenceData[], inf) => {
    if (!acc.find((i) => i.type === inf.type)) acc.push(inf);
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-px-purple" />
          Your Privacy Profile
        </h1>
        <p className="text-sm text-px-text-secondary mt-1">
          See exactly what data was collected and what someone could learn about you
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-px-surface rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("collected")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "collected"
              ? "bg-px-card text-px-text shadow-sm"
              : "text-px-text-muted hover:text-px-text"
          }`}
        >
          <Database className="w-4 h-4 inline mr-2" />
          What We Collected
        </button>
        <button
          onClick={() => setActiveTab("inferred")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === "inferred"
              ? "bg-px-card text-px-text shadow-sm"
              : "text-px-text-muted hover:text-px-text"
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          What Can Be Inferred
          {uniqueInferences.length > 0 && (
            <span className="ml-2 text-[10px] bg-px-magenta/20 text-px-magenta px-1.5 py-0.5 rounded-full">
              {uniqueInferences.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== TAB 1: WHAT WE COLLECTED ===== */}
      {activeTab === "collected" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-1">Total Events</div>
              <div className="text-3xl font-bold text-px-cyan">{eventSummary?.total || 0}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-1">Categories Seen</div>
              <div className="text-3xl font-bold text-px-purple">{categoryStats.length}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-1">Peak Activity</div>
              <div className="text-3xl font-bold text-px-amber">{peakHour}:00</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-1">Data Sources</div>
              <div className="text-3xl font-bold text-px-emerald">
                {eventSummary?.events ? new Set(eventSummary.events.map((e) => e.source)).size : 0}
              </div>
            </div>
          </div>

          {/* What was NOT collected */}
          <div className="glass-card p-4 border-px-emerald/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-px-emerald mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong className="text-px-emerald">What PrivacyX does NOT collect:</strong>
                <span className="text-px-text-muted"> Passwords, keystrokes, page content, messages, emails, form data, banking details, or any actual website content. Only minimal metadata (category, time, sensitivity level) is recorded.</span>
              </div>
            </div>
          </div>

          {/* Category breakdown — what types of sites you visited */}
          <div className="glass-card p-6">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-px-cyan" />
              Website Categories You Visited
            </h2>
            <p className="text-xs text-px-text-muted mb-4">
              We don&apos;t record specific URLs — just which <em>category</em> of website and how sensitive it is.
            </p>

            {categoryStats.length === 0 ? (
              <div className="text-center py-8 text-px-text-muted text-sm">
                No events yet. Generate test data or install the browser extension.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryStats.map((cat, i) => (
                  <motion.div
                    key={cat.category}
                    className="flex items-center gap-4 group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <span className="text-xl w-8 text-center">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cat.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            cat.sensitivity === "Very High" ? "border-risk-critical/30 text-risk-critical" :
                            cat.sensitivity === "High" ? "border-risk-high/30 text-risk-high" :
                            cat.sensitivity === "Medium" ? "border-risk-medium/30 text-risk-medium" :
                            "border-px-border text-px-text-muted"
                          }`}>
                            {cat.sensitivity} sensitivity
                          </span>
                        </div>
                        <span className="text-xs text-px-text-muted">{cat.count} events ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-px-bg rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-px-cyan to-px-purple rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ delay: i * 0.03 + 0.2, duration: 0.5 }}
                        />
                      </div>
                      <div className="text-[11px] text-px-text-muted mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        💡 <em>What this reveals: {cat.whatItReveals}</em>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline — when you're most active */}
          <div className="glass-card p-6">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-px-amber" />
              When You&apos;re Active
            </h2>
            <p className="text-xs text-px-text-muted mb-4">
              This timeline shows your browsing activity by hour. Peak hours reveal your timezone and daily schedule.
            </p>
            <div className="flex items-end gap-[2px] h-24">
              {hourStats.map((count, hour) => (
                <div
                  key={hour}
                  className="flex-1 relative group"
                  title={`${hour}:00 — ${count} events`}
                >
                  <motion.div
                    className={`w-full rounded-t-sm ${
                      count === 0
                        ? "bg-px-border/30"
                        : hour >= 22 || hour < 6
                        ? "bg-px-purple/60"
                        : hour >= 6 && hour < 10
                        ? "bg-px-amber/60"
                        : "bg-px-cyan/60"
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(2, (count / maxHourCount) * 100)}%` }}
                    transition={{ delay: hour * 0.02, duration: 0.3 }}
                  />
                  {/* Label every 3 hours */}
                  {hour % 3 === 0 && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-px-text-muted">
                      {hour}
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-px-bg-tertiary border border-px-border px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {hour}:00 — {count} events
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-6 text-[10px] text-px-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-px-purple/60" /> Night (10PM–6AM)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-px-amber/60" /> Morning (6AM–10AM)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-px-cyan/60" /> Day/Evening</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== TAB 2: WHAT CAN BE INFERRED ===== */}
      {activeTab === "inferred" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {uniqueInferences.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Brain className="w-12 h-12 text-px-text-muted mx-auto mb-4 opacity-30" />
              <p className="text-px-text-muted text-sm mb-2">No inferences yet.</p>
              <p className="text-xs text-px-text-muted">
                Go to the <Link href="/attack" className="text-px-cyan underline">Attack page</Link> and run a privacy attack first.
                Then come back here to see what could be learned about you.
              </p>
            </div>
          ) : (
            <>
              {/* Summary banner */}
              <div className="glass-card p-5 border-px-magenta/20 bg-gradient-to-r from-px-surface to-px-card">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-px-magenta mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm">
                      <strong className="text-px-magenta">Based on your data, an attacker could potentially learn {uniqueInferences.length} things about you.</strong>
                    </p>
                    <p className="text-xs text-px-text-muted mt-1">
                      These are probabilistic inferences, not confirmed facts. Each one shows what COULD be deduced from your digital footprint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Inference cards */}
              {uniqueInferences.map((inf, i) => {
                const meta = INFERENCE_META[inf.type] || INFERENCE_META.TEMPORAL_PATTERN;
                const Icon = meta?.icon || Activity;
                const isExpanded = expandedInference === inf._id;

                return (
                  <motion.div
                    key={inf._id}
                    className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <button
                      onClick={() => setExpandedInference(isExpanded ? null : inf._id)}
                      className="w-full p-5 text-left hover:bg-px-surface/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-px-border bg-px-surface ${meta?.color || 'text-px-text'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold">{meta?.title || inf.type.replace(/_/g, " ")}</h3>
                            <div className="flex items-center gap-2">
                              <span className={getRiskBadge(inf.risk)}>{getRiskLabel(inf.risk)} Risk</span>
                              <ChevronDown className={`w-4 h-4 text-px-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                          <p className="text-xs text-px-text-secondary mt-1">{meta?.whatItMeans}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-px-text-muted">
                            <span>Confidence: {Math.round(inf.confidence * 100)}%</span>
                            <span>·</span>
                            <span>{inf.evidence?.length || 0} evidence signals</span>
                            <span>·</span>
                            <span className="capitalize">{inf.attackProfile} attacker</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-px-border"
                        >
                          <div className="p-5 space-y-4">
                            {/* Why it matters */}
                            <div className="p-3 rounded-lg bg-px-amber/5 border border-px-amber/20">
                              <div className="text-[11px] uppercase tracking-wider text-px-amber font-bold mb-1">⚠️ Why This Matters</div>
                              <p className="text-xs text-px-text-secondary">{meta?.whyItMatters}</p>
                            </div>

                            {/* Evidence in plain language */}
                            <div>
                              <div className="text-xs text-px-text-muted uppercase tracking-wider mb-2">Evidence Found</div>
                              {inf.evidence?.map((e, j) => (
                                <div key={j} className="flex items-start gap-2 py-1.5">
                                  <AlertTriangle className="w-3 h-3 text-px-amber mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="text-sm text-px-text-secondary">{e.description}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <div className="h-1 w-16 bg-px-bg rounded-full overflow-hidden">
                                        <div className="h-full bg-px-amber rounded-full" style={{ width: `${Math.round(e.strength * 100)}%` }} />
                                      </div>
                                      <span className="text-[10px] text-px-text-muted">{Math.round(e.strength * 100)}% strength</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* What you can do */}
                            <div className="p-3 rounded-lg bg-px-emerald/5 border border-px-emerald/20">
                              <div className="text-[11px] uppercase tracking-wider text-px-emerald font-bold mb-1">🛡️ What You Can Do</div>
                              <p className="text-xs text-px-text-secondary">{meta?.whatYouCanDo}</p>
                              <Link href="/defense" className="inline-flex items-center gap-1 text-xs text-px-cyan mt-2 hover:underline">
                                <Shield className="w-3 h-3" /> Go to Defense Engine →
                              </Link>
                            </div>

                            {/* Disclaimer */}
                            <div className="text-[10px] text-px-text-muted border-t border-px-border/50 pt-2">
                              ⚠️ This is a probabilistic inference (confidence: {Math.round(inf.confidence * 100)}%), not a confirmed fact.
                              It represents what a {inf.attackProfile}-capability attacker could deduce from your data patterns.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
