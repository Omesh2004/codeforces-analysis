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

    const submissions = await db
      .collection("submissions")
      .find({
        studentId,
        submissionTime: { $gte: filterDate },
        verdict: "OK", // Only accepted submissions
      })
      .sort({ submissionTime: -1 })
      .toArray()

    // Calculate statistics
    const stats = {
      totalProblems: submissions.length,
      averageRating:
        submissions.length > 0
          ? Math.round(submissions.reduce((sum, sub) => sum + (sub.problemRating || 0), 0) / submissions.length)
          : 0,
      averageProblemsPerDay: submissions.length > 0 ? (submissions.length / days).toFixed(1) : "0",
      mostDifficultProblem: submissions.reduce(
        (max, sub) => ((sub.problemRating || 0) > (max.problemRating || 0) ? sub : max),
        { problemRating: 0, problemName: "None", submissionTime: new Date() },
      ),
      ratingDistribution: calculateRatingDistribution(submissions),
    }

    return NextResponse.json({
      submissions,
      stats,
    })
  } catch (error) {
    console.error("Failed to fetch submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

function calculateRatingDistribution(submissions: any[]) {
  const buckets = [
    { rating: "800-999", count: 0 },
    { rating: "1000-1199", count: 0 },
    { rating: "1200-1399", count: 0 },
    { rating: "1400-1599", count: 0 },
    { rating: "1600-1799", count: 0 },
    { rating: "1800-1999", count: 0 },
    { rating: "2000+", count: 0 },
  ]

  submissions.forEach((sub) => {
    const rating = sub.problemRating || 0
    if (rating >= 800 && rating < 1000) buckets[0].count++
    else if (rating >= 1000 && rating < 1200) buckets[1].count++
    else if (rating >= 1200 && rating < 1400) buckets[2].count++
    else if (rating >= 1400 && rating < 1600) buckets[3].count++
    else if (rating >= 1600 && rating < 1800) buckets[4].count++
    else if (rating >= 1800 && rating < 2000) buckets[5].count++
    else if (rating >= 2000) buckets[6].count++
  })

  return buckets
}
