import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const achievementsTable = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  achievementType: text("achievement_type").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ earnedAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;

export type AchievementType =
  | "first_post"
  | "first_match"
  | "first_project"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "level_up"
  | "challenge_complete"
  | "interview_complete"
  | "collaboration_complete";
