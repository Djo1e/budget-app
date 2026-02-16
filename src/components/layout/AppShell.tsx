"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Landmark,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/settings", label: "More", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-background md:block">
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-xs font-mono tracking-[0.2em] uppercase">Budget</h1>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors hover:bg-accent",
                pathname.startsWith(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em]",
                pathname.startsWith(item.href)
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
