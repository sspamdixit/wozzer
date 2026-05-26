import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const followsTable = pgTable("follows", {
  followerId: text("follower_id").notNull(),
  followingId: text("following_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]);

export type Follow = typeof followsTable.$inferSelect;
