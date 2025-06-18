import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { codeforcesAPI } from "@/lib/codeforces-api"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const contestId = searchParams.get("contestId")

    const db = await getDatabase()
    const studentId = new ObjectId(params.id)

    // Get student info
    const student = await db.collection("students").findOne({ _id: studentId })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get submissions from Codeforces API
    const allSubmissions = await codeforcesAPI.getUserSubmissions(student.codeforcesHandle)

    let filteredSubmissions = allSubmissions
    if (contestId) {
      filteredSubmissions = allSubmissions.filter((sub) => sub.contestId === Number.parseInt(contestId))
    }

    // Group by contest and show problem solving stats
    const contestStats = new Map()

    filteredSubmissions.forEach((sub) => {
      if (!sub.contestId) return

      if (!contestStats.has(sub.contestId)) {
        contestStats.set(sub.contestId, {
          contestId: sub.contestId,
          allSubmissions: [],
          acceptedSubmissions: [],
          uniqueProblems: new Set(),
        })
      }

      const stats = contestStats.get(sub.contestId)
      stats.allSubmissions.push({
        id: sub.id,
        problemIndex: sub.problem.index,
        problemName: sub.problem.name,
        verdict: sub.verdict,
        time: new Date(sub.creationTimeSeconds * 1000).toISOString(),
      })

      if (sub.verdict === "OK") {
        stats.acceptedSubmissions.push({
          id: sub.id,
          problemIndex: sub.problem.index,
          problemName: sub.problem.name,
          time: new Date(sub.creationTimeSeconds * 1000).toISOString(),
        })
        stats.uniqueProblems.add(sub.problem.index)
      }
    })

    // Convert to array and add counts
    const result = Array.from(contestStats.values()).map((stats) => ({
      ...stats,
      uniqueProblems: Array.from(stats.uniqueProblems),
      problemsSolved: stats.uniqueProblems.size,
      totalSubmissions: stats.allSubmissions.length,
      acceptedCount: stats.acceptedSubmissions.length,
    }))

    return NextResponse.json({
      student: {
        name: student.name,
        codeforcesHandle: student.codeforcesHandle,
      },
      contestStats: result,
      totalSubmissions: allSubmissions.length,
    })
  } catch (error) {
    console.error("Failed to debug submissions:", error)
    return NextResponse.json({ error: "Failed to debug submissions" }, { status: 500 })
  }
}
