"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import bcrypt from "bcryptjs";

export interface User {
  name: string;
  email: string;
}

export interface StoredUser extends User {
  passwordHash: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => void;
  signup: (name: string, email: string, pass: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Clear out deprecated unhashed login key if any (Cleanup)
    localStorage.removeItem("finstack_user");
    localStorage.removeItem("finstack_users");
    localStorage.removeItem("finstack_active_user");
    
    const stored = localStorage.getItem("currentUser");
    const authStatus = localStorage.getItem("auth");
    if (stored && authStatus === "true") {
      setUser(JSON.parse(stored));
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const authRoutes = ["/login", "/signup"];
      // Route Gating
      if (!user && !authRoutes.includes(pathname)) {
        router.push("/login");
      } else if (user && authRoutes.includes(pathname)) {
        router.push("/");
      }
    }
  }, [user, pathname, mounted, router]);

  const getUsers = (): StoredUser[] => {
    const raw = localStorage.getItem("users");
    return raw ? JSON.parse(raw) : [];
  };

  const login = (email: string, pass: string) => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!found) throw new Error("User not found.");
    
    const isValid = bcrypt.compareSync(pass, found.passwordHash);
    if (!isValid) throw new Error("Invalid email/password.");

    const activeUser = { name: found.name, email: found.email };
    localStorage.setItem("auth", "true");
    localStorage.setItem("currentUser", JSON.stringify(activeUser));
    setUser(activeUser);
  };

  const signup = (name: string, email: string, pass: string) => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
       throw new Error("User already exists with this email.");
    }
    
    // Hash password robustly synchronously in pure JS 
    const passwordHash = bcrypt.hashSync(pass, 10);
    const newUser: StoredUser = { name, email, passwordHash };
    
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    const activeUser = { name, email };
    localStorage.setItem("auth", "true");
    localStorage.setItem("currentUser", JSON.stringify(activeUser));
    setUser(activeUser);
  };

  const logout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
