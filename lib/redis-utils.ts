import { kv } from "@vercel/kv"

export async function checkRedisConfig() {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL
  return {
    success: !!redisUrl,
    message: redisUrl ? "Redis URL is configured" : "Redis URL is not configured",
    url: redisUrl ? "configured" : "not configured",
  }
}

export async function checkRedisConnection() {
  try {
    // Try to ping Redis
    await kv.ping()
    return {
      success: true,
      message: "Redis connection successful",
    }
  } catch (error) {
    console.error("Redis connection error:", error)
    return {
      success: false,
      message: `Redis connection failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

