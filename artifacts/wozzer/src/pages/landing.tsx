import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "sign-up" | "sign-in";
type InputMode = "email" | "phone";

interface Country { name: string; code: string; dial: string; flag: string; }

const COUNTRIES: Country[] = [
  { name: "Afghanistan", code: "AF", dial: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dial: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Argentina", code: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Chile", code: "CL", dial: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dial: "+57", flag: "🇨🇴" },
  { name: "Czech Republic", code: "CZ", dial: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Finland", code: "FI", dial: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dial: "+30", flag: "🇬🇷" },
  { name: "Hong Kong", code: "HK", dial: "+852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dial: "+36", flag: "🇭🇺" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dial: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Romania", code: "RO", dial: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Taiwan", code: "TW", dial: "+886", flag: "🇹🇼" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Uganda", code: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dial: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "🇻🇳" },
];

const DEFAULT_COUNTRY = COUNTRIES.find(c => c.code === "US")!;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isDesktop;
}

function CountryPicker({ selected, onChange }: { selected: Country; onChange: (c: Country) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = query.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.dial.includes(query))
    : COUNTRIES;

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 40); }, [open]);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" onClick={() => { setOpen(o => !o); setQuery(""); }}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 11px", height: "100%", background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRight: "none", borderRadius: "10px 0 0 10px", cursor: "pointer" }}>
        <span style={{ fontSize: "1.1rem" }}>{selected.flag}</span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "0.84rem", color: "#78716C" }}>{selected.dial}</span>
        <span style={{ fontSize: "0.55rem", color: "#A8A29E" }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 200, background: "#fff", border: "1.5px solid #E4D8C8", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 260, maxHeight: 260, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "7px 7px 5px", borderBottom: "1px solid #F0E8DC" }}>
            <input ref={searchRef} type="text" placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 8, fontFamily: "'Inter'", fontSize: "0.84rem", color: "#1C1917", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map(c => (
              <button key={c.code} type="button" onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: c.code === selected.code ? "#FFF0EB" : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #F5EDE0" }}>
                <span style={{ fontSize: "1.05rem" }}>{c.flag}</span>
                <span style={{ flex: 1, fontFamily: "'Inter'", fontSize: "0.82rem", color: "#1C1917" }}>{c.name}</span>
                <span style={{ fontFamily: "'Inter'", fontSize: "0.77rem", color: "#78716C" }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const BENEFITS = [
  { emoji: "🤝", text: "Merit-based" },
  { emoji: "🌍", text: "Global" },
  { emoji: "⚡", text: "AI-screened" },
  { emoji: "🔥", text: "Ship-first" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const isDesktop = useIsDesktop();

  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [inputMode, setInputMode] = useState<InputMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then(r => r.json()).then((d: { country_code?: string }) => {
        if (d.country_code) { const m = COUNTRIES.find(c => c.code === d.country_code); if (m) setCountry(m); }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (session && user) setLocation(user.onboardingComplete ? "/discover" : "/onboarding");
  }, [session, user, setLocation]);

  const fullPhone = `${country.dial}${localNumber.replace(/^0+/, "")}`;
  const isSignUp = mode === "sign-up";

  const F: React.CSSProperties = {
    width: "100%", padding: "0.68rem 0.9rem",
    background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 10,
    fontFamily: "'Inter'", fontSize: "0.93rem", color: "#1C1917",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#FF5A1F"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,90,31,0.1)"; };
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "#E4D8C8"; e.currentTarget.style.boxShadow = "none"; };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtpSent(true);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (error) throw error;
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/onboarding` } });
    if (error) setError(error.message);
    setLoading(false);
  };

  const OAuthBtn = ({ provider }: { provider: "google" | "github" }) => (
    <button onClick={() => handleOAuth(provider)} disabled={loading} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      padding: "10px 14px", background: "#fff", color: "#1C1917",
      border: "1.5px solid #E4D8C8", borderRadius: 10,
      fontFamily: "'Inter'", fontWeight: 600, fontSize: "0.91rem",
      cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "background 0.12s",
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#FFF8F0"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
    >
      {provider === "google" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      )}
      Continue with {provider === "google" ? "Google" : "GitHub"}
    </button>
  );

  const AuthForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* OAuth */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <OAuthBtn provider="google" />
        <OAuthBtn provider="github" />
      </div>

      <div className="divider" style={{ margin: "16px 0" }}>or</div>

      {/* Email/phone form */}
      {inputMode === "email" ? (
        <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={F} onFocus={onFocus} onBlur={onBlur} />
          <input type="password" placeholder={isSignUp ? "Create a password" : "Password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} style={F} onFocus={onFocus} onBlur={onBlur} />
          {success && <p style={{ color: "#46A302", fontSize: "0.83rem", fontFamily: "'Inter'", margin: 0 }}>{success}</p>}
          {error && <p style={{ color: "#FF4B4B", fontSize: "0.83rem", fontFamily: "'Inter'", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, width: "100%" }}>
            {loading ? "…" : isSignUp ? "Create account" : "Sign in"}
          </button>
          <button type="button" onClick={() => { setInputMode("phone"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.84rem", color: "#A8A29E", textAlign: "center", padding: "2px 0" }}>
            Use phone number instead
          </button>
        </form>
      ) : !otpSent ? (
        <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", height: 44 }}>
            <CountryPicker selected={country} onChange={c => { setCountry(c); setError(""); }} />
            <input type="tel" placeholder="Phone number" value={localNumber} onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-()]/g, ""))} required inputMode="tel"
              style={{ ...F, borderRadius: "0 10px 10px 0", flex: 1, minWidth: 0, height: "100%" }} onFocus={onFocus} onBlur={onBlur} />
          </div>
          {error && <p style={{ color: "#FF4B4B", fontSize: "0.83rem", fontFamily: "'Inter'", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading || !localNumber.trim()} className="btn-primary" style={{ marginTop: 4, width: "100%" }}>
            {loading ? "…" : "Send code"}
          </button>
          <button type="button" onClick={() => { setInputMode("email"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.84rem", color: "#A8A29E", textAlign: "center", padding: "2px 0" }}>
            Use email instead
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.88rem", margin: 0 }}>Code sent to {country.flag} {fullPhone}</p>
          <input type="text" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} inputMode="numeric"
            style={{ ...F, letterSpacing: "0.35em", fontSize: "1.4rem", textAlign: "center" }} />
          {error && <p style={{ color: "#FF4B4B", fontSize: "0.83rem", fontFamily: "'Inter'", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, width: "100%" }}>
            {loading ? "…" : "Verify"}
          </button>
          <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.84rem", color: "#A8A29E", textAlign: "center", padding: "2px 0" }}>
            ← Change number
          </button>
        </form>
      )}

      {/* Toggle sign in / sign up */}
      <p style={{ marginTop: 16, textAlign: "center", fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.86rem" }}>
        {isSignUp
          ? <>Already have an account?{" "}<button onClick={() => { setMode("sign-in"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF5A1F", fontWeight: 700, fontFamily: "'Inter'", fontSize: "0.86rem", padding: 0 }}>Sign in</button></>
          : <>New to Wozzer?{" "}<button onClick={() => { setMode("sign-up"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF5A1F", fontWeight: 700, fontFamily: "'Inter'", fontSize: "0.86rem", padding: 0 }}>Apply now</button></>
        }
      </p>
    </div>
  );

  const WashiNote = ({ withAuth }: { withAuth: boolean }) => (
    <div style={{ position: "relative", paddingTop: 14 }}>
      {/* Washi tape */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 96, height: 22, borderRadius: 3, zIndex: 10,
        background: "repeating-linear-gradient(90deg, #FF5A1F 0px, #FF5A1F 6px, rgba(255,255,255,0.35) 6px, rgba(255,255,255,0.35) 8px)",
        opacity: 0.9,
      }} />

      <div style={{
        background: "#FFFDF8",
        border: "1.5px solid #E4D8C8",
        borderRadius: 16,
        boxShadow: "0 6px 28px rgba(28,25,23,0.09)",
        padding: withAuth ? "32px 28px 28px" : "36px 32px 32px",
        position: "relative",
      }}>
        <span className="sticker sticker-orange" style={{ marginBottom: 14, display: "inline-flex" }}>
          For builders aged 13–18
        </span>

        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 700,
          fontSize: withAuth ? "clamp(1.9rem, 4vw, 2.4rem)" : "clamp(2.4rem, 5vw, 3.2rem)",
          lineHeight: 1.08, color: "#1C1917", marginBottom: 12, marginTop: 8,
        }}>
          Find your<br /><span style={{ color: "#FF5A1F" }}>co-founder.</span>
        </h1>

        <p style={{
          fontFamily: "'Inter'", color: "#78716C",
          fontSize: "0.95rem", lineHeight: 1.65,
          marginBottom: withAuth ? 20 : 24,
        }}>
          Earn your spot through an AI interview or technical challenge — then swipe through verified builders who actually ship.
        </p>

        {/* Benefit chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: withAuth ? 24 : 0 }}>
          {BENEFITS.map(b => (
            <div key={b.text} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "#fff", border: "1.5px solid #E4D8C8",
              borderRadius: 8, padding: "4px 11px",
              fontFamily: "'Inter'", fontSize: "0.81rem", fontWeight: 600, color: "#78716C",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}>
              {b.emoji} {b.text}
            </div>
          ))}
        </div>

        {/* Auth form embedded (mobile) */}
        {withAuth && (
          <div style={{ borderTop: "1.5px solid #EDE6D8", paddingTop: 20 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.25rem", color: "#1C1917", marginBottom: 4 }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.85rem", marginBottom: 16 }}>
              {isSignUp ? "Join the network" : "Sign in to continue"}
            </p>
            <AuthForm />
          </div>
        )}
      </div>
    </div>
  );

  /* ── DESKTOP: two-column ─────────────────────────────────────────────────── */
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "20px 40px", borderBottom: "1.5px solid #EDE6D8" }}>
          <div style={{ width: 34, height: 34, background: "#FF5A1F", border: "2px solid #1C1917", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", boxShadow: "2px 2px 0 #1C1917" }}>W</div>
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.2rem", color: "#1C1917" }}>Wozzer</span>
        </div>

        {/* Two-column body */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 56, padding: "48px 40px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>

          {/* LEFT: Auth panel */}
          <div style={{ flex: "0 0 340px", maxWidth: 340 }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.45rem", color: "#1C1917", marginBottom: 4, lineHeight: 1.2 }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.88rem", marginBottom: 22 }}>
              {isSignUp ? "For builders aged 13–18" : "Sign in to continue building"}
            </p>
            <AuthForm />
          </div>

          {/* RIGHT: Washi-taped note */}
          <div style={{ flex: 1, maxWidth: 420 }}>
            <WashiNote withAuth={false} />
          </div>
        </div>
      </div>
    );
  }

  /* ── MOBILE: single washi note with auth inside ──────────────────────────── */
  return (
    <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 24, alignSelf: "flex-start" }}>
        <div style={{ width: 34, height: 34, background: "#FF5A1F", border: "2px solid #1C1917", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", boxShadow: "2px 2px 0 #1C1917" }}>W</div>
        <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.2rem", color: "#1C1917" }}>Wozzer</span>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <WashiNote withAuth={true} />
      </div>
    </div>
  );
}
