import { createContext, useContext, useEffect, useState } from "react";
import type { ColorThemeId } from "@/lib/themes";

type LightDark = "dark" | "light" | "system";

type ThemeProviderState = {
  theme: LightDark;
  setTheme: (theme: LightDark) => void;
  colorTheme: ColorThemeId;
  setColorTheme: (t: ColorThemeId) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  colorTheme: "default",
  setColorTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "study-planner-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: LightDark;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<LightDark>(
    () => (localStorage.getItem(storageKey) as LightDark) || defaultTheme
  );
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(
    () => (localStorage.getItem("study-planner-color-theme") as ColorThemeId) || "default"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.add(resolved);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === "default") {
      root.removeAttribute("data-color-theme");
    } else {
      root.setAttribute("data-color-theme", colorTheme);
    }
  }, [colorTheme]);

  const setTheme = (t: LightDark) => {
    localStorage.setItem(storageKey, t);
    setThemeState(t);
  };

  const setColorTheme = (t: ColorThemeId) => {
    localStorage.setItem("study-planner-color-theme", t);
    setColorThemeState(t);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, colorTheme, setColorTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeProviderContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
