"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"

export function MemoryLogsTable() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMemoryLogs() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/create-memory-log")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()

        if (Array.isArray(data.logs) && data.logs.length > 0) {
          // Sort by timestamp (newest first)
          const sortedLogs = [...data.logs].sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          })

          setLogs(sortedLogs)
        }
      } catch (err) {
        console.error("Error fetching memory logs:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMemoryLogs()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Checking for memory-only logs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Error fetching memory logs: {error}</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return null // Don't show anything if no memory logs found
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-md font-medium mb-2">Memory-Only Logs</h3>
      <p className="text-sm text-gray-500 mb-4">
        These logs are stored in memory and will be lost when the server restarts.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Planned Days
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{new Date(log.timestamp).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{log.username}</div>
                  <div className="text-xs text-gray-500">ID: {log.userId.substring(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">
                    {log.plannedDaysCount !== undefined ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {log.plannedDaysCount} days
                      </span>
                    ) : (
                      <span className="text-gray-400">Not available</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

