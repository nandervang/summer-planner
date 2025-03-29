import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Check if Redis URL is available
    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      return NextResponse.json({
        success: false,
        error: "REDIS_URL environment variable is not set",
        hasRedisUrl: false,
      })
    }

    // Return success without actually connecting to Redis
    return NextResponse.json({
      success: true,
      message: "Redis URL is configured",
      hasRedisUrl: true,
    })
  } catch (error) {
    console.error("Error checking Redis configuration:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hasRedisUrl: !!process.env.REDIS_URL,
      },
      { status: 500 },
    )
  }
}

