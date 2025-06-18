"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

type ApiTestResult = {
  name: string
  url: string
  description: string
  status: string
  statusCode: number
  responseTime: number
  isJson?: boolean
  data?: any
  error?: string
}

export default function DebugPage() {
  const [apiTests, setApiTests] = useState<ApiTestResult[]>([])
  const [loading, setLoading] = useState(false)

  const testRoutes = [
    { name: "Basic API Test", url: "/api/test", description: "Test if API routes are working" },
    { name: "Health Check", url: "/api/health", description: "System health status" },
    { name: "Database Debug", url: "/api/debug/database", description: "Database connection test" },
    { name: "Students API", url: "/api/students", description: "Students data endpoint" },
    { name: "Email Debug", url: "/api/email/debug", description: "Email configuration test" },
  ]

  const runAllTests = async () => {
    setLoading(true)
    const results = []

    for (const route of testRoutes) {
      try {
        const startTime = Date.now()
        const response = await fetch(route.url)
        const endTime = Date.now()
        const responseTime = endTime - startTime

        let data = null
        let isJson = false

        try {
          data = await response.json()
          isJson = true
        } catch {
          data = await response.text()
        }

        results.push({
          ...route,
          status: response.ok ? "success" : "error",
          statusCode: response.status,
          responseTime,
          isJson,
          data: isJson ? data : { message: data.substring(0, 200) + "..." },
        })
      } catch (error) {
        results.push({
          ...route,
          status: "error",
          statusCode: 0,
          responseTime: 0,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    setApiTests(results)
    setLoading(false)
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "error":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Debug Dashboard</h1>
            <p className="text-muted-foreground">Test all API endpoints and system components</p>
          </div>
          <Button onClick={runAllTests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Run All Tests
          </Button>
        </div>

        <div className="grid gap-4">
          {apiTests.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      {test.name}
                    </CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(test.status)}>{test.statusCode || "FAILED"}</Badge>
                    {test.responseTime > 0 && <Badge variant="outline">{test.responseTime}ms</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>URL:</strong> <code>{test.url}</code>
                  </div>
                  {test.error && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {test.error}
                    </div>
                  )}
                  {test.data && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">Response Data</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Current URL:</strong> {typeof window !== "undefined" ? window.location.origin : "N/A"}
              </div>
              <div>
                <strong>User Agent:</strong>{" "}
                {typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 50) + "..." : "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Fixes */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>404 Errors:</strong> Restart development server with <code>npm run dev</code>
              </div>
              <div>
                <strong>Database Errors:</strong> Check if MongoDB is running and .env.local is configured
              </div>
              <div>
                <strong>JSON Errors:</strong> Usually indicates server-side error, check terminal logs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
