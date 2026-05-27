import { eq, and, gte, count } from "drizzle-orm";
import { db, usersTable, postsTable, swipesTable, achievementsTable } from "@workspace/db";
import type { AchievementType } from "@workspace/db";
import crypto from "crypto";

export const XP_REWARDS = {
  daily_login: 10,
  post: 25,
  challenge_complete: 50,
  onboarding_interview: 75,
  first_match: 100,
  project_submit: 200,
  collaboration_sprint: 500,
} as const;

export const LEVEL_THRESHOLDS = [0, 75, 200, 400, 700, 1200];

export function xpToLevel(xp: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  if (xp >= 1200) {
    level = 5 + Math.floor((xp - 1200) / 1000);
  }
  return level;
}

export function xpForNextLevel(currentXp: number): { current: number; next: number; level: number } {
  const level = xpToLevel(currentXp);
  const currentThreshold = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : 1200 + (level - 5) * 1000;
  const nextThreshold = level + 1 < LEVEL_THRESHOLDS.length
    ? LEVEL_THRESHOLDS[level + 1]
    : 1200 + (level - 4) * 1000;
  return { current: currentXp - currentThreshold, next: nextThreshold - currentThreshold, level };
}

export async function awardXp(userId: string, amount: number): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const newXp = user.xp + amount;
  const newLevel = xpToLevel(newXp);
  const leveledUp = newLevel > user.xpLevel;

  await db.update(usersTable)
    .set({ xp: newXp, xpLevel: newLevel, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  if (leveledUp) {
    await grantAchievement(userId, "level_up");
  }

  await recalculateVisibilityScore(userId);
}

export async function updateStreak(userId: string): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  const lastActive = user.streakLastActive;

  let newStreak = user.streakCurrent;

  if (!lastActive) {
    newStreak = 1;
  } else if (lastActive === today) {
    return;
  } else {
    const last = new Date(lastActive);
    const now = new Date(today);
    const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak = user.streakCurrent + 1;
    } else {
      newStreak = 1;
    }
  }

  const newLongest = Math.max(newStreak, user.streakLongest);

  await db.update(usersTable)
    .set({ streakCurrent: newStreak, streakLongest: newLongest, streakLastActive: today, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  if (newStreak === 7) await grantAchievement(userId, "streak_7");
  if (newStreak === 30) await grantAchievement(userId, "streak_30");
  if (newStreak === 100) await grantAchievement(userId, "streak_100");

  await recalculateVisibilityScore(userId);
}

export async function recalculateVisibilityScore(userId: string): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [postCount] = await db
    .select({ count: count() })
    .from(postsTable)
    .where(and(eq(postsTable.authorId, userId), gte(postsTable.createdAt, sevenDaysAgo)));

  const [swipeCount] = await db
    .select({ count: count() })
    .from(swipesTable)
    .where(and(eq(swipesTable.userId, userId), gte(swipesTable.createdAt, sevenDaysAgo)));

  const activityCount = (postCount?.count ?? 0) + (swipeCount?.count ?? 0);

  const profileCompleteScore =
    (user.bio ? 0.33 : 0) +
    (user.projectLinks && user.projectLinks.length > 0 ? 0.33 : 0) +
    (user.skills && user.skills.length > 0 ? 0.34 : 0);

  const maxLevel = 10;
  const levelScore = Math.min(user.xpLevel / maxLevel, 1);
  const streakScore = Math.min(user.streakCurrent / 30, 1);
  const activityScore = Math.min(activityCount / 10, 1);

  const visibilityScore =
    levelScore * 0.4 +
    streakScore * 0.3 +
    activityScore * 0.2 +
    profileCompleteScore * 0.1;

  await db.update(usersTable)
    .set({ visibilityScore, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));
}

export async function grantAchievement(userId: string, type: AchievementType): Promise<void> {
  const [existing] = await db
    .select()
    .from(achievementsTable)
    .where(and(eq(achievementsTable.userId, userId), eq(achievementsTable.achievementType, type)));

  if (existing) return;

  await db.insert(achievementsTable).values({
    id: crypto.randomUUID(),
    userId,
    achievementType: type,
  });
}

export async function getUserAchievements(userId: string): Promise<string[]> {
  const rows = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, userId));
  return rows.map(r => r.achievementType);
}
