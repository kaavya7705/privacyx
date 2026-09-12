"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-px-bg flex items-center justify-center relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute inset-0 gradient-overlay" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-px-cyan" />
            <span className="text-2xl font-bold">Privacy<span className="text-px-cyan">X</span></span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-px-text-secondary">Start your privacy penetration test</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-px-magenta/10 border border-px-magenta/30 text-px-magenta text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-px-text-secondary mb-2 uppercase tracking-wider">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="input-field pl-10" placeholder="Your name" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-px-text-secondary mb-2 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-px-text-secondary mb-2 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-px-text-muted" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10" placeholder="Minimum 6 characters" required minLength={6} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? "Creating account..." : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-center text-sm text-px-text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-px-cyan hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
