import { ActivityFeed } from "@/modules/dashboard/components/ActivityFeed";
import { AlertsBox } from "@/modules/dashboard/components/AlertsBox";
import { KpiCard } from "@/modules/dashboard/components/KpiCard";
import { formatCurrency } from "@/shared/lib/utils";
import {
  useGetDashboardActivity,
  useGetDashboardAlerts,
  useGetDashboardKpis,
} from "@workspace/api-client-react";
import { Bell, CheckCircle2, Clock, TrendingUp, Truck, Users } from "lucide-react";

export default function DashboardPage() {
  const { data: kpis, isLoading: isKpisLoading } = useGetDashboardKpis();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();
  const { data: alerts, isLoading: isAlertsLoading } = useGetDashboardAlerts();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">DASHBOARD</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your dispatch operation and recent activity.
        </p>
      </header>

      <section
        aria-label="Dashboard key performance indicators"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          title="Active Carriers"
          value={kpis?.activeCarriers}
          icon={Truck}
          loading={isKpisLoading}
        />
        <KpiCard
          title="Inactive Carriers"
          value={kpis?.inactiveCarriers}
          icon={Users}
          loading={isKpisLoading}
          variant="muted"
        />
        <KpiCard
          title="Loads Booked"
          value={kpis?.loadsBooked}
          icon={CheckCircle2}
          loading={isKpisLoading}
        />
        <KpiCard
          title="Monthly Revenue"
          value={kpis?.monthlyRevenue != null ? formatCurrency(kpis.monthlyRevenue) : null}
          icon={TrendingUp}
          loading={isKpisLoading}
          variant="primary"
        />
      </section>

      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Recent Activity
          </h2>
          <ActivityFeed activity={activity} isLoading={isActivityLoading} />
        </div>

        <div className="min-w-0 space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Bell className="h-4 w-4" aria-hidden="true" />
            System Alerts
          </h2>
          <AlertsBox alerts={alerts} isLoading={isAlertsLoading} />
        </div>
      </section>
    </main>
  );
}
