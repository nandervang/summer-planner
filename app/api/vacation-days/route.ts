import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import Redis from "ioredis"

// Specify Node.js runtime
export const runtime = "nodejs"

// Simple in-memory storage as fallback (will reset on server restart)
const memoryStorage: Record<string, any> = {}

// Function to safely get Redis client with timeout
async function getRedisClient(timeoutMs = 2000) {
  try {
    // Check if Redis URL is available
    const redisUrl = process.env.REDIS_URL

    if (!redisUrl) {
      console.warn("Redis URL not available, using memory storage instead")
      return {
        client: null,
        available: false,
      }
    }

    // Create Redis client with timeout options
    const redis = new Redis(redisUrl, {
      connectTimeout: timeoutMs,
      commandTimeout: timeoutMs,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Disable retries to fail fast
    })

    // Set up event handlers
    redis.on("error", (err) => {
      console.error("Redis client error:", err)
    })

    // Test connection with timeout
    const pingPromise = redis.ping()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timeout")), timeoutMs),
    )

    await Promise.race([pingPromise, timeoutPromise])

    return {
      client: redis,
      available: true,
    }
  } catch (error) {
    console.warn("Redis connection failed, using memory storage instead:", error)
    return {
      client: null,
      available: false,
    }
  }
}

// GET endpoint to retrieve vacation days
export async function GET(request: NextRequest) {
  let redisClient = null

  try {
    // Get the authenticated user
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get Redis client with short timeout
    const { client, available } = await getRedisClient(1500)
    redisClient = client

    let data: any = null

    if (available && client) {
      try {
        // Set a command timeout
        const getPromise = client.get(`vacation-days:${userId}`)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis get timeout")), 1500),
        )

        // Retrieve vacation days from Redis with timeout
        const rawData = await Promise.race([getPromise, timeoutPromise])

        if (rawData) {
          data = JSON.parse(rawData)
        }
      } catch (redisError) {
        console.error("Redis error during GET:", redisError)
        // Fall back to memory storage
        data = memoryStorage[`vacation-days:${userId}`]
      }
    } else {
      // Use in-memory fallback
      data = memoryStorage[`vacation-days:${userId}`]
    }

    return NextResponse.json({
      plannedDays: data?.plannedDays || [],
      weekNotes: data?.weekNotes || {},
      success: true,
    })
  } catch (error) {
    console.error("Error retrieving vacation days:", error)
    return NextResponse.json(
      {
        error: "Failed to retrieve vacation days",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false,
        plannedDays: [],
        weekNotes: {},
      },
      { status: 500 },
    )
  } finally {
    // Always close the Redis connection
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch (e) {
        console.error("Error closing Redis connection:", e)
      }
    }
  }
}

// POST endpoint to save vacation days
export async function POST(request: NextRequest) {
  let redisClient = null

  try {
    // Get the authenticated user
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get data from request body
    const body = await request.json().catch((e) => {
      console.error("Error parsing request body:", e)
      throw new Error("Invalid JSON in request body")
    })

    const { plannedDays, weekNotes } = body

    if (!Array.isArray(plannedDays)) {
      return NextResponse.json(
        {
          error: "Invalid data format",
          message: "plannedDays must be an array",
          success: false,
        },
        { status: 400 },
      )
    }

    // Get Redis client with short timeout
    const { client, available } = await getRedisClient(1500)
    redisClient = client

    const dataToSave = {
      plannedDays,
      weekNotes: weekNotes || {},
      updatedAt: new Date().toISOString(),
    }

    // Always save to memory storage as backup
    memoryStorage[`vacation-days:${userId}`] = dataToSave

    if (available && client) {
      try {
        // Set with timeout
        const setPromise = client.set(`vacation-days:${userId}`, JSON.stringify(dataToSave))
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Redis set timeout")), 1500),
        )

        // Save to Redis with timeout
        await Promise.race([setPromise, timeoutPromise])
      } catch (redisError) {
        console.error("Redis error during POST:", redisError)
        // We already saved to memory storage above
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving vacation days:", error)
    return NextResponse.json(
      {
        error: "Failed to save vacation days",
        message: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  } finally {
    // Always close the Redis connection
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch (e) {
        console.error("Error closing Redis connection:", e)
      }
    }
  }
}

