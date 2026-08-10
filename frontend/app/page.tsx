"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { Leaf, LayoutDashboard, LogOut, QrCode, Recycle, ScanLine } from "lucide-react"
import { AuthScreen } from "@/components/auth-screen"
import { useAuth } from "@/components/auth-provider"
import { ScanScreen } from "@/components/scan-screen"
import { AnalyzingScreen } from "@/components/analyzing-screen"
import { ResultScreen } from "@/components/result-screen"
import { Dashboard } from "@/components/dashboard"
import { TraceScreen } from "@/components/trace-screen"
import { RescueMarketplace } from "@/components/rescue-marketplace"
import { AiCopilot } from "@/components/ai-copilot"
import { ThemeToggle } from "@/components/theme-toggle"
import { ToastViewport, type ToastData } from "@/components/alert-toast"
import { getStatus, inventory, recentScans, type RecentScan } from "@/lib/freshness"
import { cn } from "@/lib/utils"
import { fetchCriticalAlerts } from "@/lib/api"

type View = "scan" | "analyzing" | "result" | "dashboard" | "trace" | "rescue"

const criticalBatches = inventory
  .filter((b) => getStatus(b.freshness) === "critical")
  .sort((a, b) => a.freshness - b.freshness)
const criticalCount = criticalBatches.length

const navItems: { id: Exclude<View, "analyzing" | "result">; label: string; icon: typeof ScanLine; badge?: number }[] = [
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: criticalCount },
  { id: "trace", label: "Trace", icon: QrCode },
  { id: "rescue", label: "Rescue", icon: Recycle },
]

export default function Page() {
  const { isHydrated, token, user, logout } = useAuth()
  const [view, setView] = useState<View>("scan")
  const [activeScan, setActiveScan] = useState<RecentScan>(recentScans[0])
  const [toasts, setToasts] = useState<ToastData[]>([])
  const toastId = useRef(0)
  const alertFired = useRef(false)
  const { data: alertData } = useSWR(token ? ["critical-alerts", token] : null, ([, authToken]) => fetchCriticalAlerts(authToken))

  const currentNav: View = view === "result" || view === "analyzing" ? "scan" : view

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback((title: string, message: string) => {
    toastId.current += 1
    const id = toastId.current
    setToasts((prev) => [...prev, { id, title, message }])
  }, [])

  useEffect(() => {
    if (!alertData || alertFired.current || alertData.critical_count <= 0) return
    alertFired.current = true
    const product = alertData.items?.[0]?.product_name ?? "A batch"
    pushToast("New critical alert", `${product} needs action — shelf-life is almost out.`)
  }, [alertData, pushToast])

  if (!isHydrated) return <div className="min-h-screen bg-background" />
  if (!token) return <AuthScreen />

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 bg-navbar text-navbar-foreground">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setView("scan")}
            className="flex items-center gap-2"
            aria-label="FreshGuard AI home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-navbar-foreground">
              <Leaf className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-navbar-foreground">
              FreshGuard <span className="text-navbar-foreground/60">AI</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = currentNav === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-navbar-foreground"
                      : "text-navbar-foreground/70 hover:bg-white/10 hover:text-navbar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                  {(item.id === "dashboard" ? alertData?.critical_count ?? item.badge : item.badge) ? (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
                        "bg-destructive text-white",
                      )}
                    >
                      {item.id === "dashboard" ? alertData?.critical_count ?? item.badge : item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="border-white/20 bg-white/10 text-navbar-foreground hover:bg-white/20" />
            <span className="hidden max-w-28 truncate text-sm text-navbar-foreground/80 sm:inline" title={user?.email}>
              {user?.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs font-medium text-navbar-foreground transition hover:bg-white/20"
              aria-label="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 md:pb-0">
        {view === "scan" && (
          <ScanScreen
            token={token}
            onScan={(scan) => {
              setActiveScan(scan)
              setView(scan.shelfLifeDays !== undefined ? "result" : "analyzing")
            }}
          />
        )}
        {view === "analyzing" && <AnalyzingScreen scan={activeScan} onDone={() => setView("result")} />}
        {view === "result" && (
          <ResultScreen scan={activeScan} onBack={() => setView("scan")} onRescue={() => setView("rescue")} />
        )}
        {view === "dashboard" && (
          <Dashboard
            token={token}
            onSimulateAlert={() =>
              pushToast(
                "New critical alert",
                criticalBatches.length > 0
                  ? `${criticalBatches[criticalBatches.length - 1].name} just dropped below the freshness threshold.`
                  : "A batch just dropped below the freshness threshold.",
              )
            }
          />
        )}
        {view === "trace" && <TraceScreen />}
        {view === "rescue" && <RescueMarketplace token={token} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = currentNav === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {(item.id === "dashboard" ? alertData?.critical_count ?? item.badge : item.badge) ? (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-white">
                      {item.id === "dashboard" ? alertData?.critical_count ?? item.badge : item.badge}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <AiCopilot />
    </div>
  )
}
