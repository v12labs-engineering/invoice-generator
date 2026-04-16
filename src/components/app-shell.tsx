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
        <SidebarHeader className="gap-2 px-3 py-3 group-data-[collapsible=icon]:px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-1 py-0.5 text-sm font-semibold tracking-tight"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
          <SidebarGroup className="px-3 py-3 group-data-[collapsible=icon]:px-2">
            <SidebarNav />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-1 px-3 py-3 group-data-[collapsible=icon]:px-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="h-11 w-full justify-start gap-3 rounded-lg px-3 text-[0.95rem] font-medium text-muted-foreground hover:bg-primary/5 hover:text-foreground [&_svg]:size-5"
            >
              <LogOut />
              <span>Sign out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
