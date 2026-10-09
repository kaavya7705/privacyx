"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, Radio, Target, Brain, GitBranch,
  ShieldCheck, ShieldAlert, GitCompare, FlaskConical, Clock, Settings,
  Lock, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/live", icon: Radio, label: "Live Monitor" },
  { href: "/attack", icon: Target, label: "Attack" },
  { href: "/inferences", icon: Brain, label: "Inferences" },
  { href: "/graph", icon: GitBranch, label: "Evidence Graph" },
  { href: "/defense", icon: ShieldCheck, label: "Defense" },
  { href: "/leaks", icon: ShieldAlert, label: "Data Leaks" },
  { href: "/regression", icon: GitCompare, label: "Regression" },
  { href: "/experiments", icon: FlaskConical, label: "Experiments" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/privacy", icon: Lock, label: "Privacy" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-px-bg">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-60"} bg-px-bg-secondary border-r border-px-border flex flex-col transition-all duration-300 fixed h-full z-20`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-px-border">
          <Shield className="w-6 h-6 text-px-cyan flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">
              Privacy<span className="text-px-cyan">X</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-4 border-t border-px-border space-y-1">
          <button onClick={handleLogout} className="sidebar-link w-full" title={collapsed ? "Logout" : undefined}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="sidebar-link w-full" title="Toggle sidebar">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${collapsed ? "ml-16" : "ml-60"} transition-all duration-300`}>
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
