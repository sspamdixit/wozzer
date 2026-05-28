import { Link } from "wouter";

const BENEFITS = [
  { emoji: "🤝", text: "Merit-based matching" },
  { emoji: "🔥", text: "Ship-first culture" },
  { emoji: "🌍", text: "Global builders" },
  { emoji: "⚡", text: "AI-screened profiles" },
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <div style={{
          width: 40, height: 40, background: "#FF5A1F",
          border: "2px solid #1C1917", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff",
          boxShadow: "2px 2px 0 #1C1917",
        }}>W</div>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1.4rem", color: "#1C1917" }}>Wozzer</span>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <span className="sticker sticker-orange" style={{ marginBottom: 16, display: "inline-flex" }}>
          For builders aged 13–18
        </span>

        <h1 style={{
          fontFamily: "'Fraunces', serif", fontWeight: 700,
          fontSize: "clamp(2.4rem, 8vw, 3.2rem)", lineHeight: 1.08,
          color: "#1C1917", marginTop: 12, marginBottom: 16,
        }}>
          Find your<br /><span style={{ color: "#FF5A1F" }}>co-founder.</span>
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif", color: "#78716C",
          fontSize: "1rem", lineHeight: 1.65, marginBottom: 32,
          maxWidth: 360, margin: "0 auto 32px",
        }}>
          Earn your spot through an AI interview or technical challenge. Then swipe through verified builders who actually ship.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
          <Link href="/sign-up">
            <button className="btn-primary" style={{ width: "100%", fontSize: "1.05rem", padding: "0.85rem" }}>
              Apply Now →
            </button>
          </Link>
          <Link href="/sign-in">
            <button className="btn-secondary" style={{ width: "100%", fontSize: "0.97rem" }}>
              Sign In
            </button>
          </Link>
        </div>

        {/* Benefits row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {BENEFITS.map(b => (
            <div
              key={b.text}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#fff", border: "1.5px solid #E4D8C8",
                borderRadius: 10, padding: "6px 12px",
                fontFamily: "'Inter', sans-serif", fontSize: "0.83rem",
                fontWeight: 600, color: "#78716C",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <span>{b.emoji}</span> {b.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
