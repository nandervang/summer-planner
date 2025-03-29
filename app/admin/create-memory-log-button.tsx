"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function CreateMemoryLogButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    log?: any
  } | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/create-memory-log", {
        method: "POST",
      })

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

      // Refresh the page after a short delay to show the new log
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isLoading} variant="outline">
        {isLoading ? "Creating..." : "Create Memory-Only Log"}
      </Button>

      {result && (
        <div
          className={`text-sm p-2 rounded ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {result.success ? (
            <>
              {result.message || "Success!"}
              {result.log && (
                <div className="mt-1 text-xs">
                  Created log for: {result.log.username} ({result.log.email})
                </div>
              )}
            </>
          ) : (
            result.error || "Failed to create memory log."
          )}
        </div>
      )}
    </div>
  )
}

