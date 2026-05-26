import { Request, Response, NextFunction } from "express";
import { extractToken, getUserFromToken } from "../lib/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req.headers.authorization);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { user: typeof user }).user = user;
  next();
}
