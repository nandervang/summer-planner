import { kv } from "@vercel/kv"
import { sql } from "@vercel/postgres"
import { AUTH_CONFIG } from "./config"
import { headers } from "next/headers"

// In-memory storage as fallback
let memoryLogs: any[] = []

export async function logUserLogin(
  user: { id: string; name?: string | null; email?: string | null },
  request: Request,
  options: { plannedDaysCount?: number } = {},
) {
  const timestamp = new Date().toISOString()
  const { plannedDaysCount } = options

  // Collect additional information based on config
  const ip = AUTH_CONFIG.collectIPAddresses ? headers().get("x-forwarded-for") || "unknown" : undefined
  const userAgent = AUTH_CONFIG.collectUserAgents ? request.headers.get("user-agent") || "unknown" : undefined

  const log = {
    timestamp,
    userId: user.id,
    username: user.name || "Unknown User",
    email: user.email || "unknown",
    success: true, // Assume success since we're logging *after* login
    ip: ip || "unknown",
    userAgent: userAgent || "unknown",
    plannedDaysCount: plannedDaysCount || 0,
  }

  try {
    // Try to save to database first
    await sql`
      INSERT INTO login_logs (timestamp, user_id, username, email, success, ip, user_agent, planned_days_count)
      VALUES (
        ${timestamp},
        ${user.id},
        ${user.name || "Unknown User"},
        ${user.email || "unknown"},
        ${true},
        ${ip || "unknown"},
        ${userAgent || "unknown"},
        ${plannedDaysCount || 0}
      )
    `
    console.log(`Login log saved to database for user ${user.email}`)
  } catch (dbError) {
    console.error(`Error saving login log to database for user ${user.email}:`, dbError)

    // Try Redis as fallback
    try {
      const key = `login:${user.id}:${timestamp}`
      await kv.set(key, log)
      console.log(`Login log saved to Redis for user ${user.email}`)
    } catch (redisError) {
      console.error(`Error saving login log to Redis for user ${user.email}:`, redisError)

      // Use memory as last resort
      memoryLogs.push(log)
      console.log(`Login log saved to memory for user ${user.email}`)
    }
  }
}

// Function to create a test log entry
export async function createTestLog(source = "test") {
  const timestamp = new Date().toISOString()
  const log = {
    timestamp,
    userId: `test-user-${source}`,
    username: `test-user-${source}`,
    email: `test-${source}@example.com`,
    success: true,
    ip: "test-ip",
    userAgent: "test-agent",
    plannedDaysCount: Math.floor(Math.random() * 30), // Random number of planned days
  }

  try {
    // Try to save to database first
    await sql`
      INSERT INTO login_logs (timestamp, user_id, username, email, success, ip, user_agent, planned_days_count)
      VALUES (
        ${timestamp},
        ${log.userId},
        ${log.username},
        ${log.email},
        ${log.success},
        ${log.ip},
        ${log.userAgent},
        ${log.plannedDaysCount}
      )
    `
    console.log("Test log saved to database")
    return { success: true, message: "Test log saved to database", source }
  } catch (dbError) {
    console.error("Error saving test log to database:", dbError)

    // Try Redis as fallback
    try {
      const key = `login:${log.userId}:${timestamp}`
      await kv.set(key, log)
      console.log("Test log saved to Redis")
      return { success: true, message: "Test log saved to Redis", source }
    } catch (redisError) {
      console.error("Error saving test log to Redis:", redisError)

      // Use memory as last resort
      memoryLogs.push(log)
      console.log("Test log saved to memory")
      return { success: true, message: "Test log saved to memory", source }
    }
  }
}

// Function to create a direct memory log entry
export async function createDirectMemoryLog() {
  const timestamp = new Date().toISOString()
  const log = {
    timestamp,
    userId: "direct-memory-test",
    username: "direct-memory-test",
    email: "memory@example.com",
    success: true,
    ip: "memory-ip",
    userAgent: "memory-agent",
    plannedDaysCount: Math.floor(Math.random() * 30), // Random number of planned days
  }

  memoryLogs.push(log)
  console.log("Direct memory log created")
  return { success: true, message: "Direct memory log created" }
}

// Function to get all login logs
export async function getAllLoginLogs() {
  let dbLogs = []
  let redisLogs = []

  // Try to get logs from database
  try {
    const result = await sql`
      SELECT * FROM login_logs 
      ORDER BY timestamp DESC 
      LIMIT 100
    `

    dbLogs = result.rows.map((row) => ({
      timestamp: row.timestamp,
      userId: row.user_id,
      username: row.username,
      email: row.email,
      success: row.success,
      ip: row.ip,
      userAgent: row.user_agent,
      plannedDaysCount: row.planned_days_count || 0,
      source: "database",
    }))
    console.log(`Retrieved ${dbLogs.length} logs from database`)
  } catch (dbError) {
    console.error("Error retrieving logs from database:", dbError)
  }

  // Try to get logs from Redis
  try {
    const keys = await kv.keys("login:*")
    if (keys.length > 0) {
      const values = await kv.mget(...keys)
      redisLogs = values.map((log: any) => ({
        ...log,
        source: "redis",
      }))
      console.log(`Retrieved ${redisLogs.length} logs from Redis`)
    }
  } catch (redisError) {
    console.error("Error retrieving logs from Redis:", redisError)
  }

  // Get logs from memory
  const memoryLogsWithSource = memoryLogs.map((log) => ({
    ...log,
    source: "memory",
  }))
  console.log(`Retrieved ${memoryLogsWithSource.length} logs from memory`)

  // Combine all logs and sort by timestamp (newest first)
  const allLogs = [...dbLogs, ...redisLogs, ...memoryLogsWithSource].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return allLogs
}

// Function to delete a login log
export async function deleteLoginLog(timestamp: string, source: string) {
  try {
    if (source === "database") {
      await sql`DELETE FROM login_logs WHERE timestamp = ${timestamp}`
      return { success: true, message: "Log deleted from database" }
    } else if (source === "redis") {
      // For Redis, we need to find the key first
      const keys = await kv.keys("login:*")
      for (const key of keys) {
        const log = await kv.get(key)
        if (log && log.timestamp === timestamp) {
          await kv.del(key)
          return { success: true, message: "Log deleted from Redis" }
        }
      }
      return { success: false, message: "Log not found in Redis" }
    } else if (source === "memory") {
      const initialLength = memoryLogs.length
      memoryLogs = memoryLogs.filter((log) => log.timestamp !== timestamp)

      if (memoryLogs.length < initialLength) {
        return { success: true, message: "Log deleted from memory" }
      } else {
        return { success: false, message: "Log not found in memory" }
      }
    } else {
      return { success: false, message: "Unknown log source" }
    }
  } catch (error) {
    console.error("Error deleting log:", error)
    return { success: false, message: `Error deleting log: ${error instanceof Error ? error.message : String(error)}` }
  }
}

