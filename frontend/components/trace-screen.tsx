"use client"

import Image from "next/image"
import {
  Boxes,
  Building2,
  Check,
  MapPin,
  Snowflake,
  Sprout,
  Store,
  Tractor,
  Truck,
  User,
  Warehouse,
  type LucideIcon,
} from "lucide-react"
import { traceBatch } from "@/lib/freshness"
import { cn } from "@/lib/utils"

const stageIcons: Record<string, LucideIcon> = {
  farm: Sprout,
  aggregator: Tractor,
  packhouse: Boxes,
  mandi: Building2,
  warehouse: Warehouse,
  coldchain: Snowflake,
  retailer: Store,
  consumer: User,
}

function QrPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20 shrink-0 rounded-xl border border-border bg-card p-2 text-foreground"
      role="img"
      aria-label="Batch QR code"
    >
      {/* corner markers */}
      {[
        [8, 8],
        [64, 8],
        [8, 64],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="28" height="28" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x={x + 10} y={y + 10} width="8" height="8" rx="1" fill="currentColor" />
        </g>
      ))}
      {/* scattered data modules */}
      {[
        [50, 12],
        [58, 20],
        [50, 28],
        [66, 36],
        [50, 44],
        [12, 50],
        [20, 58],
        [28, 50],
        [44, 52],
        [52, 60],
        [60, 52],
        [68, 60],
        [52, 68],
        [60, 76],
        [68, 84],
        [84, 52],
        [84, 68],
        [76, 44],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" rx="1" fill="currentColor" />
      ))}
    </svg>
  )
}

export function TraceScreen() {
  const { stages, currentStage } = traceBatch

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-pretty text-2xl font-semibold tracking-tight lg:text-3xl">Batch traceability</h1>
        <p className="text-sm text-muted-foreground">Scan a batch QR to follow its journey across the supply chain.</p>
      </header>

      {/* Batch identity card */}
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <QrPlaceholder />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
            <Image src={traceBatch.image || "/placeholder.svg"} alt={traceBatch.product} fill className="object-cover" sizes="56px" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="inline-flex w-fit items-center rounded-full bg-secondary px-2 py-0.5 font-mono text-xs font-medium text-secondary-foreground">
              {traceBatch.batchId}
            </span>
            <span className="mt-1 truncate text-lg font-semibold tracking-tight">{traceBatch.product}</span>
            <span className="truncate text-xs text-muted-foreground">{traceBatch.variety}</span>
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Supply chain journey</h2>
          <span className="text-xs text-muted-foreground">
            {currentStage + 1} of {stages.length} stages
          </span>
        </div>

        <ol className="flex flex-col">
          {stages.map((stage, i) => {
            const Icon = stageIcons[stage.key] ?? Truck
            const isDone = i < currentStage
            const isCurrent = i === currentStage
            const isLast = i === stages.length - 1
            const state = isDone ? "done" : isCurrent ? "current" : "future"

            return (
              <li key={stage.key} className="flex gap-4">
                {/* Icon + connector rail */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      state === "done" && "border-primary bg-primary text-primary-foreground",
                      state === "current" && "border-primary bg-accent text-primary",
                      state === "future" && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
                    {isDone ? (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="relative h-5 w-5" strokeWidth={1.75} />
                    )}
                  </span>
                  {!isLast && (
                    <span
                      className={cn("my-1 w-0.5 flex-1", i < currentStage ? "bg-primary" : "bg-border")}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>

                {/* Stage details */}
                <div className={cn("flex flex-col pb-6", isLast && "pb-0")}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        state === "future" ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">
                        In transit
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-xs",
                      state === "future" ? "text-muted-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <MapPin className="h-3 w-3" strokeWidth={1.75} />
                    {stage.location}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 font-mono text-[11px] tabular-nums",
                      state === "future" ? "text-muted-foreground/60" : "text-muted-foreground",
                    )}
                  >
                    {stage.timestamp}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
