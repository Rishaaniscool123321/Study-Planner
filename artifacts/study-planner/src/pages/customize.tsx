import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Check, Sun, Moon, Monitor, Sparkles, Trash2, Save, Palette as PaletteIcon,
  RotateCcw, Type, MoveHorizontal, Bell, Volume2, Target, LayoutGrid,
  Zap, Coffee, Terminal, Heart, Star,
} from "lucide-react";
import {
  useTheme,
  DASHBOARD_WIDGET_LABELS,
  type DashboardWidgetId,
  type PresetId,
} from "@/components/theme-provider";
import {
  COLOR_THEMES, CATEGORY_LABELS, hexToHSL, hslToHex,
  type ColorTheme, type CustomTheme, type ThemeCategory,
} from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

const PRESETS: Array<{
  id: PresetId; label: string; description: string;
  icon: typeof Zap; gradient: string;
}> = [
  { id: "default", label: "Default",  description: "Clean indigo, comfortable spacing", icon: Star,     gradient: "from-indigo-500 to-blue-500" },
  { id: "focus",   label: "Focus",    description: "Dark, compact, no animations",      icon: Zap,      gradient: "from-slate-700 to-slate-900" },
  { id: "cozy",    label: "Cozy",     description: "Warm coffee tones, serif, roomy",   icon: Coffee,   gradient: "from-amber-600 to-orange-700" },
  { id: "hacker",  label: "Hacker",   description: "Green-on-black terminal vibes",     icon: Terminal, gradient: "from-green-700 to-emerald-900" },
  { id: "pastel",  label: "Pastel",   description: "Soft pinks, rounded, dreamy",       icon: Heart,    gradient: "from-pink-400 to-rose-400" },
];

type ThemeFilter = "all" | "light" | "dark";

function isDarkPreview(t: ColorTheme): boolean {
  // Naive luminance check on the bg hex
  const hex = t.preview.bg.replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

export default function Customize() {
  const {
    theme, setTheme,
    colorTheme, setColorTheme,
    customThemes, saveCustomTheme, deleteCustomTheme,
    font, setFont,
    fontScale, setFontScale,
    radius, setRadius,
    density, setDensity,
    sidebarPosition, setSidebarPosition,
    sidebarSize, setSidebarSize,
    reduceMotion, setReduceMotion,
    dailyGoalMinutes, setDailyGoalMinutes,
    dashboardWidgets, setDashboardWidget,
    timerSoundEnabled, setTimerSoundEnabled,
    timerNotificationsEnabled, setTimerNotificationsEnabled,
    applyPreset,
    resetCustomization,
  } = useTheme();

  const { toast } = useToast();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomTheme | null>(null);
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [activeCategory, setActiveCategory] = useState<ThemeCategory | "all">("all");

  // Notification permission status (for help text)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, [timerNotificationsEnabled]);

  const allCategories = useMemo(() => {
    const set = new Set<ThemeCategory>();
    COLOR_THEMES.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, []);

  const filteredThemes = useMemo(() => {
    return COLOR_THEMES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (themeFilter === "all") return true;
      const dark = isDarkPreview(t);
      return themeFilter === "dark" ? dark : !dark;
    });
  }, [themeFilter, activeCategory]);

  // user custom themes shown as their own group
  const customAsList: ColorTheme[] = customThemes.map((c) => ({
    id: c.id,
    name: c.name,
    description: "Your custom theme",
    preview: c.preview,
    category: "custom",
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PaletteIcon className="text-primary" size={28} /> Customize
          </h1>
          <p className="text-muted-foreground">
            Pick a vibe in one click, or fine-tune anything below.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          if (confirm("Reset all customization to defaults?")) {
            resetCustomization();
            toast({ title: "Reset to defaults" });
          }
        }}>
          <RotateCcw size={14} className="mr-1.5" /> Reset all
        </Button>
      </div>

      {/* ─── 1. QUICK PRESETS ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h2 className="font-semibold text-lg">Quick presets</h2>
          <span className="text-xs text-muted-foreground">— one-click looks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  applyPreset(p.id);
                  toast({ title: `${p.label} applied`, description: p.description });
                }}
                className="group text-left rounded-xl border-2 border-border hover:border-primary/60 transition-all overflow-hidden bg-card hover:shadow-md"
              >
                <div className={`h-16 bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                  <Icon size={24} className="text-white/95" />
                </div>
                <div className="p-2.5">
                  <div className="font-semibold text-sm">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{p.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── 2. EVERYTHING ELSE — ACCORDION ───────────────── */}
      <Accordion type="multiple" defaultValue={["appearance", "goals"]} className="space-y-3">
        {/* APPEARANCE */}
        <AccordionItem value="appearance" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <PaletteIcon size={16} className="text-primary" />
              <span className="font-semibold">Appearance</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Light/dark, color theme
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pt-2">
            {/* Mode */}
            <div>
              <Label className="text-sm mb-2 block">Mode</Label>
              <div className="flex gap-2 flex-wrap">
                {(["light", "dark", "system"] as const).map((m) => {
                  const Icon = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
                  return (
                    <Button
                      key={m}
                      variant={theme === m ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(m)}
                    >
                      <Icon size={14} className="mr-1.5" /> {m[0].toUpperCase() + m.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Filter chips */}
            <div className="space-y-2">
              <Label className="text-sm">Color theme</Label>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "light", "dark"] as ThemeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setThemeFilter(f)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      themeFilter === f
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {f === "all" ? "All" : f === "light" ? "Light" : "Dark"}
                  </button>
                ))}
                <span className="mx-1 text-muted-foreground text-xs self-center">·</span>
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    activeCategory === "all"
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  All categories
                </button>
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      activeCategory === cat
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom themes (if any) */}
            {customAsList.length > 0 && (
              <ThemeGroup
                title="Your custom themes"
                themes={customAsList}
                activeId={colorTheme}
                onPick={setColorTheme}
                onEdit={(id) => {
                  const c = customThemes.find((t) => t.id === id);
                  if (c) { setEditingCustom(c); setCreatorOpen(true); }
                }}
                onDelete={(id) => deleteCustomTheme(id)}
              />
            )}

            {/* Themes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredThemes.map((t) => (
                <ThemeSwatch
                  key={t.id}
                  t={t}
                  active={colorTheme === t.id}
                  onPick={() => setColorTheme(t.id)}
                />
              ))}
              {filteredThemes.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-6">
                  No themes match these filters.
                </p>
              )}
            </div>

            {/* Build your own */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={() => { setEditingCustom(null); setCreatorOpen(true); }}
              >
                <Sparkles size={14} className="mr-1.5" /> Build your own theme
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                Start from a few colors, we'll auto-fill the rest.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LOOK & FEEL */}
        <AccordionItem value="lookfeel" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Type size={16} className="text-primary" />
              <span className="font-semibold">Look &amp; feel</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Font, size, corners, density
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pt-2">
            {/* Font family */}
            <div>
              <Label className="text-sm mb-2 block">Font family</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { id: "inter", label: "Inter", style: "font-sans" },
                  { id: "system", label: "System", style: "" },
                  { id: "serif", label: "Serif", style: "font-serif" },
                  { id: "mono", label: "Mono", style: "font-mono" },
                  { id: "rounded", label: "Rounded", style: "" },
                  { id: "display", label: "Display", style: "" },
                  { id: "handwriting", label: "Handwriting", style: "" },
                ] as Array<{ id: typeof font; label: string; style: string }>).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border-2 transition-colors text-left ${
                      font === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="text-sm font-medium">{f.label}</span>
                    <span className={`text-lg ${f.style}`}>Aa</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text size */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-sm">
                <span>Text size</span>
                <span className="text-muted-foreground text-xs">{Math.round(fontScale * 100)}%</span>
              </Label>
              <Slider
                min={0.85} max={1.3} step={0.05}
                value={[fontScale]}
                onValueChange={([v]) => setFontScale(v)}
              />
            </div>

            {/* Corner radius */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-sm">
                <span>Corner roundness</span>
                <span className="text-muted-foreground text-xs">{radius.toFixed(2)}rem</span>
              </Label>
              <Slider min={0} max={1.5} step={0.05} value={[radius]} onValueChange={([v]) => setRadius(v)} />
              <div className="flex gap-1.5 flex-wrap mt-1">
                {[
                  { v: 0, label: "Square" },
                  { v: 0.25, label: "Subtle" },
                  { v: 0.5, label: "Soft" },
                  { v: 0.75, label: "Round" },
                  { v: 1.25, label: "Pill" },
                ].map((p) => (
                  <Button key={p.v} variant="outline" size="sm" onClick={() => setRadius(p.v)}>{p.label}</Button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="space-y-1.5">
              <Label className="text-sm">Spacing</Label>
              <Select value={density} onValueChange={(v) => setDensity(v as any)}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact — tight, fits more</SelectItem>
                  <SelectItem value="comfortable">Comfortable — balanced</SelectItem>
                  <SelectItem value="spacious">Spacious — roomy and airy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reduce motion */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label className="text-sm">Reduce motion</Label>
                <p className="text-xs text-muted-foreground">Disable animations and transitions.</p>
              </div>
              <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LAYOUT */}
        <AccordionItem value="layout" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MoveHorizontal size={16} className="text-primary" />
              <span className="font-semibold">Layout</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Sidebar position and size
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pt-2">
            <div>
              <Label className="text-sm mb-2 block">Sidebar position</Label>
              <div className="flex gap-2">
                <Button variant={sidebarPosition === "left" ? "default" : "outline"} size="sm" onClick={() => setSidebarPosition("left")}>Left</Button>
                <Button variant={sidebarPosition === "right" ? "default" : "outline"} size="sm" onClick={() => setSidebarPosition("right")}>Right</Button>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Sidebar size</Label>
              <Select value={sidebarSize} onValueChange={(v) => setSidebarSize(v as any)}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="icons">Icons only</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* GOALS */}
        <AccordionItem value="goals" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="font-semibold">Daily study goal</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                {dailyGoalMinutes} minutes / day
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-sm">
                <span>How many minutes do you want to study each day?</span>
                <span className="text-primary font-semibold">{dailyGoalMinutes} min</span>
              </Label>
              <Slider
                min={15} max={240} step={5}
                value={[dailyGoalMinutes]}
                onValueChange={([v]) => setDailyGoalMinutes(v)}
              />
              <div className="flex gap-1.5 flex-wrap">
                {[30, 60, 90, 120, 180].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => setDailyGoalMinutes(v)}>
                    {v} min
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your progress toward this goal shows on your Dashboard and Progress pages.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* DASHBOARD WIDGETS */}
        <AccordionItem value="widgets" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} className="text-primary" />
              <span className="font-semibold">Dashboard widgets</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Choose what shows on the home page
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-1 pt-2">
            {(Object.keys(DASHBOARD_WIDGET_LABELS) as DashboardWidgetId[]).map((id) => (
              <div key={id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{DASHBOARD_WIDGET_LABELS[id]}</span>
                <Switch
                  checked={!!dashboardWidgets[id]}
                  onCheckedChange={(v) => setDashboardWidget(id, v)}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* TIMER NOTIFICATIONS */}
        <AccordionItem value="notifications" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <span className="font-semibold">Timer notifications</span>
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Sound and browser pop-ups
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-start gap-2">
                <Volume2 size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-sm">Play a chime when timer ends</Label>
                  <p className="text-xs text-muted-foreground">A short three-tone bell.</p>
                </div>
              </div>
              <Switch checked={timerSoundEnabled} onCheckedChange={setTimerSoundEnabled} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-start gap-2">
                <Bell size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <Label className="text-sm">Show a browser notification</Label>
                  <p className="text-xs text-muted-foreground">
                    {notifPermission === "granted" && "Granted — you'll get a pop-up when timer ends."}
                    {notifPermission === "denied" && "Blocked. Enable notifications for this site in your browser settings."}
                    {notifPermission === "default" && "We'll ask you for permission when you start the timer."}
                    {notifPermission === "unsupported" && "Your browser does not support notifications."}
                  </p>
                </div>
              </div>
              <Switch checked={timerNotificationsEnabled} onCheckedChange={setTimerNotificationsEnabled} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ThemeCreatorDialog
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        editing={editingCustom}
        onSave={(t) => {
          saveCustomTheme(t);
          setColorTheme(t.id);
          setCreatorOpen(false);
          toast({ title: editingCustom ? "Theme updated" : "Theme saved", description: t.name });
        }}
      />
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
function ThemeSwatch({
  t, active, onPick,
  onEdit, onDelete,
}: {
  t: ColorTheme;
  active: boolean;
  onPick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={`group relative text-left rounded-lg border-2 overflow-hidden transition-all hover:scale-[1.02] ${
        active ? "border-primary shadow-md" : "border-border hover:border-primary/40"
      }`}
      title={t.description}
    >
      <div
        className="h-14 flex items-center justify-center"
        style={{ background: t.preview.bg, color: t.preview.text }}
      >
        <div
          className="px-2.5 py-1 rounded text-xs font-bold"
          style={{ background: t.preview.primary, color: "#fff" }}
        >
          Aa
        </div>
      </div>
      <div className="px-2.5 py-1.5 bg-card flex items-center justify-between text-xs">
        <span className="font-semibold truncate">{t.name}</span>
        {active && <Check size={12} className="text-primary flex-shrink-0" />}
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}
              className="p-1 bg-background/90 backdrop-blur rounded text-foreground hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title={`Edit ${t.name}`}
              aria-label={`Edit ${t.name} theme`}
            >
              <Save size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (confirm("Delete this theme?")) onDelete(); }}
              className="p-1 bg-background/90 backdrop-blur rounded text-destructive hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              title={`Delete ${t.name}`}
              aria-label={`Delete ${t.name} theme`}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </button>
  );
}

function ThemeGroup({
  title, themes, activeId, onPick, onEdit, onDelete,
}: {
  title: string;
  themes: ColorTheme[];
  activeId: string;
  onPick: (id: any) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {themes.map((t) => (
          <ThemeSwatch
            key={t.id}
            t={t}
            active={activeId === t.id}
            onPick={() => onPick(t.id)}
            onEdit={onEdit ? () => onEdit(t.id) : undefined}
            onDelete={onDelete ? () => onDelete(t.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
const DEFAULT_NEW: CustomTheme = {
  id: "custom-new",
  name: "My Theme",
  background: hexToHSL("#0f172a"),
  foreground: hexToHSL("#f1f5f9"),
  primary: hexToHSL("#6366f1"),
  primaryForeground: hexToHSL("#ffffff"),
  accent: hexToHSL("#f59e0b"),
  accentForeground: hexToHSL("#000000"),
  destructive: hexToHSL("#ef4444"),
  card: hexToHSL("#1e293b"),
  border: hexToHSL("#334155"),
  muted: hexToHSL("#1e293b"),
  mutedForeground: hexToHSL("#94a3b8"),
  preview: { bg: "#0f172a", primary: "#6366f1", text: "#f1f5f9" },
};

// Helper: derive a sensible foreground from a background HSL string
function autoForeground(bgHSL: string): string {
  const m = bgHSL.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return hexToHSL("#ffffff");
  const l = parseFloat(m[3]);
  return l > 55 ? hexToHSL("#0f172a") : hexToHSL("#f8fafc");
}

function ThemeCreatorDialog({
  open, onClose, editing, onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: CustomTheme | null;
  onSave: (t: CustomTheme) => void;
}) {
  const [draft, setDraft] = useState<CustomTheme>(editing || DEFAULT_NEW);
  const [advanced, setAdvanced] = useState(false);

  // Reset when opening — must be an effect (state updates in render are unsafe)
  useEffect(() => {
    if (open) {
      setDraft(editing || { ...DEFAULT_NEW, id: `custom-${Date.now()}` });
      setAdvanced(false);
    }
  }, [open, editing]);

  const update = useCallback((patch: Partial<CustomTheme>) => setDraft((d) => {
    const next = { ...d, ...patch };
    next.preview = {
      bg: hslToHex(next.background),
      primary: hslToHex(next.primary),
      text: hslToHex(next.foreground),
    };
    return next;
  }), []);

  // Update background and auto-derive related colors (foreground, card, muted, border)
  const updateBackground = useCallback((hex: string) => {
    const bg = hexToHSL(hex);
    const fg = autoForeground(bg);
    setDraft((d) => {
      const next = {
        ...d,
        background: bg,
        foreground: fg,
        card: bg,
        muted: bg,
        mutedForeground: fg,
        border: fg,
      };
      next.preview = { bg: hex, primary: hslToHex(next.primary), text: hslToHex(fg) };
      return next;
    });
  }, []);

  const colorRow = (
    label: string,
    key: keyof CustomTheme,
    description?: string,
  ) => {
    const val = draft[key] as string;
    const hex = hslToHex(val);
    return (
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => update({ [key]: hexToHSL(e.target.value) } as any)}
          className="w-12 h-10 rounded border border-border cursor-pointer flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <Label className="text-sm">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Input
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(v)) update({ [key]: hexToHSL(v) } as any);
          }}
          className="w-24 font-mono text-xs"
        />
      </div>
    );
  };

  const bgHex = hslToHex(draft.background);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit theme" : "Build a theme"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live preview */}
          <div
            className="rounded-xl p-4 border-2"
            style={{ background: draft.preview.bg, color: draft.preview.text, borderColor: hslToHex(draft.border) }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">{draft.name || "Preview"}</h3>
              <button
                style={{ background: hslToHex(draft.primary), color: hslToHex(draft.primaryForeground) }}
                className="px-3 py-1.5 rounded-md text-sm font-semibold"
              >
                Primary Button
              </button>
            </div>
            <div className="rounded-lg p-3 mb-2" style={{ background: hslToHex(draft.card), border: `1px solid ${hslToHex(draft.border)}` }}>
              <p className="text-sm">A card with regular text.</p>
              <p className="text-xs mt-1" style={{ color: hslToHex(draft.mutedForeground) }}>Muted helper text.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: hslToHex(draft.accent), color: hslToHex(draft.accentForeground) }}>Accent</span>
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: hslToHex(draft.destructive), color: "#fff" }}>Delete</span>
            </div>
          </div>

          <div>
            <Label>Theme name</Label>
            <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} className="mt-1" />
          </div>

          {/* Simple mode: just 3 colors */}
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Pick three colors. We'll figure out the rest.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgHex}
                  onChange={(e) => updateBackground(e.target.value)}
                  className="w-12 h-10 rounded border border-border cursor-pointer flex-shrink-0"
                />
                <div className="flex-1">
                  <Label className="text-sm">Background</Label>
                  <p className="text-xs text-muted-foreground">Sets text and card colors automatically.</p>
                </div>
                <Input value={bgHex} readOnly className="w-24 font-mono text-xs" />
              </div>
              {colorRow("Primary (buttons & links)", "primary")}
              {colorRow("Accent (highlights)", "accent")}
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setAdvanced((a) => !a)}
            className="text-sm text-primary hover:underline"
          >
            {advanced ? "Hide" : "Show"} advanced colors
          </button>

          {advanced && (
            <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
              {colorRow("Text", "foreground")}
              {colorRow("On primary", "primaryForeground")}
              {colorRow("On accent", "accentForeground")}
              {colorRow("Card", "card")}
              {colorRow("Border", "border")}
              {colorRow("Muted", "muted")}
              {colorRow("Muted text", "mutedForeground")}
              {colorRow("Destructive", "destructive")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            <Save size={14} className="mr-1.5" /> Save theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
