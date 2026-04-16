import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Receipt } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { BusinessSwitcher, type Membership } from "@/components/business-switcher";

export function AppShell({
  children,
  memberships,
  activeBusinessId,
}: {
  children: React.ReactNode;
  memberships: Membership[];
  activeBusinessId: string | null;
}) {
  async function signOut() {
    "use server";
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold tracking-tight"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Receipt className="size-4" />
            </div>
            <span className="group-data-[collapsible=icon]:hidden">Invoicer</span>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
            <BusinessSwitcher
              memberships={memberships}
              activeBusinessId={activeBusinessId}
            />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarNav />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-1">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Invoicer</span>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
