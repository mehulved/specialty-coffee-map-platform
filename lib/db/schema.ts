import { doublePrecision, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

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
  (table) => ({ userCafeUnique: unique('cafe_rating_user_cafe_unique').on(table.cafeName, table.userId) }),
)

export const cafeSubmissions = pgTable('cafe_submission', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  tags: text('tags').array().notNull(),
  details: text('details').notNull().default(''),
  submittedBy: text('submittedBy').notNull(),
  status: text('status').notNull().default('pending'),
  availabilityStatus: text('availabilityStatus').notNull().default('open'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type CafeRating = typeof cafeRatings.$inferSelect
export type NewCafeRating = typeof cafeRatings.$inferInsert
export const locationFlags = pgTable('location_flag', {
  id: text('id').primaryKey(),
  locationId: text('locationId').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull().default(''),
  submittedBy: text('submittedBy').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type CafeSubmission = typeof cafeSubmissions.$inferSelect
export type LocationFlag = typeof locationFlags.$inferSelect
export const locationUpdates = pgTable('location_update', {
  id: text('id').primaryKey(),
  locationId: text('locationId').notNull(),
  submittedBy: text('submittedBy').notNull(),
  details: text('details').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type LocationUpdate = typeof locationUpdates.$inferSelect
export const cafeFavorites = pgTable(
  'cafe_favorite',
  {
    id: text('id').primaryKey(),
    locationId: text('locationId').notNull(),
    userId: text('userId').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({ userLocationUnique: unique('cafe_favorite_user_location_unique').on(table.userId, table.locationId) }),
)

export type CafeFavorite = typeof cafeFavorites.$inferSelect
export const cafeRatingsTable = cafeRatings
