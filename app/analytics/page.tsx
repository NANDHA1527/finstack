"use client";

import { useMemo } from "react";
import { useAppContext } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

export default function AnalyticsPage() {
  const { transactions, categories } = useAppContext();

  // Prepare data for Category Pie Chart (Expenses only)
  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    
    // Group by category ID
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Map to array with names and colors
    return Object.entries(grouped).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        name: category?.name || "Unknown",
        value: amount,
        color: category?.color || "#cbd5e1"
      };
    }).sort((a, b) => b.value - a.value); // Sort by highest
  }, [transactions, categories]);

  // Use default tailwind colors for pie if category color is not reliable
  const PIE_COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e'];

  // Prepare data for Monthly Expenses Bar Chart
  const barData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    const expenses = transactions.filter(t => t.type === "expense");

    expenses.forEach(t => {
      const date = new Date(t.date);
      // Group by Month (e.g. "Jan", "Feb")
      const monthStr = date.toLocaleString('default', { month: 'short' }); 
      monthlyData[monthStr] = (monthlyData[monthStr] || 0) + t.amount;
    });

    // Create a chronological array (simplified, just displaying months present in data)
    return Object.entries(monthlyData).map(([month, amount]) => ({
      name: month,
      amount
    }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-slate-500 dark:text-zinc-400">Detailed insights into your spending.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `$${Number(value).toLocaleString()}`} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-slate-500 text-sm">
                No expense data available for pie chart.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      formatter={(value) => `$${Number(value).toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-slate-500 text-sm">
                No expense data available for monthly chart.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
