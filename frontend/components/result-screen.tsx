"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Check, ChevronLeft, Clock, Loader2, Recycle, Sparkles, TrendingDown } from "lucide-react"
import { FreshnessRing } from "@/components/freshness-ring"
import { StatusBadge } from "@/components/status-badge"
import { getStatus, statusMeta, type RecentScan } from "@/lib/freshness"
import { cn } from "@/lib/utils"

type Recommendation = {
  action: string
  detail: string
  icon: typeof Sparkles
}

function getRecommendation(value: number): Recommendation {
  const status = getStatus(value)
  if (status === "fresh")
    return {
      action: "Sell now",
      detail: "Peak quality — list at full market price for best margins.",
      icon: TrendingDown,
    }
  if (status === "at-risk")
    return {
      action: "Discount 20%",
      detail: "Ripening fast. A small markdown moves stock before quality drops.",
      icon: TrendingDown,
    }
  return {
    action: "Send to rescue marketplace",
    detail: "Critical shelf-life. Match with nearby NGOs and bulk buyers today.",
    icon: Recycle,
  }
}

const tagsByStatus: Record<string, string[]> = {
  fresh: ["Firm texture", "Even color", "No bruising"],
  "at-risk": ["Soft spots", "High ripeness", "Slight wrinkling"],
  critical: ["Visible mold", "Over-ripe", "Moisture loss"],
}

function getReasoning(value: number, daysLeft: number): string[] {
  const status = getStatus(value)
  const demand = status === "fresh" ? "steady this week" : status === "at-risk" ? "low this week" : "very low this week"
  const price = status === "fresh" ? "holding firm" : status === "at-risk" ? "starting to drop" : "dropping fast"
  return [
    `Checking shelf-life: ${daysLeft} day${daysLeft > 1 ? "s" : ""} left`,
    `Checking demand: ${demand}`,
    `Checking market price: ${price}`,
  ]
}

export function ResultScreen({ scan, onBack, onRescue }: { scan: RecentScan; onBack: () => void; onRescue: () => void }) {
  const status = getStatus(scan.freshness)
  const meta = statusMeta[status]
  const rec = getRecommendation(scan.freshness)
  const RecIcon = rec.icon
  const daysLeft = scan.shelfLifeDays ?? Math.max(1, Math.round((scan.freshness / 100) * 8))
  const reasoning = scan.reasoning?.length ? scan.reasoning : getReasoning(scan.freshness, daysLeft)

  // Reveal the agent's reasoning steps one at a time, then the final call.
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= reasoning.length

  useEffect(() => {
    setRevealed(0)
    const timers = reasoning.map((_, i) => setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 500 + i * 700))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.id])

  const handleAction = () => {
    const recommendation = scan.recommendation?.toLowerCase() ?? ""
    if (status === "critical" || recommendation.includes("rescue") || recommendation.includes("discount")) {
      onRescue()
    } else {
      onBack()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
          aria-label="Back to scan"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <span className="text-sm font-medium text-muted-foreground">Scan result</span>
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border">
          <Image
            src={scan.image || "/placeholder.svg"}
            alt={scan.name || "Produce"}
            fill
            className="object-cover"
            sizes="36px"
            unoptimized={scan.image?.startsWith("blob:")}
          />
        </div>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-8 shadow-sm">
        <FreshnessRing value={scan.freshness} size={168} strokeWidth={14} label="freshness" />
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{scan.name}</h1>
          <StatusBadge value={scan.freshness} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            Shelf-life left
          </div>
          <span className="text-2xl font-semibold tabular-nums">
            {daysLeft}
            <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs text-muted-foreground">Est. quality</span>
          <span className="text-2xl font-semibold tabular-nums" style={{ color: meta.color }}>
            {scan.freshness}%
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-foreground">Detected</h2>
        <div className="flex flex-wrap gap-2">
          {(scan.defects?.length ? scan.defects : tagsByStatus[status]).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">AI recommendation</span>
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              {done ? (
                "Analysis complete"
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" strokeWidth={2} />
                  Thinking through the options…
                </>
              )}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {reasoning.map((line, i) => {
            const shown = i < revealed
            return (
              <li
                key={line}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm transition-all duration-500",
                  shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-foreground">{line}</span>
              </li>
            )
          })}
        </ul>

        <div
          className={cn(
            "flex flex-col gap-4 transition-all duration-500",
            done ? "translate-y-0 opacity-100" : "pointer-events-none h-0 -translate-y-1 overflow-hidden opacity-0",
          )}
        >
          <div className="flex flex-col gap-1 border-t border-border pt-4">
              <span className="text-base font-semibold text-foreground">{scan.recommendation ?? rec.action}</span>
              <p className="text-sm leading-relaxed text-muted-foreground">{scan.recommendation ?? rec.detail}</p>
          </div>
          <button
            type="button"
            onClick={handleAction}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-semibold text-white shadow-sm transition-transform active:scale-[0.98]",
            )}
            style={{ backgroundColor: meta.color }}
          >
            <RecIcon className="h-5 w-5" strokeWidth={1.75} />
            {rec.action}
          </button>
        </div>
      </section>
    </div>
  )
}
