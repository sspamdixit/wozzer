import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { awardXp, updateStreak } from "../lib/gamification";
import { z } from "zod";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  await awardXp(authReq.user.id, 10);
  await updateStreak(authReq.user.id);
  const [refreshed] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user.id));
  res.json(formatUser(refreshed ?? authReq.user));
});

const SetUsernameBody = z.object({ username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/) });

router.post("/auth/username", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = SetUsernameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid username. Use 3-30 lowercase letters, numbers, underscores." });
    return;
  }
  const { username } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing && existing.id !== authReq.user.id) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({ username, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id))
    .returning();
  res.json(formatUser(updated));
});

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role ?? null,
    level: user.level ?? null,
    skills: user.skills ?? [],
    projectLinks: user.projectLinks ?? [],
    onboardingComplete: user.onboardingComplete,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    createdAt: user.createdAt.toISOString(),
    xpLevel: user.xpLevel ?? 0,
    xp: user.xp ?? 0,
    streakCurrent: user.streakCurrent ?? 0,
    streakLongest: user.streakLongest ?? 0,
    visibilityScore: user.visibilityScore ?? 0,
  };
}

export default router;
