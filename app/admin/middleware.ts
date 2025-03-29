import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { ADMIN_CONFIG } from "@/lib/config"

export async function middleware(request: NextRequest) {
  // Get the user session
  const session = await getSession()

  // Check if user is logged in
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check if user is authorized
  const userEmail = session.user.email

  if (!userEmail || !ADMIN_CONFIG.authorizedAdmins.includes(userEmail)) {
    // User is not authorized, redirect to home
    return NextResponse.redirect(new URL("/", request.url))
  }

  // User is authorized, continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

