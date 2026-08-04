import type { ActivityItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Link } from "wouter";
import { formatDateTime } from "@/shared/lib/utils";
import { Truck, Users, Building2, CheckCircle2, AlertTriangle } from "lucide-react";

interface ActivityFeedProps {
  activity?: ActivityItem[];
  isLoading: boolean;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'load': return <Truck className="w-4 h-4 text-primary" />;
    case 'carrier': return <Users className="w-4 h-4 text-chart-2" />;
    case 'broker': return <Building2 className="w-4 h-4 text-chart-3" />;
    case 'invoice': return <CheckCircle2 className="w-4 h-4 text-chart-4" />;
    default: return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
  }
}

export function ActivityFeed({ activity, isLoading }: ActivityFeedProps) {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-sm text-muted-foreground">LOADING.DATA...</div>
        ) : !activity?.length ? (
          <div className="p-8 text-center font-mono text-sm text-muted-foreground">NO.ACTIVITY.FOUND</div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map((item) => (
              <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-accent/50 transition-colors">
                <div className="mt-1 shrink-0 p-2 bg-muted border border-border">
                  <ActivityIcon type={item.entityType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                    <span className="text-xs font-mono text-primary uppercase border border-primary/20 bg-primary/5 px-1">{item.entityType}</span>
                  </div>
                </div>
                <Link
                  href={`/${item.entityType.toLowerCase()}s/${item.entityId}`}
                  className="shrink-0 text-xs font-mono text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-primary/20 px-2 py-1"
                >
                  VIEW
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
