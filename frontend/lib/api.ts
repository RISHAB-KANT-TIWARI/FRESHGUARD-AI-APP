import type { RecentScan } from "@/lib/freshness"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type ScanResult = RecentScan & {
  product_name: string
  shelf_life_days: number
  defects: string | string[]
  recommendation: string
  reasoning: string[]
  created_at: string
}

export type DashboardSummary = {
  total_scans: number
  critical_count: number
  waste_saved_kg: number
  avg_freshness_score: number
  trend: { day: string; kg: number }[]
  inventory?: any[]
}

export type CriticalAlerts = {
  critical_count: number
  items?: { product_name: string; [key: string]: unknown }[]
}

function apiUrl(path: string) {
  if (!API_URL) throw new Error("API URL is not configured")
  return `${API_URL.replace(/\/$/, "")}${path}`
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  })
  if (!response.ok) throw new Error("Request failed")
  return response.json()
}

export async function fetchScanHistory(token: string): Promise<RecentScan[]> {
  const scans = await request<ScanResult[]>("/scan/history", token)
  return scans.map(scanToRecentScan)
}

export function analyzeScan(file: File, token: string) {
  const body = new FormData()
  body.append("file", file)
  return request<ScanResult>("/scan/analyze", token, { method: "POST", body })
}

export function fetchDashboard(token: string) {
  return request<DashboardSummary>("/dashboard/summary", token)
}

export type RescueMatch = {
  id: string
  name: string
  image?: string
  freshness: number
  daysLeft: number
  discount: number
  matched_buyers?: { name: string; type: string; distance: string }[]
  variety?: string
  quantity?: string | number
}

function rescueDiscount(freshness: number) {
  if (freshness >= 70) return 0
  if (freshness >= 40) return Math.round((70 - freshness) / 5) * 5
  return 50
}

function rescueMatchToItem(item: {
  id: string
  product_name: string
  freshness_score: number
  shelf_life_days: number
  matched_buyers?: RescueMatch["matched_buyers"]
  variety?: string
  quantity?: string | number
}): RescueMatch {
  return {
    id: item.id,
    name: item.product_name,
    image: undefined,
    freshness: item.freshness_score,
    daysLeft: item.shelf_life_days,
    discount: rescueDiscount(item.freshness_score),
    matched_buyers: item.matched_buyers,
    variety: item.variety,
    quantity: item.quantity,
  }
}

export async function fetchRescueMatches(token: string): Promise<RescueMatch[]> {
  const matches = await request<Parameters<typeof rescueMatchToItem>[0][]>("/rescue/matches", token)
  return matches.map(rescueMatchToItem)
}

export function fetchCriticalAlerts(token: string) {
  return request<CriticalAlerts>("/alerts/critical", token)
}

export function scanToRecentScan(scan: ScanResult): RecentScan {
  return {
    id: scan.id,
    name: scan.product_name,
    image: scan.image,
    freshness: scan.freshness_score,
    time: scan.created_at ? new Date(scan.created_at).toLocaleString() : "Just now",
    shelfLifeDays: scan.shelf_life_days,
    defects: Array.isArray(scan.defects)
      ? scan.defects
      : scan.defects
          .split(", ")
          .map((defect) => defect.trim())
          .filter(Boolean),
    recommendation: scan.recommendation,
    reasoning: scan.reasoning,
    createdAt: scan.created_at,
  }
}

export function scanToResult(scan: ScanResult): RecentScan {
  return scanToRecentScan(scan)
}
