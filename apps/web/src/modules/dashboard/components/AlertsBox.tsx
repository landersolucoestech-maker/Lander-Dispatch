import type { AlertItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { dashboardEntityRoute } from "../lib/entityRoutes";

interface AlertsBoxProps {
  alerts?: AlertItem[];
  isLoading: boolean;
}

function priorityClasses(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
      return "border-destructive/50 bg-destructive/10 text-destructive";
    case "high":
      return "border-amber-500/50 bg-amber-500/10 text-amber-700";
    case "medium":
      return "border-blue-500/40 bg-blue-500/10 text-blue-700";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function AlertIcon({ type }: { type: string }) {
  if (type.startsWith("insurance")) {
    return <ShieldAlert className="h-4 w-4" />;
  }
  if (type.startsWith("invoice")) {
    return <CalendarClock className="h-4 w-4" />;
  }
  return <AlertTriangle className="h-4 w-4" />;
}

export function AlertsBox({ alerts, isLoading }: AlertsBoxProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading operational alerts…
          </div>
        ) : !alerts?.length ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold">No active alerts.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Insurance and receivable deadlines are currently clear.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts.map((alert) => {
              const route = dashboardEntityRoute(
                alert.relatedEntityType,
                alert.relatedEntityId,
              );

              return (
                <article key={alert.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center border ${priorityClasses(
                        alert.priority,
                      )}`}
                    >
                      <AlertIcon type={alert.alertType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityClasses(
                            alert.priority,
                          )}`}
                        >
                          {alert.priority} priority
                        </span>
                        {alert.dueDate ? (
                          <span className="text-xs text-muted-foreground">
                            Due {alert.dueDate}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-medium leading-5">
                        {alert.description}
                      </p>
                      {route ? (
                        <Link
                          href={route}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          Review record
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
