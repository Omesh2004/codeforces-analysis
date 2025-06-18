"use client"

import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SubmissionHeatmapProps {
  studentId?: string
}

// Generate mock submission data for the past year
const generateHeatmapData = () => {
  const data = []
  const today = new Date()
  const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const submissions = Math.floor(Math.random() * 8) // 0-7 submissions per day
    data.push({
      date: new Date(d),
      count: submissions,
      level: submissions === 0 ? 0 : submissions <= 2 ? 1 : submissions <= 4 ? 2 : submissions <= 6 ? 3 : 4,
    })
  }

  return data
}

type HeatmapDay = {
  date: Date
  count: number
  level: number
}

export function SubmissionHeatmap({ studentId }: SubmissionHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // For now, use mock data. In the future, this could fetch real submission data
    setHeatmapData(generateHeatmapData())
  }, [studentId])

  const getIntensityColor = (level: number) => {
    const colors = [
      "bg-gray-100 dark:bg-gray-800", // 0 submissions
      "bg-green-200 dark:bg-green-900", // 1-2 submissions
      "bg-green-300 dark:bg-green-700", // 3-4 submissions
      "bg-green-400 dark:bg-green-600", // 5-6 submissions
      "bg-green-500 dark:bg-green-500", // 7+ submissions
    ]
    return colors[level] || colors[0]
  }

  if (!mounted) {
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

  // Create a proper grid starting from the first Sunday of the year
  const createWeeklyGrid = () => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // Find the first Sunday on or before our start date
    const firstSunday = new Date(oneYearAgo)
    firstSunday.setDate(oneYearAgo.getDate() - oneYearAgo.getDay())

    // Create a map of dates to submission data for quick lookup
    const dataMap = new Map()
    heatmapData.forEach((item) => {
      const dateKey = item.date.toDateString()
      dataMap.set(dateKey, item)
    })

    const weeks = []
    const currentDate = new Date(firstSunday)

    // Generate weeks until we reach today
    while (currentDate <= today) {
      const week = []

      // Generate 7 days for this week
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
          week.push(null) // Empty cell for dates outside our range
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      weeks.push(week)
    }

    return weeks
  }

  const weeks = createWeeklyGrid()

  // Generate month labels based on the actual weeks
  const getMonthLabels = () => {
    const labels: { index: number; label: string }[] = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find((day) => day !== null)
      if (firstDayOfWeek && weekIndex % 4 === 0) {
        // Show label every 4 weeks
        const month = firstDayOfWeek.date.getMonth()
        labels.push({
          index: weekIndex,
          label: monthNames[month],
        })
      }
    })

    return labels
  }

  const monthLabels = getMonthLabels()
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`} />
            ))}
          </div>
          <span>More</span>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex mb-2 ml-8">
              {monthLabels.map((monthLabel) => (
                <div
                  key={monthLabel.index}
                  className="text-xs text-muted-foreground"
                  style={{
                    marginLeft:
                      monthLabel.index === 0
                        ? "0"
                        : `${(monthLabel.index - (monthLabels[monthLabels.indexOf(monthLabel) - 1]?.index || 0)) * 16}px`,
                  }}
                >
                  {monthLabel.label}
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
        <div className="text-xs text-muted-foreground">
          {heatmapData.length} days tracked • {heatmapData.reduce((sum, day) => sum + day.count, 0)} total submissions
        </div>
      </div>
    </TooltipProvider>
  )
}
