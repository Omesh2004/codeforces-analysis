"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Calendar, Users, RefreshCw } from "lucide-react"
import { useStudentData } from "@/hooks/use-student-data"
import { useState } from "react"

interface ContestHistoryProps {
  student: any
  filter: string
}

export function ContestHistory({ student, filter }: ContestHistoryProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: contests,
    loading,
    error,
    refetch,
    clearCache,
  } = useStudentData({
    studentId: student._id,
    endpoint: "contests",
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
    window.location.reload() // Reload to fetch fresh data
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
        <p className="text-red-600 mb-4">Error loading contest data: {error}</p>
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

  const contestList = contests || []

  interface RatingDataPoint {
    date: string
    rating: number
    change: number
  }

  interface Contest {
    _id: string
    contestName: string
    participationDate?: string
    rank?: number
    ratingChange?: number
    newRating?: number
    problemsSolved?: number
    totalProblems?: number
  }

  const ratingData: RatingDataPoint[] = (contestList as Contest[])
    .filter((contest: Contest) => contest.participationDate)
    .map((contest: Contest) => ({
      date: new Date(contest.participationDate!).toLocaleDateString(),
      rating: contest.newRating as number,
      change: contest.ratingChange as number,
    }))
    .reverse()

  const totalRatingChange = (contestList as Contest[]).reduce(
    (sum: number, contest: Contest) => sum + (contest.ratingChange || 0),
    0
  )
  const averageRank: number =
    contestList.length > 0
      ? Math.round(
          (contestList as Contest[]).reduce(
            (sum: number, contest: Contest) => sum + (contest.rank || 0),
            0
          ) / contestList.length
        )
      : 0

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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Contests</p>
                <p className="text-2xl font-bold">{contestList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {totalRatingChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Rating Change</p>
                <p className={`text-2xl font-bold ${totalRatingChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalRatingChange >= 0 ? "+" : ""}
                  {totalRatingChange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rank</p>
                <p className="text-2xl font-bold">{averageRank}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Problems Solved</p>
                <p className="text-2xl font-bold">
                    {contestList.reduce((sum: number, contest: Contest) => sum + (contest.problemsSolved || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Graph */}
      {ratingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Progress</CardTitle>
            <CardDescription>Rating changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contest List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contests</CardTitle>
          <CardDescription>Detailed contest performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contest</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Rank</TableHead>
                  <TableHead className="text-center">Rating Change</TableHead>
                  <TableHead className="text-center">Problems</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contestList as Contest[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No contests found for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  (contestList as Contest[]).map((contest: Contest) => (
                    <TableRow key={contest._id}>
                      <TableCell className="font-medium">{contest.contestName}</TableCell>
                      <TableCell>
                        {contest.participationDate ? new Date(contest.participationDate).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">{contest.rank}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={contest.ratingChange !== undefined && contest.ratingChange >= 0 ? "default" : "destructive"}>
                          {contest.ratingChange !== undefined && contest.ratingChange >= 0 ? "+" : ""}
                          {contest.ratingChange}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {contest.problemsSolved || 0}/{contest.totalProblems || 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
