import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-card border border-border m-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase">Reporting Engine</h1>
        <p className="text-sm font-mono text-muted-foreground">Module in development.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-4">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
