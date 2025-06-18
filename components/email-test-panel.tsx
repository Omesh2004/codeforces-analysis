"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react"

type TestResult = {
  success: boolean
  message?: string
  details?: string
} | null

export function EmailTestPanel() {
  type EmailConfig = {
    emailConfigured: boolean
    environment: {
      EMAIL_HOST?: string
      EMAIL_PORT?: string
      EMAIL_USER?: string
      EMAIL_PASS?: string
    }
  } | null

  const [emailConfig, setEmailConfig] = useState<EmailConfig>(null)
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult>(null)

  const checkEmailConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/email/debug")
      const data = await response.json()
      setEmailConfig(data)
    } catch (error) {
      console.error("Failed to check email config:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return

    try {
      setLoading(true)
      setTestResult(null)

      const response = await fetch("/api/email/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        message: data.message || data.error,
        details: data.details,
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to send test email",
        details: typeof error === "object" && error !== null && "message" in error ? String((error as any).message) : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Service Testing
        </CardTitle>
        <CardDescription>Test your email configuration and send test emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Check */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email Configuration</h3>
            <Button onClick={checkEmailConfig} disabled={loading}>
              Check Config
            </Button>
          </div>

          {emailConfig && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {emailConfig.emailConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>Email Service: {emailConfig.emailConfigured ? "Configured" : "Not Configured"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Host:</strong> {emailConfig.environment.EMAIL_HOST}
                </div>
                <div>
                  <strong>Port:</strong> {emailConfig.environment.EMAIL_PORT}
                </div>
                <div>
                  <strong>User:</strong> {emailConfig.environment.EMAIL_USER}
                </div>
                <div>
                  <strong>Password:</strong> {emailConfig.environment.EMAIL_PASS}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Email */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Send Test Email</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={sendTestEmail} disabled={loading || !testEmail}>
                Send Test
              </Button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <strong>{testResult.success ? "Success!" : "Failed!"}</strong>
              </div>
              <p className="mt-1">{testResult.message}</p>
              {testResult.details && <p className="mt-1 text-sm opacity-75">{testResult.details}</p>}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Setup Instructions:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>
              Create <code>.env.local</code> file in project root
            </li>
            <li>Add Gmail credentials with app password</li>
            <li>Restart your development server</li>
            <li>Click "Check Config" to verify setup</li>
            <li>Send test email to confirm it's working</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
