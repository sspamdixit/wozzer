import { Router, type IRouter } from "express";
import { usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  res.json(formatUser(authReq.user));
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
  };
}

export default router;
