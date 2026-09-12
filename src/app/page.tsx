"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Eye, Target, ShieldCheck, RefreshCw, BarChart3, ChevronRight, Zap, Brain, Lock } from "lucide-react";

const ATTACK_LOOP = [
  { icon: Eye, label: "OBSERVE", color: "text-px-cyan", desc: "Authorized telemetry" },
  { icon: Brain, label: "ANALYZE", color: "text-px-purple", desc: "ML pattern detection" },
  { icon: Target, label: "ATTACK", color: "text-px-magenta", desc: "Privacy attack simulation" },
  { icon: Zap, label: "EXPLAIN", color: "text-px-amber", desc: "AI-powered explanations" },
  { icon: ShieldCheck, label: "DEFEND", color: "text-px-emerald", desc: "Privacy defenses" },
  { icon: RefreshCw, label: "RE-ATTACK", color: "text-risk-high", desc: "Validate defenses" },
  { icon: BarChart3, label: "MEASURE", color: "text-px-cyan", desc: "Privacy regression test" },
];

export default function LandingPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-px-bg relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 gradient-overlay" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 text-px-cyan" />
            <div className="absolute inset-0 blur-lg bg-px-cyan/30" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Privacy<span className="text-px-cyan">X</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-px-text-secondary hover:text-px-text transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-xs">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8">
        <section className="pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-px-cyan/30 bg-px-cyan/5 mb-8">
              <div className="pulse-dot" />
              <span className="text-xs text-px-cyan font-medium tracking-wider uppercase">
                AI-Powered Privacy Testing
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl mx-auto">
              <span className="text-px-text">YOUR DATA DOESN&apos;T </span>
              <br />
              <span className="text-px-text">HAVE TO BE </span>
              <span className="text-px-cyan glow-text-cyan">SENSITIVE</span>
              <br />
              <span className="text-px-text">TO REVEAL SOMETHING </span>
              <span className="text-px-magenta glow-text-magenta">SENSITIVE</span>
            </h1>

            <p className="text-lg text-px-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
              PrivacyX simulates what an attacker could infer from your digital footprint.
              Discover hidden privacy risks, test defenses, and measure protection — all
              powered by machine learning and adversarial analysis.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                START PRIVACY TEST
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/privacy"
                className="px-8 py-4 rounded-lg border border-px-border text-px-text-secondary hover:text-px-text hover:border-px-border-light transition-all duration-200 text-base"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Attack Loop Visualization */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-center text-sm text-px-text-muted uppercase tracking-[0.2em] mb-12 font-medium">
              The Privacy Penetration Testing Loop
            </h2>

            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap max-w-5xl mx-auto">
              {ATTACK_LOOP.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 md:gap-4">
                  <motion.div
                    className="glass-card-hover p-4 md:p-6 text-center cursor-pointer min-w-[100px]"
                    onHoverStart={() => setHoveredStep(i)}
                    onHoverEnd={() => setHoveredStep(null)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <step.icon className={`w-6 h-6 md:w-8 md:h-8 ${step.color} mx-auto mb-2`} />
                    <div className="text-xs font-bold tracking-wider">{step.label}</div>
                    {hoveredStep === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[10px] text-px-text-muted mt-1"
                      >
                        {step.desc}
                      </motion.div>
                    )}
                  </motion.div>
                  {i < ATTACK_LOOP.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-px-border-light hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Brain,
                title: "ML-Powered Analysis",
                desc: "DBSCAN clustering, Isolation Forest anomaly detection, behavioral fingerprinting, and re-identification risk scoring — not just LLM calls.",
                color: "text-px-purple",
                glow: "group-hover:shadow-[0_0_30px_rgba(153,69,255,0.2)]",
              },
              {
                icon: Target,
                title: "9 Attack Types",
                desc: "Home inference, routine detection, interest profiling, behavioral fingerprinting, re-identification, cross-source correlation, and more.",
                color: "text-px-magenta",
                glow: "group-hover:shadow-[0_0_30px_rgba(255,0,110,0.2)]",
              },
              {
                icon: Lock,
                title: "Privacy by Design",
                desc: "All monitoring requires explicit consent. Data is locally filtered before transmission. Configurable retention. Full data deletion.",
                color: "text-px-emerald",
                glow: "group-hover:shadow-[0_0_30px_rgba(0,255,136,0.2)]",
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                className={`glass-card-hover p-8 group ${card.glow}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <card.icon className={`w-10 h-10 ${card.color} mb-4`} />
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-px-text-secondary leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Research statement */}
        <section className="py-16 text-center">
          <div className="glass-card p-10 max-w-3xl mx-auto">
            <p className="text-lg text-px-text-secondary italic leading-relaxed">
              &ldquo;Privacy is not simply about what data is collected.
              Privacy is about what can be <span className="text-px-cyan font-semibold">inferred</span> from
              the data when seemingly harmless signals are <span className="text-px-magenta font-semibold">combined</span>.&rdquo;
            </p>
            <div className="mt-4 text-sm text-px-text-muted">
              PrivacyX makes those hidden inferences visible, measurable, explainable, and testable.
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-px-border text-center">
          <p className="text-xs text-px-text-muted">
            PrivacyX — Research-oriented privacy penetration testing platform.
            PrivacyX itself does not collect passwords, keystrokes, messages, banking information, or any raw personal content.
          </p>
        </footer>
      </main>
    </div>
  );
}
