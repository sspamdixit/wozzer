import { Link } from "wouter";

export default function Landing() {
  return (
    <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
        <div style={{ width: 44, height: 44, background: "#FF5A1F", border: "2.5px solid #1C1917", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1.3rem", color: "#fff", boxShadow: "3px 3px 0 #1C1917" }}>
          W
        </div>
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.5rem", color: "#1C1917" }}>Wozzer</span>
      </div>

      {/* Hero card — scrapbook style, slight tilt */}
      <div style={{ width: "100%", maxWidth: 400, position: "relative", marginBottom: 20 }}>
        {/* Washi tape strip */}
        <div className="washi washi-orange washi-top" style={{ width: 90 }} />

        <div className="scrap-card" style={{ padding: "36px 28px 32px", textAlign: "center", transform: "rotate(-0.8deg)" }}>
          <span className="sticker sticker-orange" style={{ marginBottom: 16, display: "inline-flex" }}>
            For builders 13–18
          </span>

          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "clamp(2.2rem, 8vw, 2.9rem)", lineHeight: 1.1, color: "#1C1917", marginBottom: 14, marginTop: 8 }}>
            Find your<br />
            <span style={{ color: "#FF5A1F" }}>co-founder.</span>
          </h1>

          <p style={{ fontFamily: "'Inter', sans-serif", color: "#78716C", fontSize: "0.97rem", lineHeight: 1.65, marginBottom: 28 }}>
            Earn your spot through an AI interview or a technical challenge. Then swipe through builders who actually ship.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/sign-up">
              <button className="btn-primary" style={{ width: "100%", fontSize: "1.05rem", padding: "0.85rem" }}>
                Apply Now →
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="btn-secondary" style={{ width: "100%" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating mini-cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 380 }}>
        {[
          { emoji: "⚡", label: "Builders", color: "#FF5A1F", bg: "#FFF0EB" },
          { emoji: "💡", label: "Visionaries", color: "#9040CC", bg: "#F6EEFF" },
          { emoji: "🔥", label: "Makers", color: "#E8900A", bg: "#FFFAEB" },
          { emoji: "🚀", label: "Teen founders", color: "#0A84C8", bg: "#E8F7FF" },
        ].map((tag, i) => (
          <div
            key={tag.label}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: tag.bg, border: `2px solid ${tag.color}40`,
              borderRadius: 999, padding: "5px 14px",
              fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: tag.color,
              transform: `rotate(${[-1.5, 1, -0.8, 1.5][i]}deg)`,
              boxShadow: `2px 2px 0 ${tag.color}30`,
            }}
          >
            {tag.emoji} {tag.label}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 28, fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "#A8A29E", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Exclusive · Merit-based · Built for builders
      </p>
    </div>
  );
}
