import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

import { useListSubjects } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTimer } from "@/contexts/timer-context";

export default function Timer() {
  const {
    presets,
    presetIdx,
    preset,
    seconds,
    totalSeconds,
    progress,
    running,
    completedCount,
    subjectId,
    formatted,
    start,
    pause,
    reset,
    setPreset,
    setSubjectId,
  } = useTimer();

  const { data: subjects } = useListSubjects();

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
        <p className="text-muted-foreground mt-1">
          Stay focused — the timer keeps running across the whole app.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {presets.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => setPreset(i)}
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
                <div className="text-5xl font-bold font-mono tabular-nums">{formatted}</div>
                <div className="text-sm text-muted-foreground mt-1">{preset.label}</div>
              </div>
            </div>

            <Progress value={progress} className="h-2 w-full" />

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={reset} disabled={!running && seconds === totalSeconds}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              {running ? (
                <Button size="lg" onClick={pause} className="px-10" style={{ backgroundColor: preset.color }}>
                  <Pause className="mr-2 h-5 w-5" /> Pause
                </Button>
              ) : (
                <Button size="lg" onClick={start} className="px-10" style={{ backgroundColor: preset.color }}>
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
              <div className="flex gap-2 flex-wrap">
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
