import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { listMyBusinesses, getActiveBusinessId } from "@/lib/actions/_shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const memberships = await listMyBusinesses();
  if (memberships.length === 0) redirect("/onboarding");

  const activeBusinessId = await getActiveBusinessId();

  return (
    <AppShell
      memberships={memberships.map((m) => ({
        businessId: m.businessId,
        businessName: m.business.name,
        role: m.role,
      }))}
      activeBusinessId={activeBusinessId}
    >
      {children}
    </AppShell>
  );
}
