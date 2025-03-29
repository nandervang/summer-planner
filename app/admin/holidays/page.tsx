import { SwedishHolidays } from "@/lib/holidays"
import Link from "next/link"

export default function HolidaysPage() {
  // Group holidays by month
  const holidaysByMonth: Record<string, typeof SwedishHolidays> = {}

  SwedishHolidays.forEach((holiday) => {
    const date = new Date(holiday.date)
    const monthKey = date.toLocaleString("en-US", { month: "long" })

    if (!holidaysByMonth[monthKey]) {
      holidaysByMonth[monthKey] = []
    }

    holidaysByMonth[monthKey].push(holiday)
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Swedish Holidays 2025</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(holidaysByMonth).map(([month, holidays]) => (
          <div key={month} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-blue-50 px-4 py-2 border-b">
              <h2 className="font-semibold text-lg">{month}</h2>
            </div>
            <div className="p-4">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                      Holiday
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {holidays.map((holiday) => {
                    const date = new Date(holiday.date)
                    const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" })
                    const dayOfMonth = date.getDate()

                    return (
                      <tr key={holiday.date}>
                        <td className="py-2 pr-4">
                          <div className="font-medium">{dayOfMonth}</div>
                          <div className="text-xs text-gray-500">{dayOfWeek}</div>
                        </td>
                        <td className="py-2">
                          <div
                            className={`px-2 py-1 rounded-full inline-block text-sm 
                            ${
                              date.getDay() === 0 || date.getDay() === 6
                                ? "bg-purple-100 text-purple-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {holiday.name}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Holiday Information</h2>
        <p className="text-sm text-gray-600 mb-2">
          In Sweden, public holidays ("röda dagar") are days when most businesses and public services are closed.
        </p>
        <p className="text-sm text-gray-600">
          Additionally, some holidays like Midsummer Eve and Christmas Eve are not official public holidays but are
          traditionally observed as days off.
        </p>
      </div>
    </div>
  )
}

