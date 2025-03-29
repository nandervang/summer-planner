import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if login_logs table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'login_logs'
      );
    `

    const tableExists = tableCheck.rows[0].exists

    if (!tableExists) {
      // Create login_logs table
      await sql`
        CREATE TABLE login_logs (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          success BOOLEAN NOT NULL,
          ip VARCHAR(255),
          user_agent TEXT,
          planned_days_count INTEGER DEFAULT 0
        );
      `
      return NextResponse.json({ success: true, message: "Login logs table created" })
    }

    // Check if planned_days_count column exists
    try {
      await sql`SELECT planned_days_count FROM login_logs LIMIT 1`
    } catch (error) {
      // Column doesn't exist, add it
      await sql`ALTER TABLE login_logs ADD COLUMN planned_days_count INTEGER DEFAULT 0`
      return NextResponse.json({ success: true, message: "Login logs table updated with planned_days_count column" })
    }

    return NextResponse.json({ success: true, message: "Login logs table already exists and is up to date" })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

