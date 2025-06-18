import { NextResponse } from "next/server"
import { codeforcesAPI } from "@/lib/codeforces-api"

export async function GET() {
  try {
    const isAvailable = await codeforcesAPI.isAPIAvailable()

    if (isAvailable) {
      return NextResponse.json({
        status: "available",
        message: "Codeforces API is working normally",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          status: "unavailable",
          message: "Codeforces API is currently unavailable",
          timestamp: new Date().toISOString(),
          suggestion: "Please try again later. The API might be down for maintenance.",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to check Codeforces API status",
        error: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
