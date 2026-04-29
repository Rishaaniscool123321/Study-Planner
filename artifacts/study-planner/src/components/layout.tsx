import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  TrendingUp,
  Settings,
  Palette,
  KeyRound,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useTheme } from "@/components/theme-provider";
import { StudyAIChat } from "@/components/study-ai-chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { sidebarPosition, sidebarSize } = useTheme();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/timer", label: "Timer", icon: Clock },
    { href: "/progress", label: "Progress", icon: TrendingUp },
    { href: "/passwords", label: "Passwords", icon: KeyRound },
    { href: "/customize", label: "Customize", icon: Palette },
  ];

  const sidebarWidthClass =
    sidebarSize === "icons" ? "w-14" : sidebarSize === "wide" ? "w-14 md:w-72" : "w-14 md:w-56";
  const labelClass =
    sidebarSize === "icons" ? "hidden" : "hidden md:inline";

  const sidebar = (
    <aside
      className={`${sidebarWidthClass} border-r border-border bg-sidebar flex flex-col justify-between flex-shrink-0`}
    >
      <div className="flex flex-col p-3 gap-1">
        <div className={`mb-5 mt-1 ${sidebarSize === "icons" ? "hidden" : "hidden md:flex"} items-center gap-2 px-2`}>
          <div className="w-5 h-5 rounded bg-primary flex-shrink-0" />
          <span className="font-bold text-base text-primary">Study Planner</span>
        </div>
        <div className={`mb-5 mt-1 ${sidebarSize === "icons" ? "flex" : "md:hidden flex"} justify-center`}>
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
                <span className={labelClass}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 space-y-1">
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
          <span className={labelClass}>Settings</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={14} />
                </div>
              )}
              <span className={`${labelClass} truncate text-left flex-1`}>
                {user?.firstName || user?.email || "Account"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="font-semibold">
                  {user?.firstName || user?.email || "Signed in"}
                </span>
                {user?.email && (
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut size={14} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );

  const main = (
    <main className="flex-1 overflow-auto bg-muted/20">
      <div className="max-w-5xl mx-auto p-4 md:p-8 min-h-full">{children}</div>
    </main>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {sidebarPosition === "left" ? (<>{sidebar}{main}</>) : (<>{main}{sidebar}</>)}
      <StudyAIChat />
    </div>
  );
}
