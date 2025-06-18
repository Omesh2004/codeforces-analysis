import { type NextRequest, NextResponse } from "next/server"
import { cronService } from "@/lib/cron-service"

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const syncResult = await cronService.syncSingleStudent(studentId)

    return NextResponse.json({
      message: "Data sync completed",
      result: syncResult,
    })
  } catch (error) {
    console.error("Failed to sync data:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync data",
      },
      { status: 500 },
    )
  }
}
