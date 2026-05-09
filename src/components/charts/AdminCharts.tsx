"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface LineProps {
  data: Array<{ month: string; count: number }>;
  color?: string;
}

export function UsersOverTimeChart({ data, color = "#bef264" }: LineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3d4b56" />
        <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#181d22", border: "1px solid #3d4b56", borderRadius: "12px" }} />
        <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GamesAreaChart({ data }: LineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="gamesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#bef264" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#bef264" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#3d4b56" />
        <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#181d22", border: "1px solid #3d4b56", borderRadius: "12px" }} />
        <Area type="monotone" dataKey="count" stroke="#bef264" fill="url(#gamesGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopScenariosChart({ data }: { data: Array<{ name: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={{ background: "#181d22", border: "1px solid #3d4b56", borderRadius: "12px" }} />
        <Bar dataKey="count" fill="#bef264" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
