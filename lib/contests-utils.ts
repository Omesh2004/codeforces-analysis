import { codeforcesAPI } from "./codeforces-api"

interface ContestProblemCount {
  contestId: number
  totalProblems: number
  problemsSolved: number
}

export class ContestUtils {
  // Cache for contest problem counts to avoid repeated API calls
  private static contestCache = new Map<number, number>()

  static async getContestProblemCount(contestId: number): Promise<number> {
    // Check cache first
    if (this.contestCache.has(contestId)) {
      return this.contestCache.get(contestId)!
    }

    try {
      // Try to get contest details from Codeforces API
      const contests = await codeforcesAPI.getContestList()
      const contest = contests.find((c) => c.id === contestId)

      if (contest) {
        // Estimate based on contest type and phase
        let problemCount = 5 // Default

        if (contest.name.includes("Educational")) {
          problemCount = 6
        } else if (contest.name.includes("Div. 3")) {
          problemCount = 6
        } else if (contest.name.includes("Div. 4")) {
          problemCount = 6
        } else if (contest.name.includes("Div. 2")) {
          problemCount = 5
        } else if (contest.name.includes("Div. 1")) {
          problemCount = 5
        } else if (contest.name.includes("Global")) {
          problemCount = 6
        }

        this.contestCache.set(contestId, problemCount)
        return problemCount
      }
    } catch (error) {
      console.warn(`Could not fetch contest details for ${contestId}:`, error)
    }

    // Fallback to default
    const defaultCount = 5
    this.contestCache.set(contestId, defaultCount)
    return defaultCount
  }

  static async calculateContestStats(
    studentId: string,
    contestId: number,
    submissions: any[],
  ): Promise<{ problemsSolved: number; totalProblems: number }> {
    // Count unique solved problems in this contest
    const solvedProblems = new Set<string>()

    submissions
      .filter((sub) => sub.contestId === contestId && sub.verdict === "OK")
      .forEach((sub) => solvedProblems.add(sub.problem.index))

    const problemsSolved = solvedProblems.size
    const totalProblems = await this.getContestProblemCount(contestId)

    return { problemsSolved, totalProblems }
  }
}
