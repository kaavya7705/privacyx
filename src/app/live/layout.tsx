import DashboardShell from "@/app/components/DashboardShell";
export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
