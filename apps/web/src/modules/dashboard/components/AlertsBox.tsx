import type { AlertItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Link } from "wouter";

interface AlertsBoxProps {
  alerts?: AlertItem[];
  isLoading: boolean;
}

export function AlertsBox({ alerts, isLoading }: AlertsBoxProps) {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-sm text-muted-foreground">LOADING.ALERTS...</div>
        ) : !alerts?.length ? (
          <div className="p-8 text-center font-mono text-sm text-muted-foreground">NO.ACTIVE.ALERTS</div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-1 border uppercase ${
                    alert.priority === 'High' ? 'text-destructive border-destructive bg-destructive/10' :
                    alert.priority === 'Medium' ? 'text-chart-2 border-chart-2 bg-chart-2/10' :
                    'text-muted-foreground border-border bg-muted'
                  }`}>
                    {alert.priority} PRIORITY
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {alert.dueDate ? `DUE: ${alert.dueDate}` : ''}
                  </span>
                </div>
                <p className="text-sm leading-tight">{alert.description}</p>
                <Link
                  href={`/${alert.relatedEntityType.toLowerCase()}s/${alert.relatedEntityId}`}
                  className="text-xs font-mono text-primary hover:underline mt-1 inline-block"
                >
                  RESOLVE &rarr;
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
