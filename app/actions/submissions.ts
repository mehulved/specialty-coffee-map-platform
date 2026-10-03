'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cafeSubmissions } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const result = await db.execute<{ role: string }>(sql`SELECT "role" FROM "user" WHERE "id" = ${session.user.id}`)
  if (result.rows[0]?.role !== 'admin') redirect('/')
  return session
}

export async function createCafeSubmission(input: { name: string; address: string; latitude: number; longitude: number; tags: string[]; details: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const name = input.name.trim().slice(0, 160)
  const address = input.address.trim().slice(0, 300)
  const details = input.details.trim().slice(0, 2000)
  const tags = input.tags.filter((tag) => tag === 'Cafe' || tag === 'Roastery')
  if (!name || !address || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) || !tags.length) throw new Error('Invalid submission')
  await db.insert(cafeSubmissions).values({ id: crypto.randomUUID(), name, address, latitude: input.latitude, longitude: input.longitude, tags, details, submittedBy: session.user.id })
  return { ok: true }
}

export async function getPendingSubmissions() {
  await requireAdmin()
  return db.select().from(cafeSubmissions).where(eq(cafeSubmissions.status, 'pending')).orderBy(desc(cafeSubmissions.createdAt))
}

export async function moderateSubmission(formData: FormData) {
  const session = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['approved', 'rejected'].includes(status)) throw new Error('Invalid moderation request')
  await db.update(cafeSubmissions).set({ status }).where(eq(cafeSubmissions.id, id))
  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true, moderator: session.user.id }
}
