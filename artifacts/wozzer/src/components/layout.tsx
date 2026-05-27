import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, User, Settings, Layers, LogOut, Award } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/feed" && location === "/feed") return true;
    if (path !== "/feed" && location.startsWith(path)) return true;
    return false;
  };

  const navItem = (href: string, icon: ReactNode, label: string) => (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all"
      style={{
        fontFamily: "'Caveat', cursive",
        fontSize: "1.1rem",
        fontWeight: 600,
        color: isActive(href) ? "#E8450A" : "#6B6355",
        background: isActive(href) ? "#F5E6D0" : "transparent",
        border: isActive(href) ? "1.5px solid #C4845A" : "1.5px solid transparent",
        textDecoration: "none",
      }}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row max-w-[1100px] mx-auto">
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "#F5F0E8", borderBottom: "2px solid #1A1A1A" }}
      >
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1A1A1A" }}>
          Wozzer
        </span>
        <Link
          href="/discover"
          style={{ fontFamily: "'Caveat', cursive", fontSize: "0.9rem", color: "#E8450A", fontWeight: 600, textDecoration: "none" }}
        >
          Discover
        </Link>
      </div>

      <nav
        className="fixed bottom-0 w-full md:relative md:w-56 md:flex-shrink-0 z-40 flex md:flex-col justify-around md:justify-start gap-1 md:gap-0 md:pt-8 md:px-4"
        style={{ background: "#F5F0E8", borderTop: "2px solid #1A1A1A", borderRight: "none" }}
      >
        <div className="hidden md:block mb-6 px-4">
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.8rem", fontWeight: 700, color: "#1A1A1A" }}>
            Wozzer
          </span>
        </div>

        {navItem("/feed", <Home size={18} />, "Feed")}
        {navItem("/discover", <Layers size={18} />, "Discover")}
        {navItem("/certifications", <Award size={18} />, "Certs")}
        {navItem(`/profile/${user?.username}`, <User size={18} />, "Profile")}
        {navItem("/settings", <Settings size={18} />, "Settings")}

        <div className="hidden md:block mt-auto mb-4 px-4 pt-4" style={{ borderTop: "1px solid #C8BFA8" }}>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full"
            style={{ fontFamily: "'Caveat', cursive", fontSize: "1rem", color: "#6B6355", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full pb-20 md:pb-0" style={{ borderLeft: "2px solid #1A1A1A" }}>
        {children}
      </main>
    </div>
  );
}
