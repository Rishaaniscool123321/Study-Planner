import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Clock, CheckCircle2, Flame, Award, Target, BarChart3, CalendarDays,
} from "lucide-react";
import { format, subDays, startOfDay, parseISO, isSameDay } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
} from "recharts";

import {
  useGetStatsSummary,
  useGetStreak,
  useGetStatsBySubject,
  useListSessions,
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";

function minutesToHoursLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Build last N days of {date, dateLabel, minutes}
function buildDailyMinutes(sessions: { date: string; durationMinutes?: number | null }[] | undefined, days: number) {
  const today = startOfDay(new Date());
  const out: Array<{ key: string; label: string; full: string; minutes: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    const full = format(d, "EEE, MMM d");
    const minutes = (sessions ?? [])
      .filter((s) => s.date === key)
      .reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
    out.push({ key, label, full, minutes });
  }
  return out;
}

// Build a 12 week × 7 day heatmap (84 cells) ending today.
// We render a rolling window so today is the last cell — rows therefore
// represent "N days ago" buckets, not fixed Mon–Sun weekday rows.
function buildHeatmap(sessions: { date: string; durationMinutes?: number | null }[] | undefined, weeks: number) {
  const today = startOfDay(new Date());
  const totalDays = weeks * 7;
  const start = subDays(today, totalDays - 1);
  const days: Array<{ date: Date; key: string; minutes: number }> = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = format(d, "yyyy-MM-dd");
    const minutes = (sessions ?? [])
      .filter((s) => s.date === key)
      .reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
    days.push({ date: d, key, minutes });
  }
  // Group into weeks (columns), each with 7 rows
  const cols: typeof days[] = [];
  for (let c = 0; c < weeks; c++) {
    cols.push(days.slice(c * 7, c * 7 + 7));
  }
  return cols;
}

function heatColor(minutes: number, goal: number): string {
  if (minutes === 0) return "hsl(var(--muted))";
  const ratio = Math.min(1, minutes / Math.max(goal, 1));
  // 4 levels for nicer steps
  if (ratio < 0.25) return "hsl(var(--primary) / 0.25)";
  if (ratio < 0.5)  return "hsl(var(--primary) / 0.5)";
  if (ratio < 1)    return "hsl(var(--primary) / 0.75)";
  return "hsl(var(--primary))";
}

export default function Progress() {
  const { dailyGoalMinutes } = useTheme();
  const { data: stats, isLoading: loadingStats } = useGetStatsSummary();
  const { data: streak, isLoading: loadingStreak } = useGetStreak();
  const { data: subjectStats, isLoading: loadingSubjects } = useGetStatsBySubject();
  const { data: sessions, isLoading: loadingSessions } = useListSessions();

  const dailyMinutes14 = useMemo(() => buildDailyMinutes(sessions, 14), [sessions]);
  const heatmap = useMemo(() => buildHeatmap(sessions, 12), [sessions]);

  const todayMinutes = stats?.todayStudyMinutes ?? 0;
  const goalPct = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));
  const goalMet = todayMinutes >= dailyGoalMinutes;

  const totalHeatMins = useMemo(
    () => heatmap.flat().reduce((acc, d) => acc + d.minutes, 0),
    [heatmap]
  );
  const studyDays12wk = useMemo(
    () => heatmap.flat().filter((d) => d.minutes > 0).length,
    [heatmap]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track your study habits over time. Set your daily goal in Customize → Daily study goal.
        </p>
      </motion.div>

      {/* TODAY'S GOAL */}
      <motion.div variants={itemVariants}>
        <Card className={goalMet ? "border-green-300 dark:border-green-800" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target className={`h-5 w-5 ${goalMet ? "text-green-600 dark:text-green-500" : "text-primary"}`} />
                <CardTitle className="text-base">Today's study goal</CardTitle>
              </div>
              {goalMet && (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">
                  <CheckCircle2 size={12} className="mr-1" /> Goal complete!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingStats ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">
                    {minutesToHoursLabel(todayMinutes)}
                    <span className="text-base font-normal text-muted-foreground"> / {minutesToHoursLabel(dailyGoalMinutes)}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">{goalPct}%</span>
                </div>
                <ProgressBar value={goalPct} className="h-2.5" />
                <p className="text-xs text-muted-foreground">
                  {goalMet
                    ? `You're +${minutesToHoursLabel(Math.max(0, todayMinutes - dailyGoalMinutes))} over your goal. Nice work!`
                    : `${minutesToHoursLabel(Math.max(0, dailyGoalMinutes - todayMinutes))} to go.`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* SUMMARY CARDS */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Completion rate",
            icon: CheckCircle2,
            iconColor: "text-primary",
            value: loadingStats ? null : `${Math.round(stats?.completionRate ?? 0)}%`,
            sub: loadingStats ? null : `${stats?.completedTasks ?? 0} of ${stats?.totalTasks ?? 0} tasks`,
            progress: stats?.completionRate,
          },
          {
            title: "Total study time",
            icon: Clock,
            iconColor: "text-blue-500",
            value: loadingStats ? null : minutesToHoursLabel(stats?.totalStudyMinutes ?? 0),
            sub: loadingStats ? null : `${minutesToHoursLabel(stats?.weekStudyMinutes ?? 0)} this week`,
          },
          {
            title: "Current streak",
            icon: Flame,
            iconColor: "text-orange-500",
            value: loadingStreak ? null : `${streak?.currentStreak ?? 0} days`,
            sub: loadingStreak ? null : `Longest: ${streak?.longestStreak ?? 0} days`,
          },
          {
            title: "Overdue tasks",
            icon: TrendingUp,
            iconColor: "text-destructive",
            value: loadingStats ? null : String(stats?.overdueCount ?? 0),
            sub: loadingStats ? null : `${stats?.pendingTasks ?? 0} pending in total`,
          },
        ].map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              {card.value == null ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  {card.progress != null && (
                    <ProgressBar value={card.progress} className="h-1.5 mt-2" />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* 14-DAY BAR CHART */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={18} className="text-primary" /> Last 14 days
                </CardTitle>
                <CardDescription>Minutes studied per day</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {minutesToHoursLabel(dailyMinutes14.reduce((a, d) => a + d.minutes, 0))}
                </div>
                <div className="text-xs text-muted-foreground">total over 14 days</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyMinutes14} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      tickFormatter={(v) => `${v}m`}
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
                      formatter={(value: any) => [`${value} min`, "Studied"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                    />
                    <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* HEATMAP */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays size={18} className="text-primary" /> Study heatmap
                </CardTitle>
                <CardDescription>Last 12 weeks · darker = more minutes vs your goal</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><b className="text-foreground">{studyDays12wk}</b> active days</span>
                <span><b className="text-foreground">{minutesToHoursLabel(totalHeatMins)}</b> total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {/* Day labels column */}
                  <div className="flex flex-col gap-1 pr-1 text-[10px] text-muted-foreground justify-around">
                    <div className="h-3"></div>
                    <div className="h-3">Mon</div>
                    <div className="h-3"></div>
                    <div className="h-3">Wed</div>
                    <div className="h-3"></div>
                    <div className="h-3">Fri</div>
                    <div className="h-3"></div>
                  </div>
                  {heatmap.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((d) => {
                        const isToday = isSameDay(d.date, new Date());
                        return (
                          <div
                            key={d.key}
                            title={`${format(d.date, "EEE, MMM d")} — ${d.minutes} min`}
                            className={`w-3 h-3 rounded-[3px] ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                            style={{ background: heatColor(d.minutes, dailyGoalMinutes) }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                  <span>Less</span>
                  {[0, 0.2, 0.4, 0.7, 1].map((r, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-[3px]"
                      style={{ background: heatColor(r * dailyGoalMinutes, dailyGoalMinutes) }}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* STREAK */}
      {streak && (
        <motion.div variants={itemVariants}>
          <Card className={streak.studiedToday ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className={`h-5 w-5 ${streak.studiedToday ? "text-orange-500" : "text-muted-foreground"}`} />
                Study streak
              </CardTitle>
              <CardDescription>
                {streak.studiedToday
                  ? "You've studied today — your streak is alive!"
                  : "Study today to keep your streak going."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-8 flex-wrap">
              <div>
                <div className="text-3xl font-bold text-orange-500">{streak.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Current streak (days)</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{streak.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest streak (days)</div>
              </div>
              {streak.lastStudyDate && (
                <div>
                  <div className="text-lg font-medium">
                    {(() => {
                      try { return format(parseISO(streak.lastStudyDate), "EEE, MMM d"); }
                      catch { return streak.lastStudyDate; }
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">Last study date</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PER SUBJECT */}
      <motion.div variants={itemVariants}>
        <h2 className="font-semibold text-xl mb-4">Progress by subject</h2>
        {loadingSubjects ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : subjectStats && subjectStats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {subjectStats.map((s) => (
              <Card key={s.subjectId}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: s.subjectColor }}
                      />
                      <span className="font-medium">{s.subjectName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${s.subjectColor}15`,
                        borderColor: `${s.subjectColor}40`,
                        color: s.subjectColor,
                      }}
                    >
                      {Math.round(s.completionRate)}%
                    </Badge>
                  </div>

                  <ProgressBar
                    value={s.completionRate}
                    className="h-2"
                    style={{ "--progress-color": s.subjectColor } as any}
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {s.completedTasks}/{s.totalTasks} tasks done
                    </span>
                    <span>{minutesToHoursLabel(s.totalStudyMinutes)} studied</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Award className="h-10 w-10 mb-2 opacity-20" />
              <p>No subject data yet.</p>
              <p className="text-sm mt-1">Add subjects and tasks to track progress.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
