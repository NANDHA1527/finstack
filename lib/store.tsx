"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Transaction, Category, AppState, Budget } from "../types";

const defaultCategories: Category[] = [
  { id: "1", name: "Salary", type: "income", color: "bg-emerald-500", icon: "briefcase" },
  { id: "2", name: "Food", type: "expense", color: "bg-pink-400", icon: "utensils" },
  { id: "3", name: "Transport", type: "expense", color: "bg-sky-400", icon: "car" },
  { id: "4", name: "Utilities", type: "expense", color: "bg-amber-400", icon: "zap" },
  { id: "5", name: "Entertainment", type: "expense", color: "bg-indigo-500", icon: "film" },
];

const defaultTransactions: Transaction[] = [
  { id: uuidv4(), title: "Salary March", amount: 15400, date: new Date().toISOString(), category: "1", type: "income", provider: "Incorp LLC" },
  { id: uuidv4(), title: "Groceries", amount: 150, date: new Date(Date.now() - 86400000 * 2).toISOString(), category: "2", type: "expense", provider: "Whole Foods" },
  { id: uuidv4(), title: "Uber", amount: 25, date: new Date(Date.now() - 86400000 * 5).toISOString(), category: "3", type: "expense", provider: "Uber Technologies" },
  { id: uuidv4(), title: "Electricity Bill", amount: 120, date: new Date(Date.now() - 86400000 * 10).toISOString(), category: "4", type: "expense", provider: "ConEd" },
];

const defaultBudgets: Budget[] = [
  { id: uuidv4(), categoryId: "2", amount: 600, period: "monthly" },
  { id: uuidv4(), categoryId: "5", amount: 200, period: "monthly" }
];

interface AppContextType extends AppState {
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  editTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  deleteCategory: (id: string) => void;
  setBudget: (budget: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load state from local storage or use defaults
    const storedTransactions = localStorage.getItem("finstack_transactions");
    const storedCategories = localStorage.getItem("finstack_categories");
    const storedBudgets = localStorage.getItem("finstack_budgets");

    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    else setTransactions(defaultTransactions);

    if (storedCategories) setCategories(JSON.parse(storedCategories));
    else setCategories(defaultCategories);

    if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
    else setBudgets(defaultBudgets);
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("finstack_transactions", JSON.stringify(transactions));
      localStorage.setItem("finstack_categories", JSON.stringify(categories));
      localStorage.setItem("finstack_budgets", JSON.stringify(budgets));
    }
  }, [transactions, categories, budgets, mounted]);

  const addTransaction = (t: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...t, id: uuidv4() }, ...prev]);
  };

  const editTransaction = (t: Transaction) => {
    setTransactions((prev) => prev.map((item) => (item.id === t.id ? t : item)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addCategory = (c: Omit<Category, "id">) => {
    setCategories((prev) => [...prev, { ...c, id: uuidv4() }]);
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Also cleanup budgets tied to this category
    setBudgets((prev) => prev.filter((b) => b.categoryId !== id));
  };

  const setBudget = (b: Omit<Budget, "id">) => {
    setBudgets((prev) => {
      const existing = prev.find(item => item.categoryId === b.categoryId);
      if (existing) {
        return prev.map(item => item.categoryId === b.categoryId ? { ...item, amount: b.amount } : item);
      }
      return [...prev, { ...b, id: uuidv4() }];
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        setBudget,
        deleteBudget
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
