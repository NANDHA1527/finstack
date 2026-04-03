"use client";

import { useMemo } from "react";
import { format, subDays, isAfter } from "date-fns";
import { useAppContext } from "@/lib/store";
import { formatCurrencyPair } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  Eye, ArrowUpRight, ArrowDownRight, ChevronDown, Users
} from "lucide-react";

export default function DashboardPage() {
  const { transactions, categories } = useAppContext();

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

  // Dynamic Chart Data: Rolling cumulative balance over last 14 days
  const chartData = useMemo(() => {
    const data = [];
    const fourteenDaysAgo = subDays(new Date(), 14);
    
    // Real dynamic logic: Gather daily deltas
    const days: Record<string, number> = {};
    for (let i = 14; i >= 0; i--) {
      days[format(subDays(new Date(), i), 'MMM dd')] = 0;
    }
    
    transactions.forEach(t => {
      if (isAfter(new Date(t.date), fourteenDaysAgo)) {
        const day = format(new Date(t.date), 'MMM dd');
        if (days[day] !== undefined) {
           days[day] += t.type === 'income' ? t.amount : -t.amount;
        }
      }
    });

    let current = balance - Object.values(days).reduce((a,b)=>a+b,0);
    for (const [day, delta] of Object.entries(days)) {
      current += delta;
      data.push({ name: day, amount: current > 0 ? current : 0 });
    }
    return data;
  }, [transactions, balance]);

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
        color: cat?.color || "bg-slate-300"
      };
    }).sort((a, b) => b.amountRaw - a.amountRaw);
  }, [transactions, categories, totalExpense]);

  // Static mock for Top Assets 
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
        <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:border-indigo-500/30 dark:hover:border-indigo-500/30">
          <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/25 dark:group-hover:bg-indigo-500/30" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-4 z-20">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Total Balance</CardTitle>
            <Eye className="h-4 w-4 text-indigo-400/80 transition-colors group-hover:text-indigo-500" />
          </CardHeader>
          <CardContent className="relative z-20">
            <div className="flex flex-col space-y-1">
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 transition-transform duration-500 origin-left group-hover:scale-[1.02]">{formatCurrencyPair(balance).split(' ')[0]}</div>
              <div className="text-sm font-medium text-slate-500">{formatCurrencyPair(balance).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-xs">
              <span className={`flex items-center rounded-sm px-1.5 py-0.5 font-medium ${growthPercent >= 0 ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400"}`}>
                {growthPercent >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                {Math.abs(growthPercent).toFixed(2)}%
              </span>
              <span className="text-slate-400">Compared to last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] hover:border-emerald-500/30 dark:hover:border-emerald-500/30">
          <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/25 dark:group-hover:bg-emerald-500/30" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-4 z-20">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-400/80 transition-colors group-hover:text-emerald-500" />
          </CardHeader>
          <CardContent className="relative z-20">
            <div className="flex flex-col space-y-1">
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 transition-transform duration-500 origin-left group-hover:scale-[1.02]">{formatCurrencyPair(totalIncome).split(' ')[0]}</div>
              <div className="text-sm font-medium text-slate-500">{formatCurrencyPair(totalIncome).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-xs">
              <span className={`flex items-center rounded-sm px-1.5 py-0.5 font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400`}>
                100.0%
              </span>
              <span className="text-slate-400">Of Cashflow In</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(244,63,94,0.12)] hover:border-rose-500/30 dark:hover:border-rose-500/30">
          <div className="absolute -inset-px bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-rose-500/10 blur-2xl transition-all duration-500 group-hover:bg-rose-500/25 dark:group-hover:bg-rose-500/30" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-4 z-20">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-400/80 transition-colors group-hover:text-rose-500" />
          </CardHeader>
          <CardContent className="relative z-20">
            <div className="flex flex-col space-y-1">
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 transition-transform duration-500 origin-left group-hover:scale-[1.02]">{formatCurrencyPair(totalExpense).split(' ')[0]}</div>
              <div className="text-sm font-medium text-slate-500">{formatCurrencyPair(totalExpense).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-xs">
              <span className={`flex items-center rounded-sm px-1.5 py-0.5 font-medium bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400`}>
                {(totalIncome > 0 ? (totalExpense/totalIncome)*100 : 0).toFixed(1)}%
              </span>
              <span className="text-slate-400">Of Total Income</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Growth Card */}
        <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-zinc-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(20,184,166,0.12)] hover:border-teal-500/30 dark:hover:border-teal-500/30">
          <div className="absolute -inset-px bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 -m-6 h-28 w-28 rounded-full bg-teal-500/10 blur-2xl transition-all duration-500 group-hover:bg-teal-500/25 dark:group-hover:bg-teal-500/30" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-4 z-20">
            <CardTitle className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Net Growth</CardTitle>
            <Users className="h-4 w-4 text-teal-400/80 transition-colors group-hover:text-teal-500" />
          </CardHeader>
          <CardContent className="relative z-20">
            <div className="flex flex-col space-y-1">
              <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 transition-transform duration-500 origin-left group-hover:scale-[1.02]">{formatCurrencyPair(balance).split(' ')[0]}</div>
              <div className="text-sm font-medium text-slate-500">{formatCurrencyPair(balance).split(' ')[1]}</div>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-xs">
              <span className={`flex items-center rounded-sm px-1.5 py-0.5 font-medium bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400`}>
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
                Stable
              </span>
              <span className="text-slate-400">Portfolio Status</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-50">Asset Tracking (Rolling 14 Days)</CardTitle>
            <div className="flex items-center justify-between px-3 py-1 rounded-full border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-300 cursor-pointer">
              Daily
              <ChevronDown className="ml-1 h-3 w-3" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 mt-6 px-0 pb-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width={99} height={99} aspect={2}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrencyPair(Number(value)), "Balance"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ r: 0 }}
                    activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Assets List */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-50">Top Assets</CardTitle>
            <span className="text-xs font-medium text-indigo-500 cursor-pointer hover:underline">See All</span>
          </CardHeader>
          <CardContent className="flex-1 pb-4 px-6 relative">
            <div className="flex justify-between text-xs text-slate-400 mb-4 font-medium px-1">
              <span>Name</span>
              <div className="flex w-[140px] justify-between">
                <span>Value</span>
                <span>Return</span>
              </div>
            </div>
            <div className="space-y-4">
              {topAssets.map((asset, i) => (
                <div key={i} className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{asset.name}</span>
                    <span className="text-xs text-slate-400 flex items-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-600 mr-1.5 hidden sm:block"></span>
                      {asset.type}
                    </span>
                  </div>
                  <div className="flex w-[140px] justify-between items-center text-sm font-medium">
                    <span className="text-slate-800 dark:text-zinc-200 text-[11px] whitespace-nowrap">{asset.value}</span>
                    <span className={`text-xs ml-2 flex items-center ${asset.negative ? 'text-red-500' : 'text-emerald-500'}`}>
                      {asset.return} {asset.negative ? <ArrowDownRight className="ml-0.5 h-3 w-3" /> : <ArrowUpRight className="ml-0.5 h-3 w-3" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Transactions Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm h-[320px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-50">Recent Transactions</CardTitle>
            <span className="text-xs font-medium text-indigo-500 cursor-pointer hover:underline">See All</span>
          </CardHeader>
          <CardContent className="overflow-y-auto pb-4 px-6 hide-scrollbar flex-1">
            <div className="flex border-b border-transparent text-xs text-slate-400 mb-4 font-medium px-1 justify-between">
              <span>Provider</span>
              <div className="flex justify-between w-[55%]">
                <span>Type</span>
                <span className="text-right">Amount</span>
              </div>
            </div>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? recentTransactions.map((t, i) => {
                const cat = categories.find(c => c.id === t.category);
                return (
                  <div key={t.id} className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3 w-[45%] overflow-hidden">
                      <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-[10px] text-white font-bold ${cat?.color || 'bg-slate-400'}`}>
                        {(t.provider || t.title).substring(0,2).toUpperCase()}
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold truncate text-slate-800 dark:text-zinc-200" title={t.provider || t.title}>
                        {t.provider || t.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-[55%] font-medium">
                      <span className={`${t.type==='expense' ? 'text-red-500' : 'text-emerald-500'} bg-slate-50 dark:bg-zinc-900 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider`}>
                        {t.type}
                      </span>
                      <span className="text-slate-800 dark:text-zinc-200 text-right whitespace-nowrap text-[10px]">
                        {formatCurrencyPair(t.amount)}
                      </span>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-sm text-center text-slate-400 mt-8">No recent transactions</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Types Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm h-[320px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-50">Types</CardTitle>
            <span className="text-xs font-medium text-indigo-500 cursor-pointer hover:underline">See All</span>
          </CardHeader>
          <CardContent className="pb-4 px-6 flex-1 flex flex-col overflow-hidden">
            <div className="w-full h-2 flex rounded-full overflow-hidden mb-6 flex-shrink-0">
              {typesData.length > 0 ? typesData.map((t, i) => (
                <div key={i} className={`${t.color} h-full`} style={{ width: `${t.percentNum}%` }}></div>
              )) : (
                <div className="bg-slate-200 w-full h-full"></div>
              )}
            </div>
            <div className="space-y-3.5 flex-1 overflow-y-auto hide-scrollbar px-1 min-h-0">
              {typesData.length > 0 ? typesData.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.color}`}></div>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 max-w-[80px] truncate">{t.name}</span>
                  </div>
                  <div className="flex gap-1.5 font-medium min-w-0 flex-1 justify-end">
                    <span className="text-slate-800 dark:text-zinc-200 text-[10px] whitespace-nowrap">{t.amountStr}</span>
                    <span className="text-slate-400 w-10 text-right">({t.percent})</span>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-center text-slate-400 mt-4">No expense categories to track.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members Card */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm h-[320px] flex flex-col items-center">
          <CardHeader className="flex flex-row items-center justify-between pb-4 w-full">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-50">Members</CardTitle>
            <span className="text-xs font-medium text-indigo-500 cursor-pointer hover:underline">See All</span>
          </CardHeader>
          <CardContent className="pb-4 px-6 flex flex-1 items-center justify-center w-full relative">
            <div className="w-12 h-12 rounded-full border-[5px] border-indigo-100 border-t-indigo-400 border-r-pink-300 border-b-amber-200 absolute animate-[spin_4s_linear_infinite]"></div>
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-900 absolute shadow-inner flex items-center justify-center">
               <Users className="w-4 h-4 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
