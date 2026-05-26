import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useClerk } from "@clerk/react";
import { LogOut, Home, User, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const [location] = useLocation();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const isActive = (path: string) => {
    if (path === "/feed" && location === "/feed") return true;
    if (path !== "/feed" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row max-w-[1200px] mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
          <Zap className="h-5 w-5" /> Wozzer
        </div>
      </div>

      {/* Desktop Sidebar & Mobile Bottom Nav */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 border-t md:border-t-0 md:border-r border-border bg-background z-40 p-2 md:p-6 flex md:flex-col justify-around md:justify-start gap-2">
        <div className="hidden md:flex items-center gap-2 font-bold text-xl text-primary tracking-tight mb-8 px-4">
          <Zap className="h-6 w-6" /> Wozzer
        </div>

        <Link href="/feed" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/feed") ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
          <Home className="h-5 w-5" />
          <span className="hidden md:inline">Feed</span>
        </Link>

        <Link href={`/profile/${user?.username}`} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(`/profile/${user?.username}`) ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
          <User className="h-5 w-5" />
          <span className="hidden md:inline">Profile</span>
        </Link>

        <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/settings") ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
          <Settings className="h-5 w-5" />
          <span className="hidden md:inline">Settings</span>
        </Link>

        <div className="hidden md:block mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full pb-20 md:pb-0 min-h-[100dvh]">
        {children}
      </main>
    </div>
  );
}
