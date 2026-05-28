import { Layout } from "@/components/layout";
import { MessageCircle, Lock } from "lucide-react";

export default function Messages() {
  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div className="washi washi-blue washi-top" style={{ width: 70 }} />
          <div className="scrap-card" style={{ padding: "36px 32px", maxWidth: 360, transform: "rotate(-0.5deg)" }}>
            <div style={{ width: 60, height: 60, background: "#E8F7FF", border: "2px solid #1CB0F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.6rem" }}>
              <MessageCircle size={26} color="#1CB0F6" />
            </div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.5rem", color: "#1C1917", marginBottom: 10 }}>
              Messages
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#78716C", fontSize: "0.93rem", lineHeight: 1.6, marginBottom: 16 }}>
              Chat with your matches after swiping right on each other. Messages are coming soon.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span className="sticker sticker-blue"><Lock size={11} /> Coming soon</span>
            </div>
          </div>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: "#A8A29E", maxWidth: 260 }}>
          In the meantime, go swipe — every right swipe brings you closer to a match.
        </p>
      </div>
    </Layout>
  );
}
