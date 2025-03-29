import { NextResponse } from "next/server"
import { getGoogleOAuthURL } from "@/lib/google-auth"

// Specify Node.js runtime
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    // Get the Google OAuth URL
    const googleOAuthURL = getGoogleOAuthURL()

    // Log the URL for debugging
    console.log("Redirecting to Google OAuth URL:", googleOAuthURL)

    // Redirect to Google OAuth
    return NextResponse.redirect(googleOAuthURL)
  } catch (error) {
    console.error("Error in Google sign-in:", error)
    return NextResponse.redirect(new URL("/login?error=signin_error", new URL(request.url).origin))
  }
}

