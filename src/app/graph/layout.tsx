import DashboardShell from "@/app/components/DashboardShell";
export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
