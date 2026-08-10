import { getStatus, statusMeta } from "@/lib/freshness"
import { cn } from "@/lib/utils"

export function StatusBadge({ value, className }: { value: number; className?: string }) {
  const status = getStatus(value)
  const meta = statusMeta[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.bg,
        meta.text,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}
