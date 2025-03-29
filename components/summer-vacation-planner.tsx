"use client"

import { useEffect, useState, useCallback } from "react"
import { CalendarSimple } from "./calendar-simple"
import { VacationDashboard } from "./vacation-dashboard"
import { VacationCategories } from "./vacation-categories"
import {
  initializeDatabase,
  savePlannedDays,
  getPlannedDays,
  saveDayCategory,
  getDayCategories,
  saveWeekNote,
  getWeekNotes,
} from "@/lib/database"
import { SwedishHolidays } from "@/lib/holidays"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, Calendar, Plus, Edit, Check, Save, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

interface SummerVacationPlannerProps {
  userId: string
  isGoogleUser?: boolean
}

export function SummerVacationPlanner({ userId, isGoogleUser = false }: SummerVacationPlannerProps) {
  const [plannedDays, setPlannedDays] = useState<string[]>([])
  const [dayCategories, setDayCategories] = useState<Record<string, string>>({})
  const [weekNotes, setWeekNotes] = useState<Record<string, string>>({})
  const [editingWeek, setEditingWeek] = useState<string | null>(null)
  const [newNote, setNewNote] = useState("")
  const [isDbInitialized, setIsDbInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")
  const [dbError, setDbError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const { toast } = useToast()
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize the database and load data
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        console.log("Starting database initialization...")
        const dbInitialized = await initializeDatabase()
        console.log("Database initialization result:", dbInitialized)
        setIsDbInitialized(dbInitialized)

        if (userId) {
          // Load data from local storage/IndexedDB first for immediate display
          console.log("Loading data for user:", userId)

          // Load planned days
          const savedDays = await getPlannedDays(userId)
          console.log("Loaded planned days:", savedDays)
          setPlannedDays(savedDays)

          // Load day categories
          const savedCategories = await getDayCategories(userId)
          console.log("Loaded day categories:", savedCategories)
          setDayCategories(savedCategories)

          // Load week notes
          const savedWeekNotes = await getWeekNotes(userId)
          console.log("Loaded week notes:", savedWeekNotes)
          setWeekNotes(savedWeekNotes)

          // If this is a Google user, try to fetch data from the server
          if (isGoogleUser) {
            syncFromServer()
          }
        } else {
          console.warn("No userId provided, cannot load data")
        }
      } catch (error) {
        console.error("Error initializing database:", error)
        setDbError(error instanceof Error ? error.message : "Unknown database error")

        // Try to get from localStorage as fallback
        if (userId) {
          try {
            const savedDays = localStorage.getItem(`plannedVacationDays-${userId}`)
            if (savedDays) {
              setPlannedDays(JSON.parse(savedDays))
            }
          } catch (e) {
            console.error("Failed to load from localStorage:", e)
          }
        }
      } finally {
        setIsLoading(false)
        setIsDbInitialized(true)
      }
    }

    initialize()
  }, [userId, isGoogleUser])

  // Function to sync data from the server
  const syncFromServer = useCallback(async () => {
    if (!isGoogleUser) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const response = await fetch("/api/vacation-days", {
        headers: { "Cache-Control": "no-cache" },
      })

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Unknown error occurred")
      }

      // Update local state with server data if we have data
      if (Array.isArray(data.plannedDays) && data.plannedDays.length > 0) {
        setPlannedDays(data.plannedDays)

        // Also save to local storage/IndexedDB as backup
        await savePlannedDays(data.plannedDays, userId)
      }

      // Update week notes if we have data
      if (data.weekNotes && Object.keys(data.weekNotes).length > 0) {
        setWeekNotes(data.weekNotes)

        // Save each week note
        for (const [key, note] of Object.entries(data.weekNotes)) {
          const [year, weekNumber] = key.split("-")
          await saveWeekNote(weekNumber, Number.parseInt(year), note as string, userId)
        }
      }

      setLastSynced(new Date().toLocaleTimeString())
      toast({
        title: "Synced with Google Account",
        description: "Your vacation days have been loaded from your Google account.",
      })
    } catch (error) {
      console.error("Error syncing from server:", error)
      setSyncError(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Sync Failed",
        description: "Could not load your vacation days from the server. Using local data instead.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [isGoogleUser, userId, toast])

  // Function to sync data to the server
  const syncToServer = useCallback(async () => {
    if (!isGoogleUser) return

    setIsSyncing(true)
    setSyncError(null)

    try {
      const response = await fetch("/api/vacation-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plannedDays,
          weekNotes,
        }),
      })

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server responded with ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Unknown error occurred")
      }

      setLastSynced(new Date().toLocaleTimeString())
      toast({
        title: "Saved to Google Account",
        description: "Your vacation days have been saved to your Google account.",
      })
    } catch (error) {
      console.error("Error syncing to server:", error)
      setSyncError(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Save Failed",
        description: "Could not save your vacation days to the server. Your data is still saved locally.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }, [plannedDays, weekNotes, isGoogleUser, toast])

  // Auto-sync to server when data changes (debounced)
  useEffect(() => {
    if (!isGoogleUser || !isDbInitialized) return

    const timer = setTimeout(() => {
      syncToServer()
    }, 2000) // Wait 2 seconds after changes before syncing

    return () => clearTimeout(timer)
  }, [plannedDays, weekNotes, isDbInitialized, isGoogleUser, syncToServer])

  const handleDayToggle = useCallback(
    async (dateString: string) => {
      console.log("Day toggled:", dateString)
      if (!userId) {
        console.log("No userId available, cannot toggle day")
        return
      }

      let newPlannedDays: string[]

      if (plannedDays.includes(dateString)) {
        console.log("Removing day from planned days")
        newPlannedDays = plannedDays.filter((day) => day !== dateString)
      } else {
        console.log("Adding day to planned days")
        newPlannedDays = [...plannedDays, dateString]
      }

      setPlannedDays(newPlannedDays)
      console.log("New planned days:", newPlannedDays)

      try {
        await savePlannedDays(newPlannedDays, userId)
        console.log("Successfully saved planned days to database")
      } catch (error) {
        console.error("Error saving planned days:", error)
        // Save to localStorage as fallback
        try {
          localStorage.setItem(`plannedVacationDays-${userId}`, JSON.stringify(newPlannedDays))
          console.log("Saved to localStorage as fallback")
        } catch (e) {
          console.error("Failed to save to localStorage:", e)
        }
      }
    },
    [plannedDays, userId],
  )

  const handleCategorize = useCallback(
    async (day: string, categoryId: string) => {
      if (!userId) return

      const newDayCategories = { ...dayCategories, [day]: categoryId }
      setDayCategories(newDayCategories)

      try {
        await saveDayCategory(day, categoryId, userId)
      } catch (error) {
        console.error("Error saving day category:", error)
      }
    },
    [dayCategories, userId],
  )

  // Week note functions
  const startEditingWeekNote = useCallback((weekKey: string, currentNote: string) => {
    setEditingWeek(weekKey)
    setNewNote(currentNote)
  }, [])

  const saveWeekNoteHandler = useCallback(
    async (weekKey: string) => {
      if (!userId) return

      const [year, weekNumber] = weekKey.split("-")

      try {
        await saveWeekNote(weekNumber, Number.parseInt(year), newNote, userId)

        // Update local state
        setWeekNotes({
          ...weekNotes,
          [weekKey]: newNote,
        })

        // Exit edit mode
        setEditingWeek(null)
        setNewNote("")
      } catch (error) {
        console.error("Error saving week note:", error)
      }
    },
    [newNote, weekNotes, userId],
  )

  // Export functions
  const exportToCSV = useCallback(() => {
    if (plannedDays.length === 0) return

    // Sort days
    const sortedDays = [...plannedDays].sort()

    // Create CSV content
    const csvContent = [
      "Date,Day of Week,Week Number,Week Note",
      ...sortedDays.map((day) => {
        const date = new Date(day)
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
        const weekNum = getWeekNumber(date)
        const year = date.getFullYear()
        const weekKey = `${year}-${weekNum}`
        const note = weekNotes[weekKey] || ""

        return `${day},${dayOfWeek},${weekNum},"${note.replace(/"/g, '""')}"`
      }),
    ].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "vacation_days.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [plannedDays, weekNotes])

  const exportToICal = useCallback(() => {
    if (plannedDays.length === 0) return

    // Sort days
    const sortedDays = [...plannedDays].sort()

    // Create iCal content
    let icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Summer Vacation Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ]

    sortedDays.forEach((day) => {
      const date = new Date(day)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const weekNum = getWeekNumber(date)
      const year = date.getFullYear()
      const weekKey = `${year}-${weekNum}`
      const note = weekNotes[weekKey] || "Vacation Day"

      const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      }

      icalContent = [
        ...icalContent,
        "BEGIN:VEVENT",
        `DTSTART:${formatDate(date)}`,
        `DTEND:${formatDate(nextDay)}`,
        `SUMMARY:${note}`,
        `DESCRIPTION:Planned vacation day from Summer Vacation Planner`,
        "STATUS:CONFIRMED",
        `UID:${date.getTime()}@summervacationplanner`,
        "END:VEVENT",
      ]
    })

    icalContent.push("END:VCALENDAR")

    // Create and download the file
    const blob = new Blob([icalContent.join("\r\n")], { type: "text/calendar;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "vacation_days.ics")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [plannedDays, weekNotes])

  const addToGoogleCalendar = useCallback(() => {
    if (plannedDays.length === 0) return

    // Sort days
    const sortedDays = [...plannedDays].sort()

    // Get the first day
    const firstDay = sortedDays[0]
    const date = new Date(firstDay)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const weekNum = getWeekNumber(date)
    const year = date.getFullYear()
    const weekKey = `${year}-${weekNum}`
    const note = weekNotes[weekKey] || "Vacation Day"

    // Create Google Calendar URL
    let googleCalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
    googleCalUrl += `&text=${encodeURIComponent(note)}`
    googleCalUrl += `&dates=${firstDay.replace(/-/g, "")}/${nextDay.toISOString().split("T")[0].replace(/-/g, "")}`
    googleCalUrl += `&details=${encodeURIComponent("Added from Summer Vacation Planner")}`

    // Open Google Calendar in a new tab
    window.open(googleCalUrl, "_blank")
  }, [plannedDays, weekNotes])

  // Helper function to group days by ISO week number
  const groupByWeek = useCallback((days: string[]) => {
    const sorted = [...days].sort()
    return sorted.reduce<Record<string, string[]>>((groups, day) => {
      const date = new Date(day)
      // Get ISO week number
      const weekNum = getWeekNumber(date)
      const year = date.getFullYear()
      const key = `${year}-${weekNum}`

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(day)
      return groups
    }, {})
  }, [])

  // Function to get ISO week number
  const getWeekNumber = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)) // Set to nearest Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return weekNum.toString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar data...</p>
        </div>
      </div>
    )
  }

  if (!isDbInitialized && !isLoading) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Database Initialization Failed</h3>
        <p className="text-red-600 mb-4">
          There was a problem initializing the database. Your vacation data may not be saved properly.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {dbError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
          <h3 className="font-bold">Database Error</h3>
          <p>{dbError}</p>
          <p className="mt-2 text-sm">The application will continue with limited functionality.</p>
        </div>
      )}

      {isGoogleUser && (
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div>
            <h3 className="font-medium text-blue-800">Google Account Sync</h3>
            {lastSynced && <p className="text-xs text-blue-600">Last synced: {lastSynced}</p>}
            {syncError && <p className="text-xs text-red-600">Sync error: {syncError}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={syncFromServer} disabled={isSyncing} className="bg-white">
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      )}

      <Tabs defaultValue="calendar" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <CalendarSimple
              month={5} // June (0-indexed)
              year={2025}
              plannedDays={plannedDays}
              onDayToggle={handleDayToggle}
              holidays={SwedishHolidays}
            />
            <CalendarSimple
              month={6} // July
              year={2025}
              plannedDays={plannedDays}
              onDayToggle={handleDayToggle}
              holidays={SwedishHolidays}
            />
            <CalendarSimple
              month={7} // August
              year={2025}
              plannedDays={plannedDays}
              onDayToggle={handleDayToggle}
              holidays={SwedishHolidays}
            />
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-bold mb-4">Planned Vacation Days: {plannedDays.length}</h2>
            <div className="mb-6 space-y-4">
              {/* Group days by week number */}
              {Object.entries(groupByWeek(plannedDays)).map(([weekKey, days]) => {
                const [year, weekNum] = weekKey.split("-")
                const note = weekNotes[weekKey] || ""
                const isEditing = editingWeek === weekKey

                return (
                  <div key={weekKey} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                      <h3 className="text-sm font-medium text-gray-700">Week {weekNum}</h3>

                      {!isEditing ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => startEditingWeekNote(weekKey, note)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit note</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => saveWeekNoteHandler(weekKey)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="sr-only">Save note</span>
                        </Button>
                      )}
                    </div>

                    {/* Week note */}
                    {isEditing ? (
                      <div className="p-3 bg-amber-50">
                        <Input
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note for this week (e.g., Going to Spain)"
                          className="text-sm"
                        />
                      </div>
                    ) : note ? (
                      <div className="p-3 bg-amber-50 border-b">
                        <p className="text-sm font-medium text-amber-800">{note}</p>
                      </div>
                    ) : null}

                    {/* Days */}
                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {days.map((day) => (
                          <span key={day} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {new Date(day).toLocaleDateString("sv-SE")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Export links */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={exportToCSV}
                disabled={plannedDays.length === 0}
              >
                <Download className="h-3 w-3 mr-1" />
                Export as CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={exportToICal}
                disabled={plannedDays.length === 0}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Export to iCal
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={addToGoogleCalendar}
                disabled={plannedDays.length === 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Google Calendar
              </Button>

              {isGoogleUser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs ml-auto"
                  onClick={syncToServer}
                  disabled={isSyncing}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save to Google Account
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <VacationDashboard plannedDays={plannedDays} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <VacationCategories plannedDays={plannedDays} onCategorize={handleCategorize} dayCategories={dayCategories} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

