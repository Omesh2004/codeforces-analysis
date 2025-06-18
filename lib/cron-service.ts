import { getDatabase } from "./mongodb"
import { codeforcesAPI } from "./codeforces-api"
import { emailService } from "./email-service"
import type { Student, Contest, Submission, SyncLog } from "./models/Student"
import { ObjectId } from "mongodb"

export class CronService {
  private async syncStudentData(student: Student): Promise<SyncLog> {
    const db = await getDatabase()
    const syncLog: Partial<SyncLog> = {
      studentId: student._id!,
      syncType: "automatic",
      timestamp: new Date(),
      dataFetched: { contests: 0, submissions: 0 },
    }

    try {
      console.log(`Syncing data for ${student.name} (${student.codeforcesHandle})`)

      // Fetch user info to update current rating
      const userInfo = await codeforcesAPI.getUserInfo(student.codeforcesHandle)
      if (userInfo.length > 0) {
        const user = userInfo[0]
        await db.collection("students").updateOne(
          { _id: student._id },
          {
            $set: {
              currentRating: user.rating || 0,
              maxRating: Math.max(user.maxRating || 0, student.maxRating),
              lastUpdated: new Date(),
              updatedAt: new Date(),
            },
          },
        )
      }

      // Fetch and store submissions first
      const submissions = await codeforcesAPI.getUserSubmissions(student.codeforcesHandle)
      let newSubmissions = 0
      let latestSubmissionDate = student.lastSubmissionDate

      // Create a map to track solved problems by contest
      const contestProblems = new Map<number, Set<string>>()

      for (const submission of submissions) {
        const submissionDate = new Date(submission.creationTimeSeconds * 1000)

        const submissionDoc: Partial<Submission> = {
          studentId: student._id!,
          submissionId: submission.id,
          contestId: submission.contestId,
          problemName: submission.problem.name,
          problemRating: submission.problem.rating,
          verdict: submission.verdict,
          submissionTime: submissionDate,
          programmingLanguage: submission.programmingLanguage,
          createdAt: new Date(),
        }

        const result = await db
          .collection("submissions")
          .updateOne({ studentId: student._id, submissionId: submission.id }, { $set: submissionDoc }, { upsert: true })

        if (result.upsertedCount > 0) {
          newSubmissions++
        }

        // Track solved problems per contest (only accepted submissions)
        if (submission.verdict === "OK" && submission.contestId && submission.problem.index) {
          if (!contestProblems.has(submission.contestId)) {
            contestProblems.set(submission.contestId, new Set())
          }
          // Use the problem index from the API (A, B, C, D, etc.)
          contestProblems.get(submission.contestId)!.add(submission.problem.index)
        }

        if (!latestSubmissionDate || submissionDate > latestSubmissionDate) {
          latestSubmissionDate = submissionDate
        }
      }

      // Fetch and store contest history with accurate problem counts
      const contests = await codeforcesAPI.getUserRating(student.codeforcesHandle)
      for (const contest of contests) {
        // Get the number of unique problems solved in this contest
        const solvedProblems = contestProblems.get(contest.contestId)?.size || 0

        // Estimate total problems based on contest name and type
        let totalProblems = 5 // Default for most contests

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
        } else if (contestName.includes("kotlin")) {
          totalProblems = 6
        } else if (contestName.includes("hello")) {
          totalProblems = 6
        }

        const contestDoc: Partial<Contest> = {
          studentId: student._id!,
          contestId: contest.contestId,
          contestName: contest.contestName,
          participationDate: new Date(contest.ratingUpdateTimeSeconds * 1000),
          rank: contest.rank,
          ratingChange: contest.newRating - contest.oldRating,
          newRating: contest.newRating,
          problemsSolved: solvedProblems,
          totalProblems: totalProblems,
          createdAt: new Date(),
        }

        await db
          .collection("contests")
          .updateOne({ studentId: student._id, contestId: contest.contestId }, { $set: contestDoc }, { upsert: true })

        console.log(`Contest ${contest.contestName}: ${solvedProblems}/${totalProblems} problems`)
      }
      syncLog.dataFetched!.contests = contests.length

      // Update student's last submission date and activity status
      const daysSinceLastSubmission = latestSubmissionDate
        ? Math.floor((Date.now() - latestSubmissionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      await db.collection("students").updateOne(
        { _id: student._id },
        {
          $set: {
            lastSubmissionDate: latestSubmissionDate,
            isActive: daysSinceLastSubmission <= 7,
            updatedAt: new Date(),
          },
        },
      )

      syncLog.dataFetched!.submissions = newSubmissions
      syncLog.status = "success"
      syncLog.message = `Successfully synced ${contests.length} contests and ${newSubmissions} new submissions`
    } catch (error) {
      console.error(`Failed to sync data for ${student.name}:`, error)
      syncLog.status = "error"
      syncLog.message = error instanceof Error ? error.message : "Unknown error"
    }

    // Save sync log
    await db.collection("sync_logs").insertOne(syncLog as SyncLog)
    return syncLog as SyncLog
  }

  async runDailySync(): Promise<{ success: number; errors: number; remindersSent: number }> {
    console.log("Starting daily sync job...")
    const db = await getDatabase()

    const students = (await db.collection("students").find({}).toArray()) as Student[]
    let successCount = 0
    let errorCount = 0
    let remindersSent = 0

    for (const student of students) {
      try {
        const syncResult = await this.syncStudentData(student)

        if (syncResult.status === "success") {
          successCount++

          // Check if student needs a reminder email
          if (student.emailEnabled && !student.isActive) {
            const daysSinceLastSubmission = student.lastSubmissionDate
              ? Math.floor((Date.now() - student.lastSubmissionDate.getTime()) / (1000 * 60 * 60 * 24))
              : 999

            if (daysSinceLastSubmission >= 7) {
              const emailSent = await emailService.sendReminderEmail(student)
              if (emailSent) {
                await db.collection("students").updateOne(
                  { _id: student._id },
                  {
                    $inc: { reminderCount: 1 },
                    $set: { updatedAt: new Date() },
                  },
                )
                remindersSent++
              }
            }
          }
        } else {
          errorCount++
        }
      } catch (error) {
        console.error(`Error processing student ${student.name}:`, error)
        errorCount++
      }

      // Add delay between students to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    console.log(`Daily sync completed: ${successCount} success, ${errorCount} errors, ${remindersSent} reminders sent`)

    return {
      success: successCount,
      errors: errorCount,
      remindersSent,
    }
  }

  async syncSingleStudent(studentId: string): Promise<SyncLog> {
    const db = await getDatabase()
    const student = (await db.collection("students").findOne({ _id: new ObjectId(studentId) })) as Student

    if (!student) {
      throw new Error("Student not found")
    }

    const syncLog = await this.syncStudentData(student)
    syncLog.syncType = "manual"

    return syncLog
  }
}

export const cronService = new CronService()
