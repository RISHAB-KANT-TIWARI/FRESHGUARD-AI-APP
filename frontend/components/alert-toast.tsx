"use client"

import { useEffect } from "react"
import { TriangleAlert, X } from "lucide-react"

export type ToastData = {
  id: number
  title: string
  message: string
}

export function AlertToast({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      role="status"
      className="animate-in slide-in-from-right-4 fade-in pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--danger)_16%,transparent)]">
        <TriangleAlert className="h-5 w-5 text-destructive" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">{toast.title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{toast.message}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2.5">
      {toasts.map((t) => (
        <AlertToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
