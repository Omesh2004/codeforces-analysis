"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Database, RefreshCw, Users, Trophy, FileText, Clock, CheckCircle, XCircle } from "lucide-react"

type TroubleshootingSteps = {
  [key: string]: string;
};

type DatabaseSuccessData = {
  success: true;
  message: string;
  collections: {
    students: number;
    contests: number;
    submissions: number;
    sync_logs: number;
  };
  databaseInfo: {
    name: string;
    size: number;
    collections: number;
    indexes: number;
  };
  sampleStudents?: Array<{
    _id: string;
    name: string;
    email: string;
    codeforcesHandle: string;
    createdAt: string;
  }>;
};

type DatabaseErrorData = {
  success: false;
  error: string;
  details?: string;
  solution?: string;
  troubleshooting?: TroubleshootingSteps;
  connectionInfo?: {
    mongodbUri: string;
    nodeEnv: string;
  };
};

type DatabaseData = DatabaseSuccessData | DatabaseErrorData | null;

export function DatabaseTestPanel() {
  const [dbData, setDbData] = useState<DatabaseData>(null)
  const [loading, setLoading] = useState(false)

  const checkDatabase = async () => {
    try {
      setLoading(true)

      // First test if the API route exists
      const testResponse = await fetch("/api/test")
      if (!testResponse.ok) {
        throw new Error("API routes are not accessible. Please restart your development server.")
      }

      const response = await fetch("/api/debug/database")

      if (response.status === 404) {
        throw new Error("Database debug API route not found. Please restart your development server.")
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response. This usually indicates a server error.")
      }

      const data = await response.json()
      setDbData(data)
    } catch (error) {
      console.error("Failed to check database:", error)
      setDbData({
        success: false,
        error: "Failed to connect to database",
        details: error instanceof Error ? error.message : String(error),
        solution: "Check the troubleshooting steps below",
        troubleshooting: {
          step1: "Restart your development server (npm run dev)",
          step2: "Check if .env.local file exists with MONGODB_URI",
          step3: "Ensure MongoDB is running on your system",
          step4: "Check browser console for additional errors",
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Information
            </CardTitle>
            <CardDescription>View database statistics and connection status</CardDescription>
          </div>
          <Button onClick={checkDatabase} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Check Database
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {dbData ? (
          dbData.success ? (
            <>
              {/* Success State */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Database Connected Successfully!</AlertTitle>
                <AlertDescription>{dbData.message}</AlertDescription>
              </Alert>

              {/* Collection Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Students</p>
                        <p className="text-2xl font-bold">{dbData.collections.students}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contests</p>
                        <p className="text-2xl font-bold">{dbData.collections.contests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Submissions</p>
                        <p className="text-2xl font-bold">{dbData.collections.submissions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sync Logs</p>
                        <p className="text-2xl font-bold">{dbData.collections.sync_logs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Database Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Database Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Database Name:</strong> {dbData.databaseInfo.name}
                  </div>
                  <div>
                    <strong>Data Size:</strong> {Math.round(dbData.databaseInfo.size / 1024)} KB
                  </div>
                  <div>
                    <strong>Collections:</strong> {dbData.databaseInfo.collections}
                  </div>
                  <div>
                    <strong>Indexes:</strong> {dbData.databaseInfo.indexes}
                  </div>
                </div>
              </div>

              {/* Sample Students */}
              {dbData.sampleStudents && dbData.sampleStudents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recent Students</h3>
                  <div className="space-y-2">
                    {dbData.sampleStudents.map((student) => (
                      <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{student.codeforcesHandle}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Error State */}
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Database Connection Failed</AlertTitle>
                <AlertDescription>{dbData.error}</AlertDescription>
              </Alert>

              {/* Error Details */}
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Error Details:</h4>
                  <p className="text-sm text-red-600 dark:text-red-300">{dbData.details}</p>
                  {dbData.solution && (
                    <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                      <strong>Solution:</strong> {dbData.solution}
                    </p>
                  )}
                </div>

                {/* Connection Info */}
                {dbData.connectionInfo && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Connection Information:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>MongoDB URI:</strong> {dbData.connectionInfo.mongodbUri}
                      </div>
                      <div>
                        <strong>Environment:</strong> {dbData.connectionInfo.nodeEnv}
                      </div>
                    </div>
                  </div>
                )}

                {/* Troubleshooting Steps */}
                {dbData.troubleshooting && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Troubleshooting Steps:</h4>
                    <div className="space-y-2">
                      {Object.entries(dbData.troubleshooting).map(([step, description]) => (
                        <div key={step} className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">
                            {step}
                          </Badge>
                          <p className="text-sm">{String(description)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click "Check Database" to test connection</p>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium mb-2">MongoDB Setup Instructions:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>1. Install MongoDB:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Windows: Download from mongodb.com</li>
                <li>
                  Mac: <code>brew install mongodb-community</code>
                </li>
                <li>
                  Linux: <code>sudo apt install mongodb</code>
                </li>
              </ul>
            </div>
            <div>
              <strong>2. Start MongoDB:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Windows: Start MongoDB service</li>
                <li>
                  Mac: <code>brew services start mongodb/brew/mongodb-community</code>
                </li>
                <li>
                  Linux: <code>sudo systemctl start mongod</code>
                </li>
              </ul>
            </div>
            <div>
              <strong>3. Add to .env.local:</strong>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                MONGODB_URI=mongodb://localhost:27017/student_progress
              </code>
            </div>
            <div>
              <strong>4. Restart your development server</strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
