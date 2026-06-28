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

export function UsersOverTimeChart({ data, color = "#d4ad55" }: LineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4d3a5c" />
        <XAxis dataKey="month" tick={{ fill: "#b0a290", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#b0a290", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#211829", border: "1px solid #4d3a5c", borderRadius: "12px" }} />
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
            <stop offset="5%" stopColor="#d4ad55" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d4ad55" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#4d3a5c" />
        <XAxis dataKey="month" tick={{ fill: "#b0a290", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#b0a290", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#211829", border: "1px solid #4d3a5c", borderRadius: "12px" }} />
        <Area type="monotone" dataKey="count" stroke="#d4ad55" fill="url(#gamesGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopScenariosChart({ data }: { data: Array<{ name: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: "#b0a290", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: "#b0a290", fontSize: 11, fontFamily: "Vazirmatn" }} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={{ background: "#211829", border: "1px solid #4d3a5c", borderRadius: "12px" }} />
        <Bar dataKey="count" fill="#d4ad55" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
