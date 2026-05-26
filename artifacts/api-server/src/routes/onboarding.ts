import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, onboardingSessionsTable } from "@workspace/db";
import {
  StartOnboardingBody,
  OnboardingChatBody,
  CompleteOnboardingBody,
  SubmitBuilderSkillsBody,
  SubmitBuilderChallengeBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { chat, generateText } from "../lib/gemini";
import crypto from "crypto";
import { formatUser } from "./auth";

const router: IRouter = Router();

type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: string };

const VISIONARY_SYSTEM = `You are an AI interviewer for Wozzer, a social network for young builders aged 13-18.
Your role is to interview them about their startup/project idea.
Be direct, sharp, and intellectually honest — like a Y Combinator partner.
Ask probing questions that stress-test the idea. Push back on weak assumptions.
After 4-5 exchanges, generate exactly 3 homework questions — deep follow-up questions that will help the user define their idea further.
When you've asked enough questions and want to give homework, respond ONLY with valid JSON in this exact format (no other text):
{"homework": ["question1", "question2", "question3"], "summary": "2-3 sentence summary of their idea"}`;

const BUILDER_SYSTEM = `You are an AI technical interviewer for Wozzer, a social network for young builders aged 13-18.
Your role is to verify the user's technical skills through a short practical challenge.
Be encouraging but rigorous. The challenge should be solvable in 5-10 minutes.
Keep responses concise and clear.`;

router.post("/onboarding/start", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = StartOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { path } = parsed.data;
  const sessionId = crypto.randomUUID();

  let firstMessage: string;
  if (path === "visionary") {
    firstMessage = "Tell me about your idea. What problem does it solve, and why does it need to exist?";
  } else {
    firstMessage = "Welcome to the Builder track. What skills are you most confident in? (e.g. web dev, mobile, ML, hardware, design)";
  }

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

  res.json({
    sessionId,
    messages,
    phase: "interview",
    isComplete: false,
    homeworkQuestions: [],
    summary: null,
  });
});

router.post("/onboarding/chat", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = OnboardingChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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
  const userMessage: ChatMessage = {
    role: "user",
    content: parsed.data.message,
    timestamp: new Date().toISOString(),
  };

  const allMessages = [...existingMessages, userMessage];

  const aiResponse = await chat(VISIONARY_SYSTEM, allMessages);

  let phase = session.phase as string;
  let homeworkQuestions = session.homeworkQuestions as string[];
  let summary: string | null = session.summary ?? null;
  let isComplete = session.isComplete;
  let assistantContent = aiResponse;

  // Check if AI returned homework JSON
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*"homework"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.homework && Array.isArray(parsed.homework)) {
        homeworkQuestions = parsed.homework;
        summary = parsed.summary ?? null;
        phase = "homework";
        assistantContent = `Here's your homework before you can proceed. These questions will sharpen your idea:\n\n${homeworkQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
      }
    }
  } catch (_) {
    // Not JSON, continue normally
  }

  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...allMessages, assistantMessage];

  await db
    .update(onboardingSessionsTable)
    .set({ messages: updatedMessages, phase, homeworkQuestions, summary, isComplete, updatedAt: new Date() })
    .where(eq(onboardingSessionsTable.id, session.id));

  res.json({
    sessionId: session.id,
    messages: updatedMessages,
    phase,
    isComplete,
    homeworkQuestions,
    summary,
  });
});

router.post("/onboarding/complete", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = CompleteOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const role = session.path as "visionary" | "builder";

  await db
    .update(onboardingSessionsTable)
    .set({ isComplete: true, summary: parsed.data.summary, updatedAt: new Date() })
    .where(eq(onboardingSessionsTable.id, session.id));

  const [updatedUser] = await db
    .update(usersTable)
    .set({
      role,
      onboardingComplete: true,
      aiSummary: parsed.data.summary,
      level: 1,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, authReq.user.id))
    .returning();

  res.json(formatUser(updatedUser));
});

// Builder path
router.post("/onboarding/builder/skills", requireAuth, async (req, res): Promise<void> => {
  const parsed = SubmitBuilderSkillsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { skills } = parsed.data;
  const primarySkill = skills[0];

  const prompt = `Generate a short technical challenge (5-10 minute task) for a young builder (13-18 years old) who claims to know: ${primarySkill}.
The challenge should:
- Be practical and solvable in text (code snippet, explanation, or design decision)
- Test real understanding, not just definitions
- Be appropriate for a teenager

Respond ONLY with valid JSON:
{"challengeId": "challenge_${Date.now()}", "skill": "${primarySkill}", "prompt": "the challenge prompt here"}`;

  const response = await generateText(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: "Failed to generate challenge" });
    return;
  }

  const challenge = JSON.parse(jsonMatch[0]);
  res.json(challenge);
});

router.post("/onboarding/builder/challenge", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const parsed = SubmitBuilderChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { challengeId, answer } = parsed.data;

  const prompt = `A young builder (13-18) submitted this answer to a technical challenge.
Challenge ID: ${challengeId}
Their answer: ${answer}

Evaluate whether they demonstrated real understanding. Be fair and encouraging.
Respond ONLY with valid JSON:
{"passed": true/false, "feedback": "short encouraging feedback (1-2 sentences)"}`;

  const response = await generateText(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: "Failed to evaluate challenge" });
    return;
  }

  const result = JSON.parse(jsonMatch[0]);

  if (result.passed) {
    // Mark onboarding complete for builder
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
      .set({ role: "builder", onboardingComplete: true, level: 1, updatedAt: new Date() })
      .where(eq(usersTable.id, authReq.user.id));
  }

  res.json(result);
});

export default router;
