import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getGoogleCredentials } from "@/lib/google-utils"

// Get events
export async function GET() {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get OAuth client with user's tokens
    const { oauth2Client, calendar } = await getGoogleCredentials(session.user.id)

    // Get events from primary calendar with a specific query
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(2025, 5, 1).toISOString(), // June 1, 2025
      timeMax: new Date(2025, 8, 1).toISOString(), // September 1, 2025
      singleEvents: true,
      q: "Summer Vacation Planner", // Search for events with this text in description
    })

    return NextResponse.json({ events: response.data.items })
  } catch (error) {
    console.error("Error getting Google Calendar events:", error)
    return NextResponse.json({ error: "Failed to get events" }, { status: 500 })
  }
}

// Create events
export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { events } = await request.json()

    // Get OAuth client with user's tokens
    const { oauth2Client, calendar } = await getGoogleCredentials(session.user.id)

    // Create events
    const results = await Promise.all(
      events.map(async (event: any) => {
        try {
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event,
          })
          return { success: true, id: response.data.id }
        } catch (error) {
          console.error("Error creating event:", error)
          return { success: false, error }
        }
      }),
    )

    const success = results.every((result) => result.success)

    return NextResponse.json({ success, results })
  } catch (error) {
    console.error("Error creating Google Calendar events:", error)
    return NextResponse.json({ error: "Failed to create events" }, { status: 500 })
  }
}

// Update events
export async function PUT(request: Request) {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { events } = await request.json()

    // Get OAuth client with user's tokens
    const { oauth2Client, calendar } = await getGoogleCredentials(session.user.id)

    // Update events
    const results = await Promise.all(
      events.map(async (event: any) => {
        try {
          const response = await calendar.events.update({
            calendarId: "primary",
            eventId: event.id,
            requestBody: event,
          })
          return { success: true, id: response.data.id }
        } catch (error) {
          console.error("Error updating event:", error)
          return { success: false, error }
        }
      }),
    )

    const success = results.every((result) => result.success)

    return NextResponse.json({ success, results })
  } catch (error) {
    console.error("Error updating Google Calendar events:", error)
    return NextResponse.json({ error: "Failed to update events" }, { status: 500 })
  }
}

// Delete events
export async function DELETE(request: Request) {
  try {
    // Get user session
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request body
    const { eventIds } = await request.json()

    // Get OAuth client with user's tokens
    const { oauth2Client, calendar } = await getGoogleCredentials(session.user.id)

    // Delete events
    const results = await Promise.all(
      eventIds.map(async (eventId: string) => {
        try {
          await calendar.events.delete({
            calendarId: "primary",
            eventId,
          })
          return { success: true, id: eventId }
        } catch (error) {
          console.error("Error deleting event:", error)
          return { success: false, error }
        }
      }),
    )

    const success = results.every((result) => result.success)

    return NextResponse.json({ success, results })
  } catch (error) {
    console.error("Error deleting Google Calendar events:", error)
    return NextResponse.json({ error: "Failed to delete events" }, { status: 500 })
  }
}

