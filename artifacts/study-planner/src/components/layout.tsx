import { Link, useLocation } from "wouter";
import { LayoutDashboard, CheckSquare, Calendar, Clock, TrendingUp } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

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
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-border bg-card flex flex-col justify-between">
        <div className="flex flex-col gap-2 p-4">
          <div className="font-bold text-xl mb-6 hidden md:flex items-center text-primary px-2">
            <div className="w-6 h-6 rounded bg-primary mr-2 flex-shrink-0"></div>
            Study Planner
          </div>
          <div className="font-bold text-xl mb-6 md:hidden flex justify-center text-primary">
            <div className="w-6 h-6 rounded bg-primary flex-shrink-0"></div>
          </div>
          
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 flex justify-center md:justify-start">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
