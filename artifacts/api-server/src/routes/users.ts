import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, postsTable, achievementsTable } from "@workspace/db";
import { UpdateMyProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { formatUser } from "./auth";
import { recalculateVisibilityScore } from "../lib/gamification";

const router: IRouter = Router();

function formatUserProfile(user: typeof usersTable.$inferSelect, matchScore?: number) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role ?? null,
    level: user.level ?? null,
    skills: user.skills ?? [],
    projectLinks: user.projectLinks ?? [],
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    createdAt: user.createdAt.toISOString(),
    matchScore: matchScore ?? null,
    xpLevel: user.xpLevel ?? 0,
    xp: user.xp ?? 0,
    streakCurrent: user.streakCurrent ?? 0,
    streakLongest: user.streakLongest ?? 0,
    visibilityScore: user.visibilityScore ?? 0,
  };
}

router.get("/users/:username", async (req, res): Promise<void> => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const achievements = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, user.id));

  res.json({ ...formatUserProfile(user), achievements: achievements.map(a => a.achievementType) });
});

router.get("/users/:username/posts", async (req, res): Promise<void> => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.authorId, user.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(20);

  const postsWithAuthor = posts.map((p) => ({
    id: p.id,
    authorId: p.authorId,
    content: p.content,
    imageUrl: p.imageUrl ?? null,
    linkUrl: p.linkUrl ?? null,
    linkTitle: p.linkTitle ?? null,
    createdAt: p.createdAt.toISOString(),
    author: formatUserProfile(user),
  }));

  res.json({ posts: postsWithAuthor, nextCursor: null });
});

router.patch("/users/me/profile", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.projectLinks !== undefined) updates.projectLinks = parsed.data.projectLinks;

  const [updated] = await db
    .update(usersTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id))
    .returning();

  await recalculateVisibilityScore(authReq.user.id);

  res.json(formatUser(updated));
});

export { formatUserProfile };
export default router;
