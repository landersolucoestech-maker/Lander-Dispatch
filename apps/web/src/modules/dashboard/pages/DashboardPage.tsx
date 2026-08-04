import { formatCurrency } from "@/shared/lib/utils";
import { useGetDashboardKpis, useGetDashboardActivity, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDateTime } from "@/shared/lib/utils";
import { KpiCard } from "@/modules/dashboard/components/KpiCard";
import { ActivityFeed } from "@/modules/dashboard/components/ActivityFeed";
import { AlertsBox } from "@/modules/dashboard/components/AlertsBox";
import { Truck, Users, CheckCircle2, TrendingUp, Clock, Bell } from "lucide-react";

export default function DashboardPage() {
  const { data: kpis, isLoading: isKpisLoading } = useGetDashboardKpis();
  const { data: activity, isLoading: isActivityLoading } = useGetDashboardActivity();
  const { data: alerts, isLoading: isAlertsLoading } = useGetDashboardAlerts();

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Command Center</h1>
          <p className="text-sm font-mono text-muted-foreground">Overview & Activity</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground bg-card border border-border px-3 py-1.5">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> SYSTEM.ONLINE</span>
          <span className="border-l border-border pl-4">{formatDateTime(new Date().toISOString())}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Active Carriers" 
          value={kpis?.activeCarriers} 
          icon={Truck} 
          loading={isKpisLoading}
          trend="+2 this week"
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
          trend="MTD"
        />
        <KpiCard 
          title="Monthly Rev" 
          value={kpis?.monthlyRevenue != null ? formatCurrency(kpis.monthlyRevenue) : null} 
          icon={TrendingUp} 
          loading={isKpisLoading}
          trend="+$1.2k vs last mo"
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Activity
          </h2>
          <ActivityFeed activity={activity} isLoading={isActivityLoading} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Bell className="w-4 h-4" /> System Alerts
          </h2>
          <AlertsBox alerts={alerts} isLoading={isAlertsLoading} />
        </div>
      </div>
    </div>
  );
}
