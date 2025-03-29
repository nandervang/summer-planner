import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { logUserLogin } from "@/lib/auth-logging"
import { ADMIN_CONFIG } from "@/lib/config"
import Redis from "ioredis"

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

    // Try to get planned days count
    let plannedDaysCount = 0
    try {
      if (process.env.REDIS_URL) {
        const redis = new Redis(process.env.REDIS_URL, {
          connectTimeout: 1000,
          commandTimeout: 1000,
        })

        const vacationData = await redis.get(`vacation-days:${session.user.id}`)
        await redis.quit()

        if (vacationData) {
          const parsed = JSON.parse(vacationData)
          plannedDaysCount = parsed.plannedDays?.length || 0
        }
      }
    } catch (e) {
      console.error("Error getting planned days count:", e)
    }

    // Create a test log entry
    await logUserLogin(
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      request,
      { plannedDaysCount },
    )

    return NextResponse.json({
      success: true,
      message: "Test log entry created",
    })
  } catch (error) {
    console.error("Error creating test log:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

