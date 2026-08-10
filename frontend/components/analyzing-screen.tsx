"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Sparkles } from "lucide-react"
import { FreshnessRing } from "@/components/freshness-ring"
import type { RecentScan } from "@/lib/freshness"

const phases = ["Analyzing image...", "Detecting freshness...", "Scoring quality..."]

export function AnalyzingScreen({ scan, onDone }: { scan: RecentScan; onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Build the ring up from 0 toward the true freshness value.
    const start = performance.now()
    const duration = 1700
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * scan.freshness))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const p1 = setTimeout(() => setPhase(1), 650)
    const p2 = setTimeout(() => setPhase(2), 1250)
    const done = setTimeout(onDone, 1900)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(p1)
      clearTimeout(p2)
      clearTimeout(done)
    }
  }, [scan.freshness, onDone])

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-8 px-5 py-10">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4 animate-pulse" strokeWidth={1.75} />
        AI Freshness Scanner
      </div>

      <div className="relative flex items-center justify-center">
        <span className="absolute h-56 w-56 animate-ping rounded-full bg-primary/10" />
        <span className="absolute h-44 w-44 rounded-full bg-primary/5" />
        <div className="relative animate-pulse">
          <FreshnessRing value={progress} size={176} strokeWidth={14} label="freshness" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border">
          <Image
            src={scan.image || "/placeholder.svg"}
            alt={scan.name || "Produce"}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized={scan.image?.startsWith("blob:")}
          />
        </div>
        <p key={phase} className="animate-in fade-in text-base font-medium text-foreground">
          {phases[phase]}
        </p>
        <p className="text-sm text-muted-foreground">{scan.name}</p>
      </div>
    </div>
  )
}
