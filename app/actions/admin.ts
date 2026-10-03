'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const FIRST_ADMIN_EMAIL = 'mehul.n.ved@gmail.com'

export async function promoteFirstAdmin(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const email = String(formData.get('email') ?? FIRST_ADMIN_EMAIL).trim().toLowerCase()
  if (email !== FIRST_ADMIN_EMAIL || session.user.email.toLowerCase() !== FIRST_ADMIN_EMAIL) {
    return { error: `Only ${FIRST_ADMIN_EMAIL} can become the first kaapi admin.` }
  }

  const result = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "user" WHERE "role" = 'admin'`)
  const adminCount = Number(result.rows[0]?.count ?? 0)
  if (adminCount > 0) return { error: 'An admin already exists. Ask an existing admin to approve new moderators.' }

  await db.execute(sql`UPDATE "user" SET "role" = 'admin' WHERE "id" = ${session.user.id}`)
  return { success: true }
}

export async function getAdminUsers() {
  await requireAdmin()
  const result = await db.execute(sql`
    SELECT
      u."id",
      u."name",
      u."email",
      COALESCE(u."role", 'member') AS "role",
      u."createdAt",
      COUNT(DISTINCT cs."id")::int AS "submissions",
      COUNT(DISTINCT lf."id")::int AS "flags",
      COUNT(DISTINCT cr."id")::int AS "ratings"
    FROM "user" u
    LEFT JOIN "cafe_submission" cs ON cs."submittedBy" = u."id"
    LEFT JOIN "location_flag" lf ON lf."submittedBy" = u."id"
    LEFT JOIN "cafe_rating" cr ON cr."userId" = u."id"
    GROUP BY u."id", u."name", u."email", u."role", u."createdAt"
    ORDER BY (COUNT(DISTINCT cs."id") + COUNT(DISTINCT lf."id") + COUNT(DISTINCT cr."id")) DESC, u."createdAt" DESC
  `)
  return result.rows.map((row) => ({ ...row, submissions: Number(row.submissions), flags: Number(row.flags), ratings: Number(row.ratings), points: Number(row.submissions) * 50 + Number(row.flags) * 15 + Number(row.ratings) * 10 }))
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

export async function promoteFirstAdminWithRedirect(formData: FormData) {
  const result = await promoteFirstAdmin(formData)
  if (result.success) redirect('/admin')
  return result
}
