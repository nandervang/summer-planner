// Specify Node.js runtime
export const runtime = "nodejs"

export default function OAuthDebugPage() {
  // Get the hardcoded redirect URI from google-auth.ts
  const redirectUri = "https://nandervang.vercel.app/api/auth/callback/google"

  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL ? "true" : "false",
    VERCEL_URL: process.env.VERCEL_URL || "not set",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not set",
    HAS_GOOGLE_CREDENTIALS: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    HARDCODED_REDIRECT_URI: redirectUri,
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OAuth Debug Information</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Hardcoded Redirect URI</h2>
        <p className="mb-2">This is the redirect URI that should be configured in your Google Cloud Console:</p>
        <div className="bg-yellow-100 p-4 rounded-md border border-yellow-300 font-mono break-all">{redirectUri}</div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(envInfo, null, 2)}</pre>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">How to Fix redirect_uri_mismatch</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Go to the{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              className="text-blue-600 underline"
              rel="noreferrer"
            >
              Google Cloud Console
            </a>
          </li>
          <li>Select your project and find the OAuth 2.0 Client ID you're using</li>
          <li>Add the exact redirect URI shown above to the "Authorized redirect URIs" list</li>
          <li>Click Save</li>
          <li>Wait a few minutes for the changes to propagate</li>
          <li>Try signing in again</li>
        </ol>
      </div>
    </div>
  )
}

