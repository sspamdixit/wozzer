import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useStartOnboarding,
  useOnboardingChat,
  useCompleteOnboarding,
  useSubmitBuilderSkills,
  useSubmitBuilderChallenge,
  OnboardingState,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [state, setState] = useState<OnboardingState | null>(null);
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const startOnboarding = useStartOnboarding();
  const chatMutation = useOnboardingChat();
  const completeMutation = useCompleteOnboarding();
  const submitSkills = useSubmitBuilderSkills();
  const submitChallenge = useSubmitBuilderChallenge();

  const [builderSkills, setBuilderSkills] = useState<string[]>([]);
  const [challengePrompt, setChallengePrompt] = useState<{ id: string; text: string } | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");

  const PRESET_SKILLS = [
    "React", "Node.js", "Python", "Rust", "Go",
    "Machine Learning", "iOS", "Android", "Hardware", "UI/UX Design"
  ];

  useEffect(() => {
    if (user?.onboardingComplete) {
      setLocation("/feed");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.messages]);

  const handleStartPath = async (path: "visionary" | "builder") => {
    try {
      const res = await startOnboarding.mutateAsync({ data: { path } });
      setState(res);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
    } catch (e: any) {
      toast({ title: "Error sending message", description: e.message, variant: "destructive" });
    }
  };

  const handleCompleteVisionary = async () => {
    try {
      await completeMutation.mutateAsync({ data: { summary: state?.summary || "" } });
      queryClient.invalidateQueries();
      setLocation("/feed");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBuilderSkillsSubmit = async () => {
    if (builderSkills.length === 0) return;
    try {
      const res = await submitSkills.mutateAsync({ data: { skills: builderSkills } });
      setChallengePrompt({ id: res.challengeId, text: res.prompt });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleBuilderChallengeSubmit = async () => {
    if (!challengeAnswer.trim() || !challengePrompt) return;
    try {
      const res = await submitChallenge.mutateAsync({
        data: { challengeId: challengePrompt.id, answer: challengeAnswer }
      });
      if (res.passed) {
        toast({ title: "Passed!", description: res.feedback });
        await completeMutation.mutateAsync({ data: { summary: "Builder verified" } });
        queryClient.invalidateQueries();
        setLocation("/feed");
      } else {
        toast({ title: "Keep trying", description: res.feedback, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!state && !challengePrompt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <h1 className="text-3xl font-bold">Choose your path</h1>
          <p className="text-muted-foreground">Wozzer is a network for both ideas and execution. How do you identify?</p>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleStartPath("visionary")}
              className="bg-card border border-border rounded-xl p-8 text-left hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
              disabled={startOnboarding.isPending}
            >
              <h2 className="text-2xl font-bold text-amber-500 mb-2">Visionary</h2>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">You have the ideas. You see the future. Be prepared to defend your vision against our AI inquisitor.</p>
            </button>
            <button
              onClick={() => handleStartPath("builder")}
              className="bg-card border border-border rounded-xl p-8 text-left hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
              disabled={startOnboarding.isPending}
            >
              <h2 className="text-2xl font-bold text-cyan-500 mb-2">Builder</h2>
              <p className="text-muted-foreground group-hover:text-foreground transition-colors">You build the things. You write code, design, or assemble. Prove your skills to enter.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state?.phase === "interview") {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-3xl mx-auto p-4 md:p-8">
        <h2 className="text-2xl font-bold text-amber-500 mb-6">The Inquisition</h2>
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden mb-6">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6">
              {state.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl p-4 ${m.role === "user" ? "bg-amber-500 text-amber-950 font-medium" : "bg-secondary text-foreground"}`}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl p-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border bg-background">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Defend your idea..."
                className="flex-1"
                disabled={chatMutation.isPending}
              />
              <Button type="submit" disabled={!chatInput.trim() || chatMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (state?.phase === "homework") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card border border-border rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-amber-500 mb-6">Homework</h2>
          <p className="mb-6 text-foreground text-lg">Your idea has potential, but it needs work. Before you can proceed, consider these questions:</p>
          <ul className="list-disc pl-6 space-y-4 mb-8 text-muted-foreground">
            {state.homeworkQuestions?.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
          <Button onClick={handleCompleteVisionary} className="w-full text-lg h-12" disabled={completeMutation.isPending}>
            {completeMutation.isPending ? "Entering..." : "I'll do this"}
          </Button>
        </div>
      </div>
    );
  }

  if (state && !challengePrompt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card border border-border rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-cyan-500 mb-6">Select your stack</h2>
          <p className="mb-6 text-muted-foreground">Choose your primary skills. We will test one.</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {PRESET_SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => {
                  setBuilderSkills(prev =>
                    prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                  );
                }}
                className={`px-4 py-2 rounded-full border transition-colors ${builderSkills.includes(skill) ? "bg-cyan-500/20 border-cyan-500 text-cyan-500" : "bg-transparent border-border text-muted-foreground hover:border-cyan-500/50"}`}
              >
                {skill}
              </button>
            ))}
          </div>
          <Button
            onClick={handleBuilderSkillsSubmit}
            className="w-full"
            disabled={builderSkills.length === 0 || submitSkills.isPending}
          >
            {submitSkills.isPending ? "Generating challenge..." : "Submit Skills"}
          </Button>
        </div>
      </div>
    );
  }

  if (challengePrompt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-card border border-border rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-cyan-500 mb-6">The Challenge</h2>
          <div className="bg-secondary/50 p-6 rounded-xl mb-6 font-mono text-sm leading-relaxed border border-border">
            {challengePrompt.text}
          </div>
          <textarea
            className="w-full min-h-[200px] bg-background border border-border rounded-xl p-4 mb-6 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            placeholder="Write your solution here..."
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
          />
          <Button
            onClick={handleBuilderChallengeSubmit}
            className="w-full"
            disabled={!challengeAnswer.trim() || submitChallenge.isPending}
          >
            {submitChallenge.isPending ? "Evaluating..." : "Submit Solution"}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
