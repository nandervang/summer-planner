import { checkRedisConfig } from "@/lib/redis-utils"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await checkRedisConfig()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking Redis config:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error checking Redis config: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

