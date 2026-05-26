import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingSessionsTable = pgTable("onboarding_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  path: text("path").notNull(),
  messages: jsonb("messages").notNull().default([]),
  phase: text("phase").notNull().default("interview"),
  isComplete: boolean("is_complete").notNull().default(false),
  homeworkQuestions: text("homework_questions").array().notNull().default([]),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessionsTable.$inferSelect;
