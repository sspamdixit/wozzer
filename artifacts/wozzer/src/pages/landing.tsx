import { Link } from "wouter";

export default function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#F5F0E8" }}
    >
      {/* Scrapbook hero card */}
      <div className="w-full max-w-sm relative mt-8">
        {/* Washi tape */}
        <div className="washi washi-top washi-orange" style={{ transform: "translateX(-50%) rotate(-4deg)", width: 80 }} />

        <div
          className="scrap-card scrap-card-rotate-1 p-8 text-center"
          style={{ position: "relative", zIndex: 1 }}
        >
          <p className="font-accent text-sm mb-2" style={{ color: "#6B6355" }}>
            for builders aged 13-18
          </p>
          <h1
            className="font-serif mb-4"
            style={{ fontSize: "2.8rem", fontWeight: 700, lineHeight: 1.05, color: "#1A1A1A" }}
          >
            Where serious builders meet.
          </h1>
          <p style={{ color: "#6B6355", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            Wozzer is not for everyone. Earn your spot through an AI interview or a technical challenge.
            Then find the people building the future.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/sign-up">
              <button className="btn-primary w-full" style={{ width: "100%" }}>
                Apply Now
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="btn-ghost w-full" style={{ width: "100%" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating tags */}
      <div className="flex flex-wrap gap-2 mt-8 justify-center max-w-xs">
        {["Visionaries", "Wozniak builders", "Indie makers", "Teen founders"].map((tag, i) => (
          <span
            key={tag}
            className="font-accent"
            style={{
              fontSize: "0.95rem",
              color: "#1A1A1A",
              background: i % 2 === 0 ? "#F5E6D0" : "#D8F0E0",
              border: "1.5px solid #1A1A1A",
              borderRadius: "2px",
              padding: "2px 10px",
              transform: `rotate(${[-2, 1.5, -1, 2.5][i]}deg)`,
              display: "inline-block",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
