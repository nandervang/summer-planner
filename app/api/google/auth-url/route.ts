import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getGoogleCredentials } from "@/lib/google-utils"

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get OAuth client
    const { oauth2Client } = getGoogleCredentials()

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      prompt: "consent",
      // Include user ID in state to identify the user when they return
      state: session.user.id,
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Error generating Google Calendar auth URL:", error)
    return NextResponse.json({ error: "Failed to generate auth URL" }, { status: 500 })
  }
}

