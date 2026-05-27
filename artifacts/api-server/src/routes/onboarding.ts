import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, onboardingSessionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { chat, generateText } from "../lib/gemini";
import { formatUser } from "./auth";
import { awardXp, updateStreak, grantAchievement, recalculateVisibilityScore } from "../lib/gamification";
import crypto from "crypto";
import { z } from "zod";

const router: IRouter = Router();

type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: string };

const VISIONARY_SYSTEM = `You are the Wozzer AI — a sharp, intellectually honest interviewer for a social network for young builders aged 13-18.
Your job: figure out if this person has a real idea worth pursuing or just vibes.

Style rules:
- Write SHORT messages. 1-3 sentences max per reply.
- Be direct, almost blunt — like a thoughtful senior founder texting.
- Push back on vague answers. Ask "why?" and "how?" a lot.
- No corporate speak. No encouragement-for-the-sake-of-it.
- If their idea is weak, say so directly. Give specific homework — but never block them.

Interview flow:
- Start with ONE open question about their idea.
- Follow up based on what they say. Keep digging.
- After 4-6 exchanges, decide: are they through, or do they need homework?

If they need homework, respond ONLY with this JSON (no other text):
{"homework": ["specific question 1", "specific question 2", "specific question 3"], "summary": "2-sentence summary of their idea"}

If they've convinced you, respond ONLY with this JSON:
{"approved": true, "summary": "2-sentence summary of their idea"}`;

router.post("/onboarding/start", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({ path: z.enum(["visionary", "wozniak"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "path must be visionary or wozniak" });
    return;
  }

  const { path } = parsed.data;
  const sessionId = crypto.randomUUID();

  const firstMessage = path === "visionary"
    ? "Tell me your idea. What problem are you solving?"
    : "What do you actually build? Pick your main thing.";

  const messages: ChatMessage[] = [
    { role: "assistant", content: firstMessage, timestamp: new Date().toISOString() },
  ];

  await db.insert(onboardingSessionsTable).values({
    id: sessionId,
    userId: authReq.user.id,
    path,
    messages,
    phase: "interview",
    isComplete: false,
    homeworkQuestions: [],
  });

  res.json({ sessionId, messages, phase: "interview", isComplete: false, homeworkQuestions: [], summary: null });
});

router.post("/onboarding/chat", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({ message: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "message required" });
    return;
  }

  const [session] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.userId, authReq.user.id));

  if (!session) {
    res.status(404).json({ error: "No active onboarding session" });
    return;
  }

  const existingMessages = session.messages as ChatMessage[];
  const userMessage: ChatMessage = { role: "user", content: parsed.data.message, timestamp: new Date().toISOString() };
  const allMessages = [...existingMessages, userMessage];

  const aiResponse = await chat(VISIONARY_SYSTEM, allMessages);

  let phase = session.phase as string;
  let homeworkQuestions = session.homeworkQuestions as string[];
  let summary: string | null = session.summary ?? null;
  let isComplete = session.isComplete;
  let assistantContent = aiResponse;

  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed2 = JSON.parse(jsonMatch[0]);
      if (parsed2.homework && Array.isArray(parsed2.homework)) {
        homeworkQuestions = parsed2.homework;
        summary = parsed2.summary ?? null;
        phase = "homework";
        assistantContent = parsed2.homework.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n");
      } else if (parsed2.approved === true) {
        summary = parsed2.summary ?? null;
        phase = "complete";
        isComplete = true;
        assistantContent = "You're through. Welcome to Wozzer.";
      }
    }
  } catch (_) { /* not JSON, continue */ }

  const assistantMessage: ChatMessage = { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() };
  const updatedMessages = [...allMessages, assistantMessage];

  await db
    .update(onboardingSessionsTable)
    .set({ messages: updatedMessages, phase, homeworkQuestions, summary, isComplete, updatedAt: new Date() })
    .where(eq(onboardingSessionsTable.id, session.id));

  res.json({ sessionId: session.id, messages: updatedMessages, phase, isComplete, homeworkQuestions, summary });
});

router.post("/onboarding/complete", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({ summary: z.string() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "summary required" });
    return;
  }

  const [session] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.userId, authReq.user.id));

  if (!session) {
    res.status(404).json({ error: "No active onboarding session" });
    return;
  }

  const role = session.path as "visionary" | "wozniak";

  await db
    .update(onboardingSessionsTable)
    .set({ isComplete: true, summary: parsed.data.summary, updatedAt: new Date() })
    .where(eq(onboardingSessionsTable.id, session.id));

  const [updatedUser] = await db
    .update(usersTable)
    .set({ role, onboardingComplete: true, aiSummary: parsed.data.summary, level: "beginner", updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id))
    .returning();

  await awardXp(authReq.user.id, 75);
  await updateStreak(authReq.user.id);
  await grantAchievement(authReq.user.id, "interview_complete");
  await recalculateVisibilityScore(authReq.user.id);

  const [refreshed] = await db.select().from(usersTable).where(eq(usersTable.id, authReq.user.id));
  res.json(formatUser(refreshed ?? updatedUser));
});

router.post("/onboarding/skip", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({ path: z.enum(["visionary", "wozniak"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "path required" });
    return;
  }

  const [updatedUser] = await db
    .update(usersTable)
    .set({ role: parsed.data.path, onboardingComplete: true, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id))
    .returning();

  await recalculateVisibilityScore(authReq.user.id);

  res.json(formatUser(updatedUser));
});

router.post("/onboarding/wozniak/skills", requireAuth, async (req, res): Promise<void> => {
  const parsed = z.object({ skills: z.array(z.string()).min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "skills array required" });
    return;
  }

  const { skills } = parsed.data;
  const primarySkill = skills[0];

  const prompt = `Generate a short technical challenge (5-10 minutes) for a young builder (13-18) claiming to know: ${skills.join(", ")}.
The challenge should test real understanding — not definitions.
Keep it practical: a code snippet, design decision, or explain-the-output problem.

Respond ONLY with valid JSON:
{"challengeId": "c_${Date.now()}", "skill": "${primarySkill}", "prompt": "the challenge here (2-4 sentences, code example if relevant)"}`;

  const response = await generateText(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: "Failed to generate challenge" });
    return;
  }

  res.json(JSON.parse(jsonMatch[0]));
});

router.post("/onboarding/wozniak/challenge", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = z.object({ challengeId: z.string(), answer: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "challengeId and answer required" });
    return;
  }

  const { challengeId, answer } = parsed.data;

  const prompt = `A young builder (13-18) submitted this answer to a technical challenge.
Challenge ID: ${challengeId}
Their answer: ${answer}

Assess their level honestly:
- beginner: knows the basics, gets the idea but misses nuance or makes simple errors
- intermediate: solid understanding, correct approach, minor gaps
- advanced: deep understanding, edge cases considered, would impress a senior dev

Respond ONLY with valid JSON:
{"level": "beginner"|"intermediate"|"advanced", "feedback": "1-2 sentences, honest and specific"}`;

  const response = await generateText(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: "Failed to evaluate" });
    return;
  }

  const result = JSON.parse(jsonMatch[0]);
  const level = ["beginner", "intermediate", "advanced"].includes(result.level) ? result.level : "beginner";

  const [session] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.userId, authReq.user.id));

  if (session) {
    await db
      .update(onboardingSessionsTable)
      .set({ isComplete: true, phase: "complete", updatedAt: new Date() })
      .where(eq(onboardingSessionsTable.id, session.id));
  }

  await db
    .update(usersTable)
    .set({ role: "wozniak", onboardingComplete: true, level, updatedAt: new Date() })
    .where(eq(usersTable.id, authReq.user.id));

  await awardXp(authReq.user.id, 75);
  await updateStreak(authReq.user.id);
  await grantAchievement(authReq.user.id, "challenge_complete");
  await recalculateVisibilityScore(authReq.user.id);

  res.json({ level, feedback: result.feedback });
});

export default router;
