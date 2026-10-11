import DashboardShell from "@/app/components/DashboardShell";
export default function LeaksLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
