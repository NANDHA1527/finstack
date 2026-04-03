"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CopyPlus, Edit2, Target, PiggyBank, Search, AlertCircle, X, Trash2 } from "lucide-react";
import { formatCurrencyPair } from "@/lib/utils";

export default function BudgetPage() {
  const { budgets, transactions, categories, setBudget, deleteBudget } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleOpenForm = (catId?: string, amount?: number) => {
    setIsEditing(true);
    setActiveCategoryId(catId || "");
    setTargetAmount(amount ? amount.toString() : "");
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId || !targetAmount) return;

    setBudget({
      categoryId: activeCategoryId,
      amount: parseFloat(targetAmount),
      period: "monthly",
    });

    setIsEditing(false);
    setActiveCategoryId("");
  };

  // Compile full budget insights matrix
  const budgetInsights = useMemo(() => {
    // Only fetch Expense categories
    const expenseCategories = categories.filter(c => c.type === "expense");

    return expenseCategories.map(cat => {
      // Find budget if exists
      const b = budgets.find(b => b.categoryId === cat.id);
      
      // Calculate total spent 
      const totalSpent = transactions
        .filter(t => t.type === "expense" && t.category === cat.id)
        .reduce((sum, item) => sum + item.amount, 0);

      // Math computations
      const target = b ? b.amount : 0;
      const progress = target > 0 ? (totalSpent / target) * 100 : 0;
      const isOverBudget = totalSpent > target && target > 0;
      const isWarning = progress > 75 && !isOverBudget;

      return {
        category: cat,
        budgetId: b?.id,
        target,
        totalSpent,
        progress: Math.min(progress, 100), // Cap bar at 100%
        isOverBudget,
        isWarning,
        progressRaw: progress
      };
    }).sort((a,b) => b.totalSpent - a.totalSpent); // Show biggest spenders first
  }, [categories, budgets, transactions]);

  // Aggregates for top summary
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentInBudgets = budgetInsights.reduce((sum, item) => item.target > 0 ? sum + item.totalSpent : sum, 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Tracking</h2>
          <p className="text-slate-500 dark:text-zinc-400">Manage monthly limits and monitor spending habits.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <CopyPlus className="mr-2 h-4 w-4" /> Define Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-none text-white shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Tracked Budget</CardTitle>
            <Target className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrencyPair(totalBudgeted).split(' ')[0]}</div>
            <p className="text-xs text-white/70 mt-1">{formatCurrencyPair(totalBudgeted).split(' ')[1]} Tracked globally</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Total Spent Across Budgets</CardTitle>
            <PiggyBank className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${(totalSpentInBudgets > totalBudgeted && totalBudgeted > 0) ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrencyPair(totalSpentInBudgets).split(' ')[0]}
            </div>
            <div className="text-xs mt-1 font-medium text-slate-500">{formatCurrencyPair(totalSpentInBudgets).split(' ')[1]}</div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
               <div 
                  className={`h-full ${(totalSpentInBudgets > totalBudgeted && totalBudgeted > 0) ? 'bg-red-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${totalBudgeted > 0 ? Math.min((totalSpentInBudgets/totalBudgeted)*100, 100) : 0}%`}}
               ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <CardHeader className="flex flex-row justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle>Define Monthly Budget Limit</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row gap-4 items-end whitespace-nowrap overflow-hidden">
              <div className="space-y-1 w-full sm:flex-1">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={activeCategoryId}
                  onChange={(e) => setActiveCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Expense Category</option>
                  {categories.filter(c => c.type === "expense").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                </select>
              </div>
              <div className="space-y-1 w-full sm:flex-1 text-ellipsis overflow-hidden">
                <label className="text-sm font-medium">Monthly Limit ($)</label>
                <Input type="number" step="1" placeholder="E.g. 500" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">Save Target</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-950/20 px-6 py-4 rounded-t-xl">
          <CardTitle className="text-base">Category Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {budgetInsights.map((insight) => (
              <div key={insight.category.id} className="p-6 transition-colors hover:bg-slate-50/30 dark:hover:bg-zinc-900/10">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 text-sm">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className={`w-3 h-3 rounded-full ${insight.category.color || 'bg-slate-300'}`}></div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{insight.category.name}</span>
                    {insight.target === 0 && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500">Unbudgeted</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="font-medium text-slate-900 dark:text-zinc-100">{formatCurrencyPair(insight.totalSpent)}</span>
                    {insight.target > 0 && <span className="text-slate-400">/ {formatCurrencyPair(insight.target).split(' ')[0]}</span>}
                    
                    {insight.target > 0 ? (
                       <div className="flex items-center gap-1 border-l pl-3 ml-1 border-slate-200 dark:border-zinc-800">
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-500" onClick={() => handleOpenForm(insight.category.id, insight.target)}>
                           <Edit2 className="h-3 w-3" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => deleteBudget(insight.budgetId!)}>
                           <Trash2 className="h-3 w-3" />
                         </Button>
                       </div>
                    ) : (
                       <Button variant="outline" size="sm" className="h-7 text-xs ml-2" onClick={() => handleOpenForm(insight.category.id)}>
                         Set Target
                       </Button>
                    )}
                  </div>
                </div>

                {insight.target > 0 && (
                  <div className="w-full relative">
                    <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                      <span className={insight.isOverBudget ? 'text-red-500 flex items-center' : insight.isWarning ? 'text-amber-500' : ''}>
                        {insight.isOverBudget && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                        {insight.progressRaw.toFixed(1)}% Consumed
                      </span>
                      <span>{insight.target - insight.totalSpent > 0 ? `${formatCurrencyPair(insight.target - insight.totalSpent).split(' ')[0]} left` : 'Limit Exceeded'}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-in-out ${insight.isOverBudget ? 'bg-red-500' : insight.isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${insight.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {budgetInsights.length === 0 && (
               <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                 <Search className="w-10 h-10 text-slate-200 dark:text-zinc-800 mb-4" />
                 <p>No expense categories exist.</p>
                 <p className="text-sm mt-1 text-slate-400">Add categories in the Categories tab first to track budgets.</p>
               </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
