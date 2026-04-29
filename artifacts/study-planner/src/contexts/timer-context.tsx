import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Coffee, BookOpen, Target, type LucideIcon } from "lucide-react";

import {
  useCreateSession,
  getListSessionsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetStreakQueryKey,
  getGetStatsBySubjectQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export interface TimerPreset {
  label: string;
  minutes: number;
  icon: LucideIcon;
  sessionType: "pomodoro" | "regular" | "exam_prep";
  color: string;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { label: "Pomodoro", minutes: 25, icon: Target, sessionType: "pomodoro", color: "hsl(var(--primary))" },
  { label: "Short Break", minutes: 5, icon: Coffee, sessionType: "regular", color: "#10b981" },
  { label: "Long Break", minutes: 15, icon: Coffee, sessionType: "regular", color: "#3b82f6" },
  { label: "Deep Focus", minutes: 50, icon: BookOpen, sessionType: "exam_prep", color: "#f59e0b" },
];

interface TimerContextValue {
  presets: TimerPreset[];
  presetIdx: number;
  preset: TimerPreset;
  totalSeconds: number;
  seconds: number;
  running: boolean;
  progress: number;
  subjectId: string;
  completedCount: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setPreset: (idx: number) => void;
  setSubjectId: (id: string) => void;
  formatted: string;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [presetIdx, setPresetIdx] = useState(0);
  const [subjectId, setSubjectIdState] = useState("");
  const [seconds, setSeconds] = useState(TIMER_PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const sessionStartTimeRef = useRef<string | null>(null);
  const sessionDateRef = useRef<string | null>(null);
  const sessionPresetRef = useRef<TimerPreset | null>(null);
  const sessionSubjectIdRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createSession = useCreateSession();

  const preset = TIMER_PRESETS[presetIdx];
  const totalSeconds = preset.minutes * 60;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsBySubjectQueryKey() });
  }, [queryClient]);

  const handleComplete = useCallback(() => {
    setRunning(false);
    setCompletedCount((c) => c + 1);

    const startTime = sessionStartTimeRef.current;
    const date = sessionDateRef.current;
    const startedPreset = sessionPresetRef.current;
    const startedSubject = sessionSubjectIdRef.current;
    if (startTime && date && startedPreset) {
      createSession.mutate(
        {
          data: {
            date,
            startTime,
            endTime: format(new Date(), "HH:mm"),
            durationMinutes: startedPreset.minutes,
            sessionType: startedPreset.sessionType,
            subjectId:
              startedSubject && startedSubject !== "none" ? Number(startedSubject) : null,
            notes: `${startedPreset.label} session`,
          },
        },
        {
          onSuccess: () => {
            invalidate();
            toast({
              title: `${startedPreset.label} complete!`,
              description: `${startedPreset.minutes} minutes logged.`,
            });
          },
        },
      );
    }
    sessionStartTimeRef.current = null;
    sessionDateRef.current = null;
    sessionPresetRef.current = null;
    sessionSubjectIdRef.current = "";
    setSeconds(totalSeconds);
  }, [createSession, invalidate, toast, totalSeconds]);

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
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, handleComplete]);

  const start = useCallback(() => {
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = format(new Date(), "HH:mm");
      sessionDateRef.current = format(new Date(), "yyyy-MM-dd");
      sessionPresetRef.current = preset;
      sessionSubjectIdRef.current = subjectId;
    }
    setRunning(true);
  }, [preset, subjectId]);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(totalSeconds);
    sessionStartTimeRef.current = null;
    sessionDateRef.current = null;
  }, [totalSeconds]);

  const setPreset = useCallback((idx: number) => {
    setPresetIdx(idx);
    setRunning(false);
    setSeconds(TIMER_PRESETS[idx].minutes * 60);
    sessionStartTimeRef.current = null;
    sessionDateRef.current = null;
  }, []);

  const setSubjectId = useCallback((id: string) => setSubjectIdState(id), []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${pad(mins)}:${pad(secs)}`;

  const value: TimerContextValue = {
    presets: TIMER_PRESETS,
    presetIdx,
    preset,
    totalSeconds,
    seconds,
    running,
    progress,
    subjectId,
    completedCount,
    start,
    pause,
    reset,
    setPreset,
    setSubjectId,
    formatted,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
