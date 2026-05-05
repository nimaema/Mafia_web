"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: Array<{ name: string; wins: number; losses: number }>;
}

export default function WinLossBarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "Vazirmatn" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "12px",
            fontFamily: "Vazirmatn, sans-serif",
            direction: "rtl",
          }}
          formatter={(value: any, name: any) => [value, name === "wins" ? "برد" : "باخت"]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontFamily: "Vazirmatn, sans-serif", fontSize: 12 }}>
              {value === "wins" ? "برد" : "باخت"}
            </span>
          )}
        />
        <Bar dataKey="wins" fill="#00f5d4" radius={[4, 4, 0, 0]} name="wins" />
        <Bar dataKey="losses" fill="#b91c1c" radius={[4, 4, 0, 0]} name="losses" />
      </BarChart>
    </ResponsiveContainer>
  );
}
