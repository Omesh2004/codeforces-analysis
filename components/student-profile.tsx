"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContestHistory } from "@/components/contest-history"
import { ProblemSolvingData } from "@/components/problem-solving-data"
import { Calendar, Trophy, Target, TrendingUp, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface StudentProfileProps {
  student: any
}

export function StudentProfile({ student }: StudentProfileProps) {
  const [contestFilter, setContestFilter] = useState("30")
  const [problemFilter, setProblemFilter] = useState("30")
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Helper function to safely parse dates
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date()
    if (dateValue instanceof Date) return dateValue
    return new Date(dateValue)
  }

  const lastUpdated = parseDate(student.lastUpdated)

  const handleRecalculateContests = async () => {
    try {
      setIsRecalculating(true)
      const response = await fetch(`/api/students/${student._id}/recalculate-contests`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully recalculated problem counts for ${result.updatedCount} contests`)
        // Refresh the page or trigger a re-fetch
        window.location.reload()
      } else {
        alert("Failed to recalculate contest stats")
      }
    } catch (error) {
      console.error("Failed to recalculate:", error)
      alert("Failed to recalculate contest stats")
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription className="text-base">
                {student.email} • {student.codeforcesHandle}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={student.isActive ? "default" : "destructive"}>
                {student.isActive ? "Active" : "Inactive"}
              </Badge>
              {student.reminderCount > 0 && <Badge variant="outline">{student.reminderCount} reminders sent</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Current Rating</p>
                <p className="text-lg font-semibold">{student.currentRating || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Max Rating</p>
                <p className="text-lg font-semibold">{student.maxRating || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Rating Difference</p>
                <p
                  className={`text-lg font-semibold ${(student.maxRating - student.currentRating) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {student.maxRating - student.currentRating >= 0 ? "+" : ""}
                  {student.maxRating - student.currentRating}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm">{lastUpdated.toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="contests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contests">Contest History</TabsTrigger>
          <TabsTrigger value="problems">Problem Solving</TabsTrigger>
        </TabsList>

        <TabsContent value="contests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Contest History</CardTitle>
                  <CardDescription>Track contest participation and rating changes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRecalculateContests} disabled={isRecalculating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? "animate-spin" : ""}`} />
                    {isRecalculating ? "Recalculating..." : "Fix Problem Counts"}
                  </Button>
                  <Select value={contestFilter} onValueChange={setContestFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last 365 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ContestHistory student={student} filter={contestFilter} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Problem Solving Data</CardTitle>
                  <CardDescription>Analyze problem solving patterns and progress</CardDescription>
                </div>
                <Select value={problemFilter} onValueChange={setProblemFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ProblemSolvingData student={student} filter={problemFilter} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
