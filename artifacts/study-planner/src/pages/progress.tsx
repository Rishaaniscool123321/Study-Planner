import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle2, Flame, Award } from "lucide-react";

import {
  useGetStatsSummary,
  useGetStreak,
  useGetStatsBySubject,
} from "@workspace/api-client-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function minutesToHoursLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function Progress() {
  const { data: stats, isLoading: loadingStats } = useGetStatsSummary();
  const { data: streak, isLoading: loadingStreak } = useGetStreak();
  const { data: subjectStats, isLoading: loadingSubjects } = useGetStatsBySubject();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">A snapshot of your learning journey so far.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Completion Rate",
            icon: CheckCircle2,
            iconColor: "text-primary",
            value: loadingStats ? null : `${Math.round(stats?.completionRate ?? 0)}%`,
            sub: loadingStats ? null : `${stats?.completedTasks ?? 0} of ${stats?.totalTasks ?? 0} tasks`,
            progress: stats?.completionRate,
          },
          {
            title: "Total Study Time",
            icon: Clock,
            iconColor: "text-blue-500",
            value: loadingStats ? null : minutesToHoursLabel(stats?.totalStudyMinutes ?? 0),
            sub: loadingStats ? null : `${minutesToHoursLabel(stats?.weekStudyMinutes ?? 0)} this week`,
          },
          {
            title: "Current Streak",
            icon: Flame,
            iconColor: "text-orange-500",
            value: loadingStreak ? null : `${streak?.currentStreak ?? 0} days`,
            sub: loadingStreak ? null : `Longest: ${streak?.longestStreak ?? 0} days`,
          },
          {
            title: "Overdue Tasks",
            icon: TrendingUp,
            iconColor: "text-destructive",
            value: loadingStats ? null : String(stats?.overdueCount ?? 0),
            sub: loadingStats ? null : `${stats?.pendingTasks ?? 0} pending in total`,
          },
        ].map((card) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card>
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
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants}>
        <h2 className="font-semibold text-xl mb-4">Progress by Subject</h2>
        {loadingSubjects ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : subjectStats && subjectStats.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {subjectStats.map((s) => (
              <motion.div key={s.subjectId} variants={itemVariants}>
                <Card>
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
              </motion.div>
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

      {streak && (
        <motion.div variants={itemVariants}>
          <Card className={streak.studiedToday ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className={`h-5 w-5 ${streak.studiedToday ? "text-orange-500" : "text-muted-foreground"}`} />
                Study Streak
              </CardTitle>
              <CardDescription>
                {streak.studiedToday
                  ? "You've studied today — your streak is alive!"
                  : "Study today to keep your streak going."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-8">
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
                  <div className="text-lg font-medium">{streak.lastStudyDate}</div>
                  <div className="text-xs text-muted-foreground">Last study date</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
