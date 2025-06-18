import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const studentId = new ObjectId(params.id)

    // Get student info
    const student = await db.collection("students").findOne({ _id: studentId })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if Codeforces API is available
    const { codeforcesAPI } = await import("@/lib/codeforces-api")
    const isAPIAvailable = await codeforcesAPI.isAPIAvailable()

    if (!isAPIAvailable) {
      return NextResponse.json(
        {
          error: "Codeforces API is currently unavailable. Please try again later.",
          suggestion: "The API might be down for maintenance or experiencing high load.",
        },
        { status: 503 },
      )
    }

    // Get all contests for this student
    const contests = await db.collection("contests").find({ studentId }).toArray()

    if (contests.length === 0) {
      return NextResponse.json({
        message: "No contests found for this student",
        updatedCount: 0,
      })
    }

    let updatedCount = 0
    let errorCount = 0
    const errors = []

    try {
      // Get all submissions once to avoid multiple API calls
      console.log(`Fetching submissions for ${student.codeforcesHandle}...`)
      const allSubmissions = await codeforcesAPI.getUserSubmissions(student.codeforcesHandle, 1, 50000)
      console.log(`Found ${allSubmissions.length} total submissions`)

      // Process each contest
      for (const contest of contests) {
        try {
          // Filter submissions for this specific contest that were accepted
          const contestSubmissions = allSubmissions.filter(
            (sub) => sub.contestId === contest.contestId && sub.verdict === "OK",
          )

          // Count unique problems solved using problem index
          const uniqueProblems = new Set()
          contestSubmissions.forEach((sub) => {
            if (sub.problem && sub.problem.index) {
              uniqueProblems.add(sub.problem.index)
            }
          })

          const problemsSolved = uniqueProblems.size

          // Estimate total problems based on contest name
          let totalProblems = 5 // Default
          const contestName = contest.contestName.toLowerCase()
          if (contestName.includes("educational")) {
            totalProblems = 7
          } else if (contestName.includes("div. 3")) {
            totalProblems = 7
          } else if (contestName.includes("div. 4")) {
            totalProblems = 8
          } else if (contestName.includes("global")) {
            totalProblems = 6
          } else if (contestName.includes("div. 1")) {
            totalProblems = 5
          } else if (contestName.includes("div. 2")) {
            totalProblems = 5
          }

          // Update the contest document
          await db.collection("contests").updateOne(
            { _id: contest._id },
            {
              $set: {
                problemsSolved,
                totalProblems,
                updatedAt: new Date(),
              },
            },
          )

          console.log(`Updated contest ${contest.contestName}: ${problemsSolved}/${totalProblems} problems`)
          updatedCount++

          // Small delay to avoid overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (contestError) {
          console.error(`Failed to process contest ${contest.contestName}:`, contestError)
          errors.push(
            `Contest ${contest.contestName}: ${
              contestError instanceof Error ? contestError.message : String(contestError)
            }`
          )
          errorCount++
        }
      }

      return NextResponse.json({
        message: `Recalculation completed: ${updatedCount} contests updated, ${errorCount} errors`,
        updatedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        totalSubmissions: allSubmissions.length,
      })
    } catch (apiError) {
      console.error("Failed to fetch submissions from Codeforces API:", apiError)
      return NextResponse.json(
        {
          error: "Failed to fetch data from Codeforces API",
          details: apiError instanceof Error ? apiError.message : String(apiError),
          suggestion: "The API might be temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("Failed to recalculate contest stats:", error)
    return NextResponse.json(
      {
        error: "Failed to recalculate contest stats",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
