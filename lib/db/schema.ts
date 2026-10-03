import { integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const cafeRatings = pgTable(
  'cafe_rating',
  {
    id: text('id').primaryKey(),
    cafeName: text('cafeName').notNull(),
    userId: text('userId').notNull(),
    rating: integer('rating').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    userCafeUnique: unique('cafe_rating_user_cafe_unique').on(table.cafeName, table.userId),
  }),
)

export type CafeRating = typeof cafeRatings.$inferSelect
export type NewCafeRating = typeof cafeRatings.$inferInsert

export const cafeRatingsTable = cafeRatings
