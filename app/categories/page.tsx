"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/lib/store";
import { formatCurrencyPair } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import {
  Plus, Trash2, X, Briefcase, Utensils, Car, Zap, Film,
  TrendingUp, ShoppingBag, Home, Plane, Heart, Coffee,
  Gamepad2, BookOpen, Tag, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ─── Icon map ───────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  utensils:  Utensils,
  car:       Car,
  zap:       Zap,
  film:      Film,
  trending:  TrendingUp,
  shopping:  ShoppingBag,
  home:      Home,
  plane:     Plane,
  heart:     Heart,
  coffee:    Coffee,
  gamepad:   Gamepad2,
  book:      BookOpen,
  tag:       Tag,
};

// ─── Color palettes per category type ─────────────────────────────────────
const INCOME_PALETTE = [
  { bg: "from-emerald-500/20 to-emerald-500/5", border: "hover:border-emerald-500/40", glow: "hover:shadow-[0_0_24px_rgba(16,185,129,0.2)]", dot: "bg-emerald-400", text: "text-emerald-500" },
  { bg: "from-teal-500/20 to-teal-500/5",    border: "hover:border-teal-500/40",    glow: "hover:shadow-[0_0_24px_rgba(20,184,166,0.2)]",    dot: "bg-teal-400",    text: "text-teal-500"    },
  { bg: "from-cyan-500/20 to-cyan-500/5",    border: "hover:border-cyan-500/40",    glow: "hover:shadow-[0_0_24px_rgba(6,182,212,0.2)]",       dot: "bg-cyan-400",    text: "text-cyan-500"    },
];

const EXPENSE_PALETTE = [
  { bg: "from-pink-500/20 to-pink-500/5",      border: "hover:border-pink-500/40",     glow: "hover:shadow-[0_0_24px_rgba(236,72,153,0.2)]",    dot: "bg-pink-400",    text: "text-pink-500"    },
  { bg: "from-sky-500/20 to-sky-500/5",        border: "hover:border-sky-500/40",      glow: "hover:shadow-[0_0_24px_rgba(14,165,233,0.2)]",    dot: "bg-sky-400",     text: "text-sky-500"     },
  { bg: "from-amber-500/20 to-amber-500/5",    border: "hover:border-amber-500/40",    glow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]",    dot: "bg-amber-400",   text: "text-amber-500"   },
  { bg: "from-indigo-500/20 to-indigo-500/5",  border: "hover:border-indigo-500/40",   glow: "hover:shadow-[0_0_24px_rgba(99,102,241,0.2)]",    dot: "bg-indigo-400",  text: "text-indigo-500"  },
  { bg: "from-rose-500/20 to-rose-500/5",      border: "hover:border-rose-500/40",     glow: "hover:shadow-[0_0_24px_rgba(244,63,94,0.2)]",     dot: "bg-rose-400",    text: "text-rose-500"    },
  { bg: "from-violet-500/20 to-violet-500/5",  border: "hover:border-violet-500/40",   glow: "hover:shadow-[0_0_24px_rgba(139,92,246,0.2)]",    dot: "bg-violet-400",  text: "text-violet-500"  },
];

const ICON_OPTIONS = ["briefcase", "utensils", "car", "zap", "film", "trending", "shopping", "home", "plane", "heart", "coffee", "gamepad", "book", "tag"] as const;

// ─── Category card ──────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  index,
  totalSpend,
  catSpend,
  palette,
  onDelete,
  deleting,
}: {
  cat: { id: string; name: string; type: string; color: string; icon?: string };
  index: number;
  totalSpend: number;
  catSpend: number;
  palette: typeof INCOME_PALETTE[0];
  onDelete: () => void;
  deleting: boolean;
}) {
  const IconComp = ICON_MAP[cat.icon ?? "tag"] ?? Tag;
  const pct = totalSpend > 0 ? (catSpend / totalSpend) * 100 : 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${palette.bg} backdrop-blur-xl p-4 transition-all duration-300 ${palette.border} ${palette.glow} hover:scale-[1.02] ${
        deleting ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ transitionProperty: "opacity, transform, box-shadow, border-color" }}
    >
      {/* Subtle corner glow */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${palette.dot} opacity-10 blur-2xl`} />

      <div className="flex items-start justify-between relative z-10">
        {/* Icon + Name */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 border border-white/10 ${palette.text}`}>
            <IconComp className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-zinc-50 leading-tight">{cat.name}</p>
            <p className={`text-[11px] font-semibold uppercase tracking-widest mt-0.5 ${palette.text}`}>
              {cat.type}
            </p>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 relative z-10">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">
            {catSpend > 0 ? formatCurrencyPair(catSpend).split(" ")[0] : "No activity"}
          </span>
          {catSpend > 0 && (
            <span className={`text-[11px] font-bold ${palette.text}`}>{pct.toFixed(1)}%</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-white/10 dark:bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full ${palette.dot} transition-all duration-700`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function CategorySection({
  title,
  subtitle,
  icon: SectionIcon,
  iconClass,
  cats,
  transactions,
  palette,
  onDelete,
  deletingId,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  cats: Array<{ id: string; name: string; type: string; color: string; icon?: string }>;
  transactions: Array<{ category: string; amount: number; type: string }>;
  palette: typeof INCOME_PALETTE;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
  const spendMap = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 ${iconClass}`}>
          <SectionIcon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 leading-tight">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500">{subtitle}</p>
        </div>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 dark:text-zinc-400">
          {cats.length}
        </span>
      </div>

      {cats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cats.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              totalSpend={totalSpend}
              catSpend={spendMap[cat.id] || 0}
              palette={palette[i % palette.length]}
              onDelete={() => onDelete(cat.id)}
              deleting={deletingId === cat.id}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center gap-3 py-14 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/5">
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center opacity-40">
            <SectionIcon className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400 dark:text-zinc-600">No {title.toLowerCase()} yet</p>
          <p className="text-xs text-slate-300 dark:text-zinc-700">Click &quot;Add Category&quot; to get started.</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { categories, transactions, addCategory, deleteCategory } = useAppContext();

  const [isAdding, setIsAdding]   = useState(false);
  const [name, setName]           = useState("");
  const [type, setType]           = useState<"income" | "expense">("expense");
  const [icon, setIcon]           = useState("tag");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const incomeCategories  = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const incomeTxns  = useMemo(() => transactions.filter((t) => t.type === "income"),  [transactions]);
  const expenseTxns = useMemo(() => transactions.filter((t) => t.type === "expense"), [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, color: "bg-indigo-500", icon });
    setName("");
    setIcon("tag");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteCategory(id);
      setDeletingId(null);
    }, 280);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Categories
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">
            Organise your income and expense categories.
          </p>
        </div>

        {/* Add button */}
        <button
          onClick={() => setIsAdding((v) => !v)}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">New Category</h3>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4 items-end">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Type</label>
              <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {(["expense", "income"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setType(v)}
                    className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      type === v
                        ? v === "income"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Name</label>
              <Input
                placeholder="E.g. Freelance, Rent…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-slate-900 dark:text-zinc-50 placeholder:text-zinc-500"
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Icon</label>
              <div className="grid grid-cols-7 gap-1">
                {ICON_OPTIONS.map((ic) => {
                  const Ic = ICON_MAP[ic] ?? Tag;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-150 ${
                        icon === ic
                          ? "bg-indigo-600 text-white"
                          : "bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10"
                      }`}
                    >
                      <Ic className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit button full width */}
            <button
              type="submit"
              className="sm:col-span-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200"
            >
              Save Category
            </button>
          </form>
        </div>
      )}

      {/* Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        <CategorySection
          title="Income Categories"
          subtitle="Sources of money in"
          icon={ArrowUpRight}
          iconClass="text-emerald-500"
          cats={incomeCategories}
          transactions={incomeTxns}
          palette={INCOME_PALETTE}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
        <CategorySection
          title="Expense Categories"
          subtitle="Where your money goes"
          icon={ArrowDownRight}
          iconClass="text-rose-500"
          cats={expenseCategories}
          transactions={expenseTxns}
          palette={EXPENSE_PALETTE}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}
