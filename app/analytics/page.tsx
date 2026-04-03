"use client";

import { useMemo, useState } from "react";
import { format, getWeek, getYear } from "date-fns";
import { useAppContext } from "@/lib/store";
import { formatCurrencyPair } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from "recharts";
import { TrendingDown, Tag, BarChart2, ArrowDownRight } from "lucide-react";

// ─── Palette ───────────────────────────────────────────────────────────────
const GRADIENT_COLORS = [
  { start: "#6366f1", end: "#818cf8" },
  { start: "#ec4899", end: "#f472b6" },
  { start: "#f59e0b", end: "#fbbf24" },
  { start: "#10b981", end: "#34d399" },
  { start: "#14b8a6", end: "#2dd4bf" },
  { start: "#f43f5e", end: "#fb7185" },
  { start: "#8b5cf6", end: "#a78bfa" },
];

type ViewType = "weekly" | "monthly" | "yearly";

// ─── Custom Tooltip ────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = Number(payload[0]?.value || 0);
    const usd = (val / 84).toFixed(0);
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl px-4 py-3 shadow-2xl">
        {label && <p className="text-xs text-zinc-400 mb-1.5 font-medium">{label}</p>}
        <p className="text-sm font-bold text-white">₹{val.toLocaleString("en-IN")}</p>
        <p className="text-xs text-zinc-500 mt-0.5">${Number(usd).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const PieGlassTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const val = Number(payload[0]?.value || 0);
    const usd = (val / 84).toFixed(0);
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-zinc-400 mb-1.5 font-medium">{payload[0]?.name}</p>
        <p className="text-sm font-bold text-white">₹{val.toLocaleString("en-IN")}</p>
        <p className="text-xs text-zinc-500 mt-0.5">${Number(usd).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// ─── Custom Bar ────────────────────────────────────────────────────────────
const GradientBar = (props: any) => {
  const { x, y, width, height, index } = props;
  const id = `barGrad${index}`;
  const c = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.start} stopOpacity={0.95} />
          <stop offset="100%" stopColor={c.end} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={`url(#${id})`} />
    </g>
  );
};

export default function AnalyticsPage() {
  const { transactions, categories } = useAppContext();
  const [view, setView] = useState<ViewType>("monthly");

  // ─── Filtered expenses by view ─────────────────────────────────────────
  const expenses = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions]
  );

  // ─── Summary stats ─────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => expenses.reduce((s, t) => s + t.amount, 0),
    [expenses]
  );

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    if (!top) return "—";
    const cat = categories.find((c) => c.id === top[0]);
    return cat?.name || "Unknown";
  }, [expenses, categories]);

  const avgSpend = useMemo(() => {
    if (expenses.length === 0) return 0;
    return totalExpenses / expenses.length;
  }, [expenses, totalExpenses]);

  // ─── Pie chart data ────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return { name: category?.name || "Unknown", value: amount };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  // ─── Bar chart data grouped by view ───────────────────────────────────
  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      const d = new Date(t.date);
      let key: string;
      if (view === "monthly") key = format(d, "MMM yy");
      else if (view === "weekly") key = `Wk${getWeek(d)} '${format(d, "yy")}`;
      else key = `${getYear(d)}`;
      map[key] = (map[key] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) =>
        view === "yearly" ? Number(a) - Number(b) : a.localeCompare(b)
      )
      .map(([name, amount]) => ({ name, amount }));
  }, [expenses, view]);

  const summaryStats = [
    {
      label: "Total Expenses",
      value: formatCurrencyPair(totalExpenses),
      icon: TrendingDown,
      glow: "group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)]",
      iconColor: "text-rose-400",
      accent: "from-rose-500/10",
    },
    {
      label: "Top Category",
      value: topCategory,
      icon: Tag,
      glow: "group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]",
      iconColor: "text-indigo-400",
      accent: "from-indigo-500/10",
    },
    {
      label: "Avg per Transaction",
      value: formatCurrencyPair(avgSpend),
      icon: BarChart2,
      glow: "group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]",
      iconColor: "text-amber-400",
      accent: "from-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">
            Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">
            Detailed insights into your spending patterns.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl bg-slate-100/50 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
          {(["weekly", "monthly", "yearly"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-lg ${
                view === v
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {summaryStats.map(({ label, value, icon: Icon, glow, iconColor, accent }) => (
          <div
            key={label}
            className={`glass glass-hover p-6 border-none group relative overflow-hidden flex flex-col justify-between h-32`}
          >
            <div className={`absolute top-0 right-0 -m-8 w-24 h-24 rounded-full bg-gradient-to-br ${accent} to-transparent blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">{label}</span>
              <div className={`p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110 ${iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 tabular-nums tracking-tight">{value.split(" ")[0]}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1 opacity-60">{value.split(" ")[1] || 'Overall'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Donut / Pie Card */}
        <Card className="glass glass-hover min-h-[460px] flex flex-col border-none group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-6">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Spending by Category</CardTitle>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 font-bold uppercase tracking-widest opacity-60">Expense breakdown</p>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 flex-1 flex flex-col pb-6">
            {pieData.length > 0 ? (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {pieData.map((_, i) => {
                        const c = GRADIENT_COLORS[i % GRADIENT_COLORS.length];
                        return (
                          <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={c.start} stopOpacity={1} />
                            <stop offset="100%" stopColor={c.end} stopOpacity={0.8} />
                          </radialGradient>
                        );
                      })}
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#pieGrad${index})`}
                          style={{ filter: `drop-shadow(0 0 8px ${GRADIENT_COLORS[index % GRADIENT_COLORS.length].start}44)`, cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieGlassTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={6}
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "10px", fontWeight: 800, color: "#71717a", textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: "20px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-600 opacity-40">
                <ArrowDownRight className="h-10 w-10" />
                <p className="text-xs font-bold uppercase tracking-widest">No pulse detected</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart Card */}
        <Card className="glass glass-hover min-h-[460px] flex flex-col border-none group relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-6">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-50 tracking-tight">Expenses Over Time</CardTitle>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1 font-bold uppercase tracking-widest opacity-60 capitalize">{view} history</p>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 flex-1 flex flex-col pb-6">
            {barData.length > 0 ? (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#a1a1aa"
                      opacity={0.1}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={12}
                      fontWeight={700}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      dx={-10}
                      fontWeight={700}
                    />
                    <Tooltip
                      content={<GlassTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.03)", radius: 12 }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[8, 8, 0, 0]}
                      shape={<GradientBar />}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400 dark:text-zinc-600 opacity-40">
                <BarChart2 className="h-10 w-10" />
                <p className="text-xs font-bold uppercase tracking-widest">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
