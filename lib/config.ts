// Application configuration

// Database configuration
export const DATABASE_CONFIG = {
  // Whether to use Vercel KV for server-side storage
  useVercelKV: process.env.USE_VERCEL_KV === "true",

  // Fallback to local storage if server-side storage fails
  fallbackToLocalStorage: true,

  // How often to sync data to the server (in milliseconds)
  syncInterval: 2000,

  // Maximum number of login logs to keep
  maxLoginLogs: 1000,

  // Maximum number of login logs to keep per user
  maxUserLoginLogs: 100,
}

// Admin configuration
export const ADMIN_CONFIG = {
  // List of authorized admin emails
  authorizedAdmins: ["niklas.burman@gmail.com", "niklas.andervang@frankfam.co"],

  // Default number of logs to show on the admin page
  defaultLogLimit: 500,
}

// Auth configuration
export const AUTH_CONFIG = {
  // Whether to log user logins
  logLogins: true,

  // Whether to collect IP addresses in login logs
  collectIPAddresses: true,

  // Whether to collect user agent information in login logs
  collectUserAgents: true,
}

