"use client"

import { useState } from "react"
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import type { Holiday } from "@/lib/holidays"

interface CalendarProps {
  month: number
  year: number
  plannedDays: string[]
  onDayToggle: (dateString: string) => void
  holidays: Holiday[]
}

type CalendarDay = {
  date: Date | null
  isCurrentMonth: boolean
  isHoliday: boolean
  holidayName?: string
  isPlanned: boolean
  isWeekend: boolean
}

type CalendarWeek = {
  [key: string]: CalendarDay
  mon: CalendarDay
  tue: CalendarDay
  wed: CalendarDay
  thu: CalendarDay
  fri: CalendarDay
  sat: CalendarDay
  sun: CalendarDay
}

const columnHelper = createColumnHelper<CalendarWeek>()

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

// Day mapping for Swedish calendar (Monday first)
const DAYS_OF_WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

export function Calendar({ month, year, plannedDays, onDayToggle, holidays }: CalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  // Generate calendar data
  const generateCalendarData = () => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get the day of week (0-6), but adjust for Monday start (0 = Monday, 6 = Sunday)
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startingDayOfWeek < 0) startingDayOfWeek = 6 // Sunday becomes 6 instead of 0

    const daysInMonth = lastDayOfMonth.getDate()

    // Create weeks array
    const weeks: CalendarWeek[] = []
    let currentWeek: CalendarWeek = {
      mon: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
      tue: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
      wed: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
      thu: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
      fri: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
      sat: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: true },
      sun: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: true },
    }

    // Fill in days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1)
      const dayKey = DAYS_OF_WEEK[i] as keyof CalendarWeek
      const dateString = date.toISOString().split("T")[0]
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday

      currentWeek[dayKey] = {
        date,
        isCurrentMonth: false,
        isHoliday: isHoliday(date, holidays),
        holidayName: getHolidayName(date, holidays),
        isPlanned: plannedDays.includes(dateString),
        isWeekend,
      }
    }

    // Fill in days of current month
    let currentDay = 1
    while (currentDay <= daysInMonth) {
      const date = new Date(year, month, currentDay)
      const dayOfWeek = date.getDay()

      // Convert to our index (Monday = 0, Sunday = 6)
      let adjustedDayOfWeek = dayOfWeek - 1
      if (adjustedDayOfWeek < 0) adjustedDayOfWeek = 6

      const dayKey = DAYS_OF_WEEK[adjustedDayOfWeek] as keyof CalendarWeek
      const dateString = date.toISOString().split("T")[0]
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday

      currentWeek[dayKey] = {
        date,
        isCurrentMonth: true,
        isHoliday: isHoliday(date, holidays),
        holidayName: getHolidayName(date, holidays),
        isPlanned: plannedDays.includes(dateString),
        isWeekend,
      }

      // If we're at the end of a week or the end of the month, push the current week
      if (adjustedDayOfWeek === 6 || currentDay === daysInMonth) {
        weeks.push({ ...currentWeek })
        currentWeek = {
          mon: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
          tue: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
          wed: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
          thu: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
          fri: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: false },
          sat: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: true },
          sun: { date: null, isCurrentMonth: false, isHoliday: false, isPlanned: false, isWeekend: true },
        }
      }

      currentDay++
    }

    // Fill in days from next month
    const lastWeek = weeks[weeks.length - 1]
    let nextMonthDay = 1

    // Find the first empty day in the last week
    for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
      const dayKey = DAYS_OF_WEEK[i] as keyof CalendarWeek

      if (lastWeek[dayKey].date === null) {
        const date = new Date(year, month + 1, nextMonthDay)
        const dateString = date.toISOString().split("T")[0]
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 = Sunday, 6 = Saturday

        lastWeek[dayKey] = {
          date,
          isCurrentMonth: false,
          isHoliday: isHoliday(date, holidays),
          holidayName: getHolidayName(date, holidays),
          isPlanned: plannedDays.includes(dateString),
          isWeekend,
        }

        nextMonthDay++
      }
    }

    return weeks
  }

  const isHoliday = (date: Date, holidays: Holiday[]): boolean => {
    return holidays.some((holiday) => {
      const holidayDate = new Date(holiday.date)
      return (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const getHolidayName = (date: Date, holidays: Holiday[]): string | undefined => {
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

  const handleDayClick = (day: CalendarDay) => {
    if (!day.date) {
      console.log("Clicked on empty day")
      return
    }
    const dateString = day.date.toISOString().split("T")[0]
    console.log("Handling day click for:", dateString)
    onDayToggle(dateString)
  }

  const handleDayHover = (day: CalendarDay) => {
    if (!day.date) {
      setHoveredDay(null)
      return
    }
    const dateString = day.date.toISOString().split("T")[0]
    setHoveredDay(dateString)
  }

  // Define columns with Monday first (Swedish style)
  const columns = [
    columnHelper.accessor("mon", {
      header: "MON",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("tue", {
      header: "TUE",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("wed", {
      header: "WED",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("thu", {
      header: "THU",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("fri", {
      header: "FRI",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("sat", {
      header: "SAT",
      cell: (info) => renderDay(info.getValue()),
    }),
    columnHelper.accessor("sun", {
      header: "SUN",
      cell: (info) => renderDay(info.getValue()),
    }),
  ]

  const renderDay = (day: CalendarDay) => {
    if (!day.date) return

    const dateString = day.date.toISOString().split("T")[0]
    const isHovered = hoveredDay === dateString

    return (
      <div
        className={cn(
          "h-16 p-1 relative cursor-pointer transition-colors",
          !day.isCurrentMonth && "opacity-40",
          day.isWeekend && "bg-gray-100",
          day.isHoliday && "bg-red-100",
          day.isPlanned && "bg-blue-100",
          isHovered && !day.isPlanned && "bg-blue-50",
          isHovered && day.isPlanned && "bg-blue-200",
        )}
        onClick={() => {
          console.log("Day clicked:", dateString)
          handleDayClick(day)
        }}
        onMouseEnter={() => handleDayHover(day)}
        onMouseLeave={() => setHoveredDay(null)}
        title={day.holidayName}
      >
        <span className="text-sm font-medium">{day.date.getDate()}</span>
        {day.holidayName && (
          <div className="absolute bottom-1 left-1 right-1 text-xs text-red-600 truncate">{day.holidayName}</div>
        )}
      </div>
    )
  }

  const data = generateCalendarData()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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

  return (
    <div className={cn("border rounded-lg overflow-hidden", getMonthColor())}>
      <div className="p-2 font-bold text-center border-b">{MONTH_NAMES[month]} 2025</div>
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isWeekend = header.id.includes("sat") || header.id.includes("sun")
                return (
                  <th key={header.id} className={cn("border p-2 text-center bg-white", isWeekend && "bg-gray-100")}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-0">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

