import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.onboardingComplete) {
        setLocation("/feed");
      } else {
        setLocation("/onboarding");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full">
            <Zap className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Where builders meet.
        </h1>
        <p className="text-muted-foreground text-lg">
          Wozzer is a serious network for young builders and visionaries. Earn your spot, find your people, and build the future.
        </p>
        <div className="flex flex-col gap-4 pt-4">
          <Button asChild size="lg" className="w-full font-semibold text-lg">
            <Link href="/register">Apply Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
