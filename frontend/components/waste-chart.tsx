"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"
import { wasteTrend } from "@/lib/freshness"

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {payload[0].value} kg <span className="font-normal text-muted-foreground">saved</span>
      </p>
    </div>
  )
}

export function WasteChart({ trend }: { trend?: { day: string; kg: number }[] }) {
  const chartData = trend?.length ? trend : wasteTrend
  const total = chartData.reduce((sum, d) => sum + d.kg, 0)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Waste reduced</h2>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
          {total.toLocaleString()} kg total
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--fresh)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--fresh)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="kg"
              stroke="var(--fresh)"
              strokeWidth={2.5}
              fill="url(#wasteFill)"
              dot={{ r: 3, fill: "var(--fresh)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "var(--fresh)", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
