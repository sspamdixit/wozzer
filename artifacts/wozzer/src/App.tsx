import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import Feed from "@/pages/feed";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#00bcd4",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#0d0d0d",
    colorInput: "#1a1a1a",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#334155",
    fontFamily: "inherit",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-xl w-[440px] max-w-full overflow-hidden border border-[#1e293b]",
    card: "!shadow-none !border-0 !bg-[#0d0d0d] !rounded-none",
    footer: "!shadow-none !border-0 !bg-[#0d0d0d] !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-[#f1f5f9] font-medium",
    socialButtonsBlockButton: "border-[#1e293b] bg-[#111] hover:bg-[#1a1a1a]",
    formFieldLabel: "text-[#94a3b8]",
    formFieldInput: "bg-[#1a1a1a] border-[#1e293b] text-white",
    footerActionLink: "text-[#00bcd4]",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#475569]",
    dividerLine: "bg-[#1e293b]",
    formButtonPrimary: "bg-[#00bcd4] text-black hover:bg-[#00acc1] font-semibold",
    identityPreviewEditButton: "text-[#00bcd4]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-[#f1f5f9]",
    alert: "border-[#1e293b] bg-[#111]",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    footerAction: "bg-[#0d0d0d]",
    otpCodeFieldInput: "bg-[#1a1a1a] border-[#1e293b] text-white",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ProtectedRoute({ component: Component, requireOnboarding = true }: { component: React.ComponentType; requireOnboarding?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/sign-in");
    } else if (!isLoading && user && requireOnboarding && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, isLoading, setLocation, requireOnboarding]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!user) return null;
  if (requireOnboarding && !user.onboardingComplete) return null;

  return <Component />;
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  return (
    <>
      <Show when="signed-in">
        {user?.onboardingComplete ? <Redirect to="/feed" /> : <Redirect to="/onboarding" />}
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <AuthProvider>
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
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
      <Toaster />
    </AuthProvider>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to Wozzer",
          },
        },
        signUp: {
          start: {
            title: "Apply to Wozzer",
            subtitle: "For serious builders aged 13-18",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
