"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const authRoutes = ["/login", "/signup"];

  // If hitting auth routing, isolate the view entirely (No sidebars!)
  if (authRoutes.includes(pathname)) {
    return <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-black flex items-center justify-center">{children}</div>;
  }

  // Otherwise, render full standard dashboard hierarchy
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 relative">
      {/* Global Background Layers */}
      <div className="absolute inset-0 mesh-gradient opacity-100 pointer-events-none z-0" />
      <div className="absolute inset-0 grain pointer-events-none z-0" />

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 animate-in-fade">
          {children}
        </main>
      </div>
    </div>
  );
}
