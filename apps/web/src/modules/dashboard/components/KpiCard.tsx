import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value?: number | string | null;
  icon: LucideIcon;
  loading?: boolean;
  trend?: string;
  variant?: "default" | "muted" | "primary";
}

export function KpiCard({ title, value, icon: Icon, loading, trend, variant = "default" }: KpiCardProps) {
  return (
    <Card className="overflow-hidden relative group">
      {variant === 'primary' && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl -mr-8 -mt-8 pointer-events-none" />}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant === 'primary' ? 'text-primary' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse mb-1" />
        ) : (
          <div className={`text-2xl font-bold tracking-tight ${variant === 'primary' ? 'text-primary' : ''}`}>
            {value ?? '--'}
          </div>
        )}
        {trend && (
          <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
