// This file contains a very simplified auth utility that doesn't use cookies

// Mock user data - in a real app, this would come from a database
const MOCK_USER = {
  id: "user-123456",
  name: "Test User",
  email: "test@example.com",
  image: "https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff",
}

// Simple function to get a mock user - always returns the same user
export function getMockUser() {
  return MOCK_USER
}

// Simple function to check if we're in development mode
export function isDevelopment() {
  return process.env.NODE_ENV === "development"
}

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Simple session management
export async function getSession() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("user-session")

  if (!sessionCookie?.value) {
    return null
  }

  try {
    // Parse the session cookie
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value))

    // Check if session is valid
    if (sessionData && sessionData.user) {
      return {
        user: {
          id: sessionData.user.id,
          name: sessionData.user.name,
          email: sessionData.user.email,
          image: sessionData.user.image,
        },
      }
    }

    return null
  } catch (error) {
    console.error("Error parsing session:", error)
    return null
  }
}

// Simple auth check
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

// Mock Google auth for development
export async function mockGoogleAuth() {
  // Create a mock user session
  const mockUser = {
    id: "user-" + Math.random().toString(36).substring(2, 9),
    name: "Test User",
    email: "test@example.com",
    image: "https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff",
  }

  // Set the session cookie
  cookies().set({
    name: "user-session",
    value: encodeURIComponent(JSON.stringify({ user: mockUser })),
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    sameSite: "lax",
  })

  return mockUser
}

// Sign out
export async function signOutUser() {
  cookies().delete("user-session")
}

