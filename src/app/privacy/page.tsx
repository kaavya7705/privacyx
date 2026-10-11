"use client";

import { Lock, Shield, Eye, Trash2, ArrowLeft, CheckCircle2, XCircle, Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-px-bg relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 gradient-overlay pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-px-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-px-emerald/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        {/* Navigation / Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-px-cyan hover:underline mb-2 bg-px-cyan/10 border border-px-cyan/25 px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Privacy Console</span>
          </Link>

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-px-surface border border-px-cyan/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,240,255,0.2)]">
              <Shield className="w-8 h-8 text-px-cyan" />
            </div>
            <Sparkles className="w-4 h-4 text-px-emerald absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
              <span>Privacy Commitments & Ethics</span>
              <span>🛡️</span>
            </h1>
            <p className="text-xs sm:text-sm text-px-text-secondary mt-2 max-w-xl mx-auto">
              Our core doctrine: The privacy tool itself must NEVER become the adversary. Complete transparency on telemetry, zero external leakage.
            </p>
          </div>
        </div>

        {/* Doctrine Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border-px-emerald/30 bg-gradient-to-r from-px-surface via-px-surface/80 to-px-surface space-y-2 shadow-lg"
        >
          <div className="flex items-center gap-2 text-px-emerald font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>THE PRIVACYX DOCTRINE</span>
          </div>
          <p className="text-sm text-px-text-secondary leading-relaxed">
            PrivacyX was architected from the ground up to prevent the observer effect. All telemetry normalization happens on the local client machine, mathematical noise injection uses cryptographically secure primitives, and zero personal identifiers are ever sent to external LLMs.
          </p>
        </motion.div>

        {/* Commitments Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strictly Prohibited */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border-risk-critical/30 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-px-border/60">
              <div className="p-2 rounded-lg bg-risk-critical/10 text-risk-critical">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">What We NEVER Collect</h2>
                <div className="text-[11px] text-risk-critical font-medium">Strict zero-access quarantine</div>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-px-text-secondary">
              {[
                "Passwords and keystroke logs",
                "Private messages and emails",
                "Banking credentials and payment methods",
                "Clipboard content and memory dumps",
                "Screenshots and webcam feeds",
                "Authentication tokens and cookies",
                "Private page DOM text or form fills",
                "Exact GPS coordinates (latitude/longitude)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-risk-critical font-bold text-sm mt-[-2px]">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With Explicit Consent */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 border-px-emerald/30 space-y-4"
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-px-border/60">
              <div className="p-2 rounded-lg bg-px-emerald/10 text-px-emerald">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">What We Measure (With Consent)</h2>
                <div className="text-[11px] text-px-emerald font-medium">Sanitized statistical tokens</div>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-px-text-secondary">
              {[
                "Domain categories (e.g. developer_tools, not actual full URL)",
                "Coarse time buckets (15-minute intervals, zero micro-timestamps)",
                "Visit duration estimates (e.g. '5-10m')",
                "General website taxonomy classifications",
                "Navigation frequency metrics",
                "Aggregated cross-device correlation signals",
                "Normalized adversarial attack simulations",
                "Differential privacy mathematical epsilon values",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-px-emerald font-bold text-sm mt-[-2px]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* User Rights Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-px-cyan/10 border border-px-cyan/30 text-px-cyan">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Absolute Rights & Sovereign Controls</h2>
              <p className="text-xs text-px-text-muted">
                Under GDPR Article 17, CCPA, and Privacy by Design standards:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: "One-Click Instant Purge", desc: "Permanently erase all events from MongoDB at any moment" },
              { title: "Pause At Will", desc: "Stop all local telemetry listening whenever needed" },
              { title: "Configurable Retention", desc: "Set automatic pruning to 7, 30, or 90 days" },
              { title: "Inspect Every Packet", desc: "Full evidence graph inspection of what AI deduces" },
              { title: "Defense Obfuscation", desc: "Apply differential privacy & noise injection locally" },
              { title: "Zero Lock-In", desc: "Export privacy risk reports in markdown format anytime" },
            ].map((right, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-px-border bg-px-surface/40 space-y-1">
                <div className="text-xs font-bold text-px-cyan flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{right.title}</span>
                </div>
                <div className="text-[11px] text-px-text-muted leading-relaxed">
                  {right.desc}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-px-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-px-text-secondary">
              <Heart className="w-4 h-4 text-px-magenta" />
              <span>Crafted for human freedom and privacy resilience.</span>
            </div>
            <Link href="/dashboard" className="btn-primary text-xs flex items-center justify-center gap-2">
              <span>Open Dashboard Console</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
