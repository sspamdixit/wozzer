import { Router, type IRouter } from "express";
import { ne, notInArray, inArray, eq } from "drizzle-orm";
import { db, usersTable, projectsTable, swipesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import crypto from "crypto";
import { z } from "zod/v4";

const router: IRouter = Router();

router.get("/discover", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const userId = authReq.user.id;

  // Get already-swiped IDs
  const existingSwipes = await db.select().from(swipesTable).where(eq(swipesTable.userId, userId));
  const swipedPersonIds = existingSwipes.filter(s => s.targetType === "person").map(s => s.targetId);
  const swipedProjectIds = existingSwipes.filter(s => s.targetType === "project").map(s => s.targetId);

  // Get candidate persons (exclude self + already swiped)
  const excludeUsers = [userId, ...swipedPersonIds];
  const persons = await db
    .select()
    .from(usersTable)
    .where(notInArray(usersTable.id, excludeUsers))
    .limit(30);

  // Get candidate projects (exclude already swiped)
  const projectQuery = swipedProjectIds.length > 0
    ? db.select().from(projectsTable).where(notInArray(projectsTable.id, swipedProjectIds)).limit(10)
    : db.select().from(projectsTable).limit(10);
  const projects = await projectQuery;

  // Build project author map
  const authorIds = [...new Set(projects.map(p => p.authorId))];
  const authors = authorIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, authorIds))
    : [];
  const authorMap = new Map(authors.map(a => [a.id, a]));

  // Build card deck: 3 person : 1 project ratio
  const personCards = persons.map(u => ({
    id: u.id,
    type: "person" as const,
    person: {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      bio: u.bio ?? null,
      avatarUrl: u.avatarUrl ?? null,
      role: u.role ?? null,
      level: u.level ?? null,
      skills: u.skills ?? [],
      projectLinks: u.projectLinks ?? [],
      followersCount: u.followersCount,
      followingCount: u.followingCount,
      createdAt: u.createdAt.toISOString(),
      matchScore: null,
    },
  }));

  const projectCards = projects.map(p => {
    const author = authorMap.get(p.authorId);
    return {
      id: p.id,
      type: "project" as const,
      project: {
        id: p.id,
        name: p.name,
        description: p.description,
        tags: p.tags ?? [],
        screenshotUrl: p.screenshotUrl ?? null,
        linkUrl: p.linkUrl ?? null,
        authorUsername: author?.username ?? "unknown",
        authorLevel: author?.level ?? null,
      },
    };
  });

  // Interleave: 3 persons + 1 project per group, shuffle within groups
  const cards: typeof personCards[0][] = [];
  let pi = 0;
  let pj = 0;
  const totalGroups = Math.max(Math.ceil(personCards.length / 3), Math.ceil(projectCards.length));

  for (let g = 0; g < totalGroups; g++) {
    const group: typeof cards = [];
    for (let k = 0; k < 3 && pi < personCards.length; k++, pi++) {
      group.push(personCards[pi]);
    }
    if (pj < projectCards.length) {
      group.push(projectCards[pj] as any);
      pj++;
    }
    // Shuffle group
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    cards.push(...group);
  }

  res.json({ cards });
});

router.post("/discover/swipe", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({
    targetId: z.string(),
    targetType: z.enum(["person", "project"]),
    direction: z.enum(["left", "right"]),
  }).safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid swipe data" });
    return;
  }

  await db.insert(swipesTable).values({
    id: crypto.randomUUID(),
    userId: authReq.user.id,
    targetId: parsed.data.targetId,
    targetType: parsed.data.targetType,
    direction: parsed.data.direction,
  });

  res.json({ success: true });
});

export default router;
