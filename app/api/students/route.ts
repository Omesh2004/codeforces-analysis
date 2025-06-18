import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { codeforcesAPI } from "@/lib/codeforces-api"
import { emailService } from "@/lib/email-service"
import type { Student } from "@/lib/models/Student"

export async function GET() {
  try {
    const db = await getDatabase()
    const students = await db.collection("students").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(students)
  } catch (error) {
    console.error("Failed to fetch students:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, codeforcesHandle, currentRating, maxRating, emailEnabled } = body

    // Validate required fields
    if (!name || !email || !phone || !codeforcesHandle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if email or handle already exists
    const existingStudent = await db.collection("students").findOne({
      $or: [{ email }, { codeforcesHandle }],
    })

    if (existingStudent) {
      return NextResponse.json(
        {
          error: "Student with this email or Codeforces handle already exists",
        },
        { status: 409 },
      )
    }

    // Try to validate Codeforces handle, but don't fail if API is down
    let isValidHandle = true
    try {
      isValidHandle = await codeforcesAPI.validateHandle(codeforcesHandle)
      if (!isValidHandle) {
        return NextResponse.json({ error: "Invalid Codeforces handle" }, { status: 400 })
      }
    } catch (error) {
      console.warn("Could not validate Codeforces handle (API might be down):", error)
      // Continue without validation if Codeforces API is down
    }

    // Get current rating from Codeforces if not provided (optional)
    let finalCurrentRating = currentRating || 0
    let finalMaxRating = maxRating || 0

    try {
      const userInfo = await codeforcesAPI.getUserInfo(codeforcesHandle)
      if (userInfo.length > 0) {
        finalCurrentRating = userInfo[0].rating || 0
        finalMaxRating = userInfo[0].maxRating || 0
      }
    } catch (error) {
      console.warn("Could not fetch initial rating from Codeforces (using provided values):", error)
    }

    const newStudent: Partial<Student> = {
      name,
      email,
      phone,
      codeforcesHandle,
      currentRating: finalCurrentRating,
      maxRating: finalMaxRating,
      lastUpdated: new Date(),
      isActive: true,
      reminderCount: 0,
      emailEnabled: emailEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("students").insertOne(newStudent)
    const createdStudent = { ...newStudent, _id: result.insertedId }

    // Send welcome email (non-blocking)
    if (emailEnabled) {
      try {
        await emailService.sendWelcomeEmail(createdStudent as Student)
      } catch (error) {
        console.warn("Failed to send welcome email, but student was created successfully:", error)
      }
    }

    // Trigger initial data sync in background (non-blocking)
    setTimeout(async () => {
      try {
        const { cronService } = await import("@/lib/cron-service")
        await cronService.syncSingleStudent(result.insertedId.toString())
      } catch (error) {
        console.error("Failed to sync initial data, but student was created successfully:", error)
      }
    }, 1000)

    return NextResponse.json(createdStudent, { status: 201 })
  } catch (error) {
    console.error("Failed to create student:", error)
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}
