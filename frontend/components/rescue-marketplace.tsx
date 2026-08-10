"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Check, Handshake, MapPin, Recycle } from "lucide-react"
import { FreshnessRing } from "@/components/freshness-ring"
import { rescueItems } from "@/lib/freshness"
import { fetchRescueMatches } from "@/lib/api"
import { cn } from "@/lib/utils"

export function RescueMarketplace({ token }: { token: string }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({})
  const { data, error, isLoading } = useSWR(token ? ["rescue-matches", token] : null, ([, authToken]) => fetchRescueMatches(authToken))
  const items = data?.length ? data : rescueItems

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Recycle className="h-4 w-4" strokeWidth={1.75} />
          Rescue marketplace
        </div>
        <h1 className="text-pretty text-2xl font-semibold tracking-tight lg:text-3xl">Near-expiry produce</h1>
        <p className="text-sm text-muted-foreground">
          Discounted batches matched with nearby NGOs and bulk buyers to keep good food out of the bin.
        </p>
      </header>

      {isLoading ? <div className="h-48 animate-pulse rounded-2xl bg-muted" /> : null}
      {error ? <p className="text-sm text-destructive">Couldn't load data, please try again</p> : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const key = item.id
          return (
            <article key={key} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                <Image src={item.image || "/placeholder.svg"} alt={item.name || "Produce"} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  -{item.discount}%
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-card/90 p-1.5 shadow-sm backdrop-blur">
                  <FreshnessRing value={item.freshness} size={40} />
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <h2 className="text-base font-semibold">{item.name}</h2>
                    <span className="text-xs text-muted-foreground">{item.variety}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <p className="text-xs text-muted-foreground">
                      {item.daysLeft} day{item.daysLeft > 1 ? "s" : ""} left
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matched buyers</span>
                  {(item.matched_buyers ?? item.buyers ?? []).map((b: any) => (
                    <div key={b.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                            b.type === "NGO" ? "bg-accent text-primary" : "bg-secondary text-secondary-foreground",
                          )}
                        >
                          {b.type}
                        </span>
                        <span className="font-medium text-foreground">{b.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" strokeWidth={1.75} />
                        {b.distance}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setConnected((c) => ({ ...c, [key]: !c[key] }))}
                  className={cn(
                    "mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    connected[key]
                      ? "bg-accent text-primary"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {connected[key] ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2} />
                      Request sent
                    </>
                  ) : (
                    <>
                      <Handshake className="h-4 w-4" strokeWidth={1.75} />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
