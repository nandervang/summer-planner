import { getAllLoginLogs } from "@/lib/auth-logging"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const logs = await getAllLoginLogs()
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

