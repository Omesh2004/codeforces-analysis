import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { codeforcesAPI } from "@/lib/codeforces-api"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const student = await db.collection("students").findOne({ _id: new ObjectId(params.id) })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error("Failed to fetch student:", error)
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, email, phone, codeforcesHandle, currentRating, maxRating, emailEnabled } = body

    const db = await getDatabase()
    const existingStudent = await db.collection("students").findOne({ _id: new ObjectId(params.id) })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if the new handle is different and valid
    let shouldSyncData = false
    if (codeforcesHandle && codeforcesHandle !== existingStudent.codeforcesHandle) {
      const isValidHandle = await codeforcesAPI.validateHandle(codeforcesHandle)
      if (!isValidHandle) {
        return NextResponse.json({ error: "Invalid Codeforces handle" }, { status: 400 })
      }
      shouldSyncData = true
    }

    // Check for duplicate email or handle (excluding current student)
    if (email !== existingStudent.email || codeforcesHandle !== existingStudent.codeforcesHandle) {
      const duplicateStudent = await db.collection("students").findOne({
        _id: { $ne: new ObjectId(params.id) },
        $or: [{ email }, { codeforcesHandle }],
      })

      if (duplicateStudent) {
        return NextResponse.json(
          {
            error: "Another student with this email or Codeforces handle already exists",
          },
          { status: 409 },
        )
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(codeforcesHandle && { codeforcesHandle }),
      ...(currentRating !== undefined && { currentRating }),
      ...(maxRating !== undefined && { maxRating }),
      ...(emailEnabled !== undefined && { emailEnabled }),
      lastUpdated: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("students").updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    // If Codeforces handle changed, trigger immediate sync
    if (shouldSyncData) {
      setTimeout(async () => {
        try {
          const { cronService } = await import("@/lib/cron-service")
          await cronService.syncSingleStudent(params.id)
        } catch (error) {
          console.error("Failed to sync updated data:", error)
        }
      }, 1000)
    }

    const updatedStudent = await db.collection("students").findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error("Failed to update student:", error)
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()

    // Delete student and all related data
    const studentId = new ObjectId(params.id)

    await Promise.all([
      db.collection("students").deleteOne({ _id: studentId }),
      db.collection("contests").deleteMany({ studentId }),
      db.collection("submissions").deleteMany({ studentId }),
      db.collection("sync_logs").deleteMany({ studentId }),
    ])

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Failed to delete student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
