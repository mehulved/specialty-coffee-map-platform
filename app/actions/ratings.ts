'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cafeRatings } from '@/lib/db/schema'
import { and, avg, count, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'

const MAX_NOTES_LENGTH = 2000

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getCafeFeedback(cafeName: string) {
  if (!cafeName || cafeName.length > 200) throw new Error('Invalid cafe')
  const session = await auth.api.getSession({ headers: await headers() })
  const [summary, mine] = await Promise.all([
    db.select({ average: avg(cafeRatings.rating), count: count() }).from(cafeRatings).where(eq(cafeRatings.cafeName, cafeName)),
    session?.user ? db.select().from(cafeRatings).where(and(eq(cafeRatings.cafeName, cafeName), eq(cafeRatings.userId, session.user.id))).limit(1) : Promise.resolve([]),
  ])
  return { average: Number(summary[0]?.average ?? 0), count: Number(summary[0]?.count ?? 0), mine: mine[0] ?? null }
}

export async function saveCafeFeedback(input: { cafeName: string; rating?: number; notes?: string }) {
  const userId = await getUserId()
  const cafeName = input.cafeName.trim()
  const notes = (input.notes ?? '').trim()
  const rating = input.rating
  if (!cafeName || cafeName.length > 200) throw new Error('Invalid cafe name')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')
  if (notes.length > MAX_NOTES_LENGTH) throw new Error('Notes are too long')

  const existing = await db.select({ id: cafeRatings.id }).from(cafeRatings).where(and(eq(cafeRatings.cafeName, cafeName), eq(cafeRatings.userId, userId))).limit(1)
  if (existing[0]) {
    await db.update(cafeRatings).set({ rating, notes, updatedAt: new Date() }).where(eq(cafeRatings.id, existing[0].id))
  } else {
    await db.insert(cafeRatings).values({ id: randomUUID(), cafeName, userId, rating, notes })
  }
  revalidatePath('/')
  return getCafeFeedback(cafeName)
}
