// Codeforces API integration utilities
// This script provides functions to interact with the Codeforces API

const fetch = require("node-fetch")

class CodeforcesAPI {
  constructor() {
    this.baseURL = "https://codeforces.com/api"
    this.rateLimitDelay = 1000 // 1 second between requests
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async makeRequest(endpoint) {
    try {
      await this.delay(this.rateLimitDelay)
      const response = await fetch(`${this.baseURL}${endpoint}`)
      const data = await response.json()

      if (data.status !== "OK") {
        throw new Error(`API Error: ${data.comment}`)
      }

      return data.result
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error)
      throw error
    }
  }

  async getUserInfo(handle) {
    return await this.makeRequest(`/user.info?handles=${handle}`)
  }

  async getUserRating(handle) {
    return await this.makeRequest(`/user.rating?handle=${handle}`)
  }

  async getUserSubmissions(handle, from = 1, count = 100000) {
    return await this.makeRequest(`/user.status?handle=${handle}&from=${from}&count=${count}`)
  }

  async getContestList() {
    return await this.makeRequest("/contest.list")
  }

  async getContestStandings(contestId, handles) {
    const handlesParam = handles.join(";")
    return await this.makeRequest(`/contest.standings?contestId=${contestId}&handles=${handlesParam}`)
  }
}

// Example usage
async function syncStudentData(handle) {
  const api = new CodeforcesAPI()

  try {
    console.log(`Syncing data for ${handle}...`)

    const userInfo = await api.getUserInfo(handle)
    const ratings = await api.getUserRating(handle)
    const submissions = await api.getUserSubmissions(handle)

    console.log(`User: ${userInfo[0].firstName} ${userInfo[0].lastName}`)
    console.log(`Current Rating: ${userInfo[0].rating}`)
    console.log(`Max Rating: ${userInfo[0].maxRating}`)
    console.log(`Total Submissions: ${submissions.length}`)

    // Process and store the data in your database
    // ...

    return {
      userInfo: userInfo[0],
      ratings,
      submissions,
      syncTime: new Date(),
    }
  } catch (error) {
    console.error(`Failed to sync data for ${handle}:`, error)
    throw error
  }
}

module.exports = { CodeforcesAPI, syncStudentData }
