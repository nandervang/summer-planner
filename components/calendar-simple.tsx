"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Holiday } from "@/lib/holidays"

interface CalendarSimpleProps {
  month: number
  year: number
  plannedDays: string[]
  onDayToggle: (dateString: string) => void
  holidays: Holiday[]
}

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
]

// Day names for Swedish calendar (Monday first)
const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

export function CalendarSimple({ month, year, plannedDays, onDayToggle, holidays }: CalendarSimpleProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Function to get ISO week number
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)) // Set to nearest Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  // Function to format a date as YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, "0")
    const d = date.getDate().toString().padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Generate calendar data
  const generateCalendarData = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()

    // Get the day of week (0-6), but adjust for Monday start (0 = Monday, 6 = Sunday)
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startingDayOfWeek < 0) startingDayOfWeek = 6 // Sunday becomes 6 instead of 0

    const calendarDays: Array<{
      date: Date | null
      dateString: string
      isCurrentMonth: boolean
      isHoliday: boolean
      holidayName?: string
      isPlanned: boolean
      isWeekend: boolean
      isMonday: boolean
      weekNumber?: number
    }> = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1)
      const dateString = formatDateString(date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
      const isMonday = dayOfWeek === 1

      calendarDays.push({
        date,
        dateString,
        isCurrentMonth: false,
        isHoliday: isHoliday(date),
        holidayName: getHolidayName(date),
        isPlanned: plannedDays.includes(dateString),
        isWeekend,
        isMonday,
        weekNumber: isMonday ? getWeekNumber(date) : undefined,
      })
    }

    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = formatDateString(date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
      const isMonday = dayOfWeek === 1

      calendarDays.push({
        date,
        dateString,
        isCurrentMonth: true,
        isHoliday: isHoliday(date),
        holidayName: getHolidayName(date),
        isPlanned: plannedDays.includes(dateString),
        isWeekend,
        isMonday,
        weekNumber: isMonday ? getWeekNumber(date) : undefined,
      })
    }

    // Add days from next month to complete the grid (6 rows x 7 days = 42 cells)
    const totalCellsNeeded = 42
    let nextMonthDay = 1
    while (calendarDays.length < totalCellsNeeded) {
      const date = new Date(year, month + 1, nextMonthDay)
      const dateString = formatDateString(date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday
      const isMonday = dayOfWeek === 1

      calendarDays.push({
        date,
        dateString,
        isCurrentMonth: false,
        isHoliday: isHoliday(date),
        holidayName: getHolidayName(date),
        isPlanned: plannedDays.includes(dateString),
        isWeekend,
        isMonday,
        weekNumber: isMonday ? getWeekNumber(date) : undefined,
      })

      nextMonthDay++
    }

    return calendarDays
  }

  const isHoliday = (date: Date): boolean => {
    return holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date)
      return (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getHolidayName = (date: Date): string | undefined => {
    const holiday = holidays.find((holiday) => {
      const holidayDate = new Date(holiday.date)
      return (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
      )
    })

    return holiday?.name
  }

  const handleDayClick = (dateString: string) => {
    console.log("Day clicked:", dateString)
    onDayToggle(dateString)
  }

  const calendarDays = generateCalendarData()

  const getMonthColor = () => {
    switch (month) {
      case 5: // June
        return "bg-amber-50 border-amber-200"
      case 6: // July
        return "bg-rose-50 border-rose-200"
      case 7: // August
        return "bg-emerald-50 border-emerald-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Split the days into weeks
  const weeks: Array<typeof calendarDays> = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", getMonthColor())}>
      <div className="p-2 font-bold text-center border-b">{MONTH_NAMES[month]} 2025</div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {DAY_NAMES.map((day, index) => (
              <th
                key={day}
                className={cn("border p-2 text-center bg-white", (index === 5 || index === 6) && "bg-gray-100")}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day.date) return <td key={dayIndex} className="border p-0"></td>

                const isHovered = hoveredDay === day.dateString

                return (
                  <td key={dayIndex} className="border p-0">
                    <button
                      className={cn(
                        "w-full h-16 p-1 relative text-left transition-colors",
                        !day.isCurrentMonth && "opacity-40",
                        day.isWeekend && "bg-gray-100",
                        day.isHoliday && "bg-red-100",
                        day.isPlanned && "bg-blue-100",
                        isHovered && !day.isPlanned && "bg-blue-50",
                        isHovered && day.isPlanned && "bg-blue-200",
                      )}
                      onClick={() => handleDayClick(day.dateString)}
                      onMouseEnter={() => setHoveredDay(day.dateString)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={day.holidayName}
                      type="button"
                    >
                      <span className="text-sm font-medium">{day.date.getDate()}</span>

                      {/* Week number for Monday cells */}
                      {day.isMonday && day.weekNumber && (
                        <span className="absolute top-1 right-1 text-xs bg-gray-200 text-gray-700 rounded-sm px-1">
                          w{day.weekNumber}
                        </span>
                      )}

                      {day.holidayName && (
                        <div className="absolute bottom-1 left-1 right-1 text-xs text-red-600 truncate">
                          {day.holidayName}
                        </div>
                      )}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

