import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Landing() {
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
            <Link href="/sign-up">Apply Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/sign-in">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
