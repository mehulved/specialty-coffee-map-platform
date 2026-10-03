import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cafeSubmissions } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'

export async function GET() {
  const locations = await db.select({ name: cafeSubmissions.name, tags: cafeSubmissions.tags, area: cafeSubmissions.address, lat: cafeSubmissions.latitude, lng: cafeSubmissions.longitude, note: cafeSubmissions.details }).from(cafeSubmissions).where(eq(cafeSubmissions.status, 'approved')).orderBy(asc(cafeSubmissions.name))
  return NextResponse.json(locations)
}
