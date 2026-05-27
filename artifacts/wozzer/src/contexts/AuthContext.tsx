import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useGetMe, User } from "@workspace/api-client-react";
import { apiClient } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Intercept API requests to attach Supabase token
let currentSession: Session | null = null;

export function setApiSession(session: Session | null) {
  currentSession = session;
}

export function getAccessToken(): string | null {
  return currentSession?.access_token ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setApiSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setApiSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: user, isLoading: userLoading, refetch } = useGetMe({
    query: {
      enabled: !!session,
      retry: false,
    }
  });

  const isLoading = sessionLoading || (!!session && userLoading);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setApiSession(null);
  };

  const refreshUser = () => {
    refetch();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, session, isLoading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
