import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Download,
  Upload,
  Link as LinkIcon,
  CalendarDays,
  Loader2,
} from "lucide-react";

import {
  useListSessions,
  useCreateSession,
  useDeleteSession,
  useListSubjects,
  useImportIcal,
  useImportIcalUrl,
  getListSessionsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetStreakQueryKey,
  getGetStatsBySubjectQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const SESSION_TYPES = ["regular", "pomodoro", "exam_prep"] as const;
type SessionType = (typeof SESSION_TYPES)[number];

const sessionTypeLabels: Record<SessionType, string> = {
  regular: "Regular",
  pomodoro: "Pomodoro",
  exam_prep: "Exam Prep",
};

type SessionForm = {
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
  sessionType: SessionType;
  notes: string;
};

const today = new Date();

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<null | "file" | "url">(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [importSubjectId, setImportSubjectId] = useState<string>("none");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<SessionForm>({
    subjectId: "",
    date: format(today, "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "",
    durationMinutes: "25",
    sessionType: "regular",
    notes: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions, isLoading } = useListSessions(undefined, {
    query: { queryKey: getListSessionsQueryKey() },
  });
  const { data: subjects } = useListSubjects();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const importIcal = useImportIcal();
  const importIcalUrl = useImportIcalUrl();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getSessionsForDay(date: Date) {
    if (!sessions) return [];
    return sessions
      .filter((s) => {
        try {
          return isSameDay(parseISO(s.date), date);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function dayTotalMinutes(date: Date): number {
    return getSessionsForDay(date).reduce(
      (sum, s) => sum + (s.durationMinutes ?? 0),
      0,
    );
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsBySubjectQueryKey() });
  }

  function handleSubmit() {
    const payload = {
      date: form.date,
      startTime: form.startTime,
      sessionType: form.sessionType,
      subjectId:
        form.subjectId && form.subjectId !== "none"
          ? Number(form.subjectId)
          : null,
      endTime: form.endTime || null,
      durationMinutes: form.durationMinutes
        ? Number(form.durationMinutes)
        : null,
      notes: form.notes || null,
    };
    createSession.mutate(
      { data: payload },
      {
        onSuccess: () => {
          invalidate();
          setDialogOpen(false);
          toast({ title: "Session added to your schedule" });
        },
      },
    );
  }

  function handleDelete(id: number) {
    deleteSession.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Session removed", variant: "destructive" });
        },
      },
    );
  }

  function describeResult(r: {
    imported: number;
    updated: number;
    skipped: number;
    total: number;
  }) {
    return `${r.imported} new · ${r.updated} updated${r.skipped ? ` · ${r.skipped} skipped` : ""}`;
  }

  function handleFilePicked(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const ics = String(reader.result || "");
      if (!ics) {
        toast({ title: "Empty file", variant: "destructive" });
        return;
      }
      const defaultSubjectId =
        importSubjectId && importSubjectId !== "none"
          ? Number(importSubjectId)
          : null;
      importIcal.mutate(
        { data: { ics, defaultSubjectId } },
        {
          onSuccess: (data) => {
            invalidate();
            setImportMode(null);
            toast({
              title: `Imported "${file.name}"`,
              description: describeResult(data),
            });
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { error?: string } } };
            toast({
              title: "Import failed",
              description: e?.response?.data?.error ?? "Invalid .ics file",
              variant: "destructive",
            });
          },
        },
      );
    };
    reader.readAsText(file);
  }

  function handleUrlImport() {
    if (!icalUrl.trim()) return;
    const defaultSubjectId =
      importSubjectId && importSubjectId !== "none"
        ? Number(importSubjectId)
        : null;
    importIcalUrl.mutate(
      { data: { url: icalUrl.trim(), defaultSubjectId } },
      {
        onSuccess: (data) => {
          invalidate();
          setImportMode(null);
          setIcalUrl("");
          toast({
            title: "Calendar synced",
            description: describeResult(data),
          });
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: string } } };
          toast({
            title: "Sync failed",
            description: e?.response?.data?.error ?? "Could not fetch the URL",
            variant: "destructive",
          });
        },
      },
    );
  }

  function handleExport() {
    window.location.href = "/api/sessions/export.ics";
  }

  function goToToday() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const importBusy = importIcal.isPending || importIcalUrl.isPending;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground mt-1">
            Plan and track your weekly study sessions. Import from any .ics file
            or calendar link.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-calendar-menu">
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Import</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  setImportSubjectId("none");
                  setImportMode("file");
                  setTimeout(() => fileInputRef.current?.click(), 50);
                }}
                data-testid="menu-import-file"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload .ics file
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setImportSubjectId("none");
                  setImportMode("url");
                }}
                data-testid="menu-import-url"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Import from URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={handleExport}
                data-testid="menu-export-ics"
              >
                <Download className="mr-2 h-4 w-4" />
                Download my schedule (.ics)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setDialogOpen(true)}
            data-testid="button-add-session"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Session
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between gap-2 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            data-testid="button-today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="font-medium text-sm">
          {format(weekStart, "MMM d")} –{" "}
          {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </span>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2"
        >
          {weekDays.map((day) => {
            const daySessions = getSessionsForDay(day);
            const isToday = isSameDay(day, new Date());
            const total = dayTotalMinutes(day);
            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg border p-2 min-h-32 flex flex-col gap-1 ${
                  isToday
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div
                    className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {format(day, "EEE")}
                    <span
                      className={`ml-1 ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  {total > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {total}m
                    </span>
                  )}
                </div>
                {daySessions.map((session) => {
                  const subject = subjects?.find(
                    (s) => s.id === session.subjectId,
                  );
                  return (
                    <div
                      key={session.id}
                      className="rounded p-1.5 text-xs group relative cursor-default"
                      style={{
                        backgroundColor: subject
                          ? `${subject.color}20`
                          : "hsl(var(--muted))",
                        borderLeft: `3px solid ${subject ? subject.color : "hsl(var(--primary))"}`,
                      }}
                      title={session.notes ?? undefined}
                    >
                      <div
                        className="font-medium truncate"
                        style={{
                          color: subject
                            ? subject.color
                            : "hsl(var(--foreground))",
                        }}
                      >
                        {subject?.name ??
                          session.notes ??
                          sessionTypeLabels[
                            session.sessionType as SessionType
                          ] ??
                          "Study"}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {session.startTime}
                        {session.endTime && ` – ${session.endTime}`}
                        {!session.endTime &&
                          session.durationMinutes &&
                          ` · ${session.durationMinutes}m`}
                      </div>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        aria-label="Delete session"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                {daySessions.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground/40 text-xs">
                    No sessions
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <h2 className="font-semibold text-lg mb-3">Session Types</h2>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((t) => (
            <Badge key={t} variant="outline" className="text-sm px-3 py-1">
              {sessionTypeLabels[t]}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Hidden file input used by the Calendar menu */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFilePicked(f);
          e.target.value = "";
        }}
        data-testid="input-ics-file"
      />

      {/* URL import dialog */}
      <Dialog
        open={importMode === "url"}
        onOpenChange={(open) => !open && setImportMode(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import from calendar URL</DialogTitle>
            <DialogDescription>
              Paste an iCalendar (.ics) link from Google Calendar, Apple
              Calendar, Outlook, Canvas, Notion, etc. Events for the next 90
              days will be imported. <code>webcal://</code> links are accepted
              too.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="ical-url">Calendar URL</Label>
              <Input
                id="ical-url"
                placeholder="https://calendar.example.com/feed.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                data-testid="input-ical-url"
              />
            </div>
            {subjects && subjects.length > 0 && (
              <div className="space-y-1">
                <Label>Assign to subject (optional)</Label>
                <Select
                  value={importSubjectId}
                  onValueChange={setImportSubjectId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tip: Re-importing the same URL updates existing events instead of
              duplicating them.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportMode(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUrlImport}
              disabled={importBusy || !icalUrl.trim()}
              data-testid="button-import-url-submit"
            >
              {importBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File-import secondary dialog: only shown after a file is picked if user wants to set a subject before sending.
          For simplicity we send straight from the file picker; the dialog below is only used if user opens "file" mode
          and we want to show a confirmation. We keep importMode==='file' short-lived. */}
      {importBusy && importMode === "file" && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card p-4 shadow">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Importing your calendar…</span>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Session type</Label>
                <Select
                  value={form.sessionType}
                  onValueChange={(v) =>
                    setForm({ ...form, sessionType: v as SessionType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {sessionTypeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {subjects && subjects.length > 0 && (
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select
                  value={form.subjectId || "none"}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What will you study?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createSession.isPending}>
              Add Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
