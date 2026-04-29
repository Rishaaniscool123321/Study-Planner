import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ColorThemeId, CustomTheme } from "@/lib/themes";

type LightDark = "dark" | "light" | "system";
export type FontChoice = "inter" | "system" | "serif" | "mono" | "rounded" | "display" | "handwriting";
export type Density = "compact" | "comfortable" | "spacious";
export type SidebarPosition = "left" | "right";
export type SidebarSize = "icons" | "normal" | "wide";

export type DashboardWidgetId =
  | "stats"
  | "goal"
  | "weekly"
  | "schedule"
  | "upNext"
  | "timer";

export const DEFAULT_DASHBOARD_WIDGETS: Record<DashboardWidgetId, boolean> = {
  stats: true,
  goal: true,
  weekly: true,
  schedule: true,
  upNext: true,
  timer: true,
};

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  stats: "Stat cards (streak, time, tasks, completion)",
  goal: "Today's study goal",
  weekly: "Weekly activity chart",
  schedule: "Today's logged sessions",
  upNext: "Up Next tasks",
  timer: "Quick Timer",
};

export type PresetId = "default" | "focus" | "cozy" | "hacker" | "pastel";

interface CustomizationState {
  // Theme
  theme: LightDark;
  setTheme: (t: LightDark) => void;
  colorTheme: ColorThemeId;
  setColorTheme: (t: ColorThemeId) => void;
  // Custom themes
  customThemes: CustomTheme[];
  saveCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (id: string) => void;
  // Typography
  font: FontChoice;
  setFont: (f: FontChoice) => void;
  fontScale: number; // 0.85 - 1.3
  setFontScale: (s: number) => void;
  // Layout
  radius: number; // 0 - 1.5 (rem)
  setRadius: (r: number) => void;
  density: Density;
  setDensity: (d: Density) => void;
  sidebarPosition: SidebarPosition;
  setSidebarPosition: (p: SidebarPosition) => void;
  sidebarSize: SidebarSize;
  setSidebarSize: (s: SidebarSize) => void;
  // Motion
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  // Daily goal
  dailyGoalMinutes: number;
  setDailyGoalMinutes: (n: number) => void;
  // Dashboard widgets
  dashboardWidgets: Record<DashboardWidgetId, boolean>;
  setDashboardWidget: (id: DashboardWidgetId, enabled: boolean) => void;
  // Notifications
  timerSoundEnabled: boolean;
  setTimerSoundEnabled: (v: boolean) => void;
  timerNotificationsEnabled: boolean;
  setTimerNotificationsEnabled: (v: boolean) => void;
  // AI assistant
  aiAssistantName: string;
  setAiAssistantName: (n: string) => void;
  aiEnabled: boolean;
  setAiEnabled: (v: boolean) => void;
  // Presets
  applyPreset: (id: PresetId) => void;
  // Reset
  resetCustomization: () => void;
}

const ThemeProviderContext = createContext<CustomizationState | null>(null);

const KEYS = {
  theme: "study-planner-theme",
  colorTheme: "study-planner-color-theme",
  customThemes: "study-planner-custom-themes",
  font: "study-planner-font",
  fontScale: "study-planner-font-scale",
  radius: "study-planner-radius",
  density: "study-planner-density",
  sidebarPosition: "study-planner-sidebar-position",
  sidebarSize: "study-planner-sidebar-size",
  reduceMotion: "study-planner-reduce-motion",
  dailyGoal: "study-planner-daily-goal-minutes",
  dashboardWidgets: "study-planner-dashboard-widgets",
  timerSound: "study-planner-timer-sound",
  timerNotifications: "study-planner-timer-notifications",
  aiAssistantName: "study-planner-ai-name",
  aiEnabled: "study-planner-ai-enabled",
};

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: LightDark;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<LightDark>(() => readLS(KEYS.theme, defaultTheme));
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() => readLS(KEYS.colorTheme, "default" as ColorThemeId));
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => readLS(KEYS.customThemes, [] as CustomTheme[]));
  const [font, setFontState] = useState<FontChoice>(() => readLS(KEYS.font, "inter" as FontChoice));
  const [fontScale, setFontScaleState] = useState<number>(() => readLS(KEYS.fontScale, 1));
  const [radius, setRadiusState] = useState<number>(() => readLS(KEYS.radius, 0.75));
  const [density, setDensityState] = useState<Density>(() => readLS(KEYS.density, "comfortable" as Density));
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => readLS(KEYS.sidebarPosition, "left" as SidebarPosition));
  const [sidebarSize, setSidebarSizeState] = useState<SidebarSize>(() => readLS(KEYS.sidebarSize, "normal" as SidebarSize));
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => readLS(KEYS.reduceMotion, false));
  const [dailyGoalMinutes, setDailyGoalMinutesState] = useState<number>(() => readLS(KEYS.dailyGoal, 60));
  const [dashboardWidgets, setDashboardWidgetsState] = useState<Record<DashboardWidgetId, boolean>>(
    () => ({ ...DEFAULT_DASHBOARD_WIDGETS, ...readLS(KEYS.dashboardWidgets, {} as Partial<Record<DashboardWidgetId, boolean>>) })
  );
  const [timerSoundEnabled, setTimerSoundEnabledState] = useState<boolean>(() => readLS(KEYS.timerSound, true));
  const [timerNotificationsEnabled, setTimerNotificationsEnabledState] = useState<boolean>(() => readLS(KEYS.timerNotifications, true));
  const [aiAssistantName, setAiAssistantNameState] = useState<string>(() => readLS(KEYS.aiAssistantName, "Study AI"));
  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => readLS(KEYS.aiEnabled, true));

  // Apply light/dark class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : theme;
    root.classList.add(resolved);
  }, [theme]);

  // Apply color theme + inject custom CSS variables when custom theme selected
  useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === "default") {
      root.removeAttribute("data-color-theme");
    } else {
      root.setAttribute("data-color-theme", colorTheme);
    }

    // remove any prior custom style
    const existing = document.getElementById("custom-theme-style");
    if (existing) existing.remove();

    if (typeof colorTheme === "string" && colorTheme.startsWith("custom-")) {
      const ct = customThemes.find((t) => t.id === colorTheme);
      if (ct) {
        const style = document.createElement("style");
        style.id = "custom-theme-style";
        style.textContent = `
          [data-color-theme="${ct.id}"] {
            --background: ${ct.background};
            --foreground: ${ct.foreground};
            --border: ${ct.border};
            --card: ${ct.card};
            --card-foreground: ${ct.foreground};
            --card-border: ${ct.border};
            --sidebar: ${ct.background};
            --sidebar-foreground: ${ct.foreground};
            --sidebar-border: ${ct.border};
            --sidebar-primary: ${ct.primary};
            --sidebar-primary-foreground: ${ct.primaryForeground};
            --sidebar-accent: ${ct.muted};
            --sidebar-accent-foreground: ${ct.foreground};
            --sidebar-ring: ${ct.primary};
            --popover: ${ct.card};
            --popover-foreground: ${ct.foreground};
            --popover-border: ${ct.border};
            --primary: ${ct.primary};
            --primary-foreground: ${ct.primaryForeground};
            --secondary: ${ct.muted};
            --secondary-foreground: ${ct.foreground};
            --muted: ${ct.muted};
            --muted-foreground: ${ct.mutedForeground};
            --accent: ${ct.accent};
            --accent-foreground: ${ct.accentForeground};
            --destructive: ${ct.destructive};
            --destructive-foreground: 0 0% 100%;
            --input: ${ct.border};
            --ring: ${ct.primary};
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [colorTheme, customThemes]);

  // Font
  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  // Font scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(fontScale * 16)}px`;
  }, [fontScale]);

  // Radius
  useEffect(() => {
    document.documentElement.style.setProperty("--radius", `${radius}rem`);
  }, [radius]);

  // Density
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  // Sidebar
  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar-position", sidebarPosition);
    document.documentElement.setAttribute("data-sidebar-size", sidebarSize);
  }, [sidebarPosition, sidebarSize]);

  // Motion
  useEffect(() => {
    document.documentElement.setAttribute("data-motion", reduceMotion ? "off" : "on");
  }, [reduceMotion]);

  const setTheme = (t: LightDark) => { writeLS(KEYS.theme, t); setThemeState(t); };
  const setColorTheme = (t: ColorThemeId) => { writeLS(KEYS.colorTheme, t); setColorThemeState(t); };
  const setFont = (f: FontChoice) => { writeLS(KEYS.font, f); setFontState(f); };
  const setFontScale = (s: number) => { writeLS(KEYS.fontScale, s); setFontScaleState(s); };
  const setRadius = (r: number) => { writeLS(KEYS.radius, r); setRadiusState(r); };
  const setDensity = (d: Density) => { writeLS(KEYS.density, d); setDensityState(d); };
  const setSidebarPosition = (p: SidebarPosition) => { writeLS(KEYS.sidebarPosition, p); setSidebarPositionState(p); };
  const setSidebarSize = (s: SidebarSize) => { writeLS(KEYS.sidebarSize, s); setSidebarSizeState(s); };
  const setReduceMotion = (v: boolean) => { writeLS(KEYS.reduceMotion, v); setReduceMotionState(v); };
  const setDailyGoalMinutes = (n: number) => {
    const clamped = Math.max(5, Math.min(480, Math.round(n)));
    writeLS(KEYS.dailyGoal, clamped);
    setDailyGoalMinutesState(clamped);
  };
  const setDashboardWidget = (id: DashboardWidgetId, enabled: boolean) => {
    setDashboardWidgetsState((prev) => {
      const next = { ...prev, [id]: enabled };
      writeLS(KEYS.dashboardWidgets, next);
      return next;
    });
  };
  const setTimerSoundEnabled = (v: boolean) => { writeLS(KEYS.timerSound, v); setTimerSoundEnabledState(v); };
  const setTimerNotificationsEnabled = (v: boolean) => { writeLS(KEYS.timerNotifications, v); setTimerNotificationsEnabledState(v); };
  const setAiAssistantName = (n: string) => {
    const trimmed = n.trim().slice(0, 40) || "Study AI";
    writeLS(KEYS.aiAssistantName, trimmed); setAiAssistantNameState(trimmed);
  };
  const setAiEnabled = (v: boolean) => { writeLS(KEYS.aiEnabled, v); setAiEnabledState(v); };

  const applyPreset = useCallback((id: PresetId) => {
    const presets: Record<PresetId, {
      colorTheme: ColorThemeId; font: FontChoice; fontScale: number;
      radius: number; density: Density; reduceMotion: boolean;
      theme?: LightDark;
    }> = {
      default: { colorTheme: "default" as ColorThemeId, font: "inter", fontScale: 1, radius: 0.75, density: "comfortable", reduceMotion: false, theme: "system" },
      focus:   { colorTheme: "default" as ColorThemeId, font: "inter", fontScale: 1, radius: 0.5, density: "compact", reduceMotion: true, theme: "dark" },
      cozy:    { colorTheme: "coffee" as ColorThemeId, font: "serif", fontScale: 1.05, radius: 1.0, density: "spacious", reduceMotion: false, theme: "light" },
      hacker:  { colorTheme: "matrix" as ColorThemeId, font: "mono", fontScale: 0.95, radius: 0.25, density: "compact", reduceMotion: false, theme: "dark" },
      pastel:  { colorTheme: "cherry-blossom" as ColorThemeId, font: "rounded", fontScale: 1.05, radius: 1.25, density: "comfortable", reduceMotion: false, theme: "light" },
    };
    const p = presets[id];
    setColorTheme(p.colorTheme);
    setFont(p.font);
    setFontScale(p.fontScale);
    setRadius(p.radius);
    setDensity(p.density);
    setReduceMotion(p.reduceMotion);
    if (p.theme) setTheme(p.theme);
  }, []);

  const saveCustomTheme = useCallback((t: CustomTheme) => {
    setCustomThemes((prev) => {
      const next = [...prev.filter((x) => x.id !== t.id), t];
      writeLS(KEYS.customThemes, next);
      return next;
    });
  }, []);

  const deleteCustomTheme = useCallback((id: string) => {
    setCustomThemes((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeLS(KEYS.customThemes, next);
      return next;
    });
    if (colorTheme === id) setColorTheme("default");
  }, [colorTheme]);

  const resetCustomization = useCallback(() => {
    [Object.values(KEYS)].flat().forEach((k) => localStorage.removeItem(k));
    setThemeState("system"); setColorThemeState("default"); setCustomThemes([]);
    setFontState("inter"); setFontScaleState(1); setRadiusState(0.75);
    setDensityState("comfortable"); setSidebarPositionState("left"); setSidebarSizeState("normal");
    setReduceMotionState(false);
    setDailyGoalMinutesState(60);
    setDashboardWidgetsState({ ...DEFAULT_DASHBOARD_WIDGETS });
    setTimerSoundEnabledState(true);
    setTimerNotificationsEnabledState(true);
    setAiAssistantNameState("Study AI");
    setAiEnabledState(true);
    document.documentElement.style.removeProperty("--radius");
    document.documentElement.style.removeProperty("font-size");
  }, []);

  const value = useMemo<CustomizationState>(() => ({
    theme, setTheme, colorTheme, setColorTheme,
    customThemes, saveCustomTheme, deleteCustomTheme,
    font, setFont, fontScale, setFontScale,
    radius, setRadius, density, setDensity,
    sidebarPosition, setSidebarPosition, sidebarSize, setSidebarSize,
    reduceMotion, setReduceMotion,
    dailyGoalMinutes, setDailyGoalMinutes,
    dashboardWidgets, setDashboardWidget,
    timerSoundEnabled, setTimerSoundEnabled,
    timerNotificationsEnabled, setTimerNotificationsEnabled,
    aiAssistantName, setAiAssistantName,
    aiEnabled, setAiEnabled,
    applyPreset, resetCustomization,
  }), [theme, colorTheme, customThemes, font, fontScale, radius, density, sidebarPosition, sidebarSize, reduceMotion, dailyGoalMinutes, dashboardWidgets, timerSoundEnabled, timerNotificationsEnabled, aiAssistantName, aiEnabled, applyPreset, saveCustomTheme, deleteCustomTheme, resetCustomization]);

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
