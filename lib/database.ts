import Dexie from "dexie"

// Define the database
class VacationPlannerDB extends Dexie {
  plannedDays: Dexie.Table<{ id?: string; userId: string; date: string }, string>
  categories: Dexie.Table<{ id?: string; userId: string; name: string; color: string }, string>
  dayCategories: Dexie.Table<{ id?: string; userId: string; dayDate: string; categoryId: string }, string>
  weekNotes: Dexie.Table<{ id?: string; userId: string; weekNumber: string; year: number; note: string }, string>

  constructor() {
    super("VacationPlannerDB")
    this.version(5).stores({
      plannedDays: "++id, userId, date",
      categories: "++id, userId, name",
      dayCategories: "++id, userId, dayDate, categoryId",
      weekNotes: "++id, userId, weekNumber, year",
    })
    this.plannedDays = this.table("plannedDays")
    this.categories = this.table("categories")
    this.dayCategories = this.table("dayCategories")
    this.weekNotes = this.table("weekNotes")
  }
}

// Create a new instance of the database
let db: VacationPlannerDB | null = null

// Function to get database instance with lazy initialization
function getDB(): VacationPlannerDB {
  if (!db) {
    try {
      db = new VacationPlannerDB()
    } catch (error) {
      console.error("Failed to create database instance:", error)
      throw new Error("Database initialization failed")
    }
  }
  return db
}

// Memory fallback storage
const memoryStorage: Record<string, any> = {}

export async function initializeDatabase() {
  console.log("Initializing database...")
  try {
    // Check if IndexedDB is supported
    if (typeof window === "undefined" || !window.indexedDB) {
      console.error("IndexedDB not supported in this environment")
      return false
    }

    // Try to open the database
    const database = getDB()
    await database.open()
    console.log("Database opened successfully")

    // Verify tables exist
    const tables = database.tables.map((t) => t.name)
    console.log("Database tables:", tables)

    return true
  } catch (error) {
    console.error("Failed to initialize database:", error)
    // Fallback to localStorage if IndexedDB fails
    return false
  }
}

export async function savePlannedDays(days: string[], userId: string) {
  console.log("Saving planned days for user:", userId, "Days:", days)
  if (!userId) {
    console.error("No userId provided to savePlannedDays")
    return false
  }

  // Always save to localStorage as backup
  try {
    localStorage.setItem(`plannedVacationDays-${userId}`, JSON.stringify(days))
    console.log("Saved to localStorage as backup")

    // Also save to memory storage
    memoryStorage[`plannedVacationDays-${userId}`] = days
  } catch (localStorageError) {
    console.error("Failed to save to localStorage:", localStorageError)
  }

  try {
    // Then try to save to IndexedDB
    const database = getDB()

    // Start transaction
    await database.transaction("rw", database.plannedDays, async () => {
      // Clear existing data for this user
      const deleted = await database.plannedDays.where("userId").equals(userId).delete()
      console.log(`Deleted ${deleted} existing planned days`)

      // Insert new data
      if (days.length > 0) {
        const insertedIds = await database.plannedDays.bulkAdd(
          days.map((day) => ({
            userId,
            date: day,
          })),
          { allKeys: true },
        )
        console.log(`Inserted ${insertedIds.length} new planned days`)
      }
    })

    return true
  } catch (error) {
    console.error("Failed to save planned days to IndexedDB:", error)
    return false
  }
}

export async function getPlannedDays(userId: string): Promise<string[]> {
  console.log("Getting planned days for user:", userId)
  if (!userId) {
    console.warn("No userId provided to getPlannedDays, returning empty array")
    return []
  }

  // Try all storage methods and use the first one that works
  let plannedDays: string[] = []
  let source = "none"

  // 1. First try memory storage (fastest)
  if (memoryStorage[`plannedVacationDays-${userId}`]) {
    plannedDays = memoryStorage[`plannedVacationDays-${userId}`]
    source = "memory"
    console.log(`Found ${plannedDays.length} planned days in memory storage`)
  }

  // 2. If not in memory, try IndexedDB
  if (plannedDays.length === 0) {
    try {
      const database = getDB()
      const result = await database.plannedDays.where("userId").equals(userId).toArray()

      if (result.length > 0) {
        plannedDays = result.map((item) => item.date)
        source = "indexeddb"
        console.log(`Found ${plannedDays.length} planned days in IndexedDB`)

        // Update memory storage for faster access next time
        memoryStorage[`plannedVacationDays-${userId}`] = plannedDays
      }
    } catch (indexedDBError) {
      console.error("Failed to get planned days from IndexedDB:", indexedDBError)
    }
  }

  // 3. If still not found, try localStorage
  if (plannedDays.length === 0) {
    try {
      const savedDays = localStorage.getItem(`plannedVacationDays-${userId}`)
      if (savedDays) {
        plannedDays = JSON.parse(savedDays)
        source = "localstorage"
        console.log(`Found ${plannedDays.length} planned days in localStorage`)

        // Update memory storage for faster access next time
        memoryStorage[`plannedVacationDays-${userId}`] = plannedDays
      }
    } catch (localStorageError) {
      console.error("Failed to get planned days from localStorage:", localStorageError)
    }
  }

  // 4. If still not found, try to fetch from server (if in production)
  if (plannedDays.length === 0 && typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    try {
      const response = await fetch("/api/vacation-days", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.plannedDays)) {
          plannedDays = data.plannedDays
          source = "server"
          console.log(`Found ${plannedDays.length} planned days from server`)

          // Update all storage methods
          memoryStorage[`plannedVacationDays-${userId}`] = plannedDays
          try {
            localStorage.setItem(`plannedVacationDays-${userId}`, JSON.stringify(plannedDays))
          } catch (e) {
            console.error("Failed to save server data to localStorage:", e)
          }
        }
      }
    } catch (serverError) {
      console.error("Failed to get planned days from server:", serverError)
    }
  }

  console.log(`Returning ${plannedDays.length} planned days from ${source}`)
  return plannedDays
}

export async function saveDayCategory(dayDate: string, categoryId: string, userId: string) {
  if (!userId) return false

  // Save to memory storage
  const key = `dayCategories-${userId}`
  const existingCategories = memoryStorage[key] || {}
  memoryStorage[key] = { ...existingCategories, [dayDate]: categoryId }

  try {
    // Try to save to IndexedDB
    const database = getDB()

    // Check if this day already has a category
    const existing = await database.dayCategories
      .where("userId")
      .equals(userId)
      .and((item) => item.dayDate === dayDate)
      .first()

    if (existing) {
      // Update existing
      await database.dayCategories.update(existing.id!, { categoryId })
    } else {
      // Add new
      await database.dayCategories.add({
        userId,
        dayDate,
        categoryId,
      })
    }

    return true
  } catch (error) {
    console.error("Failed to save day category to IndexedDB:", error)

    // Try to save to localStorage as fallback
    try {
      const key = `dayCategories-${userId}`
      const existingCategories = JSON.parse(localStorage.getItem(key) || "{}")
      existingCategories[dayDate] = categoryId
      localStorage.setItem(key, JSON.stringify(existingCategories))
      return true
    } catch (localStorageError) {
      console.error("Failed to save day category to localStorage:", localStorageError)
      return false
    }
  }
}

export async function getDayCategories(userId: string): Promise<Record<string, string>> {
  if (!userId) return {}

  // Try all storage methods and use the first one that works
  let categories: Record<string, string> = {}
  let source = "none"

  // 1. First try memory storage (fastest)
  if (memoryStorage[`dayCategories-${userId}`]) {
    categories = memoryStorage[`dayCategories-${userId}`]
    source = "memory"
    console.log(`Found day categories in memory storage`)
  }

  // 2. If not in memory, try IndexedDB
  if (Object.keys(categories).length === 0) {
    try {
      const database = getDB()
      const result = await database.dayCategories.where("userId").equals(userId).toArray()

      if (result.length > 0) {
        categories = result.reduce(
          (acc, item) => {
            acc[item.dayDate] = item.categoryId
            return acc
          },
          {} as Record<string, string>,
        )
        source = "indexeddb"
        console.log(`Found day categories in IndexedDB`)

        // Update memory storage for faster access next time
        memoryStorage[`dayCategories-${userId}`] = categories
      }
    } catch (indexedDBError) {
      console.error("Failed to get day categories from IndexedDB:", indexedDBError)
    }
  }

  // 3. If still not found, try localStorage
  if (Object.keys(categories).length === 0) {
    try {
      const savedCategories = localStorage.getItem(`dayCategories-${userId}`)
      if (savedCategories) {
        categories = JSON.parse(savedCategories)
        source = "localstorage"
        console.log(`Found day categories in localStorage`)

        // Update memory storage for faster access next time
        memoryStorage[`dayCategories-${userId}`] = categories
      }
    } catch (localStorageError) {
      console.error("Failed to get day categories from localStorage:", localStorageError)
    }
  }

  console.log(`Returning day categories from ${source}`)
  return categories
}

// New functions for week notes
export async function saveWeekNote(weekNumber: string, year: number, note: string, userId: string) {
  if (!userId) return false

  // Save to memory storage
  const key = `weekNotes-${userId}`
  const weekKey = `${year}-${weekNumber}`
  const existingNotes = memoryStorage[key] || {}
  memoryStorage[key] = { ...existingNotes, [weekKey]: note }

  try {
    // Try to save to IndexedDB
    const database = getDB()

    // Check if this week already has a note
    const existing = await database.weekNotes
      .where("userId")
      .equals(userId)
      .and((item) => item.weekNumber === weekNumber && item.year === year)
      .first()

    if (existing) {
      // Update existing
      await database.weekNotes.update(existing.id!, { note })
    } else {
      // Add new
      await database.weekNotes.add({
        userId,
        weekNumber,
        year,
        note,
      })
    }

    return true
  } catch (error) {
    console.error("Failed to save week note to IndexedDB:", error)

    // Try to save to localStorage as fallback
    try {
      const key = `weekNote-${userId}-${year}-${weekNumber}`
      localStorage.setItem(key, note)
      return true
    } catch (localStorageError) {
      console.error("Failed to save week note to localStorage:", localStorageError)
      return false
    }
  }
}

export async function getWeekNotes(userId: string): Promise<Record<string, string>> {
  if (!userId) return {}

  // Try all storage methods and use the first one that works
  let notes: Record<string, string> = {}
  let source = "none"

  // 1. First try memory storage (fastest)
  if (memoryStorage[`weekNotes-${userId}`]) {
    notes = memoryStorage[`weekNotes-${userId}`]
    source = "memory"
    console.log(`Found week notes in memory storage`)
  }

  // 2. If not in memory, try IndexedDB
  if (Object.keys(notes).length === 0) {
    try {
      const database = getDB()
      const result = await database.weekNotes.where("userId").equals(userId).toArray()

      if (result.length > 0) {
        notes = result.reduce(
          (acc, item) => {
            const key = `${item.year}-${item.weekNumber}`
            acc[key] = item.note
            return acc
          },
          {} as Record<string, string>,
        )
        source = "indexeddb"
        console.log(`Found week notes in IndexedDB`)

        // Update memory storage for faster access next time
        memoryStorage[`weekNotes-${userId}`] = notes
      }
    } catch (indexedDBError) {
      console.error("Failed to get week notes from IndexedDB:", indexedDBError)
    }
  }

  // 3. If still not found, try localStorage
  if (Object.keys(notes).length === 0) {
    try {
      // This is a simplified approach - in a real app, you'd need a way to know which keys to look for
      const weekNotes: Record<string, string> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`weekNote-${userId}`)) {
          const parts = key.split("-")
          if (parts.length === 4) {
            const year = parts[2]
            const week = parts[3]
            const note = localStorage.getItem(key) || ""
            weekNotes[`${year}-${week}`] = note
          }
        }
      }

      if (Object.keys(weekNotes).length > 0) {
        notes = weekNotes
        source = "localstorage"
        console.log(`Found week notes in localStorage`)

        // Update memory storage for faster access next time
        memoryStorage[`weekNotes-${userId}`] = notes
      }
    } catch (localStorageError) {
      console.error("Failed to get week notes from localStorage:", localStorageError)
    }
  }

  console.log(`Returning week notes from ${source}`)
  return notes
}

