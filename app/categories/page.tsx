"use client";

import { useState } from "react";
import { useAppContext } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Trash2, Tag, X } from "lucide-react";

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    addCategory({
      name,
      type,
    });

    // Reset
    setName("");
    setIsAdding(false);
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-slate-500 dark:text-zinc-400">Manage your income and expense categories.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {isAdding && (
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <CardHeader className="flex flex-row justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle>New Category</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full sm:w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={type}
                  onChange={(e) => setType(e.target.value as "income" | "expense")}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-sm font-medium">Name</label>
                <Input placeholder="E.g. Travel" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Save Category</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-600 dark:text-emerald-500">Income Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomeCategories.length > 0 ? incomeCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-3 text-emerald-500" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No income categories.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-500">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories.length > 0 ? expenseCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-3 text-red-500" />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No expense categories.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
