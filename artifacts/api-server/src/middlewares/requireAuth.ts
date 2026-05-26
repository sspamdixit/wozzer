import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import crypto from "crypto";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    // JIT provision: look up Clerk user details to seed initial record
    const clerkUser = auth?.sessionClaims;
    const email = (clerkUser?.email as string) ?? `${clerkUserId}@clerk.local`;
    const firstName = (clerkUser?.first_name as string) ?? "";
    const lastName = (clerkUser?.last_name as string) ?? "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Wozzer User";
    const baseUsername = (email.split("@")[0] ?? clerkUserId).replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "user";
    const username = `${baseUsername}_${crypto.randomBytes(3).toString("hex")}`;

    [user] = await db
      .insert(usersTable)
      .values({
        id: crypto.randomUUID(),
        clerkId: clerkUserId,
        username,
        email,
        displayName,
      })
      .returning();
  }

  (req as Request & { user: typeof user }).user = user;
  next();
}
