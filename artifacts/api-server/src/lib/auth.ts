import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuffer, Buffer.from(hash, "hex"));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const tokens = new Map<string, string>(); // token -> userId

export function createSession(userId: string): string {
  const token = generateToken();
  tokens.set(token, userId);
  return token;
}

export function getSessionUserId(token: string): string | undefined {
  return tokens.get(token);
}

export function deleteSession(token: string): void {
  tokens.delete(token);
}

export async function getUserFromToken(token: string | undefined): Promise<typeof usersTable.$inferSelect | null> {
  if (!token) return null;
  const userId = getSessionUserId(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}

export function extractToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) return undefined;
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  return undefined;
}
