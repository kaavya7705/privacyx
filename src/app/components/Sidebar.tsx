"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, Radio, Target, Brain, GitBranch,
  ShieldCheck, ShieldAlert, GitCompare, FlaskConical, Clock, Settings,
  Lock, LogOut, ChevronLeft, ChevronRight, X
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
  color?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-px-cyan" },
  { href: "/live", icon: Radio, label: "Live Monitor", badge: "LIVE", color: "text-px-emerald" },
  { href: "/attack", icon: Target, label: "Attack Simulator", color: "text-px-magenta" },
  { href: "/inferences", icon: Brain, label: "Inferences", color: "text-px-purple" },
  { href: "/graph", icon: GitBranch, label: "Evidence Graph", color: "text-px-cyan" },
  { href: "/defense", icon: ShieldCheck, label: "Defense Engine", badge: "AI", color: "text-px-emerald" },
  { href: "/leaks", icon: ShieldAlert, label: "Data Leaks", color: "text-risk-critical" },
  { href: "/regression", icon: GitCompare, label: "Regression", color: "text-px-amber" },
  { href: "/experiments", icon: FlaskConical, label: "Experiments", color: "text-px-purple" },
  { href: "/history", icon: Clock, label: "History", color: "text-px-text-secondary" },
  { href: "/settings", icon: Settings, label: "Settings", color: "text-px-text-muted" },
  { href: "/privacy", icon: Lock, label: "Privacy Policy", color: "text-px-emerald" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Aside Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-px-bg-secondary/95 backdrop-blur-xl border-r border-px-border flex flex-col transition-all duration-300 z-50
          ${collapsed ? "md:w-16" : "md:w-60"}
          ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-px-border flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group overflow-hidden"
            onClick={onCloseMobile}
          >
            <div className="relative flex-shrink-0">
              <Shield className="w-6 h-6 text-px-cyan transition-transform group-hover:scale-110 duration-200" />
              <div className="absolute inset-0 blur-md bg-px-cyan/30 rounded-full" />
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Privacy<span className="text-px-cyan glow-text-cyan">X</span>
              </span>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-px-text-muted hover:text-white p-1 rounded-lg hover:bg-px-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-px-cyan/15 text-px-cyan border border-px-cyan/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                    : "text-px-text-secondary hover:text-px-text hover:bg-px-surface/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-px-cyan" : item.color || "text-px-text-muted"
                  }`}
                />

                {(!collapsed || mobileOpen) && (
                  <span className="truncate flex-1">{item.label}</span>
                )}

                {/* Badge if present */}
                {(!collapsed || mobileOpen) && item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.badge === "LIVE"
                        ? "bg-px-emerald/20 text-px-emerald border border-px-emerald/40 animate-pulse"
                        : "bg-px-purple/20 text-px-purple border border-px-purple/40"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Left Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-px-cyan rounded-r-full shadow-[0_0_8px_#00f0ff]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-3 border-t border-px-border/80 flex-shrink-0 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-px-text-muted hover:text-risk-critical hover:bg-risk-critical/10 transition-colors"
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-px-text-muted hover:text-px-cyan hover:bg-px-surface/50 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-px-cyan" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
