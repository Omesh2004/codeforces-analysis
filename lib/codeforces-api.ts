interface CodeforcesUser {
  handle: string
  email?: string
  vkId?: string
  openId?: string
  firstName?: string
  lastName?: string
  country?: string
  city?: string
  organization?: string
  contribution: number
  rank: string
  rating: number
  maxRank: string
  maxRating: number
  lastOnlineTimeSeconds: number
  registrationTimeSeconds: number
  friendOfCount: number
  avatar: string
  titlePhoto: string
}

interface CodeforcesRatingChange {
  contestId: number
  contestName: string
  handle: string
  rank: number
  ratingUpdateTimeSeconds: number
  oldRating: number
  newRating: number
}

interface CodeforcesSubmission {
  id: number
  contestId?: number
  creationTimeSeconds: number
  relativeTimeSeconds: number
  problem: {
    contestId?: number
    index: string
    name: string
    type: string
    rating?: number
    tags: string[]
  }
  author: {
    contestId?: number
    members: Array<{
      handle: string
    }>
    participantType: string
    ghost: boolean
    startTimeSeconds?: number
  }
  programmingLanguage: string
  verdict: string
  testset: string
  passedTestCount: number
  timeConsumedMillis: number
  memoryConsumedBytes: number
}

export class CodeforcesAPI {
  private baseURL = "https://codeforces.com/api"
  private rateLimitDelay = 2000 // Increased to 2 seconds between requests
  private maxRetries = 3
  private retryDelay = 5000 // 5 seconds between retries

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async makeRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
    try {
      await this.delay(this.rateLimitDelay)

      console.log(`Making request to: ${this.baseURL}${endpoint}`)
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          "User-Agent": "Student-Progress-Management-System/1.0",
        },
      })

      if (!response.ok) {
        if (response.status === 503 && retryCount < this.maxRetries) {
          console.log(
            `API returned 503, retrying in ${this.retryDelay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`,
          )
          await this.delay(this.retryDelay)
          return this.makeRequest<T>(endpoint, retryCount + 1)
        }

        if (response.status === 429) {
          // Rate limited, wait longer and retry
          console.log(`Rate limited, waiting ${this.retryDelay * 2}ms before retry...`)
          await this.delay(this.retryDelay * 2)
          if (retryCount < this.maxRetries) {
            return this.makeRequest<T>(endpoint, retryCount + 1)
          }
        }

        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== "OK") {
        if (data.comment && data.comment.includes("not found") && retryCount < this.maxRetries) {
          console.log(`User not found, retrying... (attempt ${retryCount + 1}/${this.maxRetries})`)
          await this.delay(this.retryDelay)
          return this.makeRequest<T>(endpoint, retryCount + 1)
        }
        throw new Error(`Codeforces API Error: ${data.comment}`)
      }

      return data.result
    } catch (error) {
      if (
        retryCount < this.maxRetries &&
        error instanceof Error &&
        (error.message.includes("503") || error.message.includes("ECONNRESET") || error.message.includes("ETIMEDOUT"))
      ) {
        console.log(
          `Request failed, retrying in ${this.retryDelay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`,
        )
        await this.delay(this.retryDelay)
        return this.makeRequest<T>(endpoint, retryCount + 1)
      }

      console.error(`Failed to fetch ${endpoint}:`, error)
      throw error
    }
  }

  async getUserInfo(handle: string): Promise<CodeforcesUser[]> {
    try {
      return await this.makeRequest<CodeforcesUser[]>(`/user.info?handles=${handle}`)
    } catch (error) {
      console.error(`Failed to get user info for ${handle}:`, error)
      throw error
    }
  }

  async getUserRating(handle: string): Promise<CodeforcesRatingChange[]> {
    try {
      return await this.makeRequest<CodeforcesRatingChange[]>(`/user.rating?handle=${handle}`)
    } catch (error) {
      // User might not have participated in any rated contests
      if (
        error instanceof Error &&
        (error.message.includes("not found") || error.message.includes("no rating changes"))
      ) {
        console.log(`No rating history found for ${handle}`)
        return []
      }
      console.error(`Failed to get rating for ${handle}:`, error)
      throw error
    }
  }

  async getUserSubmissions(handle: string, from = 1, count = 100000): Promise<CodeforcesSubmission[]> {
    try {
      // For large submission counts, we might hit API limits, so let's be more conservative
      const safeCount = Math.min(count, 50000) // Limit to 50k submissions
      return await this.makeRequest<CodeforcesSubmission[]>(
        `/user.status?handle=${handle}&from=${from}&count=${safeCount}`,
      )
    } catch (error) {
      console.error(`Failed to get submissions for ${handle}:`, error)
      throw error
    }
  }

  async getContestList(): Promise<any[]> {
    try {
      return await this.makeRequest<any[]>("/contest.list")
    } catch (error) {
      console.error("Failed to get contest list:", error)
      throw error
    }
  }

  async validateHandle(handle: string): Promise<boolean> {
    try {
      const users = await this.getUserInfo(handle)
      return users.length > 0
    } catch (error) {
      console.error(`Failed to validate handle ${handle}:`, error)
      return false
    }
  }

  // Helper method to check if API is available
  async isAPIAvailable(): Promise<boolean> {
    try {
      await this.makeRequest<any[]>("/contest.list?gym=false")
      return true
    } catch (error) {
      console.error("Codeforces API is not available:", error)
      return false
    }
  }
}

export const codeforcesAPI = new CodeforcesAPI()
