import type { ObjectId } from "mongodb"

export interface Student {
  _id?: ObjectId
  name: string
  email: string
  phone: string
  codeforcesHandle: string
  currentRating: number
  maxRating: number
  lastUpdated: Date
  isActive: boolean
  reminderCount: number
  emailEnabled: boolean
  lastSubmissionDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Contest {
  _id?: ObjectId
  studentId: ObjectId
  contestId: number
  contestName: string
  participationDate: Date
  rank: number
  ratingChange: number
  newRating: number
  problemsSolved: number
  totalProblems: number
  createdAt: Date
}

export interface Submission {
  _id?: ObjectId
  studentId: ObjectId
  submissionId: number
  contestId?: number
  problemName: string
  problemRating?: number
  verdict: string
  submissionTime: Date
  programmingLanguage: string
  createdAt: Date
}

export interface SyncLog {
  _id?: ObjectId
  studentId: ObjectId
  syncType: "manual" | "automatic"
  status: "success" | "error"
  message?: string
  timestamp: Date
  dataFetched: {
    contests: number
    submissions: number
  }
}
