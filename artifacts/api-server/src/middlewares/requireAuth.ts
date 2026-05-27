import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifySupabaseToken } from "../lib/supabase";
import crypto from "crypto";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabaseId = await verifySupabaseToken(token);
  if (!supabaseId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.supabaseId, supabaseId));

  if (!user) {
    const { supabaseAdmin } = await import("../lib/supabase");
    const { data } = await supabaseAdmin.auth.admin.getUserById(supabaseId);
    const sbUser = data.user;
    const email = sbUser?.email ?? `${supabaseId}@wozzer.app`;
    const rawBase = (sbUser?.user_metadata?.user_name as string)
      ?? (sbUser?.user_metadata?.name as string)
      ?? email.split("@")[0];
    const baseUsername = rawBase.replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "user";
    const username = `${baseUsername}_${crypto.randomBytes(3).toString("hex")}`;
    const displayName = (sbUser?.user_metadata?.full_name as string)
      ?? (sbUser?.user_metadata?.name as string)
      ?? baseUsername;
    const avatarUrl = (sbUser?.user_metadata?.avatar_url as string) ?? null;

    [user] = await db
      .insert(usersTable)
      .values({ id: crypto.randomUUID(), supabaseId, username, email, displayName, avatarUrl })
      .returning();
  }

  (req as Request & { user: typeof user }).user = user;
  next();
}
