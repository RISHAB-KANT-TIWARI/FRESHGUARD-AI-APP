export type FreshnessStatus = "fresh" | "at-risk" | "critical"

export function getStatus(value: number): FreshnessStatus {
  if (value >= 66) return "fresh"
  if (value >= 33) return "at-risk"
  return "critical"
}

export const statusMeta: Record<
  FreshnessStatus,
  { label: string; color: string; bg: string; text: string; ring: string }
> = {
  fresh: {
    label: "Fresh",
    color: "var(--fresh)",
    bg: "bg-accent",
    text: "text-primary",
    ring: "var(--fresh)",
  },
  "at-risk": {
    label: "At Risk",
    color: "var(--warning)",
    bg: "bg-[#fef3e2]",
    text: "text-[#b45309]",
    ring: "var(--warning)",
  },
  critical: {
    label: "Critical",
    color: "var(--danger)",
    bg: "bg-[#fdecec]",
    text: "text-destructive",
    ring: "var(--danger)",
  },
}

export type Batch = {
  id: string
  name: string
  variety: string
  image: string
  freshness: number
  quantity: string
  daysLeft: number
  value: string
}

export const inventory: Batch[] = [
  {
    id: "B-1042",
    name: "Tomatoes",
    variety: "Roma, Grade A",
    image: "/produce/tomatoes.png",
    freshness: 82,
    quantity: "240 kg",
    daysLeft: 6,
    value: "₹9,600",
  },
  {
    id: "B-1038",
    name: "Spinach",
    variety: "Desi Palak",
    image: "/produce/spinach.png",
    freshness: 28,
    quantity: "60 kg",
    daysLeft: 1,
    value: "₹2,400",
  },
  {
    id: "B-1035",
    name: "Alphonso Mangoes",
    variety: "Ratnagiri",
    image: "/produce/mangoes.png",
    freshness: 54,
    quantity: "120 kg",
    daysLeft: 3,
    value: "₹18,000",
  },
  {
    id: "B-1029",
    name: "Bananas",
    variety: "Robusta",
    image: "/produce/bananas.png",
    freshness: 41,
    quantity: "180 kg",
    daysLeft: 2,
    value: "₹5,400",
  },
  {
    id: "B-1021",
    name: "Capsicum",
    variety: "Mixed Bell",
    image: "/produce/capsicum.png",
    freshness: 74,
    quantity: "90 kg",
    daysLeft: 5,
    value: "₹6,300",
  },
  {
    id: "B-1018",
    name: "Strawberries",
    variety: "Winter Dawn",
    image: "/produce/strawberries.png",
    freshness: 22,
    quantity: "35 kg",
    daysLeft: 1,
    value: "₹8,750",
  },
]

export type RescueItem = Batch & {
  discount: number
  buyers: { name: string; type: string; distance: string }[]
}

export const rescueItems: RescueItem[] = [
  {
    ...inventory[1],
    discount: 40,
    buyers: [
      { name: "Annapurna Kitchen", type: "NGO", distance: "2.1 km" },
      { name: "GreenLeaf Juices", type: "Buyer", distance: "4.6 km" },
    ],
  },
  {
    ...inventory[3],
    discount: 30,
    buyers: [
      { name: "Seva Foundation", type: "NGO", distance: "1.4 km" },
      { name: "City Bakehouse", type: "Buyer", distance: "3.2 km" },
    ],
  },
  {
    ...inventory[5],
    discount: 50,
    buyers: [
      { name: "SmoothieBar Co.", type: "Buyer", distance: "0.9 km" },
      { name: "Hope Shelter", type: "NGO", distance: "5.5 km" },
    ],
  },
  {
    ...inventory[2],
    discount: 25,
    buyers: [
      { name: "Mango Masala Foods", type: "Buyer", distance: "6.0 km" },
      { name: "Akshaya Trust", type: "NGO", distance: "3.8 km" },
    ],
  },
]

export const wasteTrend: { day: string; kg: number }[] = [
  { day: "Mon", kg: 92 },
  { day: "Tue", kg: 118 },
  { day: "Wed", kg: 104 },
  { day: "Thu", kg: 156 },
  { day: "Fri", kg: 142 },
  { day: "Sat", kg: 188 },
  { day: "Sun", kg: 214 },
]

export type TraceStage = {
  key: string
  label: string
  location: string
  timestamp: string
}

// A single batch's cold-chain journey from farm to consumer.
export const traceBatch = {
  batchId: "B-1035",
  product: "Alphonso Mangoes",
  variety: "Ratnagiri, Grade A",
  image: "/produce/mangoes.png",
  // index of the stage currently in progress (0-based)
  currentStage: 5,
  stages: [
    { key: "farm", label: "Farm", location: "Devgad Orchards, Ratnagiri", timestamp: "May 12, 06:10" },
    { key: "aggregator", label: "Aggregator", location: "Konkan Growers Co-op", timestamp: "May 12, 11:40" },
    { key: "packhouse", label: "Pack House", location: "Ratnagiri Pack Unit 3", timestamp: "May 12, 16:25" },
    { key: "mandi", label: "Mandi", location: "Vashi APMC, Navi Mumbai", timestamp: "May 13, 04:50" },
    { key: "warehouse", label: "Warehouse", location: "FreshOS Hub, Bhiwandi", timestamp: "May 13, 09:15" },
    { key: "coldchain", label: "Cold Chain", location: "Reefer Transit · 8°C", timestamp: "May 13, 13:30" },
    { key: "retailer", label: "Retailer", location: "Awaiting delivery", timestamp: "Est. May 14, 08:00" },
    { key: "consumer", label: "Consumer", location: "Not yet delivered", timestamp: "—" },
  ] as TraceStage[],
}

export type RecentScan = {
  id: string
  name: string
  image: string
  freshness: number
  time: string
  shelfLifeDays?: number
  defects?: string[]
  recommendation?: string
  reasoning?: string[]
  createdAt?: string
}

export const recentScans: RecentScan[] = [
  { id: "s1", name: "Tomatoes", image: "/produce/tomatoes.png", freshness: 82, time: "2 min ago" },
  { id: "s2", name: "Spinach", image: "/produce/spinach.png", freshness: 28, time: "18 min ago" },
  { id: "s3", name: "Capsicum", image: "/produce/capsicum.png", freshness: 74, time: "1 hr ago" },
  { id: "s4", name: "Bananas", image: "/produce/bananas.png", freshness: 41, time: "3 hr ago" },
]
