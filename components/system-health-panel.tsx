"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from "lucide-react"

type HealthData = {
  status: string
  timestamp?: string
  services: {
    database: string
    email: string
    codeforces: string
  }
  error?: string
}

export function SystemHealthPanel() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)

  const checkSystemHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error("Failed to check system health:", error)
      setHealthData({
        status: "error",
        services: {
          database: "error",
          email: "error",
          codeforces: "error",
        },
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSystemHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "available":
      case "configured":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "not_configured":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error":
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "available":
      case "configured":
        return "default"
      case "not_configured":
        return "secondary"
      case "error":
      default:
        return "destructive"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Check
            </CardTitle>
            <CardDescription>Monitor the status of all system components</CardDescription>
          </div>
          <Button onClick={checkSystemHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {healthData ? (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthData.status)}
                <div>
                  <h3 className="font-medium">Overall System Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Last checked: {healthData.timestamp ? new Date(healthData.timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusColor(healthData.status)}>{healthData.status.toUpperCase()}</Badge>
            </div>

            {/* Service Status */}
            <div className="grid gap-4">
              <h3 className="text-lg font-medium">Service Status</h3>

              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthData.services.database)}
                    <div>
                      <h4 className="font-medium">MongoDB Database</h4>
                      <p className="text-sm text-muted-foreground">Student data storage</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(healthData.services.database)}>{healthData.services.database}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthData.services.email)}
                    <div>
                      <h4 className="font-medium">Email Service</h4>
                      <p className="text-sm text-muted-foreground">Reminder notifications</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(healthData.services.email)}>{healthData.services.email}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthData.services.codeforces)}
                    <div>
                      <h4 className="font-medium">Codeforces API</h4>
                      <p className="text-sm text-muted-foreground">Contest and submission data</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(healthData.services.codeforces)}>
                    {healthData.services.codeforces}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Recommendations</h3>
              <div className="space-y-2">
                {healthData.services.email === "not_configured" && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm">
                      <strong>Email Service:</strong> Configure email settings in .env.local to enable reminder
                      notifications.
                    </p>
                  </div>
                )}
                {healthData.services.database === "error" && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm">
                      <strong>Database:</strong> Check MongoDB connection string and ensure database is running.
                    </p>
                  </div>
                )}
                {healthData.services.codeforces === "error" && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm">
                      <strong>Codeforces API:</strong> API might be temporarily unavailable. Data sync will retry
                      automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click "Refresh" to check system health</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
