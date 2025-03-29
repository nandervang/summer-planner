import Redis from "ioredis"

// Function to safely get Redis client with timeout
export async function getRedisClient(timeoutMs = 2000) {
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

