import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "sign-in" | "sign-up";
type InputMode = "email" | "phone";

const BRAND_ORANGE = "#E8450A";
const INK = "#1A1A1A";
const CREAM = "#F5F0E8";
const PAPER = "#FDFAF4";
const MUTED = "#6B6355";
const BORDER = "#C8BFA8";

function WozzerLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      <div
        style={{
          width: 36,
          height: 36,
          background: BRAND_ORANGE,
          border: `2px solid ${INK}`,
          borderRadius: 4,
          boxShadow: `2px 2px 0 ${INK}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: PAPER,
        }}
      >
        W
      </div>
      <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.2rem", color: INK }}>
        Wozzer
      </span>
    </div>
  );
}

function OAuthButton({
  provider,
  onClick,
  disabled,
}: {
  provider: "google" | "github";
  onClick: () => void;
  disabled: boolean;
}) {
  const isGoogle = provider === "google";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "11px 16px",
        background: isGoogle ? PAPER : INK,
        color: isGoogle ? INK : PAPER,
        border: `1.5px solid ${INK}`,
        borderRadius: 3,
        boxShadow: `2px 2px 0 ${isGoogle ? INK : MUTED}`,
        fontFamily: "'Ngaco', cursive",
        fontWeight: 600,
        fontSize: "1.1rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
      onMouseDown={e => {
        const t = e.currentTarget;
        t.style.transform = "translate(1px, 1px)";
        t.style.boxShadow = `1px 1px 0 ${isGoogle ? INK : MUTED}`;
      }}
      onMouseUp={e => {
        const t = e.currentTarget;
        t.style.transform = "";
        t.style.boxShadow = `2px 2px 0 ${isGoogle ? INK : MUTED}`;
      }}
    >
      {isGoogle ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      )}
      Continue with {isGoogle ? "Google" : "GitHub"}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, borderBottom: `1.5px solid ${BORDER}` }} />
      <span style={{ fontFamily: "'Ngaco', cursive", color: MUTED, fontSize: "1rem" }}>or</span>
      <div style={{ flex: 1, borderBottom: `1.5px solid ${BORDER}` }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  background: "#EDE8DE",
  border: `1.5px solid ${INK}`,
  borderRadius: 3,
  fontFamily: "'Inter', sans-serif",
  fontSize: "0.95rem",
  color: INK,
  outline: "none",
  boxSizing: "border-box",
};

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("email");
  const [otpSent, setOtpSent] = useState(false);

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

  const switchInputMode = () => {
    setInputMode(m => (m === "email" ? "phone" : "email"));
    setOtpSent(false);
    setError("");
  };

  const isSignUp = mode === "sign-up";

  return (
    <div
      style={{
        minHeight: "100svh",
        background: CREAM,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
        }}
      >
        {/* Washi tape */}
        <div
          className="washi washi-top washi-orange"
          style={{ width: 72, transform: "translateX(-50%) rotate(-3deg)" }}
        />

        <div
          className="scrap-card"
          style={{
            padding: "32px 28px 28px",
            position: "relative",
          }}
        >
          <WozzerLogo />

          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontWeight: 700,
              fontSize: "1.65rem",
              color: INK,
              marginBottom: 4,
              lineHeight: 1.15,
            }}
          >
            {isSignUp ? "Create your account" : "Sign in to Wozzer"}
          </h1>
          <p
            style={{
              fontFamily: "'Ngaco', cursive",
              color: MUTED,
              fontSize: "1rem",
              marginBottom: 22,
            }}
          >
            {isSignUp ? "For builders aged 13–18" : "Good to have you back"}
          </p>

          {/* OAuth options — always visible */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <OAuthButton provider="google" onClick={() => handleOAuth("google")} disabled={loading} />
            <OAuthButton provider="github" onClick={() => handleOAuth("github")} disabled={loading} />
          </div>

          <Divider />

          {/* Email form — always visible by default */}
          {inputMode === "email" ? (
            <form
              onSubmit={handleEmailAuth}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
              <input
                type="password"
                placeholder={isSignUp ? "Create a password" : "Password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                style={inputStyle}
              />

              {success && (
                <p style={{ color: "#1A6B3A", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>
                  {success}
                </p>
              )}
              {error && (
                <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 2, width: "100%" }}
              >
                {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
              </button>

              <button
                type="button"
                onClick={switchInputMode}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Ngaco', cursive",
                  fontSize: "0.95rem",
                  color: BRAND_ORANGE,
                  textAlign: "center",
                  padding: 0,
                  marginTop: 2,
                }}
              >
                Use phone number instead
              </button>
            </form>
          ) : !otpSent ? (
            /* Phone OTP — send code */
            <form
              onSubmit={handleSendOtp}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <input
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoComplete="tel"
                style={inputStyle}
              />
              {error && (
                <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 2, width: "100%" }}
              >
                {loading ? "..." : "Send code"}
              </button>
              <button
                type="button"
                onClick={switchInputMode}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Ngaco', cursive",
                  fontSize: "0.95rem",
                  color: BRAND_ORANGE,
                  textAlign: "center",
                  padding: 0,
                  marginTop: 2,
                }}
              >
                Use email instead
              </button>
            </form>
          ) : (
            /* Phone OTP — verify */
            <form
              onSubmit={handleVerifyOtp}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <p style={{ fontFamily: "'Ngaco', cursive", color: MUTED, fontSize: "0.95rem", marginBottom: 2 }}>
                Enter the code sent to {phone}
              </p>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                inputMode="numeric"
                style={{
                  ...inputStyle,
                  letterSpacing: "0.35em",
                  fontSize: "1.6rem",
                  textAlign: "center",
                }}
              />
              {error && (
                <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: 2, width: "100%" }}
              >
                {loading ? "..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(""); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Ngaco', cursive",
                  fontSize: "0.95rem",
                  color: MUTED,
                  textAlign: "center",
                  padding: 0,
                }}
              >
                ← Change number
              </button>
            </form>
          )}

          {/* Switch sign-in / sign-up */}
          <p
            style={{
              marginTop: 22,
              textAlign: "center",
              fontFamily: "'Ngaco', cursive",
              color: MUTED,
              fontSize: "0.95rem",
            }}
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <a href="/sign-in" style={{ color: BRAND_ORANGE, fontWeight: 600 }}>
                  Sign in
                </a>
              </>
            ) : (
              <>
                New to Wozzer?{" "}
                <a href="/sign-up" style={{ color: BRAND_ORANGE, fontWeight: 600 }}>
                  Apply now
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
