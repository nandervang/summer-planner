import { checkRedisConnection } from "@/lib/redis-utils"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await checkRedisConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking Redis connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error checking Redis connection: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

