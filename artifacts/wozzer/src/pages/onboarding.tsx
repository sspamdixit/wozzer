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
    const msg = chatInput; setChatInput("");
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

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1.5px solid #E4D8C8",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(28,25,23,0.07)",
    padding: "28px 24px",
  };

  const F: React.CSSProperties = {
    width: "100%", padding: "0.7rem 1rem",
    background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 10,
    fontFamily: "'Inter'", fontSize: "0.93rem", color: "#1C1917",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  // ── Path selector ─────────────────────────────────────────────────────────
  if (!selectedPath) {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 440, width: "100%" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 32 }}>
            <div style={{ width: 34, height: 34, background: "#7C3AED", border: "2px solid #1C1917", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", boxShadow: "2px 2px 0 #1C1917" }}>W</div>
            <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.2rem", color: "#1C1917" }}>Wozzer</span>
          </div>

          <span className="sticker sticker-orange" style={{ marginBottom: 12, display: "inline-flex" }}>Step 1 of 1</span>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.8rem", color: "#1C1917", marginBottom: 8, lineHeight: 1.15 }}>
            How do you build?
          </h1>
          <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.93rem", lineHeight: 1.6, marginBottom: 24 }}>
            Complete one path to unlock your profile in the discovery deck.
          </p>

          {error && <p style={{ color: "#FF4B4B", fontFamily: "'Inter'", fontSize: "0.85rem", marginBottom: 12 }}>{error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {/* Visionary */}
            <button onClick={() => handleStartPath("visionary")} disabled={startOnboarding.isPending}
              style={{ ...card, textAlign: "left", cursor: "pointer", border: "1.5px solid #E4D8C8", transition: "border-color 0.15s, box-shadow 0.15s", padding: "18px 20px" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7C3AED"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E4D8C8"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(28,25,23,0.07)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.05rem", color: "#1C1917" }}>I have an idea</div>
                  <span className="sticker sticker-purple" style={{ marginTop: 3, display: "inline-flex" }}>Visionary · +75 XP</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.87rem", color: "#78716C", lineHeight: 1.55, margin: 0 }}>
                Defend your idea in an AI interview. Come with something real — or get homework.
              </p>
            </button>

            {/* Wozniak */}
            <button onClick={() => handleStartPath("wozniak")} disabled={startOnboarding.isPending}
              style={{ ...card, textAlign: "left", cursor: "pointer", border: "1.5px solid #E4D8C8", transition: "border-color 0.15s, box-shadow 0.15s", padding: "18px 20px" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#58CC02"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(88,204,2,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E4D8C8"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(28,25,23,0.07)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.05rem", color: "#1C1917" }}>I can build things</div>
                  <span className="sticker sticker-green" style={{ marginTop: 3, display: "inline-flex" }}>Wozniak · +75 XP</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.87rem", color: "#78716C", lineHeight: 1.55, margin: 0 }}>
                Pick your skills, solve a real challenge, get your level. Instant results.
              </p>
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.82rem", marginBottom: 10 }}>
              Not ready? Your profile won't appear in discovery until you complete this.
            </p>
            {skipError && <p style={{ color: "#FF4B4B", fontSize: "0.82rem", fontFamily: "'Inter'", marginBottom: 8 }}>{skipError}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {(["visionary", "wozniak"] as const).map(p => (
                <button key={p} onClick={() => handleSkip(p)} disabled={isSkipping}
                  style={{ background: "transparent", border: "1.5px dashed #D1C4B0", borderRadius: 8, padding: "5px 14px", cursor: "pointer", color: "#A8A29E", fontFamily: "'Inter'", fontSize: "0.82rem", opacity: isSkipping ? 0.5 : 1 }}>
                  {isSkipping ? "…" : `Skip as ${p === "visionary" ? "Visionary" : "Wozniak"}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Wozniak — skill selection ─────────────────────────────────────────────
  if (selectedPath === "wozniak" && !challenge && !levelResult) {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <button onClick={() => setSelectedPath(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#78716C", fontFamily: "'Inter'", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 5, marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={card}>
            <span className="sticker sticker-green" style={{ marginBottom: 12, display: "inline-flex" }}>Wozniak path</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.5rem", color: "#1C1917", marginBottom: 6 }}>What do you build?</h2>
            <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.5 }}>Pick your skills. We'll test one — be honest, the AI can tell.</p>
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
    );
  }

  // ── Wozniak — challenge ───────────────────────────────────────────────────
  if (challenge && !levelResult) {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 520, width: "100%" }}>
          <div style={card}>
            <span className="sticker sticker-orange" style={{ marginBottom: 12, display: "inline-flex" }}>The Challenge</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.4rem", color: "#1C1917", marginBottom: 14 }}>Show what you know</h2>
            <div style={{ background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 10, padding: "14px 16px", fontFamily: "'Inter', monospace", fontSize: "0.87rem", lineHeight: 1.7, color: "#1C1917", marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {challenge.text}
            </div>
            <textarea style={{ ...F, minHeight: 160, resize: "vertical", marginBottom: 14, lineHeight: 1.6 } as React.CSSProperties}
              placeholder="Your answer…" value={challengeAnswer} onChange={e => setChallengeAnswer(e.target.value)}
              onFocus={e => { e.currentTarget.style.borderColor = "#7C3AED"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "#E4D8C8"; }}
            />
            {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'", marginBottom: 12 }}>{error}</p>}
            <button onClick={handleChallengeSubmit} disabled={!challengeAnswer.trim() || submitChallenge.isPending} className="btn-primary" style={{ width: "100%" }}>
              {submitChallenge.isPending ? <><Loader2 size={15} className="animate-spin" /> Evaluating…</> : "Submit answer →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Level result ──────────────────────────────────────────────────────────
  if (levelResult) {
    const cfg = {
      advanced:     { emoji: "🔥", label: "Advanced Wozniak",     cls: "sticker-purple" },
      intermediate: { emoji: "⚡", label: "Intermediate Wozniak", cls: "sticker-blue" },
      beginner:     { emoji: "🌱", label: "Beginner Wozniak",     cls: "sticker-green" },
    }[levelResult.level as "advanced" | "intermediate" | "beginner"] ?? { emoji: "🌱", label: "Wozniak", cls: "sticker-green" };

    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>{cfg.emoji}</div>
            <span className={`sticker ${cfg.cls}`} style={{ marginBottom: 10, display: "inline-flex" }}>{cfg.label}</span>
            <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 16, marginTop: 10 }}>{levelResult.feedback}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Inter'", fontSize: "0.88rem", fontWeight: 700, color: "#7C3AED" }}>
              <Zap size={14} /> +75 XP · Level 1 unlocked
            </div>
            <p style={{ marginTop: 16, fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.8rem" }}>Taking you in…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Visionary interview ───────────────────────────────────────────────────
  if (state?.phase === "interview") {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,252,247,0.95)", backdropFilter: "blur(10px)", borderBottom: "1.5px solid #E4D8C8", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setSelectedPath(null); setState(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#78716C", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#1C1917" }}>The Interview</div>
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
                <span style={{ color: "#78716C" }}>thinking…</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleChatSubmit} style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1.5px solid #E4D8C8", background: "rgba(255,252,247,0.97)" }}>
          {error && <p style={{ color: "#FF4B4B", fontSize: "0.82rem", fontFamily: "'Inter'" }}>{error}</p>}
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Defend your idea…" disabled={chatMutation.isPending}
            style={{ ...F, flex: 1 }}
            onFocus={e => { e.currentTarget.style.borderColor = "#7C3AED"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#E4D8C8"; }}
          />
          <button type="submit" disabled={!chatInput.trim() || chatMutation.isPending}
            style={{ background: "#7C3AED", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", color: "#fff", opacity: !chatInput.trim() ? 0.4 : 1, display: "flex", alignItems: "center", boxShadow: "0 3px 0 #6D28D9" }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  // ── Homework ──────────────────────────────────────────────────────────────
  if (state?.phase === "homework") {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div style={card}>
            <span className="sticker sticker-yellow" style={{ marginBottom: 12, display: "inline-flex" }}>Homework assigned</span>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.5rem", color: "#1C1917", marginBottom: 8 }}>Almost there</h2>
            <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 18 }}>
              Your idea has potential. Work through these — your visibility will be limited until you do.
            </p>
            <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {state.homeworkQuestions?.map((q, i) => (
                <li key={i} style={{ color: "#1C1917", fontSize: "0.9rem", fontFamily: "'Inter'", lineHeight: 1.6 }}>{q}</li>
              ))}
            </ol>
            {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'", marginBottom: 12 }}>{error}</p>}
            <button onClick={handleCompleteHomework} disabled={completeMutation.isPending} className="btn-primary" style={{ width: "100%" }}>
              {completeMutation.isPending ? "…" : "I've thought it through →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
