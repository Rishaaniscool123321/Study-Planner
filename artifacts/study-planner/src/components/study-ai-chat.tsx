import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Sparkles, X, Trash2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useGetStatsSummary, useGetStreak, useListTasks } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { COLOR_THEMES } from "@/lib/themes";

type ChatRole = "user" | "assistant";
type ChatMsg = { role: ChatRole; content: string; actions?: AppliedAction[] };

type AppliedAction =
  | { type: "applyPreset"; preset: "default" | "focus" | "cozy" | "hacker" | "pastel" }
  | { type: "setColorTheme"; themeId: string }
  | { type: "setMode"; mode: "light" | "dark" | "system" }
  | { type: "setDailyGoal"; minutes: number }
  | { type: "setFont"; font: "inter" | "system" | "serif" | "mono" | "rounded" | "display" | "handwriting" }
  | { type: "setDensity"; density: "compact" | "comfortable" | "spacious" }
  | { type: "setRadius"; radius: number }
  | { type: "setSidebarPosition"; position: "left" | "right" }
  | { type: "toggleWidget"; widget: "stats" | "goal" | "weekly" | "schedule" | "upNext" | "timer"; enabled: boolean }
  | { type: "setTimerSound"; enabled: boolean }
  | { type: "setTimerNotifications"; enabled: boolean };

const HISTORY_KEY = "study-planner-ai-chat-history";

function isChatMsg(x: unknown): x is ChatMsg {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string" &&
    m.content.length > 0 &&
    m.content.length <= 8000 &&
    (m.actions === undefined || Array.isArray(m.actions))
  );
}

function loadHistory(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChatMsg).slice(-30);
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMsg[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-30)));
  } catch {}
}

function describeAction(a: AppliedAction): string {
  switch (a.type) {
    case "applyPreset": return `Applied ${a.preset} preset`;
    case "setColorTheme": return `Theme → ${a.themeId}`;
    case "setMode": return `Mode → ${a.mode}`;
    case "setDailyGoal": return `Daily goal → ${a.minutes} min`;
    case "setFont": return `Font → ${a.font}`;
    case "setDensity": return `Density → ${a.density}`;
    case "setRadius": return `Roundness → ${a.radius}`;
    case "setSidebarPosition": return `Sidebar → ${a.position}`;
    case "toggleWidget": return `${a.widget} widget ${a.enabled ? "shown" : "hidden"}`;
    case "setTimerSound": return `Timer sound ${a.enabled ? "on" : "off"}`;
    case "setTimerNotifications": return `Notifications ${a.enabled ? "on" : "off"}`;
  }
}

export function StudyAIChat() {
  const t = useTheme();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => loadHistory());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: stats } = useGetStatsSummary();
  const { data: streak } = useGetStreak();
  const { data: tasks } = useListTasks();

  const availableThemes = useMemo(() => COLOR_THEMES.map((c) => c.id), []);
  const pendingTasks = useMemo(() => (tasks ?? []).filter((tk: any) => !tk.completed).length, [tasks]);

  useEffect(() => {
    saveHistory(messages);
    // auto-scroll
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Close on Escape for accessibility
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ─── Apply actions returned by the AI ───────────────────────
  const applyAction = (a: AppliedAction): boolean => {
    try {
      switch (a.type) {
        case "applyPreset":
          t.applyPreset(a.preset);
          return true;
        case "setColorTheme":
          if (!availableThemes.includes(a.themeId)) return false;
          t.setColorTheme(a.themeId as any);
          return true;
        case "setMode":
          t.setTheme(a.mode);
          return true;
        case "setDailyGoal":
          t.setDailyGoalMinutes(a.minutes);
          return true;
        case "setFont":
          t.setFont(a.font as any);
          return true;
        case "setDensity":
          t.setDensity(a.density);
          return true;
        case "setRadius":
          t.setRadius(a.radius);
          return true;
        case "setSidebarPosition":
          t.setSidebarPosition(a.position);
          return true;
        case "toggleWidget":
          t.setDashboardWidget(a.widget as any, a.enabled);
          return true;
        case "setTimerSound":
          t.setTimerSoundEnabled(a.enabled);
          return true;
        case "setTimerNotifications":
          t.setTimerNotificationsEnabled(a.enabled);
          return true;
      }
    } catch {
      return false;
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setBusy(true);

    try {
      const payload = {
        messages: nextHistory.map(({ role, content }) => ({ role, content })),
        assistantName: t.aiAssistantName,
        context: {
          currentTheme: t.colorTheme,
          currentMode: t.theme,
          dailyGoalMinutes: t.dailyGoalMinutes,
          todayStudyMinutes: stats?.todayStudyMinutes ?? 0,
          currentStreak: (streak as any)?.currentStreak ?? 0,
          pendingTasks,
          availableThemes,
        },
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { text: string; actions: AppliedAction[] };

      const applied: AppliedAction[] = [];
      for (const a of data.actions ?? []) {
        if (applyAction(a)) applied.push(a);
      }

      const assistantMsg: ChatMsg = { role: "assistant", content: data.text, actions: applied };
      setMessages((prev) => [...prev, assistantMsg]);

      if (applied.length > 0) {
        toast({
          title: "Customisations applied",
          description: applied.map(describeAction).join(" · "),
        });
      }
    } catch (err: any) {
      toast({
        title: "Chat error",
        description: err?.message ?? "Could not reach the assistant.",
        variant: "destructive",
      });
      // remove the user message we optimistically added so they can retry
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    saveHistory([]);
  };

  if (!t.aiEnabled) return null;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover-elevate"
          aria-label={`Open ${t.aiAssistantName}`}
          data-testid="button-open-ai-chat"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 bg-background border border-border shadow-2xl flex flex-col",
            "bottom-0 right-0 left-0 h-[80vh] rounded-t-2xl",
            "sm:bottom-6 sm:right-6 sm:left-auto sm:h-[600px] sm:w-[400px] sm:rounded-2xl",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={`${t.aiAssistantName} chat`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate" data-testid="text-ai-name">{t.aiAssistantName}</div>
                <div className="text-xs text-muted-foreground">Study assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  aria-label="Clear chat history"
                  data-testid="button-clear-ai-chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                data-testid="button-close-ai-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 space-y-3">
                  <div className="flex justify-center">
                    <MessageCircle className="h-8 w-8 opacity-50" />
                  </div>
                  <p>Hi! I'm <span className="font-medium text-foreground">{t.aiAssistantName}</span>.</p>
                  <p>Ask me about study techniques, or tell me to customise the app.</p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {[
                      "Make it cozy",
                      "Plan a 2-hour session",
                      "Set my goal to 90 min",
                      "Tips to focus better",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover-elevate"
                        data-testid={`button-ai-suggestion-${s.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words",
                    m.role === "user"
                      ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                      : "self-start bg-muted rounded-bl-sm",
                  )}
                  data-testid={`ai-message-${m.role}-${i}`}
                >
                  {m.content}
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.actions.map((a, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] gap-1"
                          data-testid={`ai-applied-action-${idx}`}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {describeAction(a)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="self-start bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Message ${t.aiAssistantName}…`}
                rows={1}
                className="resize-none min-h-[40px] max-h-32"
                disabled={busy}
                data-testid="input-ai-message"
              />
              <Button
                size="icon"
                onClick={send}
                disabled={busy || !input.trim()}
                aria-label="Send message"
                data-testid="button-send-ai-message"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              Try: "switch to dark mode" · "use the forest theme" · "give me focus tips"
            </p>
          </div>
        </div>
      )}
    </>
  );
}
