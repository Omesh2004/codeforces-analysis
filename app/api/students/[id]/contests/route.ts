import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const db = await getDatabase()
    const studentId = new ObjectId(params.id)

    // Calculate date filter
    const filterDate = new Date()
    filterDate.setDate(filterDate.getDate() - days)

    // Get contests from database first
    const contests = await db
      .collection("contests")
      .find({
        studentId,
        participationDate: { $gte: filterDate },
      })
      .sort({ participationDate: -1 })
      .toArray()

    // Check if Codeforces API is available before trying to fetch fresh data
    const { codeforcesAPI } = await import("@/lib/codeforces-api")
    const isAPIAvailable = await codeforcesAPI.isAPIAvailable()

    if (!isAPIAvailable) {
      console.log("Codeforces API is not available, returning cached data")
      return NextResponse.json(
        contests.map((contest) => ({
          ...contest,
          problemsSolved: contest.problemsSolved || 0,
          totalProblems: contest.totalProblems || 5,
          _note: "Data from cache - API unavailable",
        })),
      )
    }

    // Try to update contests with missing problem counts, but don't fail if API is down
    const contestsWithProblemCounts = await Promise.allSettled(
      contests.map(async (contest) => {
        // If we already have problem counts, return as is
        if (contest.problemsSolved !== undefined && contest.problemsSolved > 0) {
          return contest
        }

        try {
          // Get the student's Codeforces handle
          const student = await db.collection("students").findOne({ _id: studentId })
          if (!student) return contest

          // Get submissions for this specific contest from API
          const allSubmissions = await codeforcesAPI.getUserSubmissions(student.codeforcesHandle, 1, 10000)

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
          }

          // Update the contest document with calculated values
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

          return {
            ...contest,
            problemsSolved,
            totalProblems,
          }
        } catch (error) {
          console.error(`Failed to calculate problems for contest ${contest.contestId}:`, error)
          // Return contest with default values if API call fails
          return {
            ...contest,
            problemsSolved: contest.problemsSolved || 0,
            totalProblems: contest.totalProblems || 5,
            _error: "Failed to fetch fresh data",
          }
        }
      }),
    )

    // Handle both successful and failed promises
    const finalContests = contestsWithProblemCounts.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.error(`Failed to process contest ${contests[index].contestName}:`, result.reason)
        return {
          ...contests[index],
          problemsSolved: contests[index].problemsSolved || 0,
          totalProblems: contests[index].totalProblems || 5,
          _error: "Processing failed",
        }
      }
    })

    return NextResponse.json(finalContests)
  } catch (error) {
    console.error("Failed to fetch contests:", error)
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 })
  }
}
