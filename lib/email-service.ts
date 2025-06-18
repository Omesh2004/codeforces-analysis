import nodemailer from "nodemailer"
import type { Student } from "./models/Student"

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

class EmailService {
  private transporter: nodemailer.Transporter | null

  constructor() {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email service not configured - email features will be disabled")
      this.transporter = null
      return
    }

    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    }

    try {
      this.transporter = nodemailer.createTransport(config)
    } catch (error) {
      console.error("Failed to initialize email service:", error)
      this.transporter = null
    }
  }

  async sendReminderEmail(student: Student): Promise<boolean> {
    if (!this.transporter) {
      console.warn("Email service not configured - skipping reminder email")
      return false
    }

    try {
      const mailOptions = {
        from: `"Student Progress System" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: "Time to get back to problem solving! 🚀",
        html: this.generateReminderEmailHTML(student),
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log("Reminder email sent:", info.messageId)
      return true
    } catch (error) {
      console.error("Failed to send reminder email:", error)
      return false
    }
  }

  async sendWelcomeEmail(student: Student): Promise<boolean> {
    if (!this.transporter) {
      console.warn("Email service not configured - skipping welcome email")
      return false
    }

    try {
      const mailOptions = {
        from: `"Student Progress System" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: "Welcome to Student Progress Management System! 🎉",
        html: this.generateWelcomeEmailHTML(student),
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log("Welcome email sent:", info.messageId)
      return true
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      return false
    }
  }

  private generateReminderEmailHTML(student: Student): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reminder: Get Back to Problem Solving</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Time to Code!</h1>
            <p>We miss seeing your submissions, ${student.name}!</p>
          </div>
          <div class="content">
            <p>Hi ${student.name},</p>
            
            <p>We noticed you haven't made any submissions in the last 7 days. Consistent practice is key to improving your competitive programming skills!</p>
            
            <div class="stats">
              <h3>Your Current Stats:</h3>
              <p><strong>Codeforces Handle:</strong> ${student.codeforcesHandle}</p>
              <p><strong>Current Rating:</strong> ${student.currentRating}</p>
              <p><strong>Max Rating:</strong> ${student.maxRating}</p>
            </div>
            
            <p>Here are some suggestions to get back on track:</p>
            <ul>
              <li>Start with problems rated 100-200 points below your current rating</li>
              <li>Try to solve at least 2-3 problems daily</li>
              <li>Participate in upcoming contests</li>
              <li>Review your previous submissions for learning opportunities</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://codeforces.com/profile/${student.codeforcesHandle}" class="button">
                View Your Codeforces Profile
              </a>
            </div>
            
            <p>Remember, every expert was once a beginner. Keep coding, keep learning!</p>
            
            <p>Best regards,<br>Student Progress Management Team</p>
          </div>
          <div class="footer">
            <p>This is reminder #${student.reminderCount + 1}. You can disable these emails by contacting your instructor.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateWelcomeEmailHTML(student: Student): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Student Progress Management</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome!</h1>
            <p>You've been added to the Student Progress Management System</p>
          </div>
          <div class="content">
            <p>Hi ${student.name},</p>
            
            <p>Welcome to our Student Progress Management System! We're excited to help you track and improve your competitive programming journey.</p>
            
            <div class="feature">
              <h4>📊 What we'll track for you:</h4>
              <ul>
                <li>Contest participation and rating changes</li>
                <li>Problem solving statistics and progress</li>
                <li>Submission patterns and activity</li>
                <li>Performance analytics and insights</li>
              </ul>
            </div>
            
            <div class="feature">
              <h4>🔄 Automatic Data Sync:</h4>
              <p>We'll automatically sync your Codeforces data daily to keep your progress up-to-date.</p>
            </div>
            
            <div class="feature">
              <h4>📧 Smart Reminders:</h4>
              <p>If you're inactive for more than 7 days, we'll send you a friendly reminder to keep coding!</p>
            </div>
            
            <p><strong>Your Profile Details:</strong></p>
            <ul>
              <li><strong>Name:</strong> ${student.name}</li>
              <li><strong>Email:</strong> ${student.email}</li>
              <li><strong>Codeforces Handle:</strong> ${student.codeforcesHandle}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://codeforces.com/profile/${student.codeforcesHandle}" class="button">
                Visit Your Codeforces Profile
              </a>
            </div>
            
            <p>Happy coding and best of luck with your competitive programming journey!</p>
            
            <p>Best regards,<br>Student Progress Management Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.log("Email service not configured")
      return false
    }

    try {
      await this.transporter.verify()
      console.log("Email service is ready")
      return true
    } catch (error) {
      console.error("Email service configuration error:", error)
      return false
    }
  }
}

export const emailService = new EmailService()
