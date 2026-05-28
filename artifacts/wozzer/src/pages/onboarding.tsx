import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStartOnboarding,
  useOnboardingChat,
  useCompleteOnboarding,
  useSubmitWozniakSkills,
  useSubmitWozniakChallenge,
  OnboardingState,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, ArrowLeft, Zap } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function skipOnboarding(path: "visionary" | "wozniak", token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/onboarding/skip`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try { const b = await res.json(); msg = b.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
}

const PRESET_SKILLS = [
  "React", "Node.js", "Python", "Rust", "Go", "Swift",
  "Machine Learning", "iOS", "Android", "Hardware", "UI/UX Design", "C++", "Game Dev",
];

const BG = "#080809";
const CARD = "#111113";
const BORDER = "#27272A";
const TEXT = "#F4F4F5";
const MUTED = "#71717A";
const ORANGE = "#E8450A";

export default function Onboarding() {
  const { user, refreshUser, session } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedPath, setSelectedPath] = useState<"visionary" | "wozniak" | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const [skipError, setSkipError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const startOnboarding = useStartOnboarding();
  const chatMutation = useOnboardingChat();
  const completeMutation = useCompleteOnboarding();
  const submitSkills = useSubmitWozniakSkills();
  const submitChallenge = useSubmitWozniakChallenge();

  const [wozniakSkills, setWozniakSkills] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<{ id: string; text: string } | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [levelResult, setLevelResult] = useState<{ level: string; feedback: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.onboardingComplete) setLocation("/feed");
  }, [user, setLocation]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state?.messages]);

  const handleStartPath = async (path: "visionary" | "wozniak") => {
    setSelectedPath(path);
    if (path === "visionary") {
      try {
        const res = await startOnboarding.mutateAsync({ data: { path } });
        setState(res);
      } catch (e: any) { setError(e.message); }
    }
  };

  const handleSkip = async (path: "visionary" | "wozniak") => {
    setIsSkipping(true);
    setSkipError("");
    try {
      const token = session?.access_token ?? "";
      if (!token) throw new Error("Not signed in");
      await skipOnboarding(path, token);
      queryClient.invalidateQueries();
      await refreshUser();
      setLocation("/feed");
    } catch (e: any) {
      setSkipError(e.message || "Couldn't skip — try again");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatMutation.isPending) return;
    const msg = chatInput;
    setChatInput("");
    setState(prev => prev ? { ...prev, messages: [...prev.messages, { role: "user", content: msg, timestamp: new Date().toISOString() }] } : prev);
    try {
      const res = await chatMutation.mutateAsync({ data: { message: msg } });
      setState(res);
      if (res.phase === "complete") {
        await completeMutation.mutateAsync({ data: { summary: res.summary || "Visionary approved" } });
        queryClient.invalidateQueries();
        refreshUser();
        setTimeout(() => setLocation("/feed"), 1200);
      }
    } catch (e: any) { setError(e.message); }
  };

  const handleCompleteHomework = async () => {
    try {
      await completeMutation.mutateAsync({ data: { summary: state?.summary || "" } });
      queryClient.invalidateQueries();
      refreshUser();
      setLocation("/feed");
    } catch (e: any) { setError(e.message); }
  };

  const handleWozniakSkillsSubmit = async () => {
    if (wozniakSkills.length === 0) return;
    try {
      const res = await submitSkills.mutateAsync({ data: { skills: wozniakSkills } });
      setChallenge({ id: res.challengeId, text: res.prompt });
    } catch (e: any) { setError(e.message); }
  };

  const handleChallengeSubmit = async () => {
    if (!challengeAnswer.trim() || !challenge) return;
    try {
      const res = await submitChallenge.mutateAsync({ data: { challengeId: challenge.id, answer: challengeAnswer } });
      setLevelResult(res);
      queryClient.invalidateQueries();
      refreshUser();
      setTimeout(() => setLocation("/feed"), 2500);
    } catch (e: any) { setError(e.message); }
  };

  // ── Path selector ────────────────────────────────────────────────────────────
  if (!selectedPath) {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(ellipse, rgba(232,69,10,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 460, width: "100%", position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", boxShadow: "0 3px 10px rgba(232,69,10,0.4)" }}>W</div>
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.2rem", color: TEXT }}>Wozzer</span>
          </div>

          <span className="tag-orange" style={{ marginBottom: 14, display: "inline-block" }}>Step 1 of 1</span>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.9rem", color: TEXT, marginBottom: 10, lineHeight: 1.15 }}>
            How do you build?
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", color: MUTED, fontSize: "0.93rem", lineHeight: 1.6, marginBottom: 28 }}>
            Earn your spot. Complete one of these — your profile will be visible to other builders.
          </p>

          {error && <p style={{ color: "#F87171", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Visionary card */}
            <button
              onClick={() => handleStartPath("visionary")}
              disabled={startOnboarding.isPending}
              style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px",
                textAlign: "left", cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                width: "100%",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.background = "#151517"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: "1.4rem" }}>💡</span>
                <div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.15rem", color: TEXT }}>I have an idea</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.06em" }}>Visionary path</div>
                </div>
                <span style={{ marginLeft: "auto", fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: MUTED }}>+75 XP</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.87rem", color: MUTED, lineHeight: 1.55, margin: 0 }}>
                Defend your idea in an AI interview. Come with something real — or get homework.
              </p>
            </button>

            {/* Wozniak card */}
            <button
              onClick={() => handleStartPath("wozniak")}
              disabled={startOnboarding.isPending}
              style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px",
                textAlign: "left", cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                width: "100%",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.background = "#151517"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: "1.4rem" }}>⚡</span>
                <div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.15rem", color: TEXT }}>I can build things</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.06em" }}>Wozniak path</div>
                </div>
                <span style={{ marginLeft: "auto", fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: MUTED }}>+75 XP</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.87rem", color: MUTED, lineHeight: 1.55, margin: 0 }}>
                Pick your skills, solve a real challenge, get your level. Instant results.
              </p>
            </button>
          </div>

          {/* Skip */}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#52525B", fontSize: "0.83rem", marginBottom: 10 }}>
              Not ready? Your profile won't appear in discovery until you complete this.
            </p>
            {skipError && <p style={{ color: "#F87171", fontSize: "0.82rem", fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>{skipError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {(["visionary", "wozniak"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleSkip(p)}
                  disabled={isSkipping}
                  style={{
                    background: "transparent", border: "1px dashed #27272A", borderRadius: 8,
                    padding: "5px 14px", cursor: "pointer", color: "#52525B",
                    fontFamily: "'Inter', sans-serif", fontSize: "0.83rem", opacity: isSkipping ? 0.5 : 1,
                  }}
                >
                  {isSkipping ? "..." : `Skip as ${p === "visionary" ? "Visionary" : "Wozniak"}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Wozniak — skill selection ────────────────────────────────────────────────
  if (selectedPath === "wozniak" && !challenge && !levelResult) {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <button onClick={() => setSelectedPath(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 5, marginBottom: 24 }}>
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 24px" }}>
            <span className="tag-orange" style={{ marginBottom: 14, display: "inline-block" }}>Wozniak path</span>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.55rem", color: TEXT, marginBottom: 8, lineHeight: 1.2 }}>
              What do you build?
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: MUTED, fontSize: "0.9rem", marginBottom: 22, lineHeight: 1.5 }}>
              Select your skills. We'll test one — be honest, the AI can tell.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {PRESET_SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => setWozniakSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                  className={`skill-tag${wozniakSkills.includes(skill) ? " active" : ""}`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {error && <p style={{ color: "#F87171", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleWozniakSkillsSubmit}
                disabled={wozniakSkills.length === 0 || submitSkills.isPending}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {submitSkills.isPending ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : "Get my challenge →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Wozniak — challenge ──────────────────────────────────────────────────────
  if (challenge && !levelResult) {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 520, width: "100%" }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 24px" }}>
            <span className="tag-orange" style={{ marginBottom: 14, display: "inline-block" }}>The Challenge</span>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.45rem", color: TEXT, marginBottom: 16, lineHeight: 1.2 }}>
              Show what you know
            </h2>
            <div style={{ background: "#0D0D10", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", fontFamily: "'Inter', monospace", fontSize: "0.87rem", lineHeight: 1.7, color: "#D4D4D8", marginBottom: 18, whiteSpace: "pre-wrap" }}>
              {challenge.text}
            </div>
            <textarea
              style={{ width: "100%", minHeight: 160, background: "#18181B", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", fontFamily: "'Inter', monospace", fontSize: "0.87rem", color: TEXT, outline: "none", resize: "vertical", marginBottom: 14, boxSizing: "border-box", lineHeight: 1.6 }}
              placeholder="Your answer…"
              value={challengeAnswer}
              onChange={e => setChallengeAnswer(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = ORANGE; }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
            />
            {error && <p style={{ color: "#F87171", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>{error}</p>}
            <button
              onClick={handleChallengeSubmit}
              disabled={!challengeAnswer.trim() || submitChallenge.isPending}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              {submitChallenge.isPending ? <><Loader2 size={15} className="animate-spin" /> Evaluating…</> : "Submit answer →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Level result ─────────────────────────────────────────────────────────────
  if (levelResult) {
    const accentColor = levelResult.level === "advanced" ? "#A78BFA" : levelResult.level === "intermediate" ? "#34D399" : ORANGE;
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ background: CARD, border: `1px solid ${accentColor}40`, borderRadius: 16, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: `${accentColor}20`, border: `2px solid ${accentColor}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.5rem" }}>
              {levelResult.level === "advanced" ? "🔥" : levelResult.level === "intermediate" ? "⚡" : "🌱"}
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", color: MUTED, fontSize: "0.88rem", marginBottom: 4 }}>You're a</p>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "2rem", color: accentColor, textTransform: "capitalize", marginBottom: 12 }}>
              {levelResult.level} Wozniak
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#A1A1AA", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 16 }}>
              {levelResult.feedback}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: ORANGE }}>
              <Zap size={14} /> +75 XP · Level 1 unlocked
            </div>
            <p style={{ marginTop: 20, fontFamily: "'Inter', sans-serif", color: "#52525B", fontSize: "0.8rem" }}>
              Taking you in…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Visionary interview ──────────────────────────────────────────────────────
  if (state?.phase === "interview") {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "rgba(8,8,9,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setSelectedPath(null); setState(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.93rem", color: TEXT }}>The Interview</div>
          <span className="tag-orange" style={{ marginLeft: "auto" }}>Visionary · +75 XP</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {state.messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "user"
                ? <div className="chat-bubble-user">{m.content}</div>
                : <div className="chat-bubble-ai" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              }
            </div>
          ))}
          {chatMutation.isPending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div className="chat-bubble-ai" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Loader2 size={13} className="animate-spin" />
                <span style={{ color: MUTED }}>thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: 10, padding: "14px 16px", borderTop: `1px solid ${BORDER}`, background: "rgba(8,8,9,0.95)", backdropFilter: "blur(12px)" }}>
          {error && <p style={{ color: "#F87171", fontSize: "0.82rem", fontFamily: "'Inter', sans-serif" }}>{error}</p>}
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Defend your idea…"
            disabled={chatMutation.isPending}
            style={{ flex: 1, padding: "10px 14px", background: "#18181B", border: `1px solid ${BORDER}`, borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", color: TEXT, outline: "none" }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE; }}
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatMutation.isPending}
            style={{ background: ORANGE, border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", color: "#fff", opacity: !chatInput.trim() ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  // ── Homework ─────────────────────────────────────────────────────────────────
  if (state?.phase === "homework") {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 24px" }}>
            <span style={{ display: "inline-block", marginBottom: 14, fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.06em", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 999, padding: "2px 10px" }}>
              Homework
            </span>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.5rem", color: TEXT, marginBottom: 8 }}>
              Almost there
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: MUTED, fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 20 }}>
              Your idea has real potential. Work through these questions — visibility will be limited until you do.
            </p>
            <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {state.homeworkQuestions?.map((q, i) => (
                <li key={i} style={{ color: "#D4D4D8", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                  {q}
                </li>
              ))}
            </ol>
            {error && <p style={{ color: "#F87171", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>{error}</p>}
            <button onClick={handleCompleteHomework} disabled={completeMutation.isPending} className="btn-primary" style={{ width: "100%" }}>
              {completeMutation.isPending ? "..." : "I've thought it through →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
