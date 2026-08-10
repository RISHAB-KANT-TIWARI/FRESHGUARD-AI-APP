"use client"

import Image from "next/image"
import useSWR from "swr"
import { Bell, IndianRupee, Recycle, TriangleAlert, Zap } from "lucide-react"
import { FreshnessRing } from "@/components/freshness-ring"
import { StatusBadge } from "@/components/status-badge"
import { WasteChart } from "@/components/waste-chart"
import { getStatus, statusMeta, type RecentScan } from "@/lib/freshness"
import { fetchCriticalAlerts, fetchDashboard, fetchScanHistory } from "@/lib/api"

const metrics = [
  {
    label: "Waste reduced this week",
    value: "1,240 kg",
    sub: "+18% vs last week",
    icon: Recycle,
    tone: "var(--fresh)",
    toneBg: "bg-accent",
  },
  {
    label: "Items at risk",
    value: "3 batches",
    sub: "Needs action today",
    icon: TriangleAlert,
    tone: "var(--warning)",
    toneBg: "bg-[#fef3e2]",
  },
  {
    label: "Total inventory value",
    value: "₹50,450",
    sub: "Across 6 active batches",
    icon: IndianRupee,
    tone: "var(--foreground)",
    toneBg: "bg-secondary",
  },
]

type BackendBatch = RecentScan & {
  product_name?: string
  quantity?: string | number
  value?: string | number
  variety?: string
  daysLeft?: number
}

type BackendAlert = {
  id?: string
  product_name: string
  freshness_score?: number
  freshness?: number
  shelf_life_days?: number
  quantity?: string | number
}

export function Dashboard({ token, onSimulateAlert }: { token: string; onSimulateAlert?: () => void }) {
  const { data, error, isLoading } = useSWR(token ? ["dashboard", token] : null, ([, authToken]) => fetchDashboard(authToken))
  const { data: history = [], error: historyError, isLoading: historyLoading } = useSWR(
    token ? ["dashboard-scan-history", token] : null,
    ([, authToken]) => fetchScanHistory(authToken),
  )
  const { data: alertData, error: alertsError, isLoading: alertsLoading } = useSWR(
    token ? ["dashboard-critical-alerts", token] : null,
    ([, authToken]) => fetchCriticalAlerts(authToken),
  )
  const batches = history as BackendBatch[]
  const alerts = (alertData?.items ?? []) as BackendAlert[]
  const liveMetrics = data ? [
    { ...metrics[0], value: `${data.waste_saved_kg.toLocaleString()} kg`, sub: "From rescued inventory" },
    { ...metrics[1], value: `${data.critical_count} batches`, sub: "Needs action today" },
    { ...metrics[2], value: `${data.avg_freshness_score}%`, sub: `${data.total_scans} total scans` },
  ] : metrics

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-pretty text-2xl font-semibold tracking-tight lg:text-3xl">Inventory overview</h1>
        <p className="text-sm text-muted-foreground">Live freshness across every batch in your warehouse.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-muted" /> : null}
        {error ? <p className="text-sm text-destructive">Couldn't load data, please try again</p> : null}
        <WasteChart trend={data?.trend} />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {liveMetrics.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.label}
                className="flex items-start justify-between rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <span className="text-2xl font-semibold tracking-tight">{m.value}</span>
                  <span className="text-xs text-muted-foreground">{m.sub}</span>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.toneBg}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: m.tone }} />
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Inventory batches</h2>
            <span className="text-xs text-muted-foreground">{historyLoading ? "Loading…" : `${batches.length} batches`}</span>
          </div>
          <div className="hidden grid-cols-[64px_1fr_100px_100px_120px] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>Freshness</span>
            <span>Product</span>
            <span>Quantity</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {historyError ? <p className="px-5 py-4 text-sm text-destructive">Couldn't load data, please try again</p> : null}
          {historyLoading ? <div className="mx-5 my-4 h-16 animate-pulse rounded-xl bg-muted" /> : null}
          <ul className="divide-y divide-border">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-4 md:grid-cols-[64px_1fr_100px_100px_120px]"
              >
                <FreshnessRing value={batch.freshness} size={48} />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
                    <Image src={batch.image || "/placeholder.svg"} alt={batch.name || "Produce"} fill className="object-cover" sizes="40px" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{batch.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {batch.id} · {batch.variety ?? "Fresh produce"}
                    </span>
                  </div>
                </div>
                <span className="hidden text-sm text-muted-foreground md:block">{batch.quantity ?? "—"}</span>
                <span className="hidden text-sm font-medium md:block">{batch.value}</span>
                <div className="justify-self-end md:justify-self-start">
                  <StatusBadge value={batch.freshness} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdecec]">
                <Bell className="h-4 w-4 text-destructive" strokeWidth={1.75} />
              </span>
              <h2 className="text-base font-semibold">Live alerts</h2>
            </div>
            {onSimulateAlert && (
              <button
                type="button"
                onClick={onSimulateAlert}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Zap className="h-3 w-3" strokeWidth={1.75} />
                Simulate
                <span className="rounded-full bg-secondary px-1.5 py-px text-[9px] uppercase tracking-wide text-muted-foreground">
                  demo
                </span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Batches expiring soon and needing action.</p>
          {alertsError ? <p className="text-sm text-destructive">Couldn't load data, please try again</p> : null}
          {alertsLoading ? <div className="h-16 animate-pulse rounded-xl bg-muted" /> : null}
          <ul className="flex flex-col gap-2.5">
            {alerts.map((batch) => {
              const freshness = batch.freshness_score ?? batch.freshness ?? 0
              const meta = statusMeta[getStatus(freshness)]
              return (
                <li
                  key={batch.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                  style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
                >
                  <FreshnessRing value={freshness} size={36} showValue={false} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{batch.product_name ?? "Unknown batch"}</span>
                    <span className="text-xs text-muted-foreground">
                      {batch.shelf_life_days ?? "—"} day{batch.shelf_life_days === 1 ? "" : "s"} left · {batch.quantity ?? "—"}
                    </span>
                  </div>
                  <StatusBadge value={freshness} />
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </div>
  )
}
