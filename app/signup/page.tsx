"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LayoutTemplate, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (name && email && pass) signup(name, email, pass);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 mx-4">
      <div className="flex justify-center mb-6">
        <LayoutTemplate className="h-10 w-10 text-indigo-600 dark:text-indigo-500" />
      </div>
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 mb-2">Create Account</h2>
      <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mb-6">Join Finstack to track your finances.</p>

      {error && (
        <div className="mb-4 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
           <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
           {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Name</label>
          <Input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email Address</label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={4} />
        </div>
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4 h-11">
          Register
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
         Already have an account? <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Log in</Link>
      </div>
    </div>
  );
}
