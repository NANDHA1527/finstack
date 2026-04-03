"use client";

import { useMemo, useState } from "react";
import { format, getWeek, getYear } from "date-fns";
import { useAppContext } from "@/lib/store";
import { formatCurrencyPair } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import { 
  Eye, ArrowUpRight, ArrowDownRight, Users, Target, TrendingUp, AlertTriangle
} from "lucide-react";

export default function DashboardPage() {
  const { transactions, categories, budgets } = useAppContext();
  const DEFAULT_COLOR = "#3b82f6";

  // Dynamic Base Totals
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === "income") acc.totalIncome += curr.amount;
        else acc.totalExpense += curr.amount;
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }, [transactions]);

  // Mock previous month data for growth indicator visual
  const previousMonthBalance = balance * 0.85; // Mock: grew by ~15%
  const growthPercent = ((balance - previousMonthBalance) / previousMonthBalance) * 100 || 0;

  // --- Financial Report Chart ---
  const [reportView, setReportView] = useState<"weekly" | "monthly" | "yearly">("monthly");

  const reportChartData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);
      let key: string;

      if (reportView === "monthly") {
        key = format(d, "MMM yyyy");
      } else if (reportView === "weekly") {
        key = `Wk ${getWeek(d)} '${format(d, "yy")}`;
      } else {
        key = `${getYear(d)}`;
      }

      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expenses += t.amount;
    });

    // Sort keys chronologically
    return Object.entries(map)
      .sort(([a], [b]) => {
        // For yearly, compare numerically; otherwise compare as date strings
        if (reportView === "yearly") return Number(a) - Number(b);
        // Use first transaction date within that bucket — approximate via key string
        return a.localeCompare(b);
      })
      .map(([label, vals]) => ({ label, ...vals }));
  }, [transactions, reportView]);

  // Map dynamic transactions for the Bottom Row
  const recentTransactions = [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  // Map dynamic Types (Expenses Grouped by Category)
  const typesData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([categoryId, amount]) => {
      const cat = categories.find(c => c.id === categoryId);
      return {
        name: cat?.name || "Unknown",
        amountStr: formatCurrencyPair(amount),
        amountRaw: amount,
        percentNum: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        percent: `${(totalExpense > 0 ? (amount / totalExpense) * 100 : 0).toFixed(2)}%`,
        color: cat?.color || DEFAULT_COLOR
      };
    }).sort((a, b) => b.amountRaw - a.amountRaw);
  }, [transactions, categories, totalExpense]);

  // Spending by Category (pie data)
  const CATEGORY_PALETTE = [
    { start: "#6366f1", end: "#818cf8" }, // indigo
    { start: "#ec4899", end: "#f472b6" }, // pink
    { start: "#f59e0b", end: "#fbbf24" }, // amber
    { start: "#10b981", end: "#34d399" }, // emerald
    { start: "#14b8a6", end: "#2dd4bf" }, // teal
    { start: "#f43f5e", end: "#fb7185" }, // rose
    { start: "#8b5cf6", end: "#a78bfa" }, // violet
  ];

  const spendingPieData = useMemo(() => {
    const expTxns = transactions.filter((t) => t.type === "expense");
    const totalExp = expTxns.reduce((s, t) => s + t.amount, 0);
    const map: Record<string, number> = {};
    expTxns.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([catId, amount], i) => {
        const cat = categories.find((c) => c.id === catId);
        const pct = totalExp > 0 ? (amount / totalExp) * 100 : 0;
        return {
          name: cat?.name || "Unknown",
          value: amount,
          pct,
          color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
        };
      });
  }, [transactions, categories]);

  const totalSpending = spendingPieData.reduce((s, d) => s + d.value, 0);

  // --- Budget Overview Data ---
  const budgetData = useMemo(() => {
    const expenseTxns = transactions.filter(t => t.type === "expense");
    
    const summary = budgets.reduce((acc, b) => {
      acc.totalBudget += b.amount;
      const spent = expenseTxns
        .filter(t => t.category === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      acc.totalSpent += spent;
      return acc;
    }, { totalBudget: 0, totalSpent: 0 });

    const categoryBudgets = budgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spent = expenseTxns
        .filter(t => t.category === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      
      return {
        name: cat?.name || "Unknown",
        spent,
        limit: b.amount,
        progress: Math.min(progress, 100),
        status: progress > 100 ? 'over' : progress > 80 ? 'warning' : 'safe',
        color: cat?.color || DEFAULT_COLOR
      };
    }).sort((a, b) => b.spent - a.spent).slice(0, 4);

    return { ...summary, categoryBudgets };
  }, [transactions, budgets, categories]);

  // Static mock for Top Assets (kept but no longer rendered)
  const topAssets = [
    { name: "Reliance Ind.", type: "Stock / Equity", value: "₹2,50,000", return: "8%" },
    { name: "HDFC Bank", type: "Stock / Equity", value: "₹1,20,000", return: "5%", negative: true },
    { name: "Mumbai Flat", type: "Real Estate / Mumbai", value: "₹2,50,00,000", return: "6%" },
    { name: "Nifty 50 Index", type: "Mutual Fund", value: "₹3,40,000", return: "5%", negative: true },
    { name: "TCS", type: "Stock / Tech", value: "₹4,10,000", return: "6%", negative: true },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Top Row Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Balance Card */}
        <Card className="glass glass-hover overflow-hidden border-none group relative">
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl transition-all duration-500 group-hover:bg-indigo-500/20" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
            <CardTitle className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Total Balance</CardTitle>
            <Eye className="h-4 w-4 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">{formatCurrencyPair(balance).split(' ')[0]}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{formatCurrencyPair(balance).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-[10px]">
              <span className={`flex items-center rounded-full px-2 py-0.5 font-bold ${growthPercent >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                {growthPercent >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                {Math.abs(growthPercent).toFixed(1)}%
              </span>
              <span className="text-slate-400 font-medium">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="glass glass-hover overflow-hidden border-none group relative">
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/20" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
            <CardTitle className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:text-emerald-500 transition-colors" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">{formatCurrencyPair(totalIncome).split(' ')[0]}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{formatCurrencyPair(totalIncome).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-[10px]">
              <span className="flex items-center rounded-full px-2 py-0.5 font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                100%
              </span>
              <span className="text-slate-400 font-medium">Inflow tracking</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="glass glass-hover overflow-hidden border-none group relative">
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-rose-500/10 blur-3xl transition-all duration-500 group-hover:bg-rose-500/20" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
            <CardTitle className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-400 group-hover:text-rose-500 transition-colors" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">{formatCurrencyPair(totalExpense).split(' ')[0]}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{formatCurrencyPair(totalExpense).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-[10px]">
              <span className="flex items-center rounded-full px-2 py-0.5 font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {(totalIncome > 0 ? (totalExpense/totalIncome)*100 : 0).toFixed(1)}%
              </span>
              <span className="text-slate-400 font-medium">Burn rate</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Growth Card */}
        <Card className="glass glass-hover overflow-hidden border-none group relative">
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-teal-500/10 blur-3xl transition-all duration-500 group-hover:bg-teal-500/20" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2 z-10">
            <CardTitle className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Net Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-400 group-hover:text-teal-500 transition-colors" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">{formatCurrencyPair(balance).split(' ')[0]}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{formatCurrencyPair(balance).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-[10px]">
              <span className="flex items-center rounded-full px-2 py-0.5 font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                Stable
              </span>
              <span className="text-slate-400 font-medium">Portfolio health</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2 glass glass-hover relative overflow-hidden flex flex-col group border-none">
          <div className="absolute top-0 right-0 -m-10 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full opacity-50 pointer-events-none" />
          
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-0 relative z-20 gap-3">
            <div className="px-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Financial Report</CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 font-medium">
                {reportView === "monthly" ? "Trend by Month" : reportView === "weekly" ? "Trend by Week" : "Trend by Year"}
              </p>
            </div>
            <div className="flex items-center rounded-xl bg-slate-100/50 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
              {(["weekly", "monthly", "yearly"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setReportView(v)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-lg ${
                    reportView === v
                      ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 mt-6 relative z-20 overflow-hidden">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportChartData.length > 0 ? reportChartData : [{ label: "No Data", income: 0, expenses: 0 }]} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#a1a1aa" opacity={0.1} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} dx={-10} fontWeight={600} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)', color: '#fff', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                    labelStyle={{ fontSize: '11px', marginBottom: '6px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    formatter={v => `₹${Number(v).toLocaleString("en-IN")}`}
                  />
                  <Area name="Income" type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }} />
                  <Area name="Expenses" type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category Donut */}
        <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-sm transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.18)] flex flex-col">
          <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-50">Spending by Category</CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">Expense breakdown</p>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 flex flex-col gap-4 pb-4">
            {spendingPieData.length > 0 ? (
              <>
                {/* Donut chart */}
                <div className="relative h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {spendingPieData.map((d, i) => (
                          <radialGradient key={i} id={`spendGrad${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={d.color.start} stopOpacity={1} />
                            <stop offset="100%" stopColor={d.color.end} stopOpacity={0.85} />
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={spendingPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive
                        animationBegin={0}
                        animationDuration={700}
                      >
                        {spendingPieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={`url(#spendGrad${i})`}
                            style={{ filter: `drop-shadow(0 0 6px ${spendingPieData[i].color.start}55)`, cursor: "pointer" }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(9,9,11,0.88)", backdropFilter: "blur(14px)", color: "#fff", padding: "10px 14px", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3)" }}
                        itemStyle={{ color: "#f4f4f5", fontSize: "13px", fontWeight: 600 }}
                        formatter={(value: any, name: any) => [
                          `₹${Number(value).toLocaleString("en-IN")}  ($${(Number(value) / 84).toFixed(0)})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 leading-tight">
                      ₹{(totalSpending / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>

                {/* Legend rows */}
                <div className="space-y-2.5 px-1">
                  {spendingPieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: d.color.start, boxShadow: `0 0 6px ${d.color.start}88` }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[90px]">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-slate-500 dark:text-zinc-400 text-[11px]">{d.pct.toFixed(1)}%</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
                          ₹{d.value.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-600">
                <div className="w-14 h-14 rounded-full border-4 border-dashed border-slate-200 dark:border-zinc-700 opacity-40" />
                <p className="text-sm">No expense data yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Transactions Card */}
        <Card className="glass glass-hover h-[320px] flex flex-col border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 -m-6 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10 px-6">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Recent Activity</CardTitle>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">See All</span>
          </CardHeader>
          <CardContent className="overflow-y-auto pb-6 px-6 hide-scrollbar flex-1 relative z-10">
            <div className="space-y-4">
              {recentTransactions.length > 0 ? recentTransactions.map((t) => {
                const cat = categories.find(c => c.id === t.category);
                return (
                  <div key={t.id} className="flex items-center justify-between group/row">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex shrink-0 items-center justify-center text-[11px] text-white font-bold transition-transform duration-300 group-hover/row:scale-110 shadow-sm"
                        style={{ backgroundColor: cat?.color || DEFAULT_COLOR }}
                      >
                        {(t.provider || t.title).substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold truncate text-slate-800 dark:text-zinc-100 leading-tight">
                          {t.provider || t.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium">
                          {format(new Date(t.date), "MMM dd")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[12px] font-extrabold tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-zinc-100'}`}>
                        {t.type === 'income' ? '+' : '−'}{formatCurrencyPair(t.amount).split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.type}</span>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-xs text-center text-slate-400 mt-10 font-bold uppercase tracking-widest opacity-40">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card className="glass glass-hover h-[320px] flex flex-col border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 -m-6 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10 px-6">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Spending Mix</CardTitle>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">Details</span>
          </CardHeader>
          <CardContent className="pb-6 px-6 flex-1 flex flex-col overflow-hidden relative z-10">
            <div className="w-full h-1.5 flex rounded-full overflow-hidden mb-8 bg-slate-100 dark:bg-white/5">
              {typesData.length > 0 ? typesData.map((t, i) => (
                <div key={i} className="h-full transition-all duration-1000" style={{ width: `${t.percentNum}%`, backgroundColor: t.color }}></div>
              )) : (
                <div className="bg-slate-200 w-full h-full"></div>
              )}
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar px-1">
              {typesData.length > 0 ? typesData.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="font-bold text-slate-700 dark:text-zinc-200 truncate max-w-[100px]">{t.name}</span>
                  </div>
                  <div className="flex gap-3 font-bold tabular-nums">
                    <span className="text-slate-800 dark:text-zinc-100">{t.amountStr.split(' ')[0]}</span>
                    <span className="text-slate-400 w-10 text-right opacity-60">({t.percent})</span>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-center text-slate-400 mt-10 font-bold uppercase tracking-widest opacity-40">No breakdown data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview Card */}
        <Card className="glass glass-hover h-[320px] flex flex-col border-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 -m-6 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10 px-6">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Budget Pulse</CardTitle>
            <Target className="h-4 w-4 text-indigo-500 group-hover:rotate-12 transition-transform duration-500" />
          </CardHeader>

          <CardContent className="pb-6 px-6 flex-1 flex flex-col relative z-10">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6 mt-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Target</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">₹{budgetData.totalBudget.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">Balance</p>
                <p className={`text-sm font-extrabold ${budgetData.totalBudget - budgetData.totalSpent < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ₹{(budgetData.totalBudget - budgetData.totalSpent).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Category Progress */}
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar min-h-0">
              {budgetData.categoryBudgets.length > 0 ? budgetData.categoryBudgets.map((b, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </div>
                    <span className="text-slate-400 dark:text-zinc-500 tabular-nums font-extrabold opacity-60">
                      {b.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100/50 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                        b.status === 'over' ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 
                        b.status === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                        'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`}
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                  <TrendingUp className="h-8 w-8 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No pulse detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
