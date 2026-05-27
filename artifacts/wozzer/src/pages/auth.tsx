import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "sign-in" | "sign-up";

function ScrapCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", maxWidth: 400, width: "100%", margin: "0 auto" }}>
      <div className="washi washi-top washi-blue" style={{ width: 70, transform: "translateX(-50%) rotate(-3deg)" }} />
      <div className="scrap-card scrap-card-rotate-1 p-8">
        {children}
      </div>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (session && user) {
      if (!user.onboardingComplete) setLocation("/onboarding");
      else setLocation("/feed");
    }
  }, [session, user, setLocation]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#EDE8DE",
    border: "1.5px solid #1A1A1A",
    borderRadius: "2px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    color: "#1A1A1A",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#F5F0E8" }}
    >
      <ScrapCard>
        <h1 className="font-serif mb-1" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1A1A1A" }}>
          {mode === "sign-up" ? "Apply to Wozzer" : "Welcome back"}
        </h1>
        <p className="font-accent mb-6" style={{ color: "#6B6355", fontSize: "1rem" }}>
          {mode === "sign-up" ? "For builders aged 13-18" : "Sign in to continue"}
        </p>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-2 mb-5">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading}
            style={{
              background: "#FDFAF4",
              border: "1.5px solid #1A1A1A",
              borderRadius: "2px",
              padding: "9px",
              fontFamily: "'Caveat', cursive",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#1A1A1A",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #1A1A1A",
              width: "100%",
            }}
          >
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth("github")}
            disabled={loading}
            style={{
              background: "#1A1A1A",
              border: "1.5px solid #1A1A1A",
              borderRadius: "2px",
              padding: "9px",
              fontFamily: "'Caveat', cursive",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "#F5F0E8",
              cursor: "pointer",
              boxShadow: "2px 2px 0 #6B6355",
              width: "100%",
            }}
          >
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div style={{ flex: 1, borderBottom: "1.5px solid #C8BFA8" }} />
          <span className="font-accent" style={{ color: "#6B6355", fontSize: "0.95rem" }}>or</span>
          <div style={{ flex: 1, borderBottom: "1.5px solid #C8BFA8" }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["email", "phone"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t as "email" | "phone"); setOtpSent(false); setError(""); }}
              className="font-accent"
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                padding: "4px 14px",
                background: tab === t ? "#E8450A" : "transparent",
                color: tab === t ? "#FDFAF4" : "#6B6355",
                border: "1.5px solid " + (tab === t ? "#1A1A1A" : "#C8BFA8"),
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              {t === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        {tab === "email" ? (
          <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
            {success && <p style={{ color: "#1A6B3A", fontSize: "0.85rem", fontFamily: "'Caveat', cursive" }}>{success}</p>}
            {error && <p style={{ color: "#CC2200", fontSize: "0.85rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
              {loading ? "..." : mode === "sign-up" ? "Create account" : "Sign in"}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              style={inputStyle}
            />
            {error && <p style={{ color: "#CC2200", fontSize: "0.85rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
              {loading ? "..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p className="font-accent" style={{ color: "#6B6355", fontSize: "0.95rem" }}>Enter the code sent to {phone}</p>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: "0.3em", fontSize: "1.5rem", textAlign: "center" }}
            />
            {error && <p style={{ color: "#CC2200", fontSize: "0.85rem", fontFamily: "'Caveat', cursive" }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
              {loading ? "..." : "Verify"}
            </button>
          </form>
        )}

        <p className="font-accent mt-5 text-center" style={{ color: "#6B6355", fontSize: "0.95rem" }}>
          {mode === "sign-up" ? (
            <>Already in? <a href="/sign-in" style={{ color: "#E8450A" }}>Sign in</a></>
          ) : (
            <>New here? <a href="/sign-up" style={{ color: "#E8450A" }}>Apply</a></>
          )}
        </p>
      </ScrapCard>
    </div>
  );
}
