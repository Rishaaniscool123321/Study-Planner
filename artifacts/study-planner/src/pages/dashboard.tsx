import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Flame,
  Clock,
  Calendar,
  Plus,
  CheckSquare,
  TrendingUp,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Target,
  BarChart3,
  ListChecks,
  Sparkles,
  Settings2,
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import {
  useGetStatsSummary,
  useGetStreak,
  useListTasks,
  useUpdateTask,
  useListSessions,
  getListTasksQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@workspace/api-client-react";
import { SubjectBadge } from "@/components/subject-badge";
import { useTimer } from "@/contexts/timer-context";
import { useTheme } from "@/components/theme-provider";

// Isolate timer-driven re-renders to this widget so 1Hz timer ticks
// don't re-render the whole dashboard (Recharts, task list, etc.).
function QuickTimerWidget() {
  const timer = useTimer();
  return (
    <Card
      className="h-full text-primary-foreground border-primary-border overflow-hidden relative"
      style={{ background: timer.preset.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/30 pointer-events-none" />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-primary-foreground">Quick Timer</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {timer.running ? `${timer.preset.label} in progress` : `${timer.preset.label} ready`}
            </CardDescription>
          </div>
          {timer.running && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 backdrop-blur px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col items-center justify-center pt-2 pb-6">
        <div className="text-5xl md:text-6xl font-bold mb-2 font-mono tabular-nums">
          {timer.formatted}
        </div>
        <div className="w-full bg-white/20 rounded-full h-1.5 mb-5 overflow-hidden">
          <div
            className="h-full bg-white transition-all"
            style={{ width: `${timer.progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 w-full max-w-xs">
          <Button
            variant="secondary"
            size="icon"
            onClick={timer.reset}
            disabled={!timer.running && timer.seconds === timer.totalSeconds}
            className="bg-white/20 hover:bg-white/30 border-0 text-white"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {timer.running ? (
            <Button
              onClick={timer.pause}
              size="lg"
              variant="secondary"
              className="flex-1 font-semibold bg-white text-foreground hover:bg-white/90"
            >
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
          ) : (
            <Button
              onClick={timer.start}
              size="lg"
              variant="secondary"
              className="flex-1 font-semibold bg-white text-foreground hover:bg-white/90"
            >
              <Play className="mr-2 h-4 w-4" />
              {timer.seconds === timer.totalSeconds ? "Start" : "Resume"}
            </Button>
          )}
        </div>
        <Button
          asChild
          variant="link"
          size="sm"
          className="text-primary-foreground/80 hover:text-primary-foreground mt-3"
        >
          <Link href="/timer">
            Open full timer <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface ClickableStatProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  value: React.ReactNode;
  helper: React.ReactNode;
  extra?: React.ReactNode;
}

function ClickableStat({ href, title, icon, loading, value, helper, extra }: ClickableStatProps) {
  return (
    <Link href={href} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{helper}</p>
              {extra}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function minutesShort(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}m`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

export default function Dashboard() {
  const { dashboardWidgets, dailyGoalMinutes } = useTheme();
  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary();
  const { data: streak, isLoading: isLoadingStreak } = useGetStreak();
  const { data: subjects } = useListSubjects();
  const { data: allSessions, isLoading: isLoadingSessions } = useListSessions();

  const { data: todayTasks, isLoading: isLoadingTasks } = useListTasks({
    completed: false,
  });

  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleToggleTask = (task: any) => {
    updateTask.mutate(
      { id: task.id, data: { completed: !task.completed } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          toast({
            title: task.completed ? "Task uncompleted" : "Task completed",
            description: `"${task.title}" has been updated.`,
          });
        },
      },
    );
  };

  // Derived data: weekly chart (last 7 days)
  const weeklyData = useMemo(() => {
    const today = startOfDay(new Date());
    const out: Array<{ key: string; label: string; full: string; minutes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "yyyy-MM-dd");
      const minutes = (allSessions ?? [])
        .filter((s) => s.date === key)
        .reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
      out.push({ key, label: format(d, "EEE"), full: format(d, "EEE, MMM d"), minutes });
    }
    return out;
  }, [allSessions]);

  // Today's logged sessions
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaySessions = useMemo(
    () =>
      (allSessions ?? [])
        .filter((s) => s.date === todayStr)
        .sort((a, b) => (a.startTime > b.startTime ? 1 : -1)),
    [allSessions, todayStr]
  );

  // Goal progress
  const todayMins = stats?.todayStudyMinutes ?? 0;
  const goalPct = Math.min(100, Math.round((todayMins / dailyGoalMinutes) * 100));
  const goalMet = todayMins >= dailyGoalMinutes;

  // If user has hidden every widget, show a friendly message
  const anyVisible = Object.values(dashboardWidgets).some(Boolean);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your studies today.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/timer">
              <Clock className="mr-2 h-4 w-4" /> Open Timer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tasks">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Link>
          </Button>
        </div>
      </motion.div>

      {!anyVisible && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-10 gap-3">
            <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Your dashboard is empty.</p>
              <p className="text-sm text-muted-foreground">Turn widgets on in Customize → Dashboard widgets.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/customize">
                <Settings2 className="mr-2 h-4 w-4" /> Open Customize
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      {dashboardWidgets.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ClickableStat
            href="/progress"
            title="Study Streak"
            icon={<Flame className={`h-4 w-4 ${streak?.studiedToday ? "text-orange-500" : "text-muted-foreground"}`} />}
            loading={isLoadingStreak}
            value={`${streak?.currentStreak || 0} days`}
            helper={
              streak?.studiedToday
                ? "You've studied today! Keep it up."
                : "Study today to keep your streak!"
            }
          />
          <ClickableStat
            href="/progress"
            title="Study Time Today"
            icon={<Clock className="h-4 w-4 text-primary" />}
            loading={isLoadingStats}
            value={minutesShort(stats?.todayStudyMinutes || 0)}
            helper={`${minutesShort(stats?.weekStudyMinutes || 0)} this week`}
          />
          <ClickableStat
            href="/tasks"
            title="Pending Tasks"
            icon={<CheckSquare className="h-4 w-4 text-blue-500" />}
            loading={isLoadingStats}
            value={stats?.pendingTasks || 0}
            helper={`${stats?.completedTasks || 0} completed overall`}
          />
          <ClickableStat
            href="/progress"
            title="Completion Rate"
            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            loading={isLoadingStats}
            value={`${Math.round(stats?.completionRate || 0)}%`}
            helper="Tap to view full breakdown"
            extra={<Progress value={stats?.completionRate || 0} className="h-2 mt-2" />}
          />
        </div>
      )}

      {/* Goal + Weekly chart row */}
      {(dashboardWidgets.goal || dashboardWidgets.weekly) && (
        <div className={`grid gap-4 ${dashboardWidgets.goal && dashboardWidgets.weekly ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
          {dashboardWidgets.goal && (
            <Link href="/progress" className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <Card className={`h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer ${goalMet ? "border-green-300 dark:border-green-800" : "group-hover:border-primary/40"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${goalMet ? "text-green-600 dark:text-green-500" : "text-primary"}`} />
                      <CardTitle className="text-sm font-medium">Today's goal</CardTitle>
                    </div>
                    {goalMet && (
                      <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] py-0 h-5">
                        Done!
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between mb-2">
                        <div>
                          <span className="text-2xl font-bold">{minutesShort(todayMins)}</span>
                          <span className="text-sm text-muted-foreground"> / {minutesShort(dailyGoalMinutes)}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground">{goalPct}%</span>
                      </div>
                      <Progress value={goalPct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {goalMet
                          ? `Crushed it — +${minutesShort(Math.max(0, todayMins - dailyGoalMinutes))} over.`
                          : `${minutesShort(Math.max(0, dailyGoalMinutes - todayMins))} to go.`}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          )}

          {dashboardWidgets.weekly && (
            <Link href="/progress" className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md group-hover:-translate-y-0.5 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-medium">This week</CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {minutesShort(weeklyData.reduce((a, d) => a + d.minutes, 0))} total
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSessions ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div className="h-24 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted))" }}
                            contentStyle={{
                              background: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                              fontSize: 12,
                              color: "hsl(var(--popover-foreground))",
                            }}
                            formatter={(v: any) => [`${v} min`, "Studied"]}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                          />
                          <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Up Next + Timer row */}
      {(dashboardWidgets.upNext || dashboardWidgets.timer) && (
        <div className={`grid gap-4 ${dashboardWidgets.upNext && dashboardWidgets.timer ? "md:grid-cols-2 lg:grid-cols-7" : "md:grid-cols-1"}`}>
          {dashboardWidgets.upNext && (
            <div className={dashboardWidgets.upNext && dashboardWidgets.timer ? "lg:col-span-4" : ""}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Up Next</CardTitle>
                    <CardDescription>Your most pressing tasks for today.</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-xs">
                    <Link href="/tasks">
                      View all <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingTasks ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : todayTasks && todayTasks.length > 0 ? (
                    <div className="space-y-2">
                      {todayTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-stretch rounded-lg border bg-card hover:border-primary/30 transition-colors overflow-hidden group"
                        >
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="flex items-center justify-center px-3 text-muted-foreground hover:text-primary hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <Link
                            href="/tasks"
                            className="flex-1 flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium text-sm truncate ${
                                  task.completed ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.dueDate && (
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                                </div>
                              )}
                            </div>
                            {task.subjectId && (
                              <SubjectBadge subject={subjects?.find((s) => s.id === task.subjectId)} />
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href="/tasks"
                      className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground rounded-lg border border-dashed hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <CheckCircle2 className="h-8 w-8 mb-2 opacity-50" />
                      <p>All caught up!</p>
                      <span className="text-xs mt-1">Tap to plan more tasks</span>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {dashboardWidgets.timer && (
            <div className={dashboardWidgets.upNext && dashboardWidgets.timer ? "lg:col-span-3" : ""}>
              <QuickTimerWidget />
            </div>
          )}
        </div>
      )}

      {/* Today's Schedule */}
      {dashboardWidgets.schedule && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Today's sessions
              </CardTitle>
              <CardDescription>What you've logged so far today.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/timer">
                Log a session <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingSessions ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : todaySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-6">
                <Clock className="h-7 w-7 mb-2 opacity-40" />
                <p className="text-sm">No sessions yet today.</p>
                <p className="text-xs mt-1">Start the timer to log your first one.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {todaySessions.map((s) => {
                  const subj = subjects?.find((x) => x.id === s.subjectId);
                  return (
                    <li key={s.id} className="flex items-center justify-between py-2 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground tabular-nums w-24 flex-shrink-0">
                          {s.startTime} – {s.endTime}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">
                            {s.notes || (subj ? `${subj.name} session` : "Study session")}
                          </p>
                          {subj && <SubjectBadge subject={subj} />}
                        </div>
                      </div>
                      <span className="text-sm font-semibold flex-shrink-0">
                        {minutesShort(s.durationMinutes ?? 0)}
                      </span>
                    </li>
                  );
                })}
                <li className="flex items-center justify-between pt-3 mt-1 border-t">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Total today</span>
                  <span className="text-sm font-bold">
                    {minutesShort(todaySessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0))}
                  </span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
