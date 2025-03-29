import { createTestLog } from "@/lib/auth-logging"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await createTestLog("standard")
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating test log:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error creating test log: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

