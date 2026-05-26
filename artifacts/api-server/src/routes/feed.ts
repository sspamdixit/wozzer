import { Router, type IRouter } from "express";
import { eq, ne, not, inArray } from "drizzle-orm";
import { db, usersTable, followsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { formatUserProfile } from "./users";

const router: IRouter = Router();

router.get("/feed/suggested", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };

  // Get IDs already followed
  const following = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, authReq.user.id));

  const followingIds = following.map((f) => f.followingId);

  // Get all users except self and already followed
  const excludeIds = [...followingIds, authReq.user.id];

  const candidates = await db
    .select()
    .from(usersTable)
    .where(
      excludeIds.length > 0
        ? not(inArray(usersTable.id, excludeIds))
        : ne(usersTable.id, authReq.user.id)
    )
    .limit(20);

  // Simple matching: same role or overlapping skills
  const currentSkills = authReq.user.skills ?? [];
  const currentRole = authReq.user.role;

  const scored = candidates.map((u) => {
    let score = 0;
    const theirSkills = u.skills ?? [];
    const overlap = currentSkills.filter((s: string) => theirSkills.includes(s)).length;
    score += overlap * 10;
    if (currentRole && u.role === currentRole) score += 5;
    if (u.onboardingComplete) score += 3;
    return { user: u, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const suggested = scored.slice(0, 5).map(({ user, score }) =>
    formatUserProfile(user, score > 0 ? score : undefined)
  );

  res.json(suggested);
});

export default router;
