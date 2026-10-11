"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-px-bg flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 grid-bg opacity-25" />
      <div className="absolute inset-0 gradient-overlay" />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-px-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-px-emerald/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-px-emerald/40 pointer-events-none"
          style={{
            right: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="relative z-10 w-full max-w-md my-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="relative">
              <Shield className="w-9 h-9 text-px-cyan transition-transform group-hover:scale-110 duration-200" />
              <div className="absolute inset-0 blur-md bg-px-cyan/40 rounded-full" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Privacy<span className="text-px-cyan glow-text-cyan">X</span>
            </span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <span className="text-lg">🛡️</span>
          </div>
          <p className="text-xs sm:text-sm text-px-text-secondary">
            Join the adversarial privacy penetration testing platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8 space-y-5 border-px-cyan/20 shadow-2xl shadow-black/80">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-px-magenta/10 border border-px-magenta/30 text-px-magenta text-xs font-medium flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-px-text-secondary mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-sm"
                  placeholder="Kaavya Gupta"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-px-text-secondary mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 text-sm"
                  placeholder="you@domain.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-px-text-secondary mb-1.5 uppercase tracking-wider">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 text-sm"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-px-text-muted hover:text-px-text transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-px-text-muted">
                <CheckCircle className="w-3.5 h-3.5 text-px-emerald flex-shrink-0" />
                <span>Zero telemetry sold or leaked to third parties</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-px-text-muted">
                <CheckCircle className="w-3.5 h-3.5 text-px-emerald flex-shrink-0" />
                <span>Local client filtering with differential privacy defenses</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg shadow-px-cyan/20 disabled:opacity-50 mt-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-px-cyan border-t-transparent rounded-full animate-spin" />
                  <span>Initializing Secure Sandbox...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-px-text-secondary pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-px-cyan hover:underline font-semibold ml-1">
              Sign in here →
            </Link>
          </p>
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[11px] text-px-text-muted">
          <Sparkles className="w-3 h-3 text-px-cyan" />
          <span>GDPR, CCPA & Privacy by Design compliant</span>
        </div>
      </motion.div>
    </div>
  );
}
