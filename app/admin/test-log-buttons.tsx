"use client"

import { useState } from "react"

export default function TestLogButtons() {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    standard: false,
    direct: false,
    db: false,
  })
  const [results, setResults] = useState<{ [key: string]: any }>({})

  const createTestLog = async (source = "standard") => {
    setIsLoading({ ...isLoading, [source]: true })
    setResults({ ...results, [source]: null })

    try {
      const endpoint =
        source === "direct" ? "/api/test-memory-log" : source === "db" ? "/api/test-db-log" : "/api/test-log"

      const response = await fetch(endpoint)
      const data = await response.json()

      setResults({ ...results, [source]: data })

      // Refresh the page after a successful log creation
      if (data.success) {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      setResults({
        ...results,
        [source]: {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      })
    } finally {
      setIsLoading({ ...isLoading, [source]: false })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <button
          onClick={() => createTestLog("standard")}
          disabled={isLoading.standard}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 mr-2"
        >
          {isLoading.standard ? "Creating..." : "Create Test Log Entry"}
        </button>
        {results.standard && (
          <span className={results.standard.success ? "text-green-600" : "text-red-600"}>
            {results.standard.message}
          </span>
        )}
      </div>

      <div>
        <button
          onClick={() => createTestLog("direct")}
          disabled={isLoading.direct}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-orange-300 mr-2"
        >
          {isLoading.direct ? "Creating..." : "Create Direct Memory Log"}
        </button>
        {results.direct && (
          <span className={results.direct.success ? "text-green-600" : "text-red-600"}>{results.direct.message}</span>
        )}
      </div>

      <div>
        <button
          onClick={() => createTestLog("db")}
          disabled={isLoading.db}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 mr-2"
        >
          {isLoading.db ? "Creating..." : "Create Database Test Log"}
        </button>
        {results.db && (
          <span className={results.db.success ? "text-green-600" : "text-red-600"}>{results.db.message}</span>
        )}
      </div>
    </div>
  )
}

