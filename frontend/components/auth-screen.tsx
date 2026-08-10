"use client"

import { useState } from "react"
import { Leaf, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignup = mode === "signup"
  const switchMode = () => {
    setMode(isSignup ? "login" : "signup")
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (isSignup) await signup(name, email, password)
      else await login(email, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">FreshGuard AI</h1>
            <p className="mt-1 text-sm text-muted-foreground">AI-powered fresh produce management</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
          {(["login", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setMode(item); setError(null) }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {item === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="grid gap-2 text-sm font-medium">
              Name
              <input className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" />
            </label>
          )}
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Password
            <input className="h-11 rounded-xl border border-input bg-background px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} />
          </label>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? (isSignup ? "Signing up..." : "Logging in...") : (isSignup ? "Sign up" : "Log in")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-primary hover:underline">
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </section>
    </main>
  )
}
