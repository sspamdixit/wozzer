import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { awardXp } from "../lib/gamification";
import { usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const DEMO_QUESTIONS = [
  {
    id: "q1",
    text: "What does `typeof null` return in JavaScript?",
    options: ["null", "undefined", "object", "string"],
    correctIndex: 2,
  },
  {
    id: "q2",
    text: "Which array method returns a new array with each element transformed?",
    options: ["filter", "map", "reduce", "forEach"],
    correctIndex: 1,
  },
  {
    id: "q3",
    text: "What does `===` check compared to `==`?",
    options: [
      "Value only",
      "Type only",
      "Value and type",
      "Reference equality",
    ],
    correctIndex: 2,
  },
];

const TRACKS = [
  {
    id: "js-fundamentals",
    title: "JavaScript Fundamentals",
    description: "Core JS concepts every builder needs. Variables, functions, arrays, and the weird parts.",
    category: "JavaScript",
    levels: ["Beginner", "Intermediate", "Advanced"],
    isDemo: true,
    xpReward: 50,
  },
  {
    id: "python-basics",
    title: "Python for Builders",
    description: "Python from scratch — data types, loops, functions, and getting things done fast.",
    category: "Python",
    levels: ["Beginner", "Intermediate", "Advanced"],
    isDemo: false,
    xpReward: 50,
  },
  {
    id: "ui-design",
    title: "UI Design Thinking",
    description: "Visual hierarchy, spacing, colour theory, and how to make things that don't look terrible.",
    category: "UI Design",
    levels: ["Beginner", "Intermediate"],
    isDemo: false,
    xpReward: 50,
  },
  {
    id: "product-thinking",
    title: "Product Thinking",
    description: "Defining problems, scoping solutions, shipping and learning. The mindset behind great products.",
    category: "Product Thinking",
    levels: ["Beginner", "Intermediate"],
    isDemo: false,
    xpReward: 50,
  },
];

router.get("/certifications", async (_req, res): Promise<void> => {
  res.json({ tracks: TRACKS });
});

router.get("/certifications/:trackId/questions", requireAuth, async (req, res): Promise<void> => {
  const { trackId } = req.params;
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) {
    res.status(404).json({ error: "Track not found" });
    return;
  }
  if (!track.isDemo) {
    res.status(403).json({ error: "This track is coming soon" });
    return;
  }
  res.json({ questions: DEMO_QUESTIONS.map(q => ({ id: q.id, text: q.text, options: q.options })) });
});

router.post("/certifications/:trackId/submit", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: typeof usersTable.$inferSelect };
  const { trackId } = req.params;
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) {
    res.status(404).json({ error: "Track not found" });
    return;
  }
  if (!track.isDemo) {
    res.status(403).json({ error: "This track is coming soon" });
    return;
  }

  const parsed = z.object({ answers: z.array(z.number()) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "answers array required" });
    return;
  }

  const { answers } = parsed.data;
  let correct = 0;
  for (let i = 0; i < DEMO_QUESTIONS.length; i++) {
    if (answers[i] === DEMO_QUESTIONS[i].correctIndex) correct++;
  }

  const score = Math.round((correct / DEMO_QUESTIONS.length) * 100);
  const passed = score >= 67;

  let xpAwarded = 0;
  if (passed) {
    xpAwarded = track.xpReward;
    await awardXp(authReq.user.id, xpAwarded);
  }

  res.json({
    passed,
    score,
    xpAwarded,
    feedback: passed
      ? `Solid — ${correct}/${DEMO_QUESTIONS.length} correct. ${xpAwarded} XP earned.`
      : `${correct}/${DEMO_QUESTIONS.length} correct. Study the fundamentals and try again.`,
  });
});

export default router;
