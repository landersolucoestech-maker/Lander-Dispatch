import { ActivityFeed } from "@/modules/dashboard/components/ActivityFeed";
import { KpiCard } from "@/modules/dashboard/components/KpiCard";
import { formatCurrency } from "@/shared/lib/utils";
import {
  useGetDashboardActivity,
  useGetDashboardKpis,
} from "@workspace/api-client-react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { data: kpis, isLoading: isKpisLoading } = useGetDashboardKpis();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-1 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1E36] sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500">
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
        <div className="lander-surface min-w-0 space-y-4 p-5 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#0B1E36]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E3D7A]">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            Recent Activity
          </h2>
          <ActivityFeed activity={activity} isLoading={isActivityLoading} />
        </div>

        <div className="lander-surface min-w-0 p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#0B1E36]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1E3D7A]">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              Today&apos;s Agenda
            </h2>
            <span className="pt-1 text-xs text-slate-400">{todayLabel}</span>
          </div>

          <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-5 text-center">
            <CalendarDays className="h-6 w-6 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-[#0B1E36]">No items scheduled for today</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Today&apos;s tasks, appointments and follow-ups will appear here.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
