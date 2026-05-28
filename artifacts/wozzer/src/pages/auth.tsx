import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "sign-in" | "sign-up";
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
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "0 12px", height: "100%",
          background: "#FFF8F0", border: "1.5px solid #E4D8C8",
          borderRight: "none", borderRadius: "10px 0 0 10px", cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>{selected.flag}</span>
        <span style={{ fontFamily: "'Inter'", fontWeight: 600, fontSize: "0.85rem", color: "#78716C" }}>{selected.dial}</span>
        <span style={{ fontSize: "0.55rem", color: "#A8A29E" }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 100,
          background: "#fff", border: "1.5px solid #E4D8C8",
          borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          width: 260, maxHeight: 280, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 8px 6px", borderBottom: "1px solid #F0E8DC" }}>
            <input ref={searchRef} type="text" placeholder="Search…" value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 8, fontFamily: "'Inter'", fontSize: "0.85rem", color: "#1C1917", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 && <div style={{ padding: 12, color: "#A8A29E", fontSize: "0.85rem", textAlign: "center" }}>No results</div>}
            {filtered.map(c => (
              <button key={c.code} type="button" onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", background: c.code === selected.code ? "#FFF0EB" : "transparent", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid #F5EDE0" }}>
                <span style={{ fontSize: "1.05rem", flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, fontFamily: "'Inter'", fontSize: "0.83rem", color: "#1C1917" }}>{c.name}</span>
                <span style={{ fontFamily: "'Inter'", fontSize: "0.78rem", color: "#78716C", flexShrink: 0 }}>{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OAuthBtn({ provider, onClick, disabled }: { provider: "google" | "github"; onClick: () => void; disabled: boolean }) {
  const isGoogle = provider === "google";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      padding: "11px 16px", background: "#fff", color: "#1C1917",
      border: "1.5px solid #E4D8C8", borderRadius: 10,
      fontFamily: "'Inter'", fontWeight: 600, fontSize: "0.93rem",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "background 0.12s",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#FFF8F0"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
    >
      {isGoogle ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      )}
      Continue with {isGoogle ? "Google" : "GitHub"}
    </button>
  );
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("email");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then((d: { country_code?: string }) => {
        if (d.country_code) { const m = COUNTRIES.find(c => c.code === d.country_code); if (m) setCountry(m); }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (session && user) setLocation(user.onboardingComplete ? "/discover" : "/onboarding");
  }, [session, user, setLocation]);

  const fullPhone = `${country.dial}${localNumber.replace(/^0+/, "")}`;
  const isSignUp = mode === "sign-up";

  const F: React.CSSProperties = {
    width: "100%", padding: "0.72rem 1rem",
    background: "#FFF8F0", border: "1.5px solid #E4D8C8", borderRadius: 10,
    fontFamily: "'Inter'", fontSize: "0.95rem", color: "#1C1917",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#FF5A1F";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,90,31,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#E4D8C8";
    e.currentTarget.style.boxShadow = "none";
  };

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

  return (
    <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
      <div style={{ width: "100%", maxWidth: 390 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: "#FF5A1F", border: "2px solid #1C1917", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.05rem", color: "#fff", boxShadow: "2px 2px 0 #1C1917", flexShrink: 0 }}>W</div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.2rem", color: "#1C1917" }}>Wozzer</span>
        </div>

        {/* Card — no rotation, no washi tape */}
        <div style={{
          background: "#fff", border: "1.5px solid #E4D8C8",
          borderRadius: 16, padding: "28px 22px",
          boxShadow: "0 4px 20px rgba(28,25,23,0.07)",
        }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.6rem", color: "#1C1917", marginBottom: 4, lineHeight: 1.15 }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p style={{ fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.88rem", marginBottom: 22 }}>
            {isSignUp ? "For builders aged 13–18" : "Sign in to continue building"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <OAuthBtn provider="google" onClick={() => handleOAuth("google")} disabled={loading} />
            <OAuthBtn provider="github" onClick={() => handleOAuth("github")} disabled={loading} />
          </div>

          <div className="divider" style={{ marginBottom: 20 }}>or</div>

          {inputMode === "email" ? (
            <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={F} onFocus={onFocus} onBlur={onBlur} />
              <input type="password" placeholder={isSignUp ? "Create a password" : "Password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} style={F} onFocus={onFocus} onBlur={onBlur} />
              {success && <p style={{ color: "#46A302", fontSize: "0.85rem", fontFamily: "'Inter'" }}>{success}</p>}
              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 6, width: "100%" }}>
                {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
              </button>
              <button type="button" onClick={() => { setInputMode("phone"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.85rem", color: "#A8A29E", textAlign: "center", padding: "4px 0" }}>
                Use phone number instead
              </button>
            </form>

          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "stretch", height: 46 }}>
                <CountryPicker selected={country} onChange={c => { setCountry(c); setError(""); }} />
                <input type="tel" placeholder="Phone number" value={localNumber} onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-()]/g, ""))} required autoComplete="tel-national" inputMode="tel"
                  style={{ ...F, borderRadius: "0 10px 10px 0", flex: 1, minWidth: 0, height: "100%" }} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.75rem", color: "#A8A29E", marginTop: -4 }}>{country.flag} {country.name} detected · tap to change</p>
              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'" }}>{error}</p>}
              <button type="submit" disabled={loading || !localNumber.trim()} className="btn-primary" style={{ marginTop: 6, width: "100%" }}>
                {loading ? "..." : "Send code"}
              </button>
              <button type="button" onClick={() => { setInputMode("email"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.85rem", color: "#A8A29E", textAlign: "center", padding: "4px 0" }}>
                Use email instead
              </button>
            </form>

          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: "'Inter'", color: "#78716C", fontSize: "0.9rem", marginBottom: 4 }}>Code sent to {country.flag} {fullPhone}</p>
              <input type="text" placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} inputMode="numeric"
                style={{ ...F, letterSpacing: "0.4em", fontSize: "1.5rem", textAlign: "center" }} />
              {error && <p style={{ color: "#FF4B4B", fontSize: "0.85rem", fontFamily: "'Inter'" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 6, width: "100%" }}>
                {loading ? "..." : "Verify"}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.85rem", color: "#A8A29E", textAlign: "center", padding: "4px 0" }}>
                ← Change number
              </button>
            </form>
          )}
        </div>

        <p style={{ marginTop: 18, textAlign: "center", fontFamily: "'Inter'", color: "#A8A29E", fontSize: "0.88rem" }}>
          {isSignUp
            ? <> Already have an account? <a href="/sign-in" style={{ color: "#FF5A1F", fontWeight: 700, textDecoration: "none" }}>Sign in</a></>
            : <> New to Wozzer? <a href="/sign-up" style={{ color: "#FF5A1F", fontWeight: 700, textDecoration: "none" }}>Apply now</a></>
          }
        </p>
      </div>
    </div>
  );
}
