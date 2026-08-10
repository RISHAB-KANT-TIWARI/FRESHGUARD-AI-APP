"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type AuthUser = { name: string; email: string }
type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = "freshguard_ai_token"
const USER_KEY = "freshguard_ai_user"
const AuthContext = createContext<AuthContextValue | null>(null)

function apiUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`
}

async function request(path: string, payload: Record<string, string>) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.detail ?? body?.message ?? (response.status === 409 ? "Email already registered" : "Invalid credentials"))
  }
  if (!body?.access_token) throw new Error("Authentication failed. Please try again.")
  return body as { access_token: string; token_type?: string }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY)
    const storedUser = window.localStorage.getItem(USER_KEY)
    setToken(storedToken)
    setUser(storedUser ? JSON.parse(storedUser) : null)
    setIsHydrated(true)
  }, [])

  const saveSession = (accessToken: string, nextUser: AuthUser) => {
    setToken(accessToken)
    setUser(nextUser)
    window.localStorage.setItem(TOKEN_KEY, accessToken)
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isHydrated,
    async login(email, password) {
      const result = await request("/auth/login", { email, password })
      saveSession(result.access_token, { name: email.split("@")[0], email })
    },
    async signup(name, email, password) {
      const result = await request("/auth/signup", { name, email, password })
      saveSession(result.access_token, { name, email })
    },
    logout() {
      setToken(null)
      setUser(null)
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
    },
  }), [isHydrated, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
