import { getStatus, statusMeta } from "@/lib/freshness"
import { cn } from "@/lib/utils"

type FreshnessRingProps = {
  value: number
  size?: number
  strokeWidth?: number
  showValue?: boolean
  label?: string
  className?: string
}

export function FreshnessRing({
  value,
  size = 64,
  strokeWidth,
  showValue = true,
  label,
  className,
}: FreshnessRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const status = getStatus(clamped)
  const color = statusMeta[status].ring
  const sw = strokeWidth ?? Math.max(4, Math.round(size * 0.09))
  const radius = (size - sw) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (clamped / 100) * circumference

  const valueFontSize = size * 0.28
  const labelFontSize = size * 0.13

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Freshness ${Math.round(clamped)} percent, ${statusMeta[status].label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          style={{ transition: "stroke-dashoffset 700ms ease, stroke 400ms ease" }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold leading-none tabular-nums"
            style={{ fontSize: valueFontSize, color }}
          >
            {Math.round(clamped)}
          </span>
          {label && (
            <span
              className="mt-0.5 leading-none text-muted-foreground"
              style={{ fontSize: labelFontSize }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
