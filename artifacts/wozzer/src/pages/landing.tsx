import { Link } from "wouter";

const TAGS = ["Visionaries", "Builders", "Teen founders", "Indie makers"];

export default function Landing() {
  return (
    <div style={{ minHeight: "100svh", background: "#080809", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", position: "relative", overflow: "hidden" }}>

      {/* Subtle background glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(232,69,10,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 38, height: 38, background: "#E8450A", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.2rem", color: "#fff", boxShadow: "0 4px 12px rgba(232,69,10,0.4)" }}>
            W
          </div>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.35rem", color: "#F4F4F5" }}>Wozzer</span>
        </div>

        {/* Eyebrow tag */}
        <span className="tag-orange" style={{ marginBottom: 20, display: "inline-block" }}>
          For builders aged 13–18
        </span>

        {/* Hero */}
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "clamp(2.4rem, 7vw, 3.4rem)", lineHeight: 1.08, color: "#F4F4F5", marginTop: 12, marginBottom: 18 }}>
          Find your<br />
          <span style={{ color: "#E8450A" }}>co-founder.</span>
        </h1>

        <p style={{ fontFamily: "'Inter', sans-serif", color: "#71717A", fontSize: "1.05rem", lineHeight: 1.65, marginBottom: 36, maxWidth: 360, margin: "0 auto 36px" }}>
          Not just any platform. Earn your spot through an AI interview or a technical challenge — then connect with builders who actually ship.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/sign-up">
            <button className="btn-primary" style={{ width: "100%", fontSize: "1rem", padding: "0.85rem 1.5rem" }}>
              Apply Now →
            </button>
          </Link>
          <Link href="/sign-in">
            <button className="btn-secondary" style={{ width: "100%", fontSize: "0.95rem", padding: "0.8rem 1.5rem" }}>
              Sign In
            </button>
          </Link>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 40, justifyContent: "center" }}>
          {TAGS.map(tag => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>

        {/* Social proof */}
        <p style={{ marginTop: 32, fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "#52525B", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Exclusive · Merit-based · Built different
        </p>
      </div>
    </div>
  );
}
