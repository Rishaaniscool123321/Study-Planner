import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Calendar, Clock, TrendingUp, Settings } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/timer", label: "Timer", icon: Clock },
    { href: "/progress", label: "Progress", icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-14 md:w-56 border-r border-border bg-sidebar flex flex-col justify-between flex-shrink-0">
        <div className="flex flex-col p-3 gap-1">
          <div className="mb-5 mt-1 hidden md:flex items-center gap-2 px-2">
            <div className="w-5 h-5 rounded bg-primary flex-shrink-0" />
            <span className="font-bold text-base text-primary">Study Planner</span>
          </div>
          <div className="mb-5 mt-1 md:hidden flex justify-center">
            <div className="w-5 h-5 rounded bg-primary" />
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                  title={item.label}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
              location === "/settings"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
            title="Settings"
          >
            <Settings size={18} className="flex-shrink-0" />
            <span className="hidden md:inline">Settings</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
