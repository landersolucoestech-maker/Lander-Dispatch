import { cn } from "@/shared/lib/utils"

export function StatusBadge({ 
  status, 
  className 
}: { 
  status: string,
  className?: string 
}) {
  const s = status.toLowerCase();
  
  let variant = "bg-muted text-muted-foreground border-border"; // default
  
  if (["active", "completed", "delivered", "fully paid", "won"].includes(s)) {
    variant = "bg-primary/10 text-primary border-primary/20";
  } else if (["pending", "in route", "dispatched", "partially paid"].includes(s)) {
    variant = "bg-chart-2/10 text-chart-2 border-chart-2/20";
  } else if (["picked up", "new", "contacted"].includes(s)) {
    variant = "bg-chart-3/10 text-chart-3 border-chart-3/20";
  } else if (["inactive", "canceled", "overdue", "lost"].includes(s)) {
    variant = "bg-destructive/10 text-destructive border-destructive/20";
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider border rounded-none whitespace-nowrap",
      variant,
      className
    )}>
      {status}
    </span>
  );
}
