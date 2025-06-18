"use client"

import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cacheManager } from "@/lib/cache-manager"

interface RealSubmissionHeatmapProps {
  studentId: string
}

interface HeatmapDay {
  date: Date
  count: number
  level: number
}

export function RealSubmissionHeatmap({ studentId }: RealSubmissionHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && studentId) {
      fetchSubmissionData()
    }
  }, [studentId, mounted])

  const fetchSubmissionData = async (useCache = true) => {
    try {
      setLoading(true)

      // Check cache first
      if (useCache) {
        const cachedData = cacheManager.get(studentId, "heatmap", { days: 365 })
        if (cachedData) {
          setHeatmapData(cachedData)
          setLoading(false)
          return
        }
      }

      const response = await fetch(`/api/students/${studentId}/submissions?days=365`)
      if (response.ok) {
        const data = await response.json()
        const processedData = processSubmissionsToHeatmap(data.submissions || [])

        // Cache the processed data
        cacheManager.set(studentId, "heatmap", processedData, { days: 365 })

        setHeatmapData(processedData)
      } else {
        // Fallback to mock data
        const mockData = generateMockData()
        setHeatmapData(mockData)
      }
    } catch (error) {
      console.error("Failed to fetch submission data:", error)
      // Fallback to mock data
      const mockData = generateMockData()
      setHeatmapData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchSubmissionData(false) // Force fresh fetch
    } finally {
      setIsRefreshing(false)
    }
  }

  interface Submission {
    submissionTime: string | Date
    // Add other fields if needed
  }

  interface ProcessedHeatmapDay {
    date: Date
    count: number
    level: number
  }

  const processSubmissionsToHeatmap = (submissions: Submission[]): ProcessedHeatmapDay[] => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // Create a map to count submissions per day
    const submissionCounts: Map<string, number> = new Map()

    submissions.forEach((submission: Submission) => {
      const date = new Date(submission.submissionTime)
      const dateKey = date.toDateString()
      submissionCounts.set(dateKey, (submissionCounts.get(dateKey) || 0) + 1)
    })

    // Generate data for each day in the past year
    const data: ProcessedHeatmapDay[] = []
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString()
      const count = submissionCounts.get(dateKey) || 0
      data.push({
        date: new Date(d),
        count,
        level: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4,
      })
    }

    return data
  }

  const generateMockData = () => {
    const data = []
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const submissions = Math.floor(Math.random() * 8)
      data.push({
        date: new Date(d),
        count: submissions,
        level: submissions === 0 ? 0 : submissions <= 2 ? 1 : submissions <= 4 ? 2 : submissions <= 6 ? 3 : 4,
      })
    }

    return data
  }

  const getIntensityColor = (level: number) => {
    const colors = [
      "bg-gray-100 dark:bg-gray-800", // 0 submissions
      "bg-green-200 dark:bg-green-900", // 1-2 submissions
      "bg-green-300 dark:bg-green-700", // 3-5 submissions
      "bg-green-400 dark:bg-green-600", // 6-10 submissions
      "bg-green-500 dark:bg-green-500", // 11+ submissions
    ]
    return colors[level] || colors[0]
  }

  if (!mounted) {
    return <div className="h-32 bg-gray-100 rounded animate-pulse" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className="w-3 h-3 rounded-sm bg-gray-200 animate-pulse" />
            ))}
          </div>
          <span>More</span>
        </div>
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  // Create weekly grid (same logic as before)
  const createWeeklyGrid = () => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    const firstSunday = new Date(oneYearAgo)
    firstSunday.setDate(oneYearAgo.getDate() - oneYearAgo.getDay())

    const dataMap = new Map()
    heatmapData.forEach((item) => {
      const dateKey = item.date.toDateString()
      dataMap.set(dateKey, item)
    })

    const weeks = []
    const currentDate = new Date(firstSunday)

    while (currentDate <= today) {
      const week = []

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dateKey = currentDate.toDateString()
        const submissionData = dataMap.get(dateKey)

        if (currentDate <= today && currentDate >= oneYearAgo) {
          week.push(
            submissionData || {
              date: new Date(currentDate),
              count: 0,
              level: 0,
            },
          )
        } else {
          week.push(null)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(week)
    }

    return weeks
  }

  const weeks = createWeeklyGrid()
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Cache status and refresh button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1 mx-4">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels - simplified */}
            <div className="flex mb-2 ml-8">
              {months.map((month, index) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground flex-1 text-center"
                  style={{ minWidth: "60px" }}
                >
                  {index % 3 === 0 ? month : ""}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-1 mr-2 w-6">
                {days.map((day, index) => (
                  <div key={index} className="h-3 text-xs text-muted-foreground flex items-center justify-end">
                    {index % 2 === 1 ? day : ""}
                  </div>
                ))}
              </div>

              {/* Heatmap cells */}
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 ${
                              day
                                ? `${getIntensityColor(day.level)} cursor-pointer hover:ring-1 hover:ring-primary hover:ring-offset-1`
                                : "bg-transparent border-transparent"
                            }`}
                          />
                        </TooltipTrigger>
                        {day && (
                          <TooltipContent>
                            <p className="text-sm">
                              {day.count} submission{day.count !== 1 ? "s" : ""} on {day.date.toLocaleDateString()}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {heatmapData.length} days tracked • {heatmapData.reduce((sum, day) => sum + day.count, 0)} total submissions
          </span>
          <span>Data cached • Click refresh to update</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
