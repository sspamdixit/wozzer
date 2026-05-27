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
import { Loader2, Send } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function skipOnboarding(path: "visionary" | "wozniak", token: string): Promise<void> {
  await fetch(`${BASE}/api/onboarding/skip`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ path }),
  });
}

export default function Onboarding() {
  const { user, refreshUser, session } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedPath, setSelectedPath] = useState<"visionary" | "wozniak" | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
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

  const PRESET_SKILLS = [
    "React", "Node.js", "Python", "Rust", "Go", "Swift",
    "Machine Learning", "iOS", "Android", "Hardware", "UI/UX Design", "C++", "Game Dev",
  ];

  useEffect(() => {
    if (user?.onboardingComplete) setLocation("/feed");
  }, [user, setLocation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.messages]);

  const handleStartPath = async (path: "visionary" | "wozniak") => {
    setSelectedPath(path);
    if (path === "visionary") {
      try {
        const res = await startOnboarding.mutateAsync({ data: { path } });
        setState(res);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleSkip = async (path: "visionary" | "wozniak") => {
    setIsSkipping(true);
    try {
      const token = session?.access_token ?? "";
      await skipOnboarding(path, token);
      queryClient.invalidateQueries();
      await refreshUser();
      setLocation("/feed");
    } catch (e: any) {
      setError("Couldn't skip — try again");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatMutation.isPending) return;
    const msg = chatInput;
    setChatInput("");
    setState(prev => prev ? {
      ...prev,
      messages: [...prev.messages, { role: "user", content: msg, timestamp: new Date().toISOString() }]
    } : prev);
    try {
      const res = await chatMutation.mutateAsync({ data: { message: msg } });
      setState(res);
      if (res.phase === "complete") {
        await completeMutation.mutateAsync({ data: { summary: res.summary || "Visionary approved" } });
        queryClient.invalidateQueries();
        refreshUser();
        setTimeout(() => setLocation("/feed"), 1200);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCompleteHomework = async () => {
    try {
      await completeMutation.mutateAsync({ data: { summary: state?.summary || "" } });
      queryClient.invalidateQueries();
      refreshUser();
      setLocation("/feed");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleWozniakSkillsSubmit = async () => {
    if (wozniakSkills.length === 0) return;
    try {
      const res = await submitSkills.mutateAsync({ data: { skills: wozniakSkills } });
      setChallenge({ id: res.challengeId, text: res.prompt });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleChallengeSubmit = async () => {
    if (!challengeAnswer.trim() || !challenge) return;
    try {
      const res = await submitChallenge.mutateAsync({
        data: { challengeId: challenge.id, answer: challengeAnswer }
      });
      setLevelResult(res);
      queryClient.invalidateQueries();
      refreshUser();
      setTimeout(() => setLocation("/feed"), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px 14px",
    background: "#EDE8DE",
    border: "1.5px solid #1A1A1A",
    borderRadius: "2px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    color: "#1A1A1A",
    outline: "none",
  };

  if (!selectedPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="washi washi-top washi-yellow" style={{ position: "relative", left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: 90, marginBottom: -9 }} />
          <div className="scrap-card p-8 mb-4" style={{ transform: "rotate(-0.5deg)" }}>
            <h1 className="font-serif" style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 6, color: "#1A1A1A" }}>
              Welcome to Wozzer
            </h1>
            <p style={{ color: "#6B6355", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              You're in at <strong>Level 0</strong>. Complete your interview or first challenge to start showing up in people's decks.
            </p>

            {error && <p style={{ color: "#CC2200", marginBottom: "1rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                onClick={() => handleStartPath("visionary")}
                disabled={startOnboarding.isPending}
                style={{
                  background: "#F5E6D0",
                  border: "2px solid #1A1A1A",
                  boxShadow: "3px 3px 0 #1A1A1A",
                  borderRadius: "2px",
                  padding: "1.25rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transform: "rotate(-1deg)",
                }}
              >
                <div className="font-serif" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#7B4F2E", marginBottom: 4 }}>
                  I have an idea — Visionary
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6B6355", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                  You have the idea. Defend it against the AI. Come with something real — or get homework.
                </div>
              </button>

              <button
                onClick={() => handleStartPath("wozniak")}
                disabled={startOnboarding.isPending}
                style={{
                  background: "#D8F0E0",
                  border: "2px solid #1A1A1A",
                  boxShadow: "3px 3px 0 #1A1A1A",
                  borderRadius: "2px",
                  padding: "1.25rem",
                  textAlign: "left",
                  cursor: "pointer",
                  transform: "rotate(1deg)",
                }}
              >
                <div className="font-serif" style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1A6B3A", marginBottom: 4 }}>
                  I can build things — Wozniak
                </div>
                <div style={{ fontSize: "0.85rem", color: "#6B6355", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                  Pick your skills, solve a challenge, get your level. Earn XP and Level 1 instantly.
                </div>
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p className="font-accent" style={{ color: "#A09890", fontSize: "0.8rem", marginBottom: 6 }}>
              Not ready? You can browse but your card won't appear in many decks.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => handleSkip("visionary")}
                disabled={isSkipping}
                style={{
                  background: "transparent",
                  border: "1px dashed #C8BFA8",
                  borderRadius: "2px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  color: "#A09890",
                  fontFamily: "'Caveat', cursive",
                  fontSize: "0.9rem",
                }}
              >
                Skip as Visionary
              </button>
              <button
                onClick={() => handleSkip("wozniak")}
                disabled={isSkipping}
                style={{
                  background: "transparent",
                  border: "1px dashed #C8BFA8",
                  borderRadius: "2px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  color: "#A09890",
                  fontFamily: "'Caveat', cursive",
                  fontSize: "0.9rem",
                }}
              >
                Skip as Wozniak
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPath === "wozniak" && !challenge && !levelResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="scrap-card p-8" style={{ transform: "rotate(0.8deg)" }}>
            <div className="washi washi-top washi-green" style={{ width: 80, transform: "translateX(-50%) rotate(3deg)" }} />
            <h2 className="font-serif mt-4" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>
              What do you build?
            </h2>
            <p className="font-accent" style={{ color: "#6B6355", marginBottom: "1.25rem", fontSize: "1rem" }}>
              Pick your skills. We'll test one of them. +75 XP on completion.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.5rem" }}>
              {PRESET_SKILLS.map(skill => (
                <button
                  key={skill}
                  onClick={() => setWozniakSkills(prev =>
                    prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                  )}
                  className="font-accent"
                  style={{
                    fontSize: "1rem",
                    padding: "4px 12px",
                    border: "1.5px solid " + (wozniakSkills.includes(skill) ? "#1A1A1A" : "#C8BFA8"),
                    background: wozniakSkills.includes(skill) ? "#1A1A1A" : "transparent",
                    color: wozniakSkills.includes(skill) ? "#F5F0E8" : "#6B6355",
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>

            {error && <p style={{ color: "#CC2200", marginBottom: "1rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleWozniakSkillsSubmit}
                disabled={wozniakSkills.length === 0 || submitSkills.isPending}
                className="btn-primary"
                style={{ flex: 1, opacity: wozniakSkills.length === 0 ? 0.5 : 1 }}
              >
                {submitSkills.isPending ? "Generating challenge..." : "Get my challenge"}
              </button>
              <button
                onClick={() => setSelectedPath(null)}
                className="btn-ghost"
                style={{ flexShrink: 0 }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (challenge && !levelResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div style={{ maxWidth: 520, width: "100%" }}>
          <div className="scrap-card p-8" style={{ transform: "rotate(-0.7deg)" }}>
            <div className="washi washi-top washi-orange" style={{ width: 80 }} />
            <h2 className="font-serif mt-4" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
              The Challenge
            </h2>
            <div
              style={{
                background: "#EDE8DE",
                border: "1.5px solid #1A1A1A",
                borderRadius: "2px",
                padding: "1rem",
                fontFamily: "'Inter', monospace",
                fontSize: "0.88rem",
                lineHeight: 1.7,
                marginBottom: "1.25rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {challenge.text}
            </div>
            <textarea
              style={{
                width: "100%",
                minHeight: "160px",
                background: "#F5F0E8",
                border: "1.5px solid #1A1A1A",
                borderRadius: "2px",
                padding: "10px 12px",
                fontFamily: "'Inter', monospace",
                fontSize: "0.88rem",
                color: "#1A1A1A",
                outline: "none",
                resize: "vertical",
                marginBottom: "1rem",
                boxSizing: "border-box",
              }}
              placeholder="Your answer..."
              value={challengeAnswer}
              onChange={e => setChallengeAnswer(e.target.value)}
            />
            {error && <p style={{ color: "#CC2200", marginBottom: "1rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}
            <button
              onClick={handleChallengeSubmit}
              disabled={!challengeAnswer.trim() || submitChallenge.isPending}
              className="btn-primary"
              style={{ width: "100%", opacity: !challengeAnswer.trim() ? 0.5 : 1 }}
            >
              {submitChallenge.isPending ? "Evaluating..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (levelResult) {
    const levelColors: Record<string, string> = {
      beginner: "#D8F0E0",
      intermediate: "#F5E6D0",
      advanced: "#F0D8D8",
    };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <div
            className="scrap-card p-8 text-center"
            style={{ transform: "rotate(-0.5deg)", background: levelColors[levelResult.level] || "#FDFAF4" }}
          >
            <div className="washi washi-top washi-green" style={{ width: 100 }} />
            <p className="font-accent mt-4" style={{ color: "#6B6355", fontSize: "1rem" }}>You're a</p>
            <h2 className="font-serif" style={{ fontSize: "2.2rem", fontWeight: 700, color: "#1A1A1A", textTransform: "capitalize" }}>
              {levelResult.level} Wozniak
            </h2>
            <p style={{ color: "#6B6355", fontSize: "0.9rem", margin: "1rem 0 0.5rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              {levelResult.feedback}
            </p>
            <p className="font-accent" style={{ color: "#E8450A", fontSize: "0.9rem", marginBottom: "1rem" }}>
              +75 XP · Level 1 unlocked
            </p>
            <p className="font-accent" style={{ color: "#E8450A", fontSize: "1rem" }}>Entering Wozzer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state?.phase === "interview") {
    return (
      <div
        className="min-h-screen flex flex-col max-w-2xl mx-auto"
        style={{ background: "#F5F0E8" }}
      >
        <div
          className="px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
          style={{ background: "#F5F0E8", borderBottom: "2px solid #1A1A1A" }}
        >
          <div className="font-accent" style={{ color: "#7B4F2E", fontSize: "1.1rem", fontWeight: 600 }}>
            The Interview
          </div>
          <span className="font-accent" style={{ color: "#6B6355", fontSize: "0.9rem", marginLeft: "auto" }}>
            Visionary path · +75 XP on completion
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {state.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "user" ? (
                <div className="chat-bubble-user">{m.content}</div>
              ) : (
                <div className="chat-bubble-ai" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="chat-bubble-ai flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span style={{ color: "#6B6355" }}>thinking...</span>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleChatSubmit}
          className="flex gap-2 p-4"
          style={{ borderTop: "2px solid #1A1A1A", background: "#F5F0E8" }}
        >
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Defend your idea..."
            disabled={chatMutation.isPending}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatMutation.isPending}
            style={{
              background: "#E8450A",
              border: "1.5px solid #1A1A1A",
              borderRadius: "2px",
              padding: "0 16px",
              cursor: "pointer",
              color: "#FDFAF4",
              boxShadow: "2px 2px 0 #1A1A1A",
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  if (state?.phase === "homework") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#F5F0E8" }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="scrap-card p-8" style={{ transform: "rotate(-1deg)" }}>
            <div className="washi washi-top washi-yellow" style={{ width: 90 }} />
            <h2 className="font-serif mt-4" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
              Homework assigned
            </h2>
            <p style={{ color: "#6B6355", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, marginBottom: "0.5rem" }}>
              Your idea has potential. Work through these — your visibility will be low until you do.
            </p>
            <p style={{ color: "#A09890", fontSize: "0.85rem", fontFamily: "'Caveat', cursive", marginBottom: "1.25rem" }}>
              (You can still enter and explore — just not widely visible yet)
            </p>
            <ol style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
              {state.homeworkQuestions?.map((q, i) => (
                <li key={i} style={{ color: "#1A1A1A", fontSize: "0.9rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                  {q}
                </li>
              ))}
            </ol>
            <button
              onClick={handleCompleteHomework}
              disabled={completeMutation.isPending}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              {completeMutation.isPending ? "..." : "I've thought it through — let me in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
