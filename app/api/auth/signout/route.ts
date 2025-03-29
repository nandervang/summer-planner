import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  // Delete the session cookie
  cookies().delete("user-session")

  // Return a success response
  return NextResponse.json({ success: true })
}

