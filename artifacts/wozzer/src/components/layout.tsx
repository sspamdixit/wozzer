import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, User, Settings, Layers, LogOut, Award, MessageCircle, Zap, Flame } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/discover" && location === "/discover") return true;
    if (path === "/feed" && location === "/feed") return true;
    if (path !== "/discover" && path !== "/feed" && location.startsWith(path)) return true;
    return false;
  };

  const NavItem = ({
    href, icon, label, primary,
  }: {
    href: string; icon: ReactNode; label: string; primary?: boolean;
  }) => (
    <Link href={href} style={{ textDecoration: "none", width: "100%" }}>
      <div className={`nav-item${isActive(href) ? " active" : ""}`} style={primary && !isActive(href) ? { color: "#FF5A1F", background: "#FFF0EB" } : {}}>
        {icon}
        <span className="hidden md:inline">{label}</span>
        {primary && !isActive(href) && (
          <span className="hidden md:inline" style={{ marginLeft: "auto", background: "#FF5A1F", color: "#fff", fontFamily: "'Inter'", fontSize: "0.68rem", fontWeight: 700, padding: "1px 7px", borderRadius: 999 }}>
            SWIPE
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <div style={{ minHeight: "100svh", background: "#FFFCF7", display: "flex", flexDirection: "column" }}>

      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "rgba(255,252,247,0.95)", backdropFilter: "blur(10px)", borderBottom: "2px solid #E4D8C8" }}
      >
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1C1917" }}>
          Wozzer
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.streakCurrent !== undefined && user.streakCurrent > 0 && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#E8900A", display: "flex", alignItems: "center", gap: 3 }}>
              <Flame size={14} />
              {user.streakCurrent}
            </span>
          )}
          {user?.xp !== undefined && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#FF5A1F", display: "flex", alignItems: "center", gap: 3 }}>
              <Zap size={13} />
              {user.xp}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-row max-w-[1100px] mx-auto w-full">

        {/* Sidebar / Bottom nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:w-56 md:flex-shrink-0 z-40 flex md:flex-col md:pt-8 md:px-3 md:gap-1"
          style={{
            background: "rgba(255,252,247,0.97)",
            backdropFilter: "blur(10px)",
            borderTop: "2px solid #E4D8C8",
            justifyContent: "space-around",
            padding: "10px 8px",
          }}
        >
          {/* Desktop logo */}
          <div className="hidden md:flex items-center gap-2.5 mb-6 px-2">
            <div style={{ width: 32, height: 32, background: "#FF5A1F", border: "2px solid #1C1917", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: "1rem", color: "#fff", flexShrink: 0, boxShadow: "2px 2px 0 #1C1917" }}>
              W
            </div>
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1.25rem", color: "#1C1917" }}>Wozzer</span>
          </div>

          {/* Streak + XP (desktop) */}
          {(user?.streakCurrent !== undefined || user?.xp !== undefined) && (
            <div className="hidden md:flex items-center gap-2 mb-5 px-2 flex-wrap">
              {(user?.streakCurrent ?? 0) > 0 && (
                <span className="sticker sticker-yellow" style={{ gap: 3 }}>
                  <Flame size={11} /> {user!.streakCurrent}d
                </span>
              )}
              {user?.xp !== undefined && (
                <span className="sticker sticker-orange" style={{ gap: 3 }}>
                  <Zap size={11} /> {user.xp} XP
                </span>
              )}
            </div>
          )}

          {/* Nav order: Discover > Messages > Feed > Profile > Settings */}
          <NavItem href="/discover" icon={<Layers size={19} />} label="Discover" primary />
          <NavItem href="/messages" icon={<MessageCircle size={18} />} label="Messages" />
          <NavItem href="/feed" icon={<Home size={18} />} label="Feed" />
          <NavItem href={`/profile/${user?.username}`} icon={<User size={18} />} label="Profile" />
          <NavItem href="/certifications" icon={<Award size={18} />} label="Certs" />
          <NavItem href="/settings" icon={<Settings size={18} />} label="Settings" />

          {/* Sign out */}
          <div className="hidden md:block mt-auto mb-4 pt-4 px-2" style={{ borderTop: "2px solid #E4D8C8" }}>
            <button
              onClick={signOut}
              style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", color: "#A8A29E", background: "none", border: "none", cursor: "pointer", fontWeight: 600, width: "100%", padding: "6px 2px" }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 w-full pb-24 md:pb-0" style={{ borderLeft: "2px solid #E4D8C8", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
