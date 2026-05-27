import { useState } from "react";
import { Layout } from "@/components/layout";
import { LevelBadge } from "@/components/level-badge";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Track {
  id: string;
  title: string;
  description: string;
  category: string;
  levels: string[];
  isDemo: boolean;
  xpReward: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface QuizResult {
  passed: boolean;
  score: number;
  xpAwarded: number;
  feedback: string;
}

const TRACKS: Track[] = [
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

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  "JavaScript": { bg: "#FFFBDE", border: "#C4A800", text: "#6B5A00" },
  "Python": { bg: "#D8EAF5", border: "#3A7CA8", text: "#1A4A6B" },
  "UI Design": { bg: "#F5D8E8", border: "#A83A7C", text: "#6B1A4A" },
  "Product Thinking": { bg: "#D8F0E8", border: "#3AA87C", text: "#1A6B4A" },
};

export default function Certifications() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startTrack = async (trackId: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers([]);
    try {
      const res = await fetch(`${BASE}/api/certifications/${trackId}/questions`, {
        headers: {
          Authorization: `Bearer ${document.cookie.match(/sb-.*-auth-token=([^;]+)/)?.[1] ?? ""}`,
        },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      setActiveTrack(trackId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!activeTrack || answers.some(a => a === null)) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("sb-token") ?? "";
      const res = await fetch(`${BASE}/api/certifications/${activeTrack}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      setQuestions(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (questions) {
    return (
      <Layout>
        <div style={{ maxWidth: 560, padding: "1.5rem 1.25rem" }}>
          <button
            onClick={() => { setQuestions(null); setActiveTrack(null); }}
            className="font-accent"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6355", marginBottom: "1rem", fontSize: "0.9rem" }}
          >
            ← Back
          </button>
          <h1 className="font-serif" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
            JavaScript Fundamentals
          </h1>
          <p className="font-accent" style={{ color: "#6B6355", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {questions.length} questions · +50 XP if you pass
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {questions.map((q, qi) => (
              <div
                key={q.id}
                className="scrap-card"
                style={{ padding: "1rem 1.25rem", transform: qi % 2 === 0 ? "rotate(-0.3deg)" : "rotate(0.3deg)" }}
              >
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", color: "#1A1A1A", fontWeight: 600, marginBottom: "0.75rem" }}>
                  {qi + 1}. {q.text}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers(prev => { const n = [...prev]; n[qi] = oi; return n; })}
                      className="font-accent"
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: "2px",
                        border: answers[qi] === oi ? "2px solid #1A1A1A" : "1.5px solid #C8BFA8",
                        background: answers[qi] === oi ? "#1A1A1A" : "#F5F0E8",
                        color: answers[qi] === oi ? "#FDFAF4" : "#6B6355",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        transition: "all 0.1s",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p style={{ color: "#CC2200", margin: "1rem 0", fontFamily: "'Caveat', cursive" }}>{error}</p>}

          <button
            onClick={submitQuiz}
            disabled={loading || answers.some(a => a === null)}
            className="btn-primary"
            style={{ width: "100%", marginTop: "1.5rem", opacity: answers.some(a => a === null) ? 0.5 : 1 }}
          >
            {loading ? "Submitting..." : "Submit answers"}
          </button>
        </div>
      </Layout>
    );
  }

  if (result) {
    return (
      <Layout>
        <div style={{ maxWidth: 480, padding: "2rem 1.25rem" }}>
          <div
            className="scrap-card p-8 text-center"
            style={{
              transform: "rotate(-0.5deg)",
              background: result.passed ? "#D8F0E0" : "#F5E6D0",
            }}
          >
            <div className="washi washi-top" style={{ width: 90, background: result.passed ? "#5A9A70" : "#C4845A" }} />
            <div style={{ fontSize: "2.5rem", marginTop: "1rem" }}>{result.passed ? "🏅" : "📚"}</div>
            <h2 className="font-serif" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
              {result.passed ? "Certified!" : "Not quite"}
            </h2>
            <p className="font-accent" style={{ fontSize: "1.2rem", color: "#1A1A1A", marginBottom: 6 }}>
              Score: {result.score}%
            </p>
            <p style={{ color: "#6B6355", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              {result.feedback}
            </p>
            {result.xpAwarded > 0 && (
              <p className="font-accent" style={{ color: "#E8450A", fontSize: "1rem", fontWeight: 700 }}>
                +{result.xpAwarded} XP earned
              </p>
            )}
            <button
              onClick={() => { setResult(null); setActiveTrack(null); }}
              className="btn-primary"
              style={{ marginTop: "1.5rem", width: "100%" }}
            >
              Back to certifications
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 600, padding: "1.5rem 1.25rem" }}>
        <div className="washi washi-top washi-blue" style={{ width: 90, transform: "translateX(-10px) rotate(-2deg)", marginBottom: -6 }} />
        <h1 className="font-serif" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
          Certifications
        </h1>
        <p className="font-accent" style={{ color: "#6B6355", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Earn verified badges. Get XP. Show off what you actually know.
        </p>

        {error && <p style={{ color: "#CC2200", margin: "0 0 1rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {TRACKS.map((track, i) => {
            const colors = categoryColors[track.category] ?? { bg: "#EDE8DE", border: "#C8BFA8", text: "#6B6355" };
            return (
              <div
                key={track.id}
                className="scrap-card"
                style={{
                  padding: "1.25rem",
                  transform: i % 2 === 0 ? "rotate(-0.4deg)" : "rotate(0.4deg)",
                  opacity: track.isDemo ? 1 : 0.75,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span
                        className="font-accent"
                        style={{
                          fontSize: "0.7rem",
                          padding: "1px 8px",
                          background: colors.bg,
                          border: `1.5px solid ${colors.border}`,
                          borderRadius: "3px",
                          color: colors.text,
                          fontWeight: 700,
                        }}
                      >
                        {track.category}
                      </span>
                      {!track.isDemo && (
                        <span className="font-accent" style={{ fontSize: "0.7rem", color: "#A09890" }}>
                          Coming soon
                        </span>
                      )}
                      {track.isDemo && (
                        <span className="font-accent" style={{ fontSize: "0.7rem", color: "#1A6B3A", fontWeight: 700 }}>
                          ✓ Available now
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                      {track.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "#6B6355", fontFamily: "'Inter', sans-serif", lineHeight: 1.5, marginBottom: 8 }}>
                      {track.description}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {track.levels.map(l => (
                        <span
                          key={l}
                          className="font-accent"
                          style={{
                            fontSize: "0.7rem",
                            padding: "1px 7px",
                            background: "#EDE8DE",
                            border: "1px solid #C8BFA8",
                            borderRadius: "2px",
                            color: "#6B6355",
                          }}
                        >
                          {l}
                        </span>
                      ))}
                      <span className="font-accent" style={{ fontSize: "0.7rem", color: "#E8450A", fontWeight: 700 }}>
                        +{track.xpReward} XP
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, marginTop: 4 }}>
                    {track.isDemo ? (
                      <button
                        onClick={() => startTrack(track.id)}
                        disabled={loading}
                        className="btn-primary"
                        style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                      >
                        {loading ? "..." : "Start"}
                      </button>
                    ) : (
                      <span
                        className="font-accent"
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "#C8BFA8",
                          border: "1px dashed #C8BFA8",
                          borderRadius: "2px",
                          padding: "5px 10px",
                        }}
                      >
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
