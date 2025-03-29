import { NextResponse } from "next/server"
import { getGoogleTokens, getGoogleUserInfo, setUserSession } from "@/lib/google-auth"
import { logUserLogin } from "@/lib/auth-logging"
import Redis from "ioredis"

// Specify Node.js runtime
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    // Get the authorization code from the URL
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const error = url.searchParams.get("error")

    // Log for debugging
    console.log("Google callback received. Code exists:", !!code, "Error:", error || "none")

    if (error) {
      console.error("Google OAuth error:", error)
      return NextResponse.redirect(new URL(`/login?error=${error}`, url.origin))
    }

    if (!code) {
      console.error("No authorization code received from Google")
      return NextResponse.redirect(new URL("/login?error=no_code", url.origin))
    }

    // Exchange the code for tokens
    console.log("Exchanging code for tokens...")
    const tokens = await getGoogleTokens(code)

    if (!tokens.access_token) {
      console.error("Failed to get access token:", tokens.error || "Unknown error")

      // Check for redirect_uri_mismatch error specifically
      if (tokens.error === "redirect_uri_mismatch" || tokens.error_description?.includes("redirect_uri_mismatch")) {
        return NextResponse.redirect(new URL("/login?error=redirect_uri_mismatch", url.origin))
      }

      return NextResponse.redirect(new URL(`/login?error=${tokens.error || "no_access_token"}`, url.origin))
    }

    // Get the user info
    console.log("Getting user info...")
    const googleUser = await getGoogleUserInfo(tokens.access_token)

    if (!googleUser.sub) {
      console.error("Failed to get user info:", googleUser.error || "Unknown error")
      return NextResponse.redirect(new URL("/login?error=user_info_failed", url.origin))
    }

    // Create a user object
    const user = {
      id: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
      image: googleUser.picture,
    }

    // Set the user session
    console.log("Setting user session for:", user.email)
    setUserSession(user)

    // Try to get planned days count
    let plannedDaysCount = 0
    try {
      if (process.env.REDIS_URL) {
        const redis = new Redis(process.env.REDIS_URL, {
          connectTimeout: 1000,
          commandTimeout: 1000,
        })

        const vacationData = await redis.get(`vacation-days:${user.id}`)
        await redis.quit()

        if (vacationData) {
          const parsed = JSON.parse(vacationData)
          plannedDaysCount = parsed.plannedDays?.length || 0
        }
      }
    } catch (e) {
      console.error("Error getting planned days count:", e)
    }

    // Log this login with planned days count
    console.log("Logging user login...")
    try {
      await logUserLogin(user, request, { plannedDaysCount })
      console.log("Login logged successfully")
    } catch (logError) {
      console.error("Error logging login:", logError)
    }

    // Redirect to the home page
    return NextResponse.redirect(new URL("/", url.origin))
  } catch (error) {
    console.error("Error in Google callback:", error)
    return NextResponse.redirect(new URL("/login?error=callback_error", new URL(request.url).origin))
  }
}

