"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SwedishHolidays } from "@/lib/holidays"

interface VacationDashboardProps {
  plannedDays: string[]
}

export function VacationDashboard({ plannedDays }: VacationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate statistics
  const totalDays = plannedDays.length
  const weekdayCount = countWeekdays(plannedDays)
  const weekendCount = totalDays - weekdayCount

  // Calculate days per month
  const juneCount = countDaysInMonth(plannedDays, 5, 2025) // June is month 5 (0-indexed)
  const julyCount = countDaysInMonth(plannedDays, 6, 2025)
  const augustCount = countDaysInMonth(plannedDays, 7, 2025)

  // Calculate longest streak
  const longestStreak = calculateLongestStreak(plannedDays)

  // Calculate overlap with holidays
  const holidayOverlap = calculateHolidayOverlap(plannedDays, SwedishHolidays)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vacation Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Days" value={totalDays} />
              <StatCard title="Weekdays" value={weekdayCount} />
              <StatCard title="Weekends" value={weekendCount} />
              <StatCard title="Longest Streak" value={longestStreak} suffix={longestStreak === 1 ? "day" : "days"} />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <MonthCard month="June" count={juneCount} color="amber" />
              <MonthCard month="July" count={julyCount} color="rose" />
              <MonthCard month="August" count={augustCount} color="emerald" />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Holiday Overlap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{holidayOverlap}</div>
                  <p className="text-xs text-muted-foreground">vacation days that fall on holidays</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {calculateEfficiencyScore(plannedDays, weekdayCount, holidayOverlap)}%
                  </div>
                  <p className="text-xs text-muted-foreground">based on weekends and holidays utilization</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function StatCard({ title, value, suffix = "" }: { title: string; value: number; suffix?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </div>
      </CardContent>
    </Card>
  )
}

function MonthCard({ month, count, color }: { month: string; count: number; color: string }) {
  const getColorClass = () => {
    switch (color) {
      case "amber":
        return "bg-amber-50 border-amber-200"
      case "rose":
        return "bg-rose-50 border-rose-200"
      case "emerald":
        return "bg-emerald-50 border-emerald-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <Card className={getColorClass()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{month}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">vacation days</p>
      </CardContent>
    </Card>
  )
}

// Helper functions
function countWeekdays(days: string[]): number {
  return days.filter((day) => {
    const date = new Date(day)
    const dayOfWeek = date.getDay()
    return dayOfWeek !== 0 && dayOfWeek !== 6 // 0 = Sunday, 6 = Saturday
  }).length
}

function countDaysInMonth(days: string[], month: number, year: number): number {
  return days.filter((day) => {
    const date = new Date(day)
    return date.getMonth() === month && date.getFullYear() === year
  }).length
}

function calculateLongestStreak(days: string[]): number {
  if (days.length === 0) return 0

  // Sort days
  const sortedDays = [...days].sort()

  let currentStreak = 1
  let maxStreak = 1

  for (let i = 1; i < sortedDays.length; i++) {
    const currentDate = new Date(sortedDays[i])
    const prevDate = new Date(sortedDays[i - 1])

    // Check if dates are consecutive
    const diffTime = currentDate.getTime() - prevDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (diffDays > 1) {
      currentStreak = 1
    }
  }

  return maxStreak
}

function calculateHolidayOverlap(days: string[], holidays: { date: string; name: string }[]): number {
  const holidayDates = holidays.map((h) => h.date)
  return days.filter((day) => holidayDates.includes(day)).length
}

function calculateEfficiencyScore(days: string[], weekdayCount: number, holidayOverlap: number): number {
  if (days.length === 0) return 0

  // Higher score means better utilization of weekends and holidays
  const weekendAndHolidayCount = days.length - weekdayCount + holidayOverlap
  const score = Math.round((weekendAndHolidayCount / days.length) * 100)

  return score
}

