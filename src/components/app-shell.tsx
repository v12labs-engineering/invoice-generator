import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { BusinessSwitcher, type Membership } from "@/components/business-switcher";
import { Breadcrumbs } from "@/components/breadcrumbs";

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
        <SidebarHeader className="p-2">
          <BusinessSwitcher
            memberships={memberships}
            activeBusinessId={activeBusinessId}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-2 py-1 group-data-[collapsible=icon]:px-1.5">
            <SidebarNav />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-0.5 p-2">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              className="h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground [&_svg]:size-4"
            >
              <LogOut />
              <span>Sign out</span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumbs />
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
