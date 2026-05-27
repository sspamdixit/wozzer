import { useEffect } from "react";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getAccessToken } from "@/contexts/AuthContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import Feed from "@/pages/feed";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Discover from "@/pages/discover";
import Certifications from "@/pages/certifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

setAuthTokenGetter(() => getAccessToken());

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ProtectedRoute({ component: Component, requireOnboarding = true }: { component: React.ComponentType; requireOnboarding?: boolean }) {
  const { user, session, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !session) {
      setLocation("/sign-in");
    } else if (!isLoading && session && user && requireOnboarding && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, session, isLoading, setLocation, requireOnboarding]);

  if (isLoading) return <div style={{ minHeight: "100dvh", background: "#F5F0E8" }} />;
  if (!session) return null;
  if (requireOnboarding && user && !user.onboardingComplete) return null;

  return <Component />;
}

function HomeRedirect() {
  const { user, session, isLoading } = useAuth();

  if (isLoading) return <div style={{ minHeight: "100dvh", background: "#F5F0E8" }} />;
  if (!session) return <Landing />;
  if (user?.onboardingComplete) return <Redirect to="/feed" />;
  return <Redirect to="/onboarding" />;
}

function AppRoutes() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in">{() => <AuthPage mode="sign-in" />}</Route>
        <Route path="/sign-up">{() => <AuthPage mode="sign-up" />}</Route>
        <Route path="/onboarding">
          {() => <ProtectedRoute component={Onboarding} requireOnboarding={false} />}
        </Route>
        <Route path="/feed">
          {() => <ProtectedRoute component={Feed} />}
        </Route>
        <Route path="/discover">
          {() => <ProtectedRoute component={Discover} />}
        </Route>
        <Route path="/certifications">
          {() => <ProtectedRoute component={Certifications} />}
        </Route>
        <Route path="/profile/:username">
          {() => <ProtectedRoute component={Profile} />}
        </Route>
        <Route path="/settings">
          {() => <ProtectedRoute component={Settings} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
