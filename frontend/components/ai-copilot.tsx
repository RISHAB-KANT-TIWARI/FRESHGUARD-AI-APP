"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "assistant"; text: string }

const suggestions = [
  "When should I sell these tomatoes?",
  "Which batch is most at risk?",
  "How do I cut spinach waste?",
]

export function AiCopilot() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Hi! I'm your FreshGuard AI copilot. Ask me about any batch and I'll suggest the smartest move." },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setMessages((m) => [...m, { role: "user", text: trimmed }])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/copilot/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: trimmed }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok || typeof body?.answer !== "string") throw new Error("Copilot request failed")
      setMessages((m) => [...m, { role: "assistant", text: body.answer }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't process that right now. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close copilot" : "Open AI copilot"}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
      >
        {open ? <X className="h-6 w-6" strokeWidth={1.75} /> : <MessageCircle className="h-6 w-6" strokeWidth={1.75} />}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-50 flex h-[30rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:bottom-24 md:right-6">
          <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">FreshGuard AI Copilot</span>
              <span className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" strokeWidth={2} /> AI assistant
              </span>
            </div>
          </header>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
            ))}

            {isLoading && (
              <div className="flex max-w-[85%] items-center gap-2 self-start rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Typing...</span>
              </div>
            )}

            {messages.length <= 1 && !isLoading && (
              <div className="mt-2 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about a batch..."
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
