import { NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function GET() {
  try {
    // Test email configuration
    const isConfigured = await emailService.testConnection()

    return NextResponse.json({
      emailConfigured: isConfigured,
      environment: {
        EMAIL_HOST: process.env.EMAIL_HOST || "Not set",
        EMAIL_PORT: process.env.EMAIL_PORT || "Not set",
        EMAIL_USER: process.env.EMAIL_USER || "Not set",
        EMAIL_PASS: process.env.EMAIL_PASS ? "Set (hidden)" : "Not set",
      },
      message: isConfigured ? "Email service is properly configured" : "Email service needs configuration",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Email configuration check failed",
        details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Test sending email
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

    const success = await emailService.sendWelcomeEmail(mockStudent)

    if (success) {
      return NextResponse.json({
        message: "Test email sent successfully!",
        sentTo: email,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to send test email",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Email test failed",
        details: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error),
      },
      { status: 500 },
    )
  }
}
