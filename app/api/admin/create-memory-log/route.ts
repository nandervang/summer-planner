import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { ADMIN_CONFIG } from "@/lib/config"

// Global memory storage that persists between requests (until server restart)
const memoryLogs: Array<{
  id: string
  userId: string
  username: string
  email: string
  timestamp: string
  plannedDaysCount?: number
}> = []

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const session = await getSession()

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is authorized admin
    if (!ADMIN_CONFIG.authorizedAdmins.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create a test log entry directly in memory
    const logEntry = {
      id: `memory_log_${Date.now()}`,
      userId: session.user.id,
      username: session.user.name || "Test User",
      email: session.user.email,
      timestamp: new Date().toISOString(),
      plannedDaysCount: Math.floor(Math.random() * 20) + 1, // Random number for testing (1-20)
    }

    // Add to memory logs
    memoryLogs.unshift(logEntry)
    if (memoryLogs.length > 100) {
      memoryLogs.length = 100
    }

    console.log(`Created memory log: ${logEntry.id} for user ${logEntry.username}`)
    console.log(`Total memory logs: ${memoryLogs.length}`)

    return NextResponse.json({
      success: true,
      message: "Memory test log entry created",
      log: logEntry,
    })
  } catch (error) {
    console.error("Error creating memory test log:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    logs: memoryLogs,
    count: memoryLogs.length,
  })
}

