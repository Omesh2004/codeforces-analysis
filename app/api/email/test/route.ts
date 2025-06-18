import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email, type = "test" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Test email configuration
    const isConfigured = await emailService.testConnection()

    if (!isConfigured) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Send test email
    const mockStudent = {
      _id: undefined,
      name: "Test Student",
      email,
      phone: "+1234567890",
      codeforcesHandle: "test_handle",
      currentRating: 1500,
      maxRating: 1600,
      lastUpdated: new Date(),
      isActive: false,
      reminderCount: 0,
      emailEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    let success = false
    if (type === "welcome") {
      success = await emailService.sendWelcomeEmail(mockStudent)
    } else {
      success = await emailService.sendReminderEmail(mockStudent)
    }

    if (success) {
      return NextResponse.json({ message: "Test email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Email test failed:", error)
    return NextResponse.json({ error: "Email test failed" }, { status: 500 })
  }
}
