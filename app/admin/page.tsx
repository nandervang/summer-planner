import { getAllLoginLogs } from "@/lib/auth-logging"
import { Suspense } from "react"
import AdminLoginLogsTable from "./admin-login-logs-table"
import TestLogButtons from "./test-log-buttons"
import RedisStatus from "./redis-status"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  let logs = []

  try {
    logs = await getAllLoginLogs()
  } catch (error) {
    console.error("Error fetching logs:", error)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Redis Status</h2>
          <Suspense fallback={<div>Checking Redis status...</div>}>
            <RedisStatus />
          </Suspense>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Test Functions</h2>
          <TestLogButtons />
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login Logs</h2>
        <p className="mb-4">
          <a href="/api/setup-db" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">
            Setup Database Tables
          </a>{" "}
          (Run this first to ensure the login_logs table exists)
        </p>
        <AdminLoginLogsTable initialLogs={logs} />
      </div>
    </div>
  )
}

