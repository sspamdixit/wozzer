import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, followsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/follows/:username", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (target.id === authReq.user.id) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  // Check if already following
  const [existing] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerId, authReq.user.id),
        eq(followsTable.followingId, target.id)
      )
    );

  if (existing) {
    res.json({ success: true });
    return;
  }

  await db.insert(followsTable).values({
    followerId: authReq.user.id,
    followingId: target.id,
  });

  // Update counts
  await db
    .update(usersTable)
    .set({ followingCount: authReq.user.followingCount + 1, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id));

  await db
    .update(usersTable)
    .set({ followersCount: target.followersCount + 1, updatedAt: new Date() })
    .where(eq(usersTable.id, target.id));

  res.json({ success: true });
});

router.delete("/follows/:username", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerId, authReq.user.id),
        eq(followsTable.followingId, target.id)
      )
    );

  if (!existing) {
    res.json({ success: true });
    return;
  }

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.followerId, authReq.user.id),
        eq(followsTable.followingId, target.id)
      )
    );

  // Update counts
  const newFollowingCount = Math.max(0, authReq.user.followingCount - 1);
  const newFollowersCount = Math.max(0, target.followersCount - 1);

  await db
    .update(usersTable)
    .set({ followingCount: newFollowingCount, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id));

  await db
    .update(usersTable)
    .set({ followersCount: newFollowersCount, updatedAt: new Date() })
    .where(eq(usersTable.id, target.id));

  res.json({ success: true });
});

router.get("/follows/:username/status", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!target) {
    res.json({ isFollowing: false });
    return;
  }

  const [existing] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerId, authReq.user.id),
        eq(followsTable.followingId, target.id)
      )
    );

  res.json({ isFollowing: !!existing });
});

export default router;
