'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: { date: string; total: number; count: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369A1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0369A1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8F0F1" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#BBF7D0' }} />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #BBF7D0',
            fontSize: '12px',
            backgroundColor: '#FFFFFF',
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
        />
        <Area type="monotone" dataKey="total" stroke="#0369A1" strokeWidth={2} fill="url(#salesGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
