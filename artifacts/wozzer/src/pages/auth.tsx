import { useState, useEffect, useRef } from "react";
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

// ── Country data ──────────────────────────────────────────────────────────────
interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  dial: string; // e.g. "+1"
  flag: string; // emoji
}

const COUNTRIES: Country[] = [
  { name: "Afghanistan", code: "AF", dial: "+93", flag: "🇦🇫" },
  { name: "Albania", code: "AL", dial: "+355", flag: "🇦🇱" },
  { name: "Algeria", code: "DZ", dial: "+213", flag: "🇩🇿" },
  { name: "Argentina", code: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Armenia", code: "AM", dial: "+374", flag: "🇦🇲" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Austria", code: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", code: "AZ", dial: "+994", flag: "🇦🇿" },
  { name: "Bahrain", code: "BH", dial: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Belarus", code: "BY", dial: "+375", flag: "🇧🇾" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Bolivia", code: "BO", dial: "+591", flag: "🇧🇴" },
  { name: "Bosnia & Herzegovina", code: "BA", dial: "+387", flag: "🇧🇦" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Bulgaria", code: "BG", dial: "+359", flag: "🇧🇬" },
  { name: "Cambodia", code: "KH", dial: "+855", flag: "🇰🇭" },
  { name: "Cameroon", code: "CM", dial: "+237", flag: "🇨🇲" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Chile", code: "CL", dial: "+56", flag: "🇨🇱" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Colombia", code: "CO", dial: "+57", flag: "🇨🇴" },
  { name: "Costa Rica", code: "CR", dial: "+506", flag: "🇨🇷" },
  { name: "Croatia", code: "HR", dial: "+385", flag: "🇭🇷" },
  { name: "Cuba", code: "CU", dial: "+53", flag: "🇨🇺" },
  { name: "Cyprus", code: "CY", dial: "+357", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", dial: "+420", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Dominican Republic", code: "DO", dial: "+1", flag: "🇩🇴" },
  { name: "Ecuador", code: "EC", dial: "+593", flag: "🇪🇨" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "El Salvador", code: "SV", dial: "+503", flag: "🇸🇻" },
  { name: "Estonia", code: "EE", dial: "+372", flag: "🇪🇪" },
  { name: "Ethiopia", code: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Finland", code: "FI", dial: "+358", flag: "🇫🇮" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Georgia", code: "GE", dial: "+995", flag: "🇬🇪" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Greece", code: "GR", dial: "+30", flag: "🇬🇷" },
  { name: "Guatemala", code: "GT", dial: "+502", flag: "🇬🇹" },
  { name: "Honduras", code: "HN", dial: "+504", flag: "🇭🇳" },
  { name: "Hong Kong", code: "HK", dial: "+852", flag: "🇭🇰" },
  { name: "Hungary", code: "HU", dial: "+36", flag: "🇭🇺" },
  { name: "Iceland", code: "IS", dial: "+354", flag: "🇮🇸" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Iran", code: "IR", dial: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "🇮🇪" },
  { name: "Israel", code: "IL", dial: "+972", flag: "🇮🇱" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Jamaica", code: "JM", dial: "+1", flag: "🇯🇲" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", dial: "+7", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996", flag: "🇰🇬" },
  { name: "Latvia", code: "LV", dial: "+371", flag: "🇱🇻" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "🇱🇧" },
  { name: "Libya", code: "LY", dial: "+218", flag: "🇱🇾" },
  { name: "Lithuania", code: "LT", dial: "+370", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", dial: "+352", flag: "🇱🇺" },
  { name: "Macau", code: "MO", dial: "+853", flag: "🇲🇴" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Maldives", code: "MV", dial: "+960", flag: "🇲🇻" },
  { name: "Malta", code: "MT", dial: "+356", flag: "🇲🇹" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Moldova", code: "MD", dial: "+373", flag: "🇲🇩" },
  { name: "Mongolia", code: "MN", dial: "+976", flag: "🇲🇳" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Mozambique", code: "MZ", dial: "+258", flag: "🇲🇿" },
  { name: "Myanmar", code: "MM", dial: "+95", flag: "🇲🇲" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Nicaragua", code: "NI", dial: "+505", flag: "🇳🇮" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "North Korea", code: "KP", dial: "+850", flag: "🇰🇵" },
  { name: "North Macedonia", code: "MK", dial: "+389", flag: "🇲🇰" },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Oman", code: "OM", dial: "+968", flag: "🇴🇲" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Palestine", code: "PS", dial: "+970", flag: "🇵🇸" },
  { name: "Panama", code: "PA", dial: "+507", flag: "🇵🇦" },
  { name: "Paraguay", code: "PY", dial: "+595", flag: "🇵🇾" },
  { name: "Peru", code: "PE", dial: "+51", flag: "🇵🇪" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Puerto Rico", code: "PR", dial: "+1", flag: "🇵🇷" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Romania", code: "RO", dial: "+40", flag: "🇷🇴" },
  { name: "Russia", code: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Senegal", code: "SN", dial: "+221", flag: "🇸🇳" },
  { name: "Serbia", code: "RS", dial: "+381", flag: "🇷🇸" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", dial: "+421", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", dial: "+386", flag: "🇸🇮" },
  { name: "Somalia", code: "SO", dial: "+252", flag: "🇸🇴" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Sudan", code: "SD", dial: "+249", flag: "🇸🇩" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Syria", code: "SY", dial: "+963", flag: "🇸🇾" },
  { name: "Taiwan", code: "TW", dial: "+886", flag: "🇹🇼" },
  { name: "Tajikistan", code: "TJ", dial: "+992", flag: "🇹🇯" },
  { name: "Tanzania", code: "TZ", dial: "+255", flag: "🇹🇿" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Trinidad & Tobago", code: "TT", dial: "+1", flag: "🇹🇹" },
  { name: "Tunisia", code: "TN", dial: "+216", flag: "🇹🇳" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "Turkmenistan", code: "TM", dial: "+993", flag: "🇹🇲" },
  { name: "Uganda", code: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Ukraine", code: "UA", dial: "+380", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Uruguay", code: "UY", dial: "+598", flag: "🇺🇾" },
  { name: "Uzbekistan", code: "UZ", dial: "+998", flag: "🇺🇿" },
  { name: "Venezuela", code: "VE", dial: "+58", flag: "🇻🇪" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "🇻🇳" },
  { name: "Yemen", code: "YE", dial: "+967", flag: "🇾🇪" },
  { name: "Zimbabwe", code: "ZW", dial: "+263", flag: "🇿🇼" },
];

const DEFAULT_COUNTRY = COUNTRIES.find(c => c.code === "US")!;

// ── Country picker component ──────────────────────────────────────────────────
function CountryCodePicker({
  selected,
  onChange,
}: {
  selected: Country;
  onChange: (c: Country) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? COUNTRIES.filter(
        c =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.dial.includes(query) ||
          c.code.toLowerCase().includes(query.toLowerCase())
      )
    : COUNTRIES;

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "11px 10px",
          background: "#EDE8DE",
          border: `1.5px solid ${INK}`,
          borderRadius: "3px 0 0 3px",
          borderRight: "none",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.95rem",
          color: INK,
          whiteSpace: "nowrap",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{selected.flag}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: "0.88rem" }}>
          {selected.dial}
        </span>
        <span style={{ fontSize: "0.65rem", opacity: 0.5, marginLeft: 1 }}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            background: PAPER,
            border: `1.5px solid ${INK}`,
            borderRadius: 3,
            boxShadow: `3px 3px 0 ${INK}`,
            width: 260,
            maxHeight: 280,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div style={{ padding: "8px 8px 6px", borderBottom: `1px solid ${BORDER}` }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country or code…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 9px",
                background: "#EDE8DE",
                border: `1.5px solid ${BORDER}`,
                borderRadius: 2,
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.85rem",
                color: INK,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "12px", color: MUTED, fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", textAlign: "center" }}>
                No results
              </div>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 12px",
                  background: c.code === selected.code ? "#F5E6D0" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: `1px solid ${BORDER}20`,
                }}
              >
                <span style={{ fontSize: "1.15rem", flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: INK }}>
                  {c.name}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: MUTED, flexShrink: 0 }}>
                  {c.dial}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Misc sub-components ───────────────────────────────────────────────────────
function WozzerLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
      <div
        style={{
          width: 36, height: 36, background: BRAND_ORANGE,
          border: `2px solid ${INK}`, borderRadius: 4,
          boxShadow: `2px 2px 0 ${INK}`, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700,
          fontSize: "1.1rem", color: PAPER,
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

function OAuthButton({ provider, onClick, disabled }: { provider: "google" | "github"; onClick: () => void; disabled: boolean }) {
  const isGoogle = provider === "google";
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "11px 16px",
        background: isGoogle ? PAPER : INK, color: isGoogle ? INK : PAPER,
        border: `1.5px solid ${INK}`, borderRadius: 3,
        boxShadow: `2px 2px 0 ${isGoogle ? INK : MUTED}`,
        fontFamily: "'Ngaco', cursive", fontWeight: 600, fontSize: "1.1rem",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
      }}
      onMouseDown={e => { e.currentTarget.style.transform = "translate(1px,1px)"; e.currentTarget.style.boxShadow = `1px 1px 0 ${isGoogle ? INK : MUTED}`; }}
      onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `2px 2px 0 ${isGoogle ? INK : MUTED}`; }}
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
  width: "100%", padding: "11px 13px",
  background: "#EDE8DE", border: `1.5px solid ${INK}`,
  borderRadius: 3, fontFamily: "'Inter', sans-serif",
  fontSize: "0.95rem", color: INK, outline: "none",
  boxSizing: "border-box",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [countryLoading, setCountryLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("email");
  const [otpSent, setOtpSent] = useState(false);

  // ── Auto-detect country via IP ──────────────────────────────────────────────
  useEffect(() => {
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then((data: { country_code?: string }) => {
        if (data.country_code) {
          const match = COUNTRIES.find(c => c.code === data.country_code);
          if (match) setCountry(match);
        }
      })
      .catch(() => { /* keep default */ })
      .finally(() => setCountryLoading(false));
  }, []);

  useEffect(() => {
    if (session && user) {
      setLocation(user.onboardingComplete ? "/feed" : "/onboarding");
    }
  }, [session, user, setLocation]);

  const fullPhone = `${country.dial}${localNumber.replace(/^0+/, "")}`;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      setOtpSent(true);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
      if (error) throw error;
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const switchInputMode = () => {
    setInputMode(m => m === "email" ? "phone" : "email");
    setOtpSent(false); setError("");
  };

  const isSignUp = mode === "sign-up";

  return (
    <div style={{ minHeight: "100svh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
        <div className="washi washi-top washi-orange" style={{ width: 72, transform: "translateX(-50%) rotate(-3deg)" }} />

        <div className="scrap-card" style={{ padding: "32px 28px 28px", position: "relative" }}>
          <WozzerLogo />

          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.65rem", color: INK, marginBottom: 4, lineHeight: 1.15 }}>
            {isSignUp ? "Create your account" : "Sign in to Wozzer"}
          </h1>
          <p style={{ fontFamily: "'Ngaco', cursive", color: MUTED, fontSize: "1rem", marginBottom: 22 }}>
            {isSignUp ? "For builders aged 13–18" : "Good to have you back"}
          </p>

          {/* OAuth */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <OAuthButton provider="google" onClick={() => handleOAuth("google")} disabled={loading} />
            <OAuthButton provider="github" onClick={() => handleOAuth("github")} disabled={loading} />
          </div>

          <Divider />

          {/* Email form */}
          {inputMode === "email" ? (
            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />
              <input type="password" placeholder={isSignUp ? "Create a password" : "Password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} style={inputStyle} />
              {success && <p style={{ color: "#1A6B3A", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>{success}</p>}
              {error && <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 2, width: "100%" }}>
                {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
              </button>
              <button type="button" onClick={switchInputMode} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Ngaco', cursive", fontSize: "0.95rem", color: BRAND_ORANGE, textAlign: "center", padding: 0, marginTop: 2 }}>
                Use phone number instead
              </button>
            </form>

          ) : !otpSent ? (
            /* Phone — send code */
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Country + number row */}
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <CountryCodePicker
                  selected={country}
                  onChange={c => { setCountry(c); setError(""); }}
                />
                <input
                  type="tel"
                  placeholder={countryLoading ? "detecting…" : "Phone number"}
                  value={localNumber}
                  onChange={e => setLocalNumber(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                  required
                  autoComplete="tel-national"
                  inputMode="tel"
                  style={{
                    ...inputStyle,
                    borderRadius: "0 3px 3px 0",
                    flex: 1,
                    minWidth: 0,
                  }}
                />
              </div>
              {/* Detected country hint */}
              {!countryLoading && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: MUTED, margin: "-4px 0 0" }}>
                  Detected: {country.flag} {country.name} — tap the flag to change
                </p>
              )}
              {error && <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>{error}</p>}
              <button type="submit" disabled={loading || !localNumber.trim()} className="btn-primary" style={{ marginTop: 2, width: "100%" }}>
                {loading ? "..." : "Send code"}
              </button>
              <button type="button" onClick={switchInputMode} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Ngaco', cursive", fontSize: "0.95rem", color: BRAND_ORANGE, textAlign: "center", padding: 0, marginTop: 2 }}>
                Use email instead
              </button>
            </form>

          ) : (
            /* Phone — verify OTP */
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontFamily: "'Ngaco', cursive", color: MUTED, fontSize: "0.95rem", marginBottom: 2 }}>
                Enter the code sent to {country.flag} {fullPhone}
              </p>
              <input
                type="text" placeholder="000000" value={otp}
                onChange={e => setOtp(e.target.value)} required maxLength={6}
                inputMode="numeric"
                style={{ ...inputStyle, letterSpacing: "0.35em", fontSize: "1.6rem", textAlign: "center" }}
              />
              {error && <p style={{ color: "#CC2200", fontSize: "0.88rem", fontFamily: "'Ngaco', cursive" }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 2, width: "100%" }}>
                {loading ? "..." : "Verify"}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Ngaco', cursive", fontSize: "0.95rem", color: MUTED, textAlign: "center", padding: 0 }}>
                ← Change number
              </button>
            </form>
          )}

          {/* Switch sign-in / sign-up */}
          <p style={{ marginTop: 22, textAlign: "center", fontFamily: "'Ngaco', cursive", color: MUTED, fontSize: "0.95rem" }}>
            {isSignUp ? (
              <>Already have an account? <a href="/sign-in" style={{ color: BRAND_ORANGE, fontWeight: 600 }}>Sign in</a></>
            ) : (
              <>New to Wozzer? <a href="/sign-up" style={{ color: BRAND_ORANGE, fontWeight: 600 }}>Apply now</a></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
