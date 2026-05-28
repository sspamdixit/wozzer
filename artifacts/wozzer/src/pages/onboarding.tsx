import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStartOnboarding, useOnboardingChat, useCompleteOnboarding,
  useSubmitWozniakSkills, useSubmitWozniakChallenge, OnboardingState,
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

const BG = "#FFFCF7";
const INK = "#1C1917";
const BORDER = "#E4D8C8";
const MUTED = "#78716C";
const ORANGE = "#FF5A1F";
const GREEN = "#58CC02";

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

  useEffect(() => { if (user?.onboardingComplete) setLocation("/discover"); }, [user, setLocation]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [state?.messages]);

  const handleStartPath = async (path: "visionary" | "wozniak") => {
    setSelectedPath(path);
    if (path === "visionary") {
      try { const res = await startOnboarding.mutateAsync({ data: { path } }); setState(res); }
      catch (e: any) { setError(e.message); }
    }
  };

  const handleSkip = async (path: "visionary" | "wozniak") => {
    setIsSkipping(true); setSkipError("");
    try {
      const token = session?.access_token ?? "";
      if (!token) throw new Error("Not signed in");
      await skipOnboarding(path, token);
      queryClient.invalidateQueries();
      await refreshUser();
      setLocation("/discover");
    } catch (e: any) { setSkipError(e.message || "Couldn't skip — try again"); }
    finally { setIsSkipping(false); }
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
        queryClient.invalidateQueries(); refreshUser();
        setTimeout(() => setLocation("/discover"), 1200);
      }
    } catch (e: any) { setError(e.message); }
  };

  const handleCompleteHomework = async () => {
    try {
      await completeMutation.mutateAsync({ data: { summary: state?.summary || "" } });
      queryClient.invalidateQueries(); refreshUser(); setLocation("/discover");
    } catch (e: any) { setError(e.message); }
  };

  const handleWozniakSkillsSubmit = async () => {
    if (wozniakSkills.length === 0) return;
    try { const res = await submitSkills.mutateAsync({ data: { skills: wozniakSkills } }); setChallenge({ id: res.challengeId, text: res.prompt }); }
    catch (e: any) { setError(e.message); }
  };

  const handleChallengeSubmit = async () => {
    if (!challengeAnswer.trim() || !challenge) return;
    try {
      const res = await submitChallenge.mutateAsync({ data: { challengeId: challenge.id, answer: challengeAnswer } });
      setLevelResult(res);
      queryClient.invalidateQueries(); refreshUser();
      setTimeout(() => setLocation("/discover"), 2500);
    } catch (e: any) { setError(e.message); }
  };

  // ── Path selector ────────────────────────────────────────────────────────────
  if (!selectedPath) {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 460, width: "100%" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{ width: 34, height: 34, background: ORANGE, border: "2.5px solid #1C1917", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", boxShadow: "3px 3px 0 #1C1917" }}>W</div>
            <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.2rem", color: INK }}>Wozzer</span>
          </div>

          {/* Header card */}
          <div style={{ position: "relative", marginBottom: 18 }}>
            <div className="washi washi-yellow washi-top" style={{ width: 80 }} />
            <div className="scrap-card" style={{ padding: "24px 22px", transform: "rotate(-0.5deg)" }}>
              <span className="sticker sticker-orange" style={{ marginBottom: 12, display: "inline-flex" }}>Step 1 of 1</span>
              <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.75rem", color: INK, marginBottom: 8, lineHeight: 1.15 }}>
                How do you build?
              </h1>
              <p style={{ fontFamily: "'Inter'", color: MUTED, fontSize: "0.93rem", lineHeight: 1.6, margin: 0 }}>
                Earn your spot. Complete one path — then your profile shows up in people's decks.
              </p>
            </div>
          </div>

          {error && <p style={{ color: "#FF4B4B", fontFamily: "'Inter'", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}

          {/* Path cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <button onClick={() => handleStartPath("visionary")} disabled={startOnboarding.isPending}
              style={{ background: "#FFF8F2", border: "2px solid #1C1917", borderRadius: 16, padding: "18px 20px", textAlign: "left", cursor: "pointer", boxShadow: "4px 4px 0 #1C1917", transform: "rotate(-0.8deg)", transition: "transform 0.12s, box-shadow 0.12s", width: "100%" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "rotate(-0.8deg) translateY(-3px)"; e.currentTarget.style.boxShadow = "4px 7px 0 #1C1917"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "rotate(-0.8deg)"; e.currentTarget.style.boxShadow = "4px 4px 0 #1C1917"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "1.5rem" }}>💡</span>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.1rem", color: INK }}>I have an idea</div>
                  <span className="sticker sticker-purple" style={{ marginTop: 2, display: "inline-flex" }}>Visionary · +75 XP</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.87rem", color: MUTED, lineHeight: 1.55, margin: 0 }}>
                Defend your idea in an AI interview. Come with something real — or get homework.
              </p>
            </button>

            <button onClick={() => handleStartPath("wozniak")} disabled={startOnboarding.isPending}
              style={{ background: "#F2FFF5", border: "2px solid #1C1917", borderRadius: 16, padding: "18px 20px", textAlign: "left", cursor: "pointer", boxShadow: "4px 4px 0 #1C1917", transform: "rotate(0.7deg)", transition: "transform 0.12s, box-shadow 0.12s", width: "100%" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "rotate(0.7deg) translateY(-3px)"; e.currentTarget.style.boxShadow = "4px 7px 0 #1C1917"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "rotate(0.7deg)"; e.currentTarget.style.boxShadow = "4px 4px 0 #1C1917"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.1rem", color: INK }}>I can build things</div>
                  <span className="sticker sticker-green" style={{ marginTop: 2, display: "inline-flex" }}>Wozniak · +75 XP</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.87rem", color: MUTED, lineHeight: 1.55, margin: 0 }}>
                Pick your skills, solve a real challenge, get your level. Instant results.
              </p>
            </button>
          </div>

          {/* Skip */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.82rem", marginBottom: 10 }}>
              Not ready? You'll be less visible in discovery until you complete this.
            </p>
            {skipError && <p style={{ color: "#FF4B4B", fontSize: "0.82rem", fontFamily: "'Inter'", marginBottom: 8 }}>{skipError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {(["visionary", "wozniak"] as const).map(p => (
                <button key={p} onClick={() => handleSkip(p)} disabled={isSkipping}
                  style={{ background: "transparent", border: "1.5px dashed #D1C4B0", borderRadius: 10, padding: "5px 14px", cursor: "pointer", color: "#A8A29E", fontFamily: "'Inter'", fontSize: "0.82rem", opacity: isSkipping ? 0.5 : 1 }}>
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
          <button onClick={() => setSelectedPath(null)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontFamily: "'Inter'", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ position: "relative" }}>
            <div className="washi washi-green washi-top" style={{ width: 80 }} />
            <div className="scrap-card" style={{ padding: "28px 22px" }}>
              <span className="sticker sticker-green" style={{ marginBottom: 12, display: "inline-flex" }}>Wozniak path</span>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.5rem", color: INK, marginBottom: 6 }}>What do you build?</h2>
              <p style={{ fontFamily: "'Inter'", color: MUTED, fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.5 }}>Pick your skills. We'll test one — be honest, the AI can tell.</p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                {PRESET_SKILLS.map(skill => (
                  <button key={skill} onClick={() => setWozniakSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                    className={`skill-tag${wozniakSkills.includes(skill) ? " active" : ""}`}>{skill}</button>
                ))}
              </div>

              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'", marginBottom: 12 }}>{error}</p>}
              <button onClick={handleWozniakSkillsSubmit} disabled={wozniakSkills.length === 0 || submitSkills.isPending} className="btn-primary" style={{ width: "100%" }}>
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
          <div style={{ position: "relative" }}>
            <div className="washi washi-orange washi-top" style={{ width: 80 }} />
            <div className="scrap-card" style={{ padding: "28px 22px" }}>
              <span className="sticker sticker-orange" style={{ marginBottom: 12, display: "inline-flex" }}>The Challenge</span>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.4rem", color: INK, marginBottom: 14 }}>Show what you know</h2>
              <div style={{ background: "#FFF8F0", border: "2px solid #E4D8C8", borderRadius: 10, padding: "14px 16px", fontFamily: "'Inter', monospace", fontSize: "0.87rem", lineHeight: 1.7, color: INK, marginBottom: 16, whiteSpace: "pre-wrap" }}>
                {challenge.text}
              </div>
              <textarea style={{ width: "100%", minHeight: 160, background: "#FFF8F0", border: "2px solid #E4D8C8", borderRadius: 10, padding: "12px 14px", fontFamily: "'Inter', monospace", fontSize: "0.87rem", color: INK, outline: "none", resize: "vertical", marginBottom: 14, boxSizing: "border-box", lineHeight: 1.6 }}
                placeholder="Your answer…" value={challengeAnswer} onChange={e => setChallengeAnswer(e.target.value)}
                onFocus={e => { e.currentTarget.style.borderColor = ORANGE; }}
                onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
              />
              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'", marginBottom: 12 }}>{error}</p>}
              <button onClick={handleChallengeSubmit} disabled={!challengeAnswer.trim() || submitChallenge.isPending} className="btn-primary" style={{ width: "100%" }}>
                {submitChallenge.isPending ? <><Loader2 size={15} className="animate-spin" /> Evaluating…</> : "Submit answer →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Level result ─────────────────────────────────────────────────────────────
  if (levelResult) {
    const cfg = {
      advanced:     { emoji: "🔥", label: "Advanced Wozniak",     color: "#9040CC", bg: "#F6EEFF", washi: "washi-purple" },
      intermediate: { emoji: "⚡", label: "Intermediate Wozniak", color: "#0A84C8", bg: "#E8F7FF", washi: "washi-blue" },
      beginner:     { emoji: "🌱", label: "Beginner Wozniak",     color: GREEN,     bg: "#F2FFF5", washi: "washi-green" },
    }[levelResult.level as "advanced" | "intermediate" | "beginner"] ?? { emoji: "🌱", label: "Wozniak", color: GREEN, bg: "#F2FFF5", washi: "washi-green" };
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ position: "relative" }}>
            <div className={`washi ${cfg.washi} washi-top`} style={{ width: 100 }} />
            <div className="scrap-card" style={{ padding: "32px 24px", textAlign: "center", background: cfg.bg }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>{cfg.emoji}</div>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.8rem", color: cfg.color, marginBottom: 10 }}>{cfg.label}</h2>
              <p style={{ fontFamily: "'Inter'", color: MUTED, fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 16 }}>{levelResult.feedback}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Inter'", fontSize: "0.88rem", fontWeight: 700, color: ORANGE }}>
                <Zap size={14} /> +75 XP · Level 1 unlocked
              </div>
              <p style={{ marginTop: 18, fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.8rem" }}>Taking you in…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Visionary interview ──────────────────────────────────────────────────────
  if (state?.phase === "interview") {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,252,247,0.95)", backdropFilter: "blur(10px)", borderBottom: `2px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setSelectedPath(null); setState(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: INK }}>The Interview</div>
          <span className="sticker sticker-orange" style={{ marginLeft: "auto" }}>Visionary · +75 XP</span>
        </div>

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

        <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: `2px solid ${BORDER}`, background: "rgba(255,252,247,0.97)" }}>
          {error && <p style={{ color: "#FF4B4B", fontSize: "0.82rem", fontFamily: "'Inter'" }}>{error}</p>}
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Defend your idea…" disabled={chatMutation.isPending}
            style={{ flex: 1, padding: "10px 14px", background: "#FFF8F0", border: `2px solid ${BORDER}`, borderRadius: 12, fontFamily: "'Inter'", fontSize: "0.9rem", color: INK, outline: "none" }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE; }}
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
          />
          <button type="submit" disabled={!chatInput.trim() || chatMutation.isPending}
            style={{ background: ORANGE, border: "2px solid #1C1917", borderRadius: 12, padding: "0 16px", cursor: "pointer", color: "#fff", opacity: !chatInput.trim() ? 0.4 : 1, boxShadow: "2px 2px 0 #1C1917", display: "flex", alignItems: "center" }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  // ── Homework ─────────────────────────────────────────────────────────────────
  if (state?.phase === "homework") {
    return (
      <div style={{ minHeight: "100svh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={{ position: "relative" }}>
            <div className="washi washi-yellow washi-top" style={{ width: 90 }} />
            <div className="scrap-card" style={{ padding: "28px 22px" }}>
              <span className="sticker sticker-yellow" style={{ marginBottom: 12, display: "inline-flex" }}>Homework assigned</span>
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.5rem", color: INK, marginBottom: 8 }}>Almost there</h2>
              <p style={{ fontFamily: "'Inter'", color: MUTED, fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 18 }}>
                Your idea has real potential. Work through these — your visibility will be limited until you do.
              </p>
              <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                {state.homeworkQuestions?.map((q, i) => (
                  <li key={i} style={{ color: INK, fontSize: "0.9rem", fontFamily: "'Inter'", lineHeight: 1.6 }}>{q}</li>
                ))}
              </ol>
              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'", marginBottom: 12 }}>{error}</p>}
              <button onClick={handleCompleteHomework} disabled={completeMutation.isPending} className="btn-primary" style={{ width: "100%" }}>
                {completeMutation.isPending ? "..." : "I've thought it through →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
