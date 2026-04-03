"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  Wallet, 
  BarChart3
} from "lucide-react";

const mainLinks = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Budget", href: "/budget", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 md:block md:w-64 md:flex-shrink-0">
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8">
          <nav className="space-y-2 px-4">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50"
                  )}
                >
                  <div className="flex items-center">
                    <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500")} />
                    {link.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
