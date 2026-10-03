import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cafeFavorites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json([])
  const rows = await db.select({ locationId: cafeFavorites.locationId }).from(cafeFavorites).where(eq(cafeFavorites.userId, session.user.id))
  return NextResponse.json(rows.map((row) => row.locationId))
}
