import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TimerProvider } from "@/contexts/timer-context";
import { AppLayout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

import Dashboard from "./pages/dashboard";
import Tasks from "./pages/tasks";
import Schedule from "./pages/schedule";
import Timer from "./pages/timer";
import Progress from "./pages/progress";
import Settings from "./pages/settings";
import Customize from "./pages/customize";
import Passwords from "./pages/passwords";

const queryClient = new QueryClient();

function AuthedRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/timer" component={Timer} />
        <Route path="/progress" component={Progress} />
        <Route path="/passwords" component={Passwords} />
        <Route path="/customize" component={Customize} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AuthGate() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated) return <LoginPage />;
  return (
    <TimerProvider>
      <AuthedRouter />
    </TimerProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
