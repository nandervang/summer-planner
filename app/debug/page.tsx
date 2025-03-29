// Specify Node.js runtime
export const runtime = "nodejs"

export default function DebugPage() {
  // Get environment variables (safe to expose)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? "true" : "false",
    VERCEL_URL: process.env.VERCEL_URL || "not set",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not set",
    HAS_GOOGLE_CREDENTIALS: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(envInfo, null, 2)}</pre>
    </div>
  )
}

