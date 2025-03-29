import { NextResponse } from "next/server"
import { getGoogleCredentials } from "@/lib/google-utils"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state") // Contains user ID

    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=google_auth_failed", url.origin))
    }

    // Get OAuth client
    const { oauth2Client } = getGoogleCredentials()

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    // In a real app, you'd store these tokens in a database associated with the user
    // tokens.access_token, tokens.refresh_token, tokens.expiry_date

    // Redirect back to the calendar page
    return NextResponse.redirect(new URL("/", url.origin))
  } catch (error) {
    console.error("Error in Google callback:", error)
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", new URL(request.url).origin))
  }
}

