import { type NextRequest, NextResponse } from "next/server"
import { cronService } from "@/lib/cron-service"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting scheduled sync job...")
    const results = await cronService.runDailySync()

    return NextResponse.json({
      message: "Daily sync completed successfully",
      results,
    })
  } catch (error) {
    console.error("Daily sync job failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Sync job failed",
      },
      { status: 500 },
    )
  }
}
