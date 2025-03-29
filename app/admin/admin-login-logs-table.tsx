"use client"

import { useState, useEffect } from "react"
import { deleteLog } from "../actions/delete-log"
import { formatDate } from "@/lib/utils"

interface Log {
  timestamp: string
  username: string
  email?: string
  success: boolean
  source: string
  plannedDaysCount?: number
}

export default function AdminLoginLogsTable({ initialLogs = [] }: { initialLogs: Log[] }) {
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

  const handleDelete = async (timestamp: string, source: string) => {
    setIsDeleting(timestamp)
    try {
      const result = await deleteLog(timestamp, source)

      if (result.success) {
        setLogs(logs.filter((log) => log.timestamp !== timestamp))
        setMessage({ text: result.message, type: "success" })
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      setMessage({ text: "Error deleting log", type: "error" })
    } finally {
      setIsDeleting(null)

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    }
  }

  const refreshLogs = async () => {
    try {
      const response = await fetch("/api/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
        setMessage({ text: "Logs refreshed", type: "success" })
      } else {
        setMessage({ text: "Failed to refresh logs", type: "error" })
      }
    } catch (error) {
      setMessage({ text: "Error refreshing logs", type: "error" })
    }
  }

  return (
    <div>
      {message && (
        <div
          className={`p-2 mb-4 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <button onClick={refreshLogs} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Logs
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Timestamp</th>
              <th className="py-2 px-4 border-b text-left">Username</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Vacation Days</th>
              <th className="py-2 px-4 border-b text-left">Source</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="py-2 px-4 border-b">{formatDate(log.timestamp)}</td>
                  <td className="py-2 px-4 border-b">{log.username}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={log.success ? "text-green-600" : "text-red-600"}>
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {log.plannedDaysCount !== undefined ? log.plannedDaysCount : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={
                        log.source === "database"
                          ? "text-blue-600"
                          : log.source === "redis"
                            ? "text-purple-600"
                            : "text-orange-600"
                      }
                    >
                      {log.source}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => handleDelete(log.timestamp, log.source)}
                      disabled={isDeleting === log.timestamp}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete log"
                    >
                      {isDeleting === log.timestamp ? <span className="text-gray-400">...</span> : <span>❌</span>}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && <div className="mt-4 text-sm text-gray-500">Total logs: {logs.length}</div>}
    </div>
  )
}

