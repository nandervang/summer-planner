// Google Calendar API integration

// Constants for API endpoints and scopes
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"
const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

// Interface for Google Calendar event
interface GoogleCalendarEvent {
  id?: string
  summary: string
  description: string
  start: {
    date: string
  }
  end: {
    date: string
  }
  colorId?: string
}

// Check if user has authorized the app
export async function checkGoogleCalendarAuth(): Promise<boolean> {
  try {
    const response = await fetch("/api/google/check-auth")
    const data = await response.json()
    return data.isAuthorized
  } catch (error) {
    console.error("Error checking Google Calendar auth:", error)
    return false
  }
}

// Get Google Calendar authorization URL
export async function getGoogleCalendarAuthUrl(): Promise<string> {
  try {
    const response = await fetch("/api/google/auth-url")
    const data = await response.json()
    return data.authUrl
  } catch (error) {
    console.error("Error getting Google Calendar auth URL:", error)
    return ""
  }
}

// Sync vacation days to Google Calendar
export async function syncVacationDaysToGoogle(
  plannedDays: string[],
  weekNotes: Record<string, string>,
  getWeekNumber: (date: Date) => string,
): Promise<boolean> {
  try {
    // First, get existing vacation events from Google Calendar
    const existingEvents = await getVacationEvents()

    // Create a map of existing events by date for quick lookup
    const existingEventsByDate = new Map<string, GoogleCalendarEvent>()
    existingEvents.forEach((event) => {
      if (event.start?.date) {
        existingEventsByDate.set(event.start.date, event)
      }
    })

    // Prepare events to create, update, or delete
    const eventsToCreate: GoogleCalendarEvent[] = []
    const eventsToUpdate: GoogleCalendarEvent[] = []
    const eventsToDelete: string[] = []

    // Process planned days
    plannedDays.forEach((day) => {
      const date = new Date(day)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      // Format dates for Google Calendar (YYYY-MM-DD)
      const startDate = day
      const endDate = nextDay.toISOString().split("T")[0]

      // Get week note if available
      const weekNum = getWeekNumber(date)
      const year = date.getFullYear()
      const weekKey = `${year}-${weekNum}`
      const note = weekNotes[weekKey] || "Vacation Day"

      // Create event object
      const event: GoogleCalendarEvent = {
        summary: note,
        description: "Added from Summer Vacation Planner",
        start: { date: startDate },
        end: { date: endDate },
        colorId: "9", // Blue color
      }

      // Check if event already exists
      if (existingEventsByDate.has(startDate)) {
        const existingEvent = existingEventsByDate.get(startDate)!
        event.id = existingEvent.id

        // Only update if something changed
        if (existingEvent.summary !== event.summary || existingEvent.end?.date !== event.end.date) {
          eventsToUpdate.push(event)
        }

        // Remove from map to track which events to keep
        existingEventsByDate.delete(startDate)
      } else {
        // New event
        eventsToCreate.push(event)
      }
    })

    // Any remaining events in the map should be deleted
    existingEventsByDate.forEach((event) => {
      if (event.id) {
        eventsToDelete.push(event.id)
      }
    })

    // Perform batch operations
    const results = await Promise.allSettled([
      createEvents(eventsToCreate),
      updateEvents(eventsToUpdate),
      deleteEvents(eventsToDelete),
    ])

    // Check if all operations succeeded
    const allSucceeded = results.every((result) => result.status === "fulfilled")

    return allSucceeded
  } catch (error) {
    console.error("Error syncing vacation days to Google Calendar:", error)
    return false
  }
}

// Get vacation events from Google Calendar
async function getVacationEvents(): Promise<GoogleCalendarEvent[]> {
  try {
    const response = await fetch("/api/google/events")
    const data = await response.json()
    return data.events || []
  } catch (error) {
    console.error("Error getting vacation events:", error)
    return []
  }
}

// Create new events
async function createEvents(events: GoogleCalendarEvent[]): Promise<boolean> {
  if (events.length === 0) return true

  try {
    const response = await fetch("/api/google/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("Error creating events:", error)
    return false
  }
}

// Update existing events
async function updateEvents(events: GoogleCalendarEvent[]): Promise<boolean> {
  if (events.length === 0) return true

  try {
    const response = await fetch("/api/google/events", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("Error updating events:", error)
    return false
  }
}

// Delete events
async function deleteEvents(eventIds: string[]): Promise<boolean> {
  if (eventIds.length === 0) return true

  try {
    const response = await fetch("/api/google/events", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventIds }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("Error deleting events:", error)
    return false
  }
}

