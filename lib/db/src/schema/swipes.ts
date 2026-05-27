import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const swipesTable = pgTable("swipes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(),
  direction: text("direction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
