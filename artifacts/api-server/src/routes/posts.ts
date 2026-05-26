import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, postsTable, usersTable, followsTable, type Post } from "@workspace/db";
import { CreatePostBody, DeletePostParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { formatUserProfile } from "./users";
import crypto from "crypto";

const router: IRouter = Router();

router.get("/posts", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };

  // Get IDs of people the current user follows
  const following = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, authReq.user.id));

  const followingIds = following.map((f) => f.followingId);
  // Include own posts
  const feedUserIds = [...followingIds, authReq.user.id];

  let posts: Post[];
  if (feedUserIds.length === 0) {
    posts = [];
  } else {
    posts = await db
      .select()
      .from(postsTable)
      .where(inArray(postsTable.authorId, feedUserIds))
      .orderBy(desc(postsTable.createdAt))
      .limit(30);
  }

  // Fetch authors
  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const authors = authorIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, authorIds))
    : [];
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  const postsWithAuthor = posts.map((p) => {
    const author = authorMap.get(p.authorId)!;
    return {
      id: p.id,
      authorId: p.authorId,
      content: p.content,
      imageUrl: p.imageUrl ?? null,
      linkUrl: p.linkUrl ?? null,
      linkTitle: p.linkTitle ?? null,
      createdAt: p.createdAt.toISOString(),
      author: formatUserProfile(author),
    };
  });

  res.json({ posts: postsWithAuthor, nextCursor: null });
});

router.post("/posts", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, imageUrl, linkUrl, linkTitle } = parsed.data;

  const [post] = await db
    .insert(postsTable)
    .values({
      id: crypto.randomUUID(),
      authorId: authReq.user.id,
      content,
      imageUrl: imageUrl ?? null,
      linkUrl: linkUrl ?? null,
      linkTitle: linkTitle ?? null,
    })
    .returning();

  res.status(201).json({
    id: post.id,
    authorId: post.authorId,
    content: post.content,
    imageUrl: post.imageUrl ?? null,
    linkUrl: post.linkUrl ?? null,
    linkTitle: post.linkTitle ?? null,
    createdAt: post.createdAt.toISOString(),
    author: formatUserProfile(authReq.user),
  });
});

router.delete("/posts/:postId", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, params.data.postId));

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  if (post.authorId !== authReq.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(postsTable).where(eq(postsTable.id, post.id));
  res.json({ success: true });
});

export default router;
