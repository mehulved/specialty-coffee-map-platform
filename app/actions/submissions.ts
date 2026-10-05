'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cafeSubmissions, locationFlags, locationUpdates } from '@/lib/db/schema'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
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
  const roleResult = await db.execute<{ role: string }>(sql`SELECT "role" FROM "user" WHERE "id" = ${session.user.id}`)
  const isAdmin = roleResult.rows[0]?.role === 'admin'
  await db.insert(cafeSubmissions).values({ id: crypto.randomUUID(), name, address, latitude: input.latitude, longitude: input.longitude, tags, details, submittedBy: session.user.id, status: isAdmin ? 'approved' : 'pending' })
  revalidatePath('/admin')
  revalidatePath('/')
  return { ok: true, status: isAdmin ? 'approved' : 'pending' }
}

export async function getPendingSubmissions() {
  await requireAdmin()
  return db.select().from(cafeSubmissions).where(eq(cafeSubmissions.status, 'pending')).orderBy(desc(cafeSubmissions.createdAt))
}

export async function getApprovedSubmissions() {
  await requireAdmin()
  return db.select().from(cafeSubmissions).where(eq(cafeSubmissions.status, 'approved')).orderBy(asc(cafeSubmissions.name))
}

export async function removeApprovedSubmission(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('Invalid location')
  await db.update(cafeSubmissions).set({ status: 'rejected' }).where(and(eq(cafeSubmissions.id, id), eq(cafeSubmissions.status, 'approved')))
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function submitLocationUpdate(input: { locationId: string; details: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const details = input.details.trim().slice(0, 2000)
  if (!input.locationId || !details) throw new Error('Add information before submitting')
  const roleResult = await db.execute<{ role: string }>(sql`SELECT "role" FROM "user" WHERE "id" = ${session.user.id}`)
  const isAdmin = roleResult.rows[0]?.role === 'admin'
  if (isAdmin) {
    await db.update(cafeSubmissions).set({ details }).where(eq(cafeSubmissions.id, input.locationId))
    revalidatePath('/admin')
    revalidatePath('/')
    return { ok: true, status: 'approved' as const }
  }
  await db.insert(locationUpdates).values({ id: crypto.randomUUID(), locationId: input.locationId, submittedBy: session.user.id, details })
  revalidatePath('/admin')
  return { ok: true, status: 'pending' as const }
}

export async function getPendingLocationUpdates() {
  await requireAdmin()
  return db.select({ update: locationUpdates, location: cafeSubmissions }).from(locationUpdates).innerJoin(cafeSubmissions, eq(locationUpdates.locationId, cafeSubmissions.id)).where(eq(locationUpdates.status, 'pending')).orderBy(desc(locationUpdates.createdAt))
}

export async function moderateLocationUpdate(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['approved', 'rejected'].includes(status)) throw new Error('Invalid update moderation request')
  await db.update(locationUpdates).set({ status }).where(eq(locationUpdates.id, id))
  if (status === 'approved') {
    const update = await db.select().from(locationUpdates).where(eq(locationUpdates.id, id)).limit(1)
    if (update[0]) await db.update(cafeSubmissions).set({ details: update[0].details }).where(eq(cafeSubmissions.id, update[0].locationId))
  }
  revalidatePath('/admin'); revalidatePath('/')
}

export async function submitLocationFlag(input: { locationId: string; reason: 'temporarily_closed' | 'permanently_closed' | 'reopened'; details: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  if (!input.locationId || !['temporarily_closed', 'permanently_closed', 'reopened'].includes(input.reason)) throw new Error('Invalid location flag')
  await db.insert(locationFlags).values({ id: crypto.randomUUID(), locationId: input.locationId, reason: input.reason, details: input.details.trim().slice(0, 1000), submittedBy: session.user.id })
  revalidatePath('/admin')
  return { ok: true }
}

export async function getPendingFlags() {
  await requireAdmin()
  return db.select({ flag: locationFlags, location: cafeSubmissions }).from(locationFlags).innerJoin(cafeSubmissions, eq(locationFlags.locationId, cafeSubmissions.id)).where(eq(locationFlags.status, 'pending')).orderBy(desc(locationFlags.createdAt))
}

export async function moderateFlag(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['approved', 'rejected'].includes(status)) throw new Error('Invalid flag moderation request')
  const flag = await db.select().from(locationFlags).where(eq(locationFlags.id, id)).limit(1)
  if (!flag[0]) throw new Error('Flag not found')
  await db.update(locationFlags).set({ status }).where(eq(locationFlags.id, id))
  if (status === 'approved') await db.update(cafeSubmissions).set({ availabilityStatus: flag[0].reason === 'reopened' ? 'open' : flag[0].reason }).where(eq(cafeSubmissions.id, flag[0].locationId))
  revalidatePath('/admin'); revalidatePath('/')
}

export async function updateLocationAvailability(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const availabilityStatus = String(formData.get('availabilityStatus') ?? '')
  if (!id || !['open', 'temporarily_closed', 'permanently_closed'].includes(availabilityStatus)) throw new Error('Invalid availability status')
  await db.update(cafeSubmissions).set({ availabilityStatus }).where(eq(cafeSubmissions.id, id))
  revalidatePath('/admin'); revalidatePath('/')
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
