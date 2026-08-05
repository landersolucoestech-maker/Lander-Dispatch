import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/auth-web";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  FileClock,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Truck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  sub?: Array<{ href: string; label: string }>;
}

const NAV_ITEMS: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loads", label: "Loads", icon: Truck },
  { href: "/crm", label: "CRM", icon: BookOpen },
  { href: "/carriers", label: "Carriers", icon: Users },
  { href: "/brokers", label: "Brokers", icon: Building2 },
  { href: "/documents", label: "Documents", icon: Files },
  {
    href: "/accounting/invoices",
    label: "Accounting",
    icon: Calculator,
    sub: [
      { href: "/accounting/invoices", label: "Invoices" },
      { href: "/accounting/transactions", label: "Transactions" },
      { href: "/accounting/profit-loss", label: "Profit & Loss" },
    ],
  },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit-log", label: "Audit Log", icon: FileClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getPageLabel(location: string) {
  const allItems = NAV_ITEMS.flatMap((item) => [
    { href: item.href, label: item.label },
    ...(item.sub ?? []),
  ]);
  return (
    allItems
      .sort((left, right) => right.href.length - left.href.length)
      .find((item) => location.startsWith(item.href))?.label ?? "Lander Dispatch"
  );
}

function Navigation({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate: () => void;
}) {
  const isActive = (href: string, exact = false) =>
    exact ? location === href : location.startsWith(href);

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.sub
          ? item.sub.some((subItem) => isActive(subItem.href))
          : isActive(item.href, item.href !== "/dashboard");

        return (
          <div key={item.href} className="flex flex-col gap-1">
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-3 px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.sub ? (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    active && "rotate-180",
                  )}
                />
              ) : null}
            </Link>

            {item.sub && active ? (
              <div className="ml-5 flex flex-col border-l border-slate-700 py-1 pl-5">
                {item.sub.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={onNavigate}
                    className={cn(
                      "py-2 text-sm transition-colors",
                      isActive(subItem.href, true)
                        ? "font-semibold text-blue-300"
                        : "text-slate-400 hover:text-white",
                    )}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate: () => void;
}) {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "LD";
  const localMode = user?.email === "auth-disabled@localhost";

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-600 text-xs font-black tracking-tight">
            LD
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">LANDER DISPATCH</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Operations Platform
            </p>
          </div>
        </Link>
      </div>

      {localMode ? (
        <div className="mx-3 mt-3 border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
          Local development mode
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Navigation location={location} onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 bg-white/10 text-xs font-bold uppercase">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Operator"}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">
              {localMode ? "Local Owner" : "Authenticated User"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 flex min-h-10 w-full items-center gap-2 px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const pageLabel = useMemo(() => getPageLabel(location), [location]);

  const handleQuickSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = quickSearch.trim().toLowerCase();
    if (!value) return;

    const match = NAV_ITEMS.flatMap((item) => [
      { href: item.href, label: item.label },
      ...(item.sub ?? []),
    ]).find((item) => item.label.toLowerCase().includes(value));

    if (match) {
      navigate(match.href);
      setQuickSearch("");
      setMobileOpen(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800 lg:block">
        <SidebarContent location={location} onNavigate={() => undefined} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[min(19rem,88vw)] border-r border-slate-800 shadow-2xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center border border-white/15 bg-white/10 text-white"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent location={location} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-border lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{pageLabel}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Lander Dispatch operational workspace
            </p>
          </div>

          <form className="relative hidden w-full max-w-sm md:block" onSubmit={handleQuickSearch}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={quickSearch}
              onChange={(event) => setQuickSearch(event.target.value)}
              placeholder="Navigate to a module…"
              className="h-9 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
              aria-label="Quick module navigation"
            />
          </form>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
