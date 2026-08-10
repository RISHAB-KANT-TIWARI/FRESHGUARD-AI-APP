"use client"

import { useCallback, useState, useRef } from "react"
import Image from "next/image"
import { Camera, ChevronRight, ImageIcon, Loader2, Sparkles } from "lucide-react"
import { FreshnessRing } from "@/components/freshness-ring"
import { fetchScanHistory, analyzeScan, scanToRecentScan } from "@/lib/api"
import type { RecentScan } from "@/lib/freshness"
import useSWR from "swr"

export function ScanScreen({ token, onScan }: { token: string; onScan: (scan: RecentScan, file?: File) => void }) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { data: recentScans = [], error: historyError, isLoading: historyLoading } = useSWR(
    token ? ["scan-history", token] : null,
    ([, authToken]) => fetchScanHistory(authToken),
  )

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const preview = URL.createObjectURL(file)
    onScan({ id: `upload-${Date.now()}`, name: "Uploaded produce", image: preview, freshness: 0, time: "Just now" }, file)
    try {
      const result = await analyzeScan(file, token)
      onScan(scanToRecentScan(result), file)
    } catch {
      setUploadError("Couldn't analyze image, please try again")
    } finally {
      setUploading(false)
    }
  }, [onScan, token])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 pb-28 pt-6">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          AI Freshness Scanner
        </div>
        <h1 className="text-pretty text-2xl font-semibold tracking-tight">Scan produce</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Point your camera at a batch to instantly grade its freshness and get a selling recommendation.
        </p>
      </header>

      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-sm transition-colors hover:bg-muted/50"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-active:scale-95">
          <Camera className="h-9 w-9" strokeWidth={1.75} />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-base font-semibold text-foreground">Capture or upload</span>
          <span className="text-sm text-muted-foreground">JPG, PNG or live camera</span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            galleryInputRef.current?.click()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              galleryInputRef.current?.click()
            }
          }}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
          Choose from gallery
        </span>
      </button>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent scans</h2>
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
        {uploading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" aria-label="Analyzing" /> : null}
        {uploadError || historyError ? <p className="text-sm text-destructive">{uploadError || "Couldn't load data, please try again"}</p> : null}
        {historyLoading ? <div className="h-16 animate-pulse rounded-2xl bg-muted" /> : null}
        <ul className="flex flex-col gap-2.5">
          {recentScans.map((scan) => (
            <li key={scan.id}>
              <button
                type="button"
                onClick={() => onScan(scan)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={scan.image || "/placeholder.svg"} alt={scan.name || "Produce"} fill className="object-cover" sizes="48px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{scan.name}</span>
                  <span className="text-xs text-muted-foreground">{scan.time}</span>
                </div>
                <FreshnessRing value={scan.freshness} size={40} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
