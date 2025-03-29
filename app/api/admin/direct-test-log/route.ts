import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { ADMIN_CONFIG } from "@/lib/config"

// Global memory storage for direct test logs
const directTestLogs: Array<{
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

    // Create a direct test log entry
    const logEntry = {
      id: `direct_test_log_${Date.now()}`,
      userId: session.user.id,
      username: session.user.name || "Direct Test User",
      email: session.user.email,
      timestamp: new Date().toISOString(),
      plannedDaysCount: Math.floor(Math.random() * 20) + 1, // Random number for testing (1-20)
    }

    // Add to direct test logs
    directTestLogs.unshift(logEntry)
    if (directTestLogs.length > 100) {
      directTestLogs.length = 100
    }

    console.log(`Created direct test log: ${logEntry.id} for user ${logEntry.username}`)

    return NextResponse.json({
      success: true,
      message: "Direct test log entry created",
      log: logEntry,
    })
  } catch (error) {
    console.error("Error creating direct test log:", error)
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
    logs: directTestLogs,
    count: directTestLogs.length,
  })
}

