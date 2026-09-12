import { Lock, Shield, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-px-bg">
      <div className="max-w-3xl mx-auto px-8 py-16 space-y-12">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-px-cyan" />
            <span className="text-2xl font-bold">Privacy<span className="text-px-cyan">X</span></span>
          </Link>
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Lock className="w-8 h-8 text-px-emerald" /> Privacy Commitments
          </h1>
        </div>

        <div className="glass-card p-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-px-cyan mb-3 flex items-center gap-2"><Shield className="w-5 h-5" /> What We Do NOT Collect</h2>
            <ul className="space-y-2 text-sm text-px-text-secondary">
              {["Passwords", "Keystrokes", "Private messages", "Banking information", "Payment card data",
                "Clipboard contents", "Screenshots", "Microphone recordings", "Webcam data",
                "Authentication tokens", "Full form values", "Private page contents"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-risk-critical">✕</span> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-px-cyan mb-3 flex items-center gap-2"><Eye className="w-5 h-5" /> What We Collect (With Consent)</h2>
            <ul className="space-y-2 text-sm text-px-text-secondary">
              {["Domain categories (e.g., 'developer_tools', not the specific URL)",
                "Time buckets (15-minute windows, not exact timestamps)",
                "Visit duration buckets (e.g., '5-10m')",
                "Website category classifications",
                "Navigation frequency",
                "Referrer category (not the actual referrer URL)"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-px-emerald">✓</span> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-px-cyan mb-3 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Your Rights</h2>
            <ul className="space-y-2 text-sm text-px-text-secondary">
              {["Pause monitoring at any time", "Resume monitoring at any time",
                "Revoke any permission", "Delete all data instantly",
                "Configure data retention (7/30/90 days)", "Inspect all collected data",
                "Export privacy reports"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-px-cyan">→</span> {item}
                </li>
              ))}
            </ul>
          </section>

          <div className="p-4 rounded-lg bg-px-emerald/5 border border-px-emerald/20 text-sm text-px-emerald">
            <strong>PrivacyX itself must not become spyware.</strong> Every monitoring category requires
            explicit consent. Data is locally filtered before transmission. Only structured evidence
            is sent to AI — never raw browsing data.
          </div>
        </div>
      </div>
    </div>
  );
}
