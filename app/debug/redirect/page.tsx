// Specify Node.js runtime
export const runtime = "nodejs"

export default function RedirectDebugPage() {
  // Get the client ID from environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID || "Not configured"

  // Get the current Vercel URL
  const vercelUrl = process.env.VERCEL_URL || "v0-new-project-cpozzipzj3r-e34gj5j7h.vercel.app"

  // Get the custom domain
  const customDomain = "nandervang.vercel.app"

  // Get the redirect URI we're using in our code
  const primaryRedirectUri = `https://${customDomain}/api/auth/callback/google`

  // Get all possible redirect URIs
  const possibleRedirectUris = [
    primaryRedirectUri,
    `https://${vercelUrl}/api/auth/callback/google`,
    "http://localhost:3000/api/auth/callback/google",
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Redirect URI Debug</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Important Instructions</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Go to{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              className="text-blue-600 underline"
              rel="noreferrer"
            >
              Google Cloud Console
            </a>
          </li>
          <li>
            Find your OAuth 2.0 Client ID: <code className="bg-gray-100 px-2 py-1 rounded">{clientId}</code>
          </li>
          <li>Click on it to edit</li>
          <li>
            Under "Authorized redirect URIs", make sure this exact URI is added:
            <div className="bg-white p-3 my-2 border border-gray-200 rounded font-mono text-sm break-all">
              {primaryRedirectUri}
            </div>
          </li>
          <li>Click "Save" and wait a few minutes for changes to propagate</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Primary URI in Our Code</h2>
          <div className="bg-blue-50 p-3 rounded font-mono text-sm break-all">{primaryRedirectUri}</div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Current Environment</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <strong>VERCEL:</strong> {process.env.VERCEL ? "true" : "false"}
            </li>
            <li>
              <strong>VERCEL_URL:</strong> {vercelUrl}
            </li>
            <li>
              <strong>Custom Domain:</strong> {customDomain}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 border rounded-lg p-4">
        <h2 className="font-semibold mb-2">All Possible Redirect URIs to Add</h2>
        <p className="text-sm text-gray-600 mb-3">
          Add all of these to your Google Cloud Console for comprehensive coverage:
        </p>
        <div className="space-y-2">
          {possibleRedirectUris.map((uri, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded font-mono text-sm break-all">
              {uri}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Test Your Configuration</h2>
        <p className="text-sm mb-4">After updating Google Cloud Console, try signing in again:</p>
        <a
          href="/api/auth/signin/google"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Google Sign In
        </a>
      </div>
    </div>
  )
}

