import { createDirectMemoryLog } from "@/lib/auth-logging"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await createDirectMemoryLog()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating memory log:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error creating memory log: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

