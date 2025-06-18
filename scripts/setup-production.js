// Production setup script
// Run this after deploying to set up indexes and initial configuration

const { MongoClient } = require("mongodb")

async function setupProduction() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI environment variable is required")
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("student_progress")

    // Create collections and indexes
    console.log("Creating indexes...")

    // Students collection indexes
    await db.collection("students").createIndex({ email: 1 }, { unique: true })
    await db.collection("students").createIndex({ codeforcesHandle: 1 }, { unique: true })
    await db.collection("students").createIndex({ isActive: 1 })
    await db.collection("students").createIndex({ lastUpdated: -1 })

    // Contests collection indexes
    await db.collection("contests").createIndex({ studentId: 1, contestId: 1 }, { unique: true })
    await db.collection("contests").createIndex({ studentId: 1, participationDate: -1 })

    // Submissions collection indexes
    await db.collection("submissions").createIndex({ studentId: 1, submissionId: 1 }, { unique: true })
    await db.collection("submissions").createIndex({ studentId: 1, submissionTime: -1 })
    await db.collection("submissions").createIndex({ studentId: 1, verdict: 1 })

    // Sync logs collection indexes
    await db.collection("sync_logs").createIndex({ studentId: 1, timestamp: -1 })
    await db.collection("sync_logs").createIndex({ timestamp: -1 })

    console.log("Indexes created successfully!")

    // Test email configuration
    console.log("Testing email configuration...")
    const { emailService } = require("../lib/email-service")
    const emailConfigured = await emailService.testConnection()

    if (emailConfigured) {
      console.log("✅ Email service configured correctly")
    } else {
      console.log("❌ Email service configuration failed")
    }

    // Test Codeforces API
    console.log("Testing Codeforces API...")
    const { codeforcesAPI } = require("../lib/codeforces-api")
    try {
      await codeforcesAPI.getUserInfo("tourist") // Test with a known user
      console.log("✅ Codeforces API working correctly")
    } catch (error) {
      console.log("❌ Codeforces API test failed:", error.message)
    }

    console.log("\n🎉 Production setup completed!")
    console.log("\nNext steps:")
    console.log("1. Set up a cron job to call /api/cron/sync daily")
    console.log("2. Configure your email provider credentials")
    console.log("3. Test the application with real student data")
  } catch (error) {
    console.error("Setup failed:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

setupProduction()
