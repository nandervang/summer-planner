"use client"

import { useState, useEffect } from "react"

export default function RedisStatus() {
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkRedis = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First check if Redis is configured
        const configResponse = await fetch("/api/test-redis-config")
        const configData = await configResponse.json()
        setConfigStatus(configData)

        // Only check connection if configuration is successful
        if (configData.success) {
          const connectionResponse = await fetch("/api/test-redis")
          const connectionData = await connectionResponse.json()
          setConnectionStatus(connectionData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error checking Redis status")
      } finally {
        setIsLoading(false)
      }
    }

    checkRedis()
  }, [])

  if (isLoading) {
    return <div className="animate-pulse">Checking Redis status...</div>
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Configuration Status:</h3>
        <div className={configStatus?.success ? "text-green-600" : "text-red-600"}>
          {configStatus?.message || "Unknown"}
        </div>
      </div>

      {configStatus?.success && connectionStatus && (
        <div>
          <h3 className="font-medium">Connection Status:</h3>
          <div className={connectionStatus?.success ? "text-green-600" : "text-red-600"}>
            {connectionStatus?.message || "Unknown"}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Refresh Status
        </button>
      </div>
    </div>
  )
}

