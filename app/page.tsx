import { SummerVacationPlanner } from "@/components/summer-vacation-planner"
import { Header } from "@/components/header"
import { getMockUser, getSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function Home() {
  // Force production mode on Vercel
  const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_URL

  let user = null
  let isGoogleUser = false

  if (isVercel) {
    // In production on Vercel, use real authentication
    const session = await getSession()

    // If not logged in, redirect to login
    if (!session?.user) {
      redirect("/login")
    }

    user = session.user
    isGoogleUser = true // Since we're using Google auth in production
  } else {
    // In development, use mock user
    user = getMockUser()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} isDev={!isVercel} />
      <main className="flex-1 p-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center">Summer Vacation Planner 2025</h1>
          <p className="text-center text-gray-600 mb-8">
            Plan your summer vacation in Sweden. Click on days to mark them as vacation days. Swedish holidays are
            highlighted in red.
          </p>
          <SummerVacationPlanner userId={user.id} isGoogleUser={isGoogleUser} />
        </div>
      </main>
    </div>
  )
}

