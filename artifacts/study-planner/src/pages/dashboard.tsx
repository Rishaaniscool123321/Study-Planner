import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Clock, 
  Calendar,
  AlertCircle,
  MoreVertical,
  Plus
} from "lucide-react";
import { Link } from "wouter";

import { 
  useGetStatsSummary, 
  useGetStreak, 
  useListTasks, 
  useUpdateTask,
  getListTasksQueryKey,
  getGetStatsSummaryQueryKey
} from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@workspace/api-client-react";
import { SubjectBadge } from "@/components/subject-badge";

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetStatsSummary();
  const { data: streak, isLoading: isLoadingStreak } = useGetStreak();
  const { data: subjects } = useListSubjects();
  
  const { data: todayTasks, isLoading: isLoadingTasks } = useListTasks({ 
    completed: false 
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
        }
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your studies today.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/timer">
              <Clock className="mr-2 h-4 w-4" /> Start Timer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tasks">
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className={`h-4 w-4 ${streak?.studiedToday ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {isLoadingStreak ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{streak?.currentStreak || 0} days</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {streak?.studiedToday 
                      ? "You've studied today! Keep it up." 
                      : "Study today to keep your streak!"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Time Today</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{Math.floor((stats?.todayStudyMinutes || 0) / 60)}h {(stats?.todayStudyMinutes || 0) % 60}m</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Of {Math.floor((stats?.weekStudyMinutes || 0) / 60)}h {(stats?.weekStudyMinutes || 0) % 60}m this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckSquareIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pendingTasks || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.completedTasks || 0} completed overall
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{Math.round(stats?.completionRate || 0)}%</div>
                  <Progress value={stats?.completionRate || 0} className="h-2 mt-2" />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="col-span-4">
          <Card className="col-span-4 h-full">
            <CardHeader>
              <CardTitle>Up Next</CardTitle>
              <CardDescription>
                Your most pressing tasks for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : todayTasks && todayTasks.length > 0 ? (
                <div className="space-y-4">
                  {todayTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <button 
                        onClick={() => handleToggleTask(task)}
                        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      {task.subjectId && (
                        <SubjectBadge subject={subjects?.find(s => s.id === task.subjectId)} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p>All caught up!</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/tasks">View all tasks</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-span-3">
          <Card className="h-full bg-primary text-primary-foreground border-primary-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black/20 pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-primary-foreground">Quick Timer</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Start a focus session right now.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
              <div className="text-6xl font-bold mb-8 font-mono">25:00</div>
              <Button asChild size="lg" variant="secondary" className="w-full max-w-xs font-semibold">
                <Link href="/timer">
                  Launch Focus Mode
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CheckSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
