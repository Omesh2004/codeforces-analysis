"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Globe, RefreshCw, CheckCircle, XCircle, User } from "lucide-react"

type HandleResult = {
  success: boolean
  error?: string
  details?: string
  userInfo?: {
    firstName?: string
    lastName?: string
    rating?: number
    maxRating?: number
    rank?: string
    maxRank?: string
    country?: string
  }
} | null

export function CodeforcesTestPanel() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [testHandleValue, setTestHandleValue] = useState("tourist")
  const [handleResult, setHandleResult] = useState<HandleResult>(null)
  const [loading, setLoading] = useState(false)

  const checkApiStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/codeforces/status")
      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      setApiStatus({
        status: "error",
        message: "Failed to check API status",
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const testHandle = async () => {
    if (!testHandleValue) return

    try {
      setLoading(true)
      setHandleResult(null)

      // Test handle validation
      const response = await fetch("/api/codeforces/test-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: testHandleValue }),
      })

      const data = await response.json()
      setHandleResult(data)
    } catch (error) {
      setHandleResult({
        success: false,
        error: "Failed to test handle",
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Codeforces API Testing
        </CardTitle>
        <CardDescription>Test Codeforces API connectivity and handle validation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Status Check */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">API Status</h3>
            <Button onClick={checkApiStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Check Status
            </Button>
          </div>

          {apiStatus && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {apiStatus.status === "available" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <Badge variant={apiStatus.status === "available" ? "default" : "destructive"}>
                  {apiStatus.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm">{apiStatus.message}</p>
              {apiStatus.suggestion && <p className="text-xs text-muted-foreground mt-1">{apiStatus.suggestion}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Checked: {new Date(apiStatus.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Handle Testing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Codeforces Handle</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="test-handle">Codeforces Handle</Label>
              <Input
                id="test-handle"
                placeholder="Enter handle (e.g., tourist)"
                value={testHandleValue}
                onChange={(e) => setTestHandleValue(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={testHandle} disabled={loading || !testHandleValue}>
                Test Handle
              </Button>
            </div>
          </div>

          {handleResult && (
            <div
              className={`p-4 rounded-lg border ${
                handleResult.success
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {handleResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <strong>{handleResult.success ? "Valid Handle!" : "Invalid Handle!"}</strong>
              </div>

              {handleResult.success && handleResult.userInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {handleResult.userInfo.firstName} {handleResult.userInfo.lastName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Current Rating:</strong> {handleResult.userInfo.rating || "Unrated"}
                    </div>
                    <div>
                      <strong>Max Rating:</strong> {handleResult.userInfo.maxRating || "Unrated"}
                    </div>
                    <div>
                      <strong>Rank:</strong> {handleResult.userInfo.rank || "Unranked"}
                    </div>
                    <div>
                      <strong>Max Rank:</strong> {handleResult.userInfo.maxRank || "Unranked"}
                    </div>
                  </div>
                  {handleResult.userInfo.country && (
                    <p className="text-sm">
                      <strong>Country:</strong> {handleResult.userInfo.country}
                    </p>
                  )}
                </div>
              )}

              {!handleResult.success && <p className="text-sm">{handleResult.error}</p>}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2">API Information:</h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Codeforces API has rate limits (1 request per 2 seconds)</li>
            <li>API may be temporarily unavailable during maintenance</li>
            <li>Handle validation checks if a user exists on Codeforces</li>
            <li>System automatically retries failed requests</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
