import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/auth-web";
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  FileClock,
  FileText,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Truck,
  UserPlus,
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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="lander-brand-mark relative flex h-10 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-black italic text-white">
        LD
        <span className="absolute bottom-1 left-2 h-0.5 w-7 -skew-x-[28deg] bg-white/75" />
      </span>
      {!compact ? (
        <div className="min-w-0 leading-none">
          <p className="truncate text-[15px] font-extrabold tracking-[0.02em] text-[#0B1E36]">LANDER</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-px w-4 bg-[#1E3D7A]" />
            <p className="text-[10px] font-bold tracking-[0.24em] text-[#1E3D7A]">DISPATCH</p>
            <span className="h-px w-4 bg-[#1E3D7A]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Navigation({ location, onNavigate }: { location: string; onNavigate: () => void }) {
  const isActive = (href: string, exact = false) =>
    exact ? location === href : location.startsWith(href);

  return (
    <nav className="flex flex-col gap-1 px-3 py-5">
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
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-all",
                active
                  ? "bg-[#edf3ff] text-[#1E3D7A] shadow-[inset_3px_0_0_#1E3D7A]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0B1E36]",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-[#1E3D7A]" : "text-slate-500")} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.sub ? (
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", active && "rotate-180")} />
              ) : null}
            </Link>

            {item.sub && active ? (
              <div className="ml-6 flex flex-col border-l border-slate-200 py-1 pl-4">
                {item.sub.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={onNavigate}
                    className={cn(
                      "rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive(subItem.href, true)
                        ? "bg-blue-50 text-[#1E3D7A]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-[#0B1E36]",
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

function SidebarContent({ location, onNavigate }: { location: string; onNavigate: () => void }) {
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "OP";
  const localMode = user?.email === "auth-disabled@localhost";

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-[#0B1E36]">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard" onClick={onNavigate} className="min-w-0"><Brand /></Link>
      </div>

      {localMode ? (
        <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Local development mode
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto"><Navigation location={location} onNavigate={onNavigate} /></div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3D7A] text-xs font-bold uppercase text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0B1E36]">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Operator"}</p>
              <p className="truncate text-[11px] text-slate-500">{localMode ? "Local Owner" : "Administrator"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-lg border-t border-slate-200 px-1 pt-3 text-sm font-medium text-slate-600 transition-colors hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderActions({ location }: { location: string }) {
  const dispatch = (name: string) => window.dispatchEvent(new CustomEvent(name));
  const secondaryClass = "hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-[#1E3D7A] sm:flex";
  const primaryClass = "hidden h-10 items-center gap-2 rounded-lg bg-[#1E3D7A] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#173462] sm:flex";

  if (location === "/loads") {
    return (
      <div className="flex items-center gap-2">
        <button type="button" className={secondaryClass} onClick={() => dispatch("lander:loads-import-pdf")}>
          <FileText className="h-4 w-4" />
          Import PDF
        </button>
        <button type="button" className={primaryClass} onClick={() => dispatch("lander:loads-create")}>
          <Plus className="h-4 w-4" />
          Create Load
        </button>
      </div>
    );
  }

  if (location === "/crm") {
    return (
      <div className="flex items-center gap-2">
        <button type="button" className={secondaryClass} onClick={() => dispatch("lander:crm-create-contact")}>
          <UserPlus className="h-4 w-4" />
          Create Contact
        </button>
        <button type="button" className={primaryClass} onClick={() => dispatch("lander:crm-create-lead")}>
          <Plus className="h-4 w-4" />
          Create Lead
        </button>
      </div>
    );
  }

  if (location === "/carriers") {
    return (
      <button type="button" className={primaryClass} onClick={() => dispatch("lander:carriers-add")}>
        <Plus className="h-4 w-4" />
        Add Carrier
      </button>
    );
  }

  return null;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user, logout } = useAuth();
  const pageLabel = useMemo(() => getPageLabel(location), [location]);
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "OP";
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Operator";

  return (
    <div className="lander-page-bg flex min-h-[100dvh] w-full text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white shadow-[4px_0_18px_rgba(11,30,54,0.025)] lg:block">
        <SidebarContent location={location} onNavigate={() => undefined} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#0B1E36]/35 backdrop-blur-[1px]" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[min(19rem,88vw)] border-r border-slate-200 bg-white shadow-2xl">
            <button type="button" className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </button>
            <SidebarContent location={location} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-[0_1px_8px_rgba(11,30,54,0.025)] backdrop-blur sm:px-6 lg:px-8">
          <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-[#0B1E36]">{pageLabel}</p>
            <p className="hidden text-xs text-slate-500 sm:block">Smart dispatch. Stronger miles.</p>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <HeaderActions location={location} />

            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setAccountOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-[#1E3D7A]"
              >
                <Bell className="h-[18px] w-[18px]" />
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(11,30,54,0.14)]">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-[#0B1E36]">Notifications</p>
                    <p className="mt-0.5 text-xs text-slate-500">Operational updates will appear here.</p>
                  </div>
                  <div className="px-4 py-7 text-center">
                    <Bell className="mx-auto h-5 w-5 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">No new notifications</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => {
                  setAccountOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white pl-1.5 pr-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E3D7A] text-[11px] font-semibold uppercase text-white">{initials}</span>
                <span className="hidden max-w-36 truncate text-sm font-medium text-[#0B1E36] sm:block">{displayName}</span>
                <ChevronDown className={cn("hidden h-4 w-4 text-slate-400 transition-transform sm:block", accountOpen && "rotate-180")} />
              </button>

              {accountOpen ? (
                <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(11,30,54,0.14)]">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[#0B1E36]">{displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email || "Account"}</p>
                  </div>
                  <div className="p-1.5">
                    <Link href="/settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1E3D7A]">
                      <Settings className="h-4 w-4" />
                      Account settings
                    </Link>
                    <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
