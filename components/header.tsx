"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface HeaderProps {
  user: {
    id: string
    name?: string | null
    image?: string | null
  } | null
  isDev?: boolean
}

export function Header({ user, isDev = false }: HeaderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    if (isDev) {
      // In development, just refresh the page
      router.refresh()
      return
    }

    setIsLoading(true)
    try {
      // In production, use a simple sign out
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      })

      if (response.ok) {
        router.push("/login")
      } else {
        console.error("Failed to sign out")
      }
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="bg-white border-b py-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span className="font-bold text-lg">Vacation Planner</span>
        {isDev && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Dev Mode</span>}
      </div>

      <div>
        {isLoading ? (
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              Hi, <span className="font-semibold">{user.name}</span>
            </div>
            {user.image && (
              <img src={user.image || "/placeholder.svg"} alt={user.name || "User"} className="w-8 h-8 rounded-full" />
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              {isDev ? "Refresh" : "Sign out"}
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  )
}

