"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Trophy, Target, Calendar, TrendingUp, RefreshCw } from "lucide-react"
import { RealSubmissionHeatmap } from "@/components/real-submission-heatmap"
import { useStudentData } from "@/hooks/use-student-data"
import { useState } from "react"

interface ProblemSolvingDataProps {
  student: any
  filter: string
}

export function ProblemSolvingData({ student, filter }: ProblemSolvingDataProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: submissionData,
    loading,
    error,
    refetch,
    clearCache,
  } = useStudentData({
    studentId: student._id,
    endpoint: "submissions",
    params: { days: filter },
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearCache = () => {
    clearCache()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                    <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading problem data: {error}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
          <Button variant="outline" onClick={handleClearCache}>
            Clear Cache
          </Button>
        </div>
      </div>
    )
  }

  const problemData = submissionData?.stats

  return (
    <div className="space-y-6">
      {/* Cache status and controls */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Data cached • Last updated: {new Date().toLocaleTimeString()}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearCache}>
            Clear Cache
          </Button>
        </div>
      </div>

      {problemData ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hardest Problem</p>
                    <p className="text-lg font-bold">{problemData.mostDifficultProblem?.problemRating || 0}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {problemData.mostDifficultProblem?.problemName || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Solved</p>
                    <p className="text-2xl font-bold">{problemData.totalProblems || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold">{problemData.averageRating || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Problems/Day</p>
                    <p className="text-2xl font-bold">{problemData.averageProblemsPerDay || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution Chart */}
          {problemData.ratingDistribution && problemData.ratingDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Problems by Rating</CardTitle>
                <CardDescription>Distribution of solved problems across rating ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={problemData.ratingDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Heatmap with caching */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Activity</CardTitle>
              <CardDescription>Daily submission activity over the past year</CardDescription>
            </CardHeader>
            <CardContent>
              <RealSubmissionHeatmap studentId={student._id} />
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Notable problem solving milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problemData.mostDifficultProblem?.problemRating > 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Solved hardest problem yet!</p>
                      <p className="text-sm text-muted-foreground">
                        {problemData.mostDifficultProblem?.problemName || "N/A"}
                      </p>
                    </div>
                    <Badge variant="default">{problemData.mostDifficultProblem?.problemRating || 0}</Badge>
                  </div>
                )}
                {problemData.totalProblems > 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Problems solved milestone</p>
                      <p className="text-sm text-muted-foreground">
                        Total problems solved: {problemData.totalProblems || 0}
                      </p>
                    </div>
                    <Badge variant="secondary">Milestone</Badge>
                  </div>
                )}
                {problemData.averageProblemsPerDay > 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Consistent solver</p>
                      <p className="text-sm text-muted-foreground">
                        {problemData.averageProblemsPerDay || 0} problems per day average
                      </p>
                    </div>
                    <Badge variant="outline">Streak</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-8">No data available</div>
      )}
    </div>
  )
}
