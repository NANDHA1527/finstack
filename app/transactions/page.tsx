"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/lib/store";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Trash2, Edit, X, Search, Filter } from "lucide-react";
import { Transaction } from "@/types";
import { formatCurrencyPair } from "@/lib/utils";

export default function TransactionsPage() {
  const { transactions, categories, addTransaction, editTransaction, deleteTransaction } = useAppContext();
  
  // States
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [provider, setProvider] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "Unknown";

  const openAddForm = () => {
    setIsAdding(true);
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategoryId("");
    setProvider("");
    setType("expense");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const openEditForm = (t: Transaction) => {
    setIsAdding(true);
    setEditingId(t.id);
    setTitle(t.title);
    setAmount(t.amount.toString());
    setCategoryId(t.category);
    setType(t.type);
    setProvider(t.provider || "");
    setDate(format(new Date(t.date), "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !categoryId || !date) return;
    
    if (editingId) {
      editTransaction({
        id: editingId,
        title,
        amount: parseFloat(amount),
        type,
        category: categoryId,
        provider: provider || undefined,
        date: new Date(date).toISOString(),
      });
    } else {
      addTransaction({
        title,
        amount: parseFloat(amount),
        type,
        category: categoryId,
        provider: provider || undefined,
        date: new Date(date).toISOString(),
      });
    }

    // Reset
    setIsAdding(false);
    setEditingId(null);
  };

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = (t.title + " " + (t.provider||"")).toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === "all" || t.type === filterType;
      const matchCategory = filterCategory === "all" || t.category === filterCategory;
      return matchSearch && matchType && matchCategory;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, filterType, filterCategory]);

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-slate-500 dark:text-zinc-400">View, search, and edit your finances.</p>
        </div>
        <Button onClick={openAddForm} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {isAdding && (
        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md">
          <CardHeader className="flex flex-row justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle>{editingId ? "Edit Transaction" : "New Transaction"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as "income" | "expense");
                    setCategoryId(""); 
                  }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Title/Description</label>
                <Input placeholder="E.g. Groceries" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Provider (Optional)</label>
                <Input placeholder="E.g. Whole Foods" value={provider} onChange={(e) => setProvider(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
                <Button type="submit">{editingId ? "Update Transaction" : "Save Transaction"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-950/20 rounded-t-xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="text" 
              placeholder="Search by title or provider..." 
              className="pl-9 bg-white dark:bg-zinc-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <select 
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select 
               className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900 max-w-[150px]"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-zinc-900/50 dark:text-zinc-400 uppercase border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Provider / Title</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                    {format(new Date(t.date), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-zinc-100">{t.title}</div>
                    {t.provider && <div className="text-xs text-slate-500 mt-0.5">{t.provider}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {getCategoryName(t.category)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : ''}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrencyPair(Math.abs(t.amount))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(t)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mr-2">
                       <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                       <Search className="h-8 w-8 text-slate-300 dark:text-zinc-700 mb-3" />
                       <p>No transactions found.</p>
                       <p className="text-xs mt-1 text-slate-400">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
