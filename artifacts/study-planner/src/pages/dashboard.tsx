import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
} from "lucide-react";
import { Link } from "wouter";

import {
  useGetStatsSummary,
  useGetStreak,
  useListTasks,
  useUpdateTask,
  getListTasksQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@workspace/api-client-react";
import { SubjectBadge } from "@/components/subject-badge";
import { useTimer } from "@/contexts/timer-context";

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

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary();
  const { data: streak, isLoading: isLoadingStreak } = useGetStreak();
  const { data: subjects } = useListSubjects();

  const { data: todayTasks, isLoading: isLoadingTasks } = useListTasks({
    completed: false,
  });

  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const timer = useTimer();

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

  return (
    <div className="space-y-8">
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

      {/* Clickable stat cards */}
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
          value={`${Math.floor((stats?.todayStudyMinutes || 0) / 60)}h ${(stats?.todayStudyMinutes || 0) % 60}m`}
          helper={`Of ${Math.floor((stats?.weekStudyMinutes || 0) / 60)}h ${(stats?.weekStudyMinutes || 0) % 60}m this week`}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Up Next */}
        <div className="col-span-4">
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

        {/* Live Timer card — synced with global timer */}
        <div className="col-span-3">
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
        </div>
      </div>
    </div>
  );
}
