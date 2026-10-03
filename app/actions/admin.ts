'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function promoteFirstAdmin(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (email !== session.user.email.toLowerCase()) {
    return { error: 'For the first setup, enter the email address of the signed-in account.' }
  }

  const result = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "user" WHERE "role" = 'admin'`)
  const adminCount = Number(result.rows[0]?.count ?? 0)
  if (adminCount > 0) return { error: 'An admin already exists. Ask an existing admin to approve new moderators.' }

  await db.execute(sql`UPDATE "user" SET "role" = 'admin' WHERE "id" = ${session.user.id}`)
  return { success: true }
}

export async function getCurrentRole() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const result = await db.execute(sql`SELECT "role" FROM "user" WHERE "id" = ${session.user.id}`)
  return String(result.rows[0]?.role ?? 'member')
}

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const result = await db.execute(sql`SELECT "role" FROM "user" WHERE "id" = ${session.user.id}`)
  if (result.rows[0]?.role !== 'admin') redirect('/')
  return session
}

export type AdminPromotionState = { error?: string; success?: boolean }
export const initialAdminPromotionState: AdminPromotionState = {}

export async function promoteFirstAdminWithRedirect(formData: FormData) {
  const result = await promoteFirstAdmin(formData)
  if (result.success) redirect('/admin')
  return result
}
