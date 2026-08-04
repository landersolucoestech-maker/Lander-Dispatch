import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-card border border-border m-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-destructive font-mono">404</h1>
        <p className="text-sm font-mono text-muted-foreground uppercase">SYSTEM.MODULE.NOT.FOUND</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Return to Safe Zone</Button>
        </Link>
      </div>
    </div>
  );
}
