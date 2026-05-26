import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, createSession, deleteSession, extractToken } from "../lib/auth";
import crypto from "crypto";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password, displayName } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [existingUsername] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existingUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({ id, username, email, passwordHash, displayName })
    .returning();

  const token = createSession(user.id);

  res.status(201).json({
    user: formatUser(user),
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createSession(user.id);

  res.json({ user: formatUser(user), token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (token) deleteSession(token);
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { getUserFromToken } = await import("../lib/auth");
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json(formatUser(user));
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
