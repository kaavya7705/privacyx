"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield, Eye, Target, ShieldCheck, RefreshCw, BarChart3,
  ChevronRight, Zap, Brain, Lock, Sparkles, Heart, Star,
} from "lucide-react";

const ATTACK_LOOP = [
  { icon: Eye, label: "OBSERVE", color: "text-px-cyan", desc: "Authorized telemetry", emoji: "👁️" },
  { icon: Brain, label: "ANALYZE", color: "text-px-purple", desc: "ML pattern detection", emoji: "🧠" },
  { icon: Target, label: "ATTACK", color: "text-px-magenta", desc: "Privacy attack simulation", emoji: "🎯" },
  { icon: Zap, label: "EXPLAIN", color: "text-px-amber", desc: "AI-powered explanations", emoji: "⚡" },
  { icon: ShieldCheck, label: "DEFEND", color: "text-px-emerald", desc: "Privacy defenses", emoji: "🛡️" },
  { icon: RefreshCw, label: "RE-ATTACK", color: "text-risk-high", desc: "Validate defenses", emoji: "🔄" },
  { icon: BarChart3, label: "MEASURE", color: "text-px-cyan", desc: "Privacy regression test", emoji: "📊" },
];

const FLOATING_PARTICLES = [
  { x: "10%", y: "20%", delay: 0, size: "w-2 h-2", color: "bg-px-cyan/30" },
  { x: "80%", y: "15%", delay: 0.5, size: "w-1.5 h-1.5", color: "bg-px-magenta/30" },
  { x: "60%", y: "70%", delay: 1, size: "w-2.5 h-2.5", color: "bg-px-purple/20" },
  { x: "25%", y: "80%", delay: 1.5, size: "w-1.5 h-1.5", color: "bg-px-emerald/25" },
  { x: "90%", y: "50%", delay: 2, size: "w-2 h-2", color: "bg-px-amber/20" },
  { x: "5%", y: "55%", delay: 0.8, size: "w-2 h-2", color: "bg-px-cyan/20" },
  { x: "45%", y: "10%", delay: 1.2, size: "w-1 h-1", color: "bg-px-magenta/25" },
  { x: "70%", y: "85%", delay: 0.3, size: "w-2 h-2", color: "bg-px-purple/30" },
];

export default function LandingPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Auto-animate the attack loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ATTACK_LOOP.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-px-bg relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute inset-0 gradient-overlay" />

      {/* Floating particles */}
      {FLOATING_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute ${p.size} ${p.color} rounded-full blur-[1px]`}
          style={{ left: p.x, top: p.y }}
          animate={{
            y: [0, -20, -10, -25, 0],
            opacity: [0.4, 0.8, 0.6, 0.9, 0.4],
            scale: [1, 1.2, 1, 1.3, 1],
          }}
          transition={{
            duration: 6,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Secondary gradient blob */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-px-purple/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-px-cyan/5 rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <Shield className="w-8 h-8 text-px-cyan" />
            <div className="absolute inset-0 blur-lg bg-px-cyan/30" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Privacy<span className="text-px-cyan">X</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-px-purple/10 border border-px-purple/30 text-[10px] text-px-purple font-semibold ml-1">
            <Sparkles className="w-3 h-3" />
            AI-Powered
          </span>
        </motion.div>
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/login"
            className="text-sm text-px-text-secondary hover:text-px-text transition-colors duration-200 hover:underline underline-offset-4"
          >
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-xs">
            Get Started
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8">
        <section className="pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-px-cyan/30 bg-px-cyan/5 mb-8"
              animate={{ boxShadow: [
                "0 0 0px rgba(0,240,255,0)",
                "0 0 20px rgba(0,240,255,0.15)",
                "0 0 0px rgba(0,240,255,0)",
              ]}}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="pulse-dot" />
              <span className="text-xs text-px-cyan font-medium tracking-wider uppercase">
                AI-Powered Privacy Testing
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 max-w-4xl mx-auto">
              <motion.span
                className="text-px-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                YOUR DATA DOESN&apos;T{" "}
              </motion.span>
              <br />
              <motion.span
                className="text-px-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                HAVE TO BE{" "}
              </motion.span>
              <motion.span
                className="text-px-cyan glow-text-cyan inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                SENSITIVE
              </motion.span>
              <br />
              <motion.span
                className="text-px-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                TO REVEAL SOMETHING{" "}
              </motion.span>
              <motion.span
                className="text-px-magenta glow-text-magenta inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, type: "spring" }}
              >
                SENSITIVE
              </motion.span>
            </h1>

            <motion.p
              className="text-lg text-px-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              PrivacyX simulates what an attacker could infer from your digital footprint.
              Discover hidden privacy risks, test defenses, and measure protection — all
              powered by machine learning and adversarial analysis.
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <Link
                href="/register"
                className="btn-primary text-base px-8 py-4 flex items-center gap-2 group"
              >
                <Target className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
                START PRIVACY TEST
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/privacy"
                className="px-8 py-4 rounded-lg border border-px-border text-px-text-secondary hover:text-px-text hover:border-px-border-light hover:bg-px-surface/30 transition-all duration-200 text-base flex items-center gap-2 group"
              >
                <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Attack Loop Visualization */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-center text-sm text-px-text-muted uppercase tracking-[0.2em] mb-10 font-medium">
              The Privacy Penetration Testing Loop
            </h2>

            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap max-w-5xl mx-auto">
              {ATTACK_LOOP.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <div key={step.label} className="flex items-center gap-2 md:gap-4">
                    <motion.div
                      className={`glass-card-hover p-4 md:p-6 text-center cursor-pointer min-w-[100px] relative ${
                        isActive ? "border-px-cyan/40" : ""
                      }`}
                      onHoverStart={() => setHoveredStep(i)}
                      onHoverEnd={() => setHoveredStep(null)}
                      whileHover={{ scale: 1.05, y: -5 }}
                      animate={isActive ? { y: -3, scale: 1.02 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-gradient-to-b from-px-cyan/10 to-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                      <span className="text-xl md:text-2xl block mb-1">{step.emoji}</span>
                      <step.icon
                        className={`w-5 h-5 md:w-6 md:h-6 ${step.color} mx-auto mb-2 ${
                          isActive ? "drop-shadow-lg" : ""
                        }`}
                      />
                      <div className={`text-xs font-bold tracking-wider ${isActive ? "text-px-text" : ""}`}>
                        {step.label}
                      </div>
                      {(hoveredStep === i || isActive) && (
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
                      <motion.div
                        animate={{ opacity: activeStep === i ? 1 : 0.3 }}
                      >
                        <ChevronRight className="w-4 h-4 text-px-border-light hidden md:block" />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {ATTACK_LOOP.map((_, i) => (
                <motion.div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    activeStep === i
                      ? "w-6 h-1.5 bg-px-cyan"
                      : "w-1.5 h-1.5 bg-px-border"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* Feature Cards */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Brain,
                title: "ML-Powered Analysis",
                emoji: "🤖",
                desc: "DBSCAN clustering, Isolation Forest anomaly detection, behavioral fingerprinting, and re-identification risk scoring — not just LLM calls.",
                color: "text-px-purple",
                borderColor: "hover:border-px-purple/40",
                glow: "group-hover:shadow-[0_0_30px_rgba(153,69,255,0.15)]",
              },
              {
                icon: Target,
                title: "9 Attack Types",
                emoji: "🎯",
                desc: "Home inference, routine detection, interest profiling, behavioral fingerprinting, re-identification, cross-source correlation, and more.",
                color: "text-px-magenta",
                borderColor: "hover:border-px-magenta/40",
                glow: "group-hover:shadow-[0_0_30px_rgba(255,0,110,0.15)]",
              },
              {
                icon: Lock,
                title: "Privacy by Design",
                emoji: "🔒",
                desc: "All monitoring requires explicit consent. Data is locally filtered before transmission. Configurable retention. Full data deletion.",
                color: "text-px-emerald",
                borderColor: "hover:border-px-emerald/40",
                glow: "group-hover:shadow-[0_0_30px_rgba(0,255,136,0.15)]",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className={`glass-card-hover p-8 group ${card.glow} ${card.borderColor} relative`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                whileHover={{ y: -4 }}
              >
                <span className="text-3xl block mb-3">{card.emoji}</span>
                <card.icon className={`w-8 h-8 ${card.color} mb-4`} />
                <h3 className="text-lg font-bold mb-3">{card.title}</h3>
                <p className="text-sm text-px-text-secondary leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Attack Vectors", value: "9+", emoji: "⚔️" },
              { label: "ML Models", value: "6+", emoji: "🧠" },
              { label: "Defense Strategies", value: "6", emoji: "🛡️" },
              { label: "Data Collected", value: "Minimal", emoji: "✨" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass-card p-6 text-center group hover:border-px-cyan/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                whileHover={{ scale: 1.03 }}
              >
                <span className="text-2xl block mb-2">{stat.emoji}</span>
                <div className="text-2xl md:text-3xl font-black text-px-cyan mb-1">{stat.value}</div>
                <div className="text-xs text-px-text-muted uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Research statement */}
        <section className="py-12 text-center">
          <motion.div
            className="glass-card p-10 max-w-3xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="absolute top-4 left-4 text-6xl opacity-10 select-none">&ldquo;</div>
            <div className="absolute bottom-4 right-4 text-6xl opacity-10 select-none">&rdquo;</div>
            <p className="text-lg text-px-text-secondary italic leading-relaxed relative z-10">
              Privacy is not simply about what data is collected.
              Privacy is about what can be{" "}
              <span className="text-px-cyan font-semibold not-italic">inferred</span> from
              the data when seemingly harmless signals are{" "}
              <span className="text-px-magenta font-semibold not-italic">combined</span>.
            </p>
            <div className="mt-6 text-sm text-px-text-muted relative z-10">
              PrivacyX makes those hidden inferences visible, measurable, explainable, and testable.
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section className="py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to discover your{" "}
              <span className="text-px-cyan glow-text-cyan">privacy risks</span>?
            </h2>
            <p className="text-px-text-secondary mb-8">
              Start your AI-powered privacy penetration test in minutes. No credit card required.
            </p>
            <Link
              href="/register"
              className="btn-primary text-lg px-10 py-5 inline-flex items-center gap-3 group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Get Started Free
              <Heart className="w-4 h-4 text-px-magenta group-hover:scale-125 transition-transform" />
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-px-border text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-px-cyan" />
            <span className="text-sm font-semibold">
              Privacy<span className="text-px-cyan">X</span>
            </span>
          </div>
          <p className="text-xs text-px-text-muted max-w-xl mx-auto">
            Research-oriented privacy penetration testing platform.
            PrivacyX itself does not collect passwords, keystrokes, messages, banking information, or any raw personal content.
          </p>
          <div className="flex items-center justify-center gap-1 mt-3 text-xs text-px-text-muted">
            Made with <Heart className="w-3 h-3 text-px-magenta inline" /> for privacy
          </div>
        </footer>
      </main>
    </div>
  );
}
