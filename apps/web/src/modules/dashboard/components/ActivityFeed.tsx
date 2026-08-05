import type { ActivityItem } from "@workspace/api-client-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Link } from "wouter";
import { formatDateTime } from "@/shared/lib/utils";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  ContactRound,
  FileClock,
  FileText,
  Receipt,
  Settings,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { dashboardEntityRoute } from "../lib/entityRoutes";

interface ActivityFeedProps {
  activity?: ActivityItem[];
  isLoading: boolean;
}

function ActivityIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case "load":
      return <Truck className="h-4 w-4" />;
    case "carrier":
      return <Users className="h-4 w-4" />;
    case "broker":
      return <Building2 className="h-4 w-4" />;
    case "contact":
      return <ContactRound className="h-4 w-4" />;
    case "lead":
    case "driver":
      return <UserRound className="h-4 w-4" />;
    case "invoice":
      return <Receipt className="h-4 w-4" />;
    case "transaction":
      return <CircleDollarSign className="h-4 w-4" />;
    case "document":
      return <FileText className="h-4 w-4" />;
    case "company_profile":
      return <Settings className="h-4 w-4" />;
    default:
      return <FileClock className="h-4 w-4" />;
  }
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const route = dashboardEntityRoute(item.entityType, item.entityId);

  return (
    <div className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 sm:gap-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-primary/20 bg-primary/5 text-primary">
        <ActivityIcon type={item.entityType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5">{item.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDateTime(item.createdAt)}
          </span>
          <span className="border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.entityType.replaceAll("_", " ")}
          </span>
        </div>
      </div>
      {route ? (
        <Link
          href={route}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function ActivityFeed({ activity, isLoading }: ActivityFeedProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading recent activity…
          </div>
        ) : !activity?.length ? (
          <div className="p-10 text-center">
            <FileClock className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No activity recorded yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Audited operational changes will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
