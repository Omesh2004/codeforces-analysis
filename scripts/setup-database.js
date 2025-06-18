// Database setup script for MongoDB
// Run this to set up your MongoDB collections and indexes

const { MongoClient } = require("mongodb")

async function setupDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017")

  try {
    await client.connect()
    const db = client.db("student_progress")

    // Create students collection
    const studentsCollection = db.collection("students")
    await studentsCollection.createIndex({ email: 1 }, { unique: true })
    await studentsCollection.createIndex({ codeforcesHandle: 1 }, { unique: true })

    // Create contests collection
    const contestsCollection = db.collection("contests")
    await contestsCollection.createIndex({ studentId: 1, contestId: 1 }, { unique: true })

    // Create submissions collection
    const submissionsCollection = db.collection("submissions")
    await submissionsCollection.createIndex({ studentId: 1, submissionId: 1 }, { unique: true })
    await submissionsCollection.createIndex({ studentId: 1, creationTimeSeconds: -1 })

    // Create sync_logs collection
    const syncLogsCollection = db.collection("sync_logs")
    await syncLogsCollection.createIndex({ studentId: 1, timestamp: -1 })

    console.log("Database setup completed successfully!")
  } catch (error) {
    console.error("Database setup failed:", error)
  } finally {
    await client.close()
  }
}

setupDatabase()
