import { type NextRequest, NextResponse } from "next/server"
import { codeforcesAPI } from "@/lib/codeforces-api"

export async function POST(request: NextRequest) {
  try {
    const { handle } = await request.json()

    if (!handle) {
      return NextResponse.json({ error: "Handle is required" }, { status: 400 })
    }

    // Test the handle
    const userInfo = await codeforcesAPI.getUserInfo(handle)

    if (userInfo && userInfo.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Handle '${handle}' is valid`,
        userInfo: userInfo[0],
      })
    } else {
      return NextResponse.json({
        success: false,
        error: `Handle '${handle}' not found`,
      })
    }
  } catch (error) {
    console.error("Handle test failed:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to validate handle",
      details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error),
    })
  }
}
