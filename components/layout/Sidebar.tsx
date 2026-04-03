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
    <div className="hidden border-r border-slate-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-3xl md:block md:w-64 md:flex-shrink-0 relative z-20">
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-10">
          <nav className="space-y-1.5 px-4">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out",
                    isActive
                      ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.1)]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "mr-3 p-1.5 rounded-lg transition-colors duration-300",
                      isActive ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]" : "bg-transparent text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{link.name}</span>
                  </div>
                  {isActive && <div className="h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
