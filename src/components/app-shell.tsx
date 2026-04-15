import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/clients", label: "Clients" },
  { href: "/products", label: "Products" },
  { href: "/recurring", label: "Recurring" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r p-6">
        <div className="mb-8 text-lg font-semibold">Invoicer</div>
        <nav className="flex flex-col gap-1">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className="rounded px-3 py-2 text-sm hover:bg-accent">
              {i.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="mt-8"
        >
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
