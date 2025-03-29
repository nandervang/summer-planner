"use server"

import { deleteLoginLog } from "@/lib/auth-logging"
import { revalidatePath } from "next/cache"

export async function deleteLog(timestamp: string, source: string) {
  const result = await deleteLoginLog(timestamp, source)

  // Revalidate the admin page to refresh the logs
  revalidatePath("/admin")

  return result
}

