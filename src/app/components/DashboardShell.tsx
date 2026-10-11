"use client";

import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import { Shield, Menu, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-px-bg text-px-text">
        {/* Skeleton sidebar */}
        <aside className="w-60 bg-px-bg-secondary border-r border-px-border flex-shrink-0 hidden md:block">
          <div className="flex items-center gap-2 px-4 h-16 border-b border-px-border">
            <div className="w-6 h-6 rounded-lg bg-px-surface loading-shimmer" />
            <div className="w-28 h-5 rounded-md bg-px-surface loading-shimmer" />
          </div>
          <div className="p-3 space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-px-surface/60 loading-shimmer" />
            ))}
          </div>
        </aside>
        {/* Skeleton main area */}
        <main className="flex-1 transition-all duration-300 md:ml-60">
          <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-56 rounded-lg bg-px-surface loading-shimmer" />
                <div className="h-4 w-80 rounded-md bg-px-surface loading-shimmer" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-px-surface loading-shimmer" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-px-surface loading-shimmer" />
              ))}
            </div>
            <div className="h-72 rounded-xl bg-px-surface loading-shimmer mt-6" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-px-bg text-px-text flex flex-col md:flex-row relative selection:bg-px-cyan/30 selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-px-bg-secondary/90 backdrop-blur-md border-b border-px-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 text-px-text-secondary hover:text-white rounded-lg hover:bg-px-surface"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-px-cyan" />
            <span className="font-bold tracking-tight text-sm">
              Privacy<span className="text-px-cyan">X</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-px-cyan/10 border border-px-cyan/20 text-[10px] text-px-cyan font-bold">
            <Sparkles className="w-3 h-3" />
            Secure
          </span>
        </div>
      </header>

      {/* Synchronized Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area with dynamic margin based on desktop collapse */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        <div className="p-4 sm:p-6 md:p-8 max-w-[1440px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
