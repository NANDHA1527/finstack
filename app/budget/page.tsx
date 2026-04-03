"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/lib/store";
import { Input } from "@/components/ui/Input";
import {
  CopyPlus, Edit3, Target, PiggyBank, Trash2, X,
  AlertTriangle, CheckCircle2, TrendingUp,
  Briefcase, Utensils, Car, Zap, Film, ShoppingBag,
  Home, Plane, Heart, Coffee, Gamepad2, BookOpen, Tag
} from "lucide-react";
import { formatCurrencyPair } from "@/lib/utils";

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase, utensils: Utensils, car: Car, zap: Zap,
  film: Film, shopping: ShoppingBag, home: Home, plane: Plane,
  heart: Heart, coffee: Coffee, gamepad: Gamepad2, book: BookOpen, tag: Tag,
};

// ─── Smart color logic ───────────────────────────────────────────────────────
function getProgressTheme(pct: number, over: boolean) {
  if (over || pct > 80) return {
    bar:    "from-rose-500 to-red-600",
    shadow: "shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    badge:  "bg-rose-500/15 text-rose-500 border-rose-500/20",
    text:   "text-rose-500",
    icon:   AlertTriangle,
  };
  if (pct >= 50) return {
    bar:    "from-amber-400 to-yellow-500",
    shadow: "shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    badge:  "bg-amber-500/15 text-amber-500 border-amber-500/20",
    text:   "text-amber-500",
    icon:   TrendingUp,
  };
  return {
    bar:    "from-emerald-400 to-teal-500",
    shadow: "shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    badge:  "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
    text:   "text-emerald-500",
    icon:   CheckCircle2,
  };
}

// ─── Budget Card ─────────────────────────────────────────────────────────────
function BudgetCard({
  insight,
  onEdit,
  onDelete,
  onSetTarget,
}: {
  insight: {
    category: { id: string; name: string; color: string; icon?: string };
    budgetId?: string;
    target: number;
    totalSpent: number;
    progress: number;
    progressRaw: number;
    isOverBudget: boolean;
    isWarning: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
  onSetTarget: () => void;
}) {
  const { category, target, totalSpent, progress, progressRaw, isOverBudget, isWarning } = insight;
  const IconComp = ICON_MAP[category.icon ?? "tag"] ?? Tag;
  const hasTarget = target > 0;
  const remaining = target - totalSpent;
  const theme = getProgressTheme(progressRaw, isOverBudget);
  const StatusIcon = theme.icon;

  return (
    <div className="glass glass-hover p-6 border-none group relative overflow-hidden flex flex-col min-h-[220px]">
      {/* Ambient glow on hover */}
      <div 
        className="absolute top-0 right-0 -m-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" 
        style={{ backgroundColor: category.color || '#3b82f6' }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-opacity-20 border border-white/10 shadow-lg shadow-black/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundColor: category.color || '#3b82f6' }}
          >
            <IconComp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-900 dark:text-zinc-50 leading-tight">{category.name}</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-1 uppercase tracking-widest">
              {hasTarget ? 'Active Budget' : 'Category'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          {hasTarget ? (
            <>
              <button onClick={onEdit} className="p-2 rounded-xl transition-all duration-200 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 active:scale-90">
                <Edit3 className="h-4 w-4" />
              </button>
              <button onClick={onDelete} className="p-2 rounded-xl transition-all duration-200 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onSetTarget}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <Target className="h-3.5 w-3.5" />
              Set Limit
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-8 relative z-10 flex flex-col flex-1 justify-end">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tabular-nums leading-tight tracking-tight">
              {formatCurrencyPair(totalSpent).split(" ")[0]}
            </p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-1">
              {hasTarget ? `of ${formatCurrencyPair(target).split(" ")[0]} Cap` : 'Spent Overall'}
            </p>
          </div>

          {hasTarget && (
            <div className="flex flex-col items-end gap-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-tight shadow-sm ${theme.badge}`}>
                <StatusIcon className="h-3 w-3" />
                {isOverBudget
                  ? `Over ₹${Math.abs(remaining).toLocaleString()}`
                  : `₹${remaining.toLocaleString()} Left`}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {hasTarget ? (
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100/50 dark:bg-white/5 rounded-full overflow-hidden border border-black/[0.02] dark:border-white/[0.02]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${theme.bar} shadow-[0_0_12px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} opacity-80`}>
                {isOverBudget ? 'Exceeded' : isWarning ? 'Warning' : 'Healthy'}
              </span>
              <span className="text-[10px] font-extrabold text-slate-400 tabular-nums">{progressRaw.toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onSetTarget}
            className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-600 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 transition-all active:scale-[0.98]"
          >
            + Define Spending Cap
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const { budgets, transactions, categories, setBudget, deleteBudget } = useAppContext();
  const DEFAULT_COLOR = "#3b82f6";
  const [isEditing, setIsEditing]         = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [targetAmount, setTargetAmount]   = useState("");

  const handleOpenForm = (catId?: string, amount?: number) => {
    setIsEditing(true);
    setActiveCategoryId(catId || "");
    setTargetAmount(amount ? amount.toString() : "");
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId || !targetAmount) return;
    setBudget({ categoryId: activeCategoryId, amount: parseFloat(targetAmount), period: "monthly" });
    setIsEditing(false);
    setActiveCategoryId("");
  };

  const budgetInsights = useMemo(() => {
    const expCats = categories.filter((c) => c.type === "expense");
    return expCats.map((cat) => {
      const b = budgets.find((b) => b.categoryId === cat.id);
      const totalSpent = transactions
        .filter((t) => t.type === "expense" && t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      const target = b ? b.amount : 0;
      const progressRaw = target > 0 ? (totalSpent / target) * 100 : 0;
      return {
        category: cat,
        budgetId: b?.id,
        target,
        totalSpent,
        progress: Math.min(progressRaw, 100),
        isOverBudget: totalSpent > target && target > 0,
        isWarning: progressRaw > 75 && totalSpent <= target,
        progressRaw,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [categories, budgets, transactions]);

  const totalBudgeted         = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpentInBudgets   = budgetInsights.reduce((s, i) => i.target > 0 ? s + i.totalSpent : s, 0);
  const overallPct            = totalBudgeted > 0 ? Math.min((totalSpentInBudgets / totalBudgeted) * 100, 100) : 0;
  const overallTheme          = getProgressTheme(overallPct, totalSpentInBudgets > totalBudgeted && totalBudgeted > 0);
  const budgetedCats          = budgetInsights.filter((i) => i.target > 0).length;
  const safeCats              = budgetInsights.filter((i) => i.target > 0 && !i.isOverBudget && !i.isWarning).length;

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Budget Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">Set monthly limits and monitor spending habits.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200"
        >
          <CopyPlus className="h-4 w-4" /> Define Budget
        </button>
      </div>

      {/* Top summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Total Budgeted */}
        <div className="glass glass-hover p-6 border-none group relative overflow-hidden flex flex-col justify-between h-32 bg-indigo-600 dark:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
          <div className="absolute top-0 right-0 -m-8 w-24 h-24 rounded-full bg-white/20 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Total Cap</span>
            <div className={`p-2 rounded-xl bg-white/10 border border-white/10 shadow-sm transition-transform group-hover:scale-110`}>
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-extrabold text-white tabular-nums tracking-tight">{formatCurrencyPair(totalBudgeted).split(" ")[0]}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">{budgetedCats} Categories Tracked</p>
          </div>
        </div>

        {/* Total Spent */}
        <div className="glass glass-hover p-6 border-none group relative overflow-hidden flex flex-col justify-between h-32">
          <div className={`absolute top-0 right-0 -m-8 w-24 h-24 rounded-full bg-gradient-to-br ${overallTheme.bar.replace('from-', 'from-').replace('to-', 'to-')} to-transparent blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Total Burn</span>
            <div className={`p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110 ${overallTheme.text}`}>
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${overallTheme.text}`}>{formatCurrencyPair(totalSpentInBudgets).split(" ")[0]}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{overallPct.toFixed(1)}% Consumed</p>
          </div>
        </div>

        {/* On Track */}
        <div className="glass glass-hover p-6 border-none group relative overflow-hidden flex flex-col justify-between h-32">
          <div className="absolute top-0 right-0 -m-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Healthy</span>
            <div className={`p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110 text-emerald-500`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tabular-nums tracking-tight">{safeCats}</p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">{budgetedCats > 0 ? (safeCats / budgetedCats * 100).toFixed(0) : 0}% Efficiency</p>
          </div>
        </div>
      </div>

      {/* Budget Form */}
      {isEditing && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Define Monthly Budget Limit</h3>
            <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSaveBudget} className="grid sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Category</label>
              <select
                value={activeCategoryId}
                onChange={(e) => setActiveCategoryId(e.target.value)}
                required
                className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="" disabled>Select expense category</option>
                {categories.filter((c) => c.type === "expense").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Monthly Limit (₹)</label>
              <Input
                type="number" step="1" placeholder="E.g. 5000"
                value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                required className="bg-white/5 border-white/10"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200"
            >
              Save Target
            </button>
          </form>
        </div>
      )}

      {/* Category Budget Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">Category Insights</h3>
          <span className="text-xs text-slate-400 dark:text-zinc-600">{budgetInsights.length} categories</span>
        </div>

        {budgetInsights.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {budgetInsights.map((insight) => (
              <BudgetCard
                key={insight.category.id}
                insight={insight}
                onEdit={() => handleOpenForm(insight.category.id, insight.target)}
                onDelete={() => deleteBudget(insight.budgetId!)}
                onSetTarget={() => handleOpenForm(insight.category.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-white/5">
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center opacity-40">
              <PiggyBank className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-zinc-500">No expense categories yet</p>
            <p className="text-xs text-slate-400 dark:text-zinc-600">Add categories in the Categories tab first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
