import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, User, Settings, Layers, LogOut, Award, Zap } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/feed" && location === "/feed") return true;
    if (path !== "/feed" && location.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({ href, icon, label }: { href: string; icon: ReactNode; label: string }) => (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className={`nav-item${isActive(href) ? " active" : ""}`}>
        {icon}
        <span className="hidden md:inline">{label}</span>
      </div>
    </Link>
  );

  return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "#080809" }}>

      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "rgba(8,8,9,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid #27272A" }}
      >
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.3rem", fontWeight: 700, color: "#F4F4F5" }}>
          Wozzer
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.xp !== undefined && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: 600, color: "#E8450A", display: "flex", alignItems: "center", gap: 3 }}>
              <Zap size={12} />
              {user.xp} XP
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-row max-w-[1100px] mx-auto w-full">

        {/* Sidebar nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto md:w-56 md:flex-shrink-0 z-40 flex md:flex-col justify-around md:justify-start md:pt-8 md:px-3 md:gap-1"
          style={{
            background: "rgba(8,8,9,0.95)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid #27272A",
            padding: "8px 12px",
          }}
        >
          {/* Desktop logo */}
          <div className="hidden md:flex items-center gap-2.5 mb-8 px-2">
            <div style={{ width: 30, height: 30, background: "#E8450A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", flexShrink: 0, boxShadow: "0 2px 8px rgba(232,69,10,0.4)" }}>
              W
            </div>
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.25rem", color: "#F4F4F5" }}>Wozzer</span>
          </div>

          {/* XP pill (desktop) */}
          {user?.xp !== undefined && (
            <div className="hidden md:flex items-center gap-2 mb-5 px-2">
              <span className="pill-orange" style={{ fontSize: "0.8rem" }}>
                <Zap size={11} />
                {user.xp} XP · Lvl {user.xpLevel ?? 0}
              </span>
            </div>
          )}

          <NavItem href="/feed" icon={<Home size={18} />} label="Feed" />
          <NavItem href="/discover" icon={<Layers size={18} />} label="Discover" />
          <NavItem href="/certifications" icon={<Award size={18} />} label="Certs" />
          <NavItem href={`/profile/${user?.username}`} icon={<User size={18} />} label="Profile" />
          <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" />

          {/* Sign out (desktop) */}
          <div className="hidden md:block mt-auto mb-4 pt-4 px-2" style={{ borderTop: "1px solid #27272A" }}>
            <button
              onClick={signOut}
              style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color: "#52525B", background: "none", border: "none", cursor: "pointer", fontWeight: 500, width: "100%", padding: "6px 0" }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 w-full pb-20 md:pb-0" style={{ borderLeft: "1px solid #27272A", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
