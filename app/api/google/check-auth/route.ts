import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getGoogleCredentials } from "@/lib/google-utils"

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ isAuthorized: false }, { status: 401 })
    }

    // Check if we have a token for this user
    const { oauth2Client } = getGoogleCredentials()

    // This would need to be implemented to check if the user has a valid token
    // In a real app, you'd store tokens in a database
    const hasToken = false // Replace with actual token check

    return NextResponse.json({ isAuthorized: hasToken })
  } catch (error) {
    console.error("Error checking Google Calendar auth:", error)
    return NextResponse.json({ isAuthorized: false, error: "Failed to check authorization" }, { status: 500 })
  }
}

