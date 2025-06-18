import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { emailService } from "@/lib/email-service"
import { codeforcesAPI } from "@/lib/codeforces-api"

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      email: "unknown",
      codeforces: "unknown",
    },
  }

  // Test database connection
  try {
    await getDatabase()
    health.services.database = "connected"
  } catch (error) {
    health.services.database = "error"
    health.status = "degraded"
  }

  // Test email service
  try {
    const emailConfigured = await emailService.testConnection()
    health.services.email = emailConfigured ? "configured" : "not_configured"
  } catch (error) {
    health.services.email = "error"
  }

  // Test Codeforces API
  try {
    await codeforcesAPI.validateHandle("tourist") // Test with a known user
    health.services.codeforces = "available"
  } catch (error) {
    health.services.codeforces = "error"
    health.status = "degraded"
  }

  return NextResponse.json(health)
}
