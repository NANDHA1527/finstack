"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Menu, LayoutTemplate, LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/70 px-6 sm:px-8 dark:border-zinc-800/60 dark:bg-zinc-950/40 backdrop-blur-3xl relative z-30">
      {/* Brand & Mobile Menu */}
      <div className="flex items-center">
        <button className="mr-4 block md:hidden text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/" className="flex items-center gap-2 mr-8">
           <LayoutTemplate className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
           <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 hidden sm:block">Finstack</span>
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4 relative">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        {/* User Profile Dropdown Component */}
        <div className="relative">
          <div className="flex items-center gap-3">
            {mounted && user && (
              <div className="hidden sm:block text-right cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <p className="text-sm font-bold tracking-wide uppercase text-slate-800 dark:text-zinc-200 leading-none">{user.name}</p>
              </div>
            )}
            <div 
              className="h-9 w-9 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 cursor-pointer transition-all hover:scale-105 shadow-sm"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
               <Wallet className="h-[18px] w-[18px] stroke-[2.5]" />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isProfileOpen && user && (
            <>
              {/* Invisible overlay to close dropdown on outside click */}
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
              
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-50 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
      </div>
    </header>
  );
}
