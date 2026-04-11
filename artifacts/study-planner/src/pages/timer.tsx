import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, BookOpen, Target } from "lucide-react";
import { format } from "date-fns";

import {
  useListSubjects,
  useCreateSession,
  getListSessionsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetStreakQueryKey,
  getGetStatsBySubjectQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  { label: "Pomodoro", minutes: 25, icon: Target, sessionType: "pomodoro" as const, color: "hsl(var(--primary))" },
  { label: "Short Break", minutes: 5, icon: Coffee, sessionType: "regular" as const, color: "#10b981" },
  { label: "Long Break", minutes: 15, icon: Coffee, sessionType: "regular" as const, color: "#3b82f6" },
  { label: "Deep Focus", minutes: 50, icon: BookOpen, sessionType: "exam_prep" as const, color: "#f59e0b" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Timer() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [subjectId, setSubjectId] = useState<string>("");
  const [seconds, setSeconds] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subjects } = useListSubjects();
  const createSession = useCreateSession();

  const preset = PRESETS[presetIdx];
  const totalSeconds = preset.minutes * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsBySubjectQueryKey() });
  }

  function handleComplete() {
    setRunning(false);
    setCompletedCount((c) => c + 1);

    if (sessionStartTime && sessionDate) {
      createSession.mutate(
        {
          data: {
            date: sessionDate,
            startTime: sessionStartTime,
            endTime: format(new Date(), "HH:mm"),
            durationMinutes: preset.minutes,
            sessionType: preset.sessionType,
            subjectId: subjectId && subjectId !== "none" ? Number(subjectId) : null,
            notes: `${preset.label} session`,
          },
        },
        {
          onSuccess: () => {
            invalidate();
            toast({
              title: `${preset.label} complete!`,
              description: `${preset.minutes} minutes logged.`,
            });
          },
        }
      );
    }

    setSessionStartTime(null);
    setSessionDate(null);
    setSeconds(totalSeconds);
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, preset.minutes]);

  function handleStart() {
    if (!sessionStartTime) {
      setSessionStartTime(format(new Date(), "HH:mm"));
      setSessionDate(format(new Date(), "yyyy-MM-dd"));
    }
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  function handleReset() {
    setRunning(false);
    setSeconds(totalSeconds);
    setSessionStartTime(null);
    setSessionDate(null);
  }

  function handlePresetChange(idx: number) {
    setPresetIdx(idx);
    setRunning(false);
    setSeconds(PRESETS[idx].minutes * 60);
    setSessionStartTime(null);
    setSessionDate(null);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div className="space-y-6 max-w-xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Focus Timer</h1>
        <p className="text-muted-foreground mt-1">Stay focused and track your study sessions automatically.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {PRESETS.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => handlePresetChange(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                presetIdx === i
                  ? "text-white shadow-md"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-card"
              }`}
              style={presetIdx === i ? { backgroundColor: p.color, borderColor: p.color } : {}}
            >
              <Icon className="h-4 w-4" />
              {p.label}
              <span className="text-xs opacity-75">{p.minutes}m</span>
            </button>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="h-2" style={{ backgroundColor: preset.color }} />
          <CardContent className="p-8 flex flex-col items-center gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={preset.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="text-center">
                <div className="text-5xl font-bold font-mono tabular-nums">
                  {pad(mins)}:{pad(secs)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{preset.label}</div>
              </div>
            </div>

            <Progress value={progress} className="h-2 w-full" />

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={handleReset} disabled={!running && seconds === totalSeconds}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              {running ? (
                <Button size="lg" onClick={handlePause} className="px-10" style={{ backgroundColor: preset.color }}>
                  <Pause className="mr-2 h-5 w-5" /> Pause
                </Button>
              ) : (
                <Button size="lg" onClick={handleStart} className="px-10" style={{ backgroundColor: preset.color }}>
                  <Play className="mr-2 h-5 w-5" /> {seconds === totalSeconds ? "Start" : "Resume"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2">
        <Label>Subject (optional)</Label>
        <Select value={subjectId || "none"} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="No subject selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No subject</SelectItem>
            {subjects?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">The session will be logged under this subject when the timer completes.</p>
      </motion.div>

      {completedCount > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-primary">Sessions completed today</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex gap-2">
                {Array.from({ length: completedCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: preset.color }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
