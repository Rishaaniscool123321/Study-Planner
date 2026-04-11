export type ColorThemeId =
  | "default"
  | "matrix"
  | "hacker"
  | "void"
  | "red-alert"
  | "lime-zest"
  | "matcha"
  | "midnight"
  | "sunset"
  | "ocean"
  | "candy"
  | "graphite";

export interface ColorTheme {
  id: ColorThemeId;
  name: string;
  description: string;
  preview: { bg: string; primary: string; text: string };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "default",
    name: "Indigo",
    description: "Classic indigo on white",
    preview: { bg: "#f8fafc", primary: "#6366f1", text: "#1e293b" },
  },
  {
    id: "void",
    name: "Void",
    description: "Indigo on deep black",
    preview: { bg: "#05050f", primary: "#818cf8", text: "#e2e8f0" },
  },
  {
    id: "matrix",
    name: "Matrix",
    description: "Green on black",
    preview: { bg: "#020c04", primary: "#00e645", text: "#00ff47" },
  },
  {
    id: "hacker",
    name: "Hacker",
    description: "Black on green",
    preview: { bg: "#1a7a2e", primary: "#000000", text: "#000000" },
  },
  {
    id: "red-alert",
    name: "Red Alert",
    description: "Crimson on white",
    preview: { bg: "#ffffff", primary: "#dc2626", text: "#1c0a0a" },
  },
  {
    id: "lime-zest",
    name: "Lime",
    description: "Lime green on white",
    preview: { bg: "#f9fff3", primary: "#65a30d", text: "#1a2e05" },
  },
  {
    id: "matcha",
    name: "Matcha",
    description: "Soft sage on cream",
    preview: { bg: "#f4f7f0", primary: "#4d7c4e", text: "#1f2e1f" },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Blue on deep navy",
    preview: { bg: "#020816", primary: "#3b82f6", text: "#e2e8f0" },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange on cream",
    preview: { bg: "#fff8f2", primary: "#ea580c", text: "#3a1a06" },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Teal on dark slate",
    preview: { bg: "#070f12", primary: "#14b8a6", text: "#e2f8f7" },
  },
  {
    id: "candy",
    name: "Candy",
    description: "Pink on soft white",
    preview: { bg: "#fff5f9", primary: "#ec4899", text: "#3b0a23" },
  },
  {
    id: "graphite",
    name: "Graphite",
    description: "Near-monochrome",
    preview: { bg: "#f7f7f7", primary: "#374151", text: "#111827" },
  },
];
