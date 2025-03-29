// This file contains Google OAuth implementation without NextAuth.js
// It will run in the Node.js runtime, not Edge

import { cookies } from "next/headers"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""

// IMPORTANT: Use the custom domain as the primary redirect URI
const CUSTOM_DOMAIN = "nandervang.vercel.app"
const REDIRECT_URI = `https://${CUSTOM_DOMAIN}/api/auth/callback/google`

// Generate Google OAuth URL
export function getGoogleOAuthURL() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth"

  console.log("Using redirect URI:", REDIRECT_URI)

  const options = {
    redirect_uri: REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(
      " ",
    ),
  }

  const queryString = new URLSearchParams(options).toString()

  return `${rootUrl}?${queryString}`
}

// Get tokens from Google
export async function getGoogleTokens(code: string) {
  const url = "https://oauth2.googleapis.com/token"

  const values = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    return await response.json()
  } catch (error) {
    console.error("Error getting Google tokens:", error)
    throw new Error("Failed to get Google tokens")
  }
}

// Get user info from Google
export async function getGoogleUserInfo(access_token: string) {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    return await response.json()
  } catch (error) {
    console.error("Error getting Google user info:", error)
    throw new Error("Failed to get Google user info")
  }
}

// Set user session
export function setUserSession(user: any) {
  cookies().set({
    name: "user-session",
    value: encodeURIComponent(JSON.stringify({ user })),
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax",
  })
}

