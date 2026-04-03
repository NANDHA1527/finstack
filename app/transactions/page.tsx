"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/lib/store";
import { format, subDays, isAfter } from "date-fns";
import { Input } from "@/components/ui/Input";
import {
  Plus, Trash2, Edit3, X, Search, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, Calendar, ReceiptText
} from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrencyPair } from "@/lib/utils";

// ─── Select wrapper ──────────────────────────────────────────────────────────
function GlassSelect({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-white/5 backdrop-blur-md px-3 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
    >
      {children}
    </select>
  );
}

// ─── Transaction Card Row ────────────────────────────────────────────────────
function TransactionRow({
  t,
  catName,
  catColor,
  onEdit,
  onDelete,
}: {
  t: Transaction;
  catName: string;
  catColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = t.type === "income";

  return (
    <div className="group flex items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-white/5 backdrop-blur-xl px-4 py-4 transition-all duration-300 hover:scale-[1.01] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      
      {/* Avatar */}
      <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl text-white text-[11px] font-bold shadow-lg shadow-black/5 ${catColor} transition-transform duration-300 group-hover:scale-110`}>
        {(t.provider || t.title).substring(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-slate-900 dark:text-zinc-50 truncate leading-tight">{t.title}</p>
          <span className={`inline-flex sm:hidden items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${catColor} bg-opacity-10 text-slate-700 dark:text-zinc-300 border border-black/5 dark:border-white/5`}>
            {catName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest truncate">{t.provider || 'Personal'}</p>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 tabular-nums uppercase">{format(new Date(t.date), "MMM dd, yyyy")}</p>
        </div>
      </div>

      {/* Category desktop */}
      <div className="hidden sm:flex flex-col items-end mr-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${catColor} bg-opacity-10 text-slate-800 dark:text-zinc-200 border border-black/5 dark:border-white/10`}>
          {catName}
        </span>
      </div>

      {/* Amount */}
      <div className={`flex-shrink-0 text-right min-w-[100px]`}>
        <p className={`text-sm font-extrabold tabular-nums tracking-tight ${isIncome ? "text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "text-slate-900 dark:text-zinc-100"}`}>
          {isIncome ? "+" : "−"}{formatCurrencyPair(t.amount).split(" ")[0]}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">{formatCurrencyPair(t.amount).split(" ")[1]}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={onEdit}
          className="p-2 rounded-xl transition-all duration-200 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 active:scale-90"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl transition-all duration-200 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, categories, addTransaction, editTransaction, deleteTransaction } = useAppContext();

  const [isAdding, setIsAdding]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [title, setTitle]           = useState("");
  const [amount, setAmount]         = useState("");
  const [type, setType]             = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate]             = useState(format(new Date(), "yyyy-MM-dd"));
  const [provider, setProvider]     = useState("");

  const [searchQuery, setSearchQuery]       = useState("");
  const [filterType, setFilterType]         = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");
  const [dateRange, setDateRange]           = useState<"all" | "7d" | "30d">("all");

  const getCategoryName  = (id: string) => categories.find((c) => c.id === id)?.name  || "Unknown";
  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.color || "bg-slate-400";

  const openAddForm = () => {
    setIsAdding(true); setEditingId(null);
    setTitle(""); setAmount(""); setCategoryId(""); setProvider("");
    setType("expense"); setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const openEditForm = (t: Transaction) => {
    setIsAdding(true); setEditingId(t.id);
    setTitle(t.title); setAmount(t.amount.toString());
    setCategoryId(t.category); setType(t.type);
    setProvider(t.provider || "");
    setDate(format(new Date(t.date), "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId || !date) return;
    const payload = {
      title, amount: parseFloat(amount), type,
      category: categoryId, provider: provider || undefined,
      date: new Date(date).toISOString(),
    };
    if (editingId) editTransaction({ ...payload, id: editingId });
    else addTransaction(payload);
    setIsAdding(false); setEditingId(null);
  };

  // ─── Filters ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = dateRange === "7d" ? subDays(new Date(), 7)
                 : dateRange === "30d" ? subDays(new Date(), 30) : null;
    return transactions
      .filter((t) => {
        const matchSearch   = (t.title + " " + (t.provider || "")).toLowerCase().includes(searchQuery.toLowerCase());
        const matchType     = filterType === "all" || t.type === filterType;
        const matchCategory = filterCategory === "all" || t.category === filterCategory;
        const matchDate     = !cutoff || isAfter(new Date(t.date), cutoff);
        return matchSearch && matchType && matchCategory && matchDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, filterType, filterCategory, dateRange]);

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    income:  filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    count:   filtered.length,
  }), [filtered]);

  const filteredCats = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Transactions</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">View, search, and manage your finances.</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Incoming", val: formatCurrencyPair(summary.income), icon: ArrowUpRight, color: "text-emerald-500", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]", accent: "from-emerald-500/20" },
          { label: "Outgoing", val: formatCurrencyPair(summary.expense), icon: ArrowDownRight, color: "text-rose-500", glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]", accent: "from-rose-500/20" },
          { label: "History", val: summary.count.toString(), icon: ReceiptText, color: "text-indigo-500", glow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]", accent: "from-indigo-500/20" },
        ].map(({ label, val, icon: Icon, color, glow, accent }) => (
          <div key={label} className={`glass glass-hover p-5 border-none group relative overflow-hidden flex flex-col justify-between h-32`}>
            <div className={`absolute top-0 right-0 -m-8 w-24 h-24 rounded-full bg-gradient-to-br ${accent} to-transparent blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">{label}</span>
              <div className={`p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tabular-nums tracking-tight">{val.split(" ")[0]}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1 opacity-60">{val.split(" ")[1] || 'Transactions'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50">
              {editingId ? "Edit Transaction" : "New Transaction"}
            </h3>
            <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {[
              { label: "Type", el: (
                <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  {(["expense", "income"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => { setType(v); setCategoryId(""); }}
                      className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${type === v ? (v === "income" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white") : "text-slate-600 dark:text-zinc-400 hover:bg-white/10"}`}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              )},
              { label: "Title / Description", el: <Input placeholder="E.g. Groceries" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-white/5 border-white/10" /> },
              { label: "Provider (Optional)", el: <Input placeholder="E.g. Whole Foods" value={provider} onChange={(e) => setProvider(e.target.value)} className="bg-white/5 border-white/10" /> },
              { label: "Amount (₹)", el: <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-white/5 border-white/10" /> },
              { label: "Category", el: (
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                  className="flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  <option value="" disabled>Select category</option>
                  {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )},
              { label: "Date", el: <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-white/5 border-white/10" /> },
            ].map(({ label, el }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</label>
                {el}
              </div>
            ))}

            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-200">
                {editingId ? "Update Transaction" : "Save Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or provider…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-medium text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <GlassSelect value={filterType} onChange={(v) => setFilterType(v as any)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </GlassSelect>
          <GlassSelect value={filterCategory} onChange={setFilterCategory}>
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </GlassSelect>
          <div className="flex rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/5 overflow-hidden">
            {([["all", "All Time"], ["30d", "30 Days"], ["7d", "7 Days"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setDateRange(v)}
                className={`px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1 transition-all duration-150 ${dateRange === v ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
                {v !== "all" && <Calendar className="h-3 w-3" />}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {/* Column header */}
          <div className="hidden sm:grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto] gap-4 px-4 items-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-600">
            <span />
            <span>Transaction</span>
            <span className="hidden sm:block">Category</span>
            <span className="hidden md:block">Date</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {filtered.map((t) => (
            <TransactionRow
              key={t.id}
              t={t}
              catName={getCategoryName(t.category)}
              catColor={getCategoryColor(t.category)}
              onEdit={() => openEditForm(t)}
              onDelete={() => deleteTransaction(t.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white/30 dark:bg-white/5">
          <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-700 flex items-center justify-center opacity-40">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-500">No transactions found</p>
          <p className="text-xs text-slate-400 dark:text-zinc-600">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
