import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Feed from "@/pages/feed";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, requireOnboarding = true }: { component: any, requireOnboarding?: boolean }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && requireOnboarding && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, isLoading, location, setLocation, requireOnboarding]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!user) return null;
  if (requireOnboarding && !user.onboardingComplete) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding">
        {() => <ProtectedRoute component={Onboarding} requireOnboarding={false} />}
      </Route>
      <Route path="/feed">
        {() => <ProtectedRoute component={Feed} />}
      </Route>
      <Route path="/profile/:username">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
