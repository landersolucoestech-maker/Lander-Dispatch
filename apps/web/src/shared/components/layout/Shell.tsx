import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Building2, 
  BookOpen, 
  Calculator, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/loads", label: "Loads", icon: Truck },
  { href: "/crm", label: "CRM", icon: BookOpen },
  { 
    href: "/accounting/invoices", 
    label: "Accounting", 
    icon: Calculator,
    sub: [
      { href: "/accounting/invoices", label: "Invoices" },
      { href: "/accounting/transactions", label: "Transactions" },
      { href: "/accounting/profit-loss", label: "Profit & Loss" }
    ]
  },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isPathActive = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            <span className="w-3 h-3 bg-primary block shrink-0" />
            <span className="font-bold tracking-tight uppercase text-sm">Lander Dispatch</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.sub 
              ? item.sub.some(s => isPathActive(s.href))
              : isPathActive(item.href, true);
              
            return (
              <div key={item.href} className="flex flex-col gap-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.sub && (
                    <ChevronDown className={cn("w-4 h-4 ml-auto", active && "rotate-180")} />
                  )}
                </Link>
                {item.sub && active && (
                  <div className="flex flex-col gap-1 pl-10 border-l border-border ml-4 mt-1 mb-2">
                    {item.sub.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "py-1.5 text-sm transition-colors hover:text-foreground",
                          isPathActive(subItem.href, true) 
                            ? "text-primary font-medium" 
                            : "text-muted-foreground"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-muted rounded-none flex items-center justify-center font-mono text-xs text-muted-foreground uppercase border border-border">
              {user?.firstName?.[0] || 'O'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold truncate">{user?.firstName || 'Operator'}</span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase truncate">SYSTEM.OP</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {children}
      </main>
    </div>
  );
}
