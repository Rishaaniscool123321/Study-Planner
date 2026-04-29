import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Check, Sun, Moon, Monitor, Sparkles, Trash2, Save, Palette as PaletteIcon,
  RotateCcw, Type, LayoutGrid, MoveHorizontal,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
    resetCustomization,
  } = useTheme();

  const { toast } = useToast();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomTheme | null>(null);

  // group themes by category
  const grouped = useMemo(() => {
    const map = new Map<ThemeCategory, ColorTheme[]>();
    for (const t of COLOR_THEMES) {
      const arr = map.get(t.category) || [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, []);

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
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PaletteIcon className="text-primary" size={28} /> Customize
          </h1>
          <p className="text-muted-foreground">
            46+ themes, build your own, fine-tune fonts, density, and layout.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          if (confirm("Reset all customization to defaults?")) {
            resetCustomization();
            toast({ title: "Customization reset" });
          }
        }}>
          <RotateCcw size={14} className="mr-1.5" /> Reset all
        </Button>
      </div>

      <Tabs defaultValue="themes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="creator">Theme Creator</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* ─── THEMES ──────────────────────────────────────── */}
        <TabsContent value="themes" className="space-y-6">
          {/* Mode picker */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3 flex-wrap">
              <span className="font-medium mr-2">Mode</span>
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
            </CardContent>
          </Card>

          {/* User custom themes first */}
          {customAsList.length > 0 && (
            <ThemeGroup
              title={CATEGORY_LABELS.custom}
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

          {Array.from(grouped.entries()).map(([cat, themes]) => (
            <ThemeGroup
              key={cat}
              title={CATEGORY_LABELS[cat]}
              themes={themes}
              activeId={colorTheme}
              onPick={setColorTheme}
            />
          ))}
        </TabsContent>

        {/* ─── CREATOR ─────────────────────────────────────── */}
        <TabsContent value="creator" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Build your own theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick every color, save it, and use it like any other theme.
                  </p>
                </div>
              </div>
              <Button onClick={() => { setEditingCustom(null); setCreatorOpen(true); }}>
                <PaletteIcon size={14} className="mr-1.5" /> Create new theme
              </Button>
            </CardContent>
          </Card>

          {customThemes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Your themes</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {customThemes.map((ct) => (
                  <Card key={ct.id} className="overflow-hidden">
                    <div
                      className="h-20 flex items-center justify-center"
                      style={{ background: ct.preview.bg, color: ct.preview.text }}
                    >
                      <div
                        className="px-3 py-1 rounded-md font-semibold text-sm"
                        style={{ background: ct.preview.primary, color: "#fff" }}
                      >
                        {ct.name}
                      </div>
                    </div>
                    <CardContent className="p-3 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant={colorTheme === ct.id ? "default" : "outline"}
                        onClick={() => setColorTheme(ct.id)}
                      >
                        {colorTheme === ct.id ? "Active" : "Apply"}
                      </Button>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingCustom(ct); setCreatorOpen(true); }}>
                          <Save size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteCustomTheme(ct.id)}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── TYPOGRAPHY ──────────────────────────────────── */}
        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Type className="text-primary" />
                <h3 className="font-semibold text-lg">Font family</h3>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(
                  [
                    { id: "inter", label: "Inter", style: "font-sans" },
                    { id: "system", label: "System UI", style: "" },
                    { id: "serif", label: "Serif", style: "font-serif" },
                    { id: "mono", label: "Monospace", style: "font-mono" },
                    { id: "rounded", label: "Rounded", style: "" },
                    { id: "display", label: "Display", style: "" },
                    { id: "handwriting", label: "Handwriting", style: "" },
                  ] as Array<{ id: typeof font; label: string; style: string }>
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors text-left ${
                      font === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-medium">{f.label}</span>
                    <span className={`text-xl ${f.style}`}>Aa</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Label className="flex items-center justify-between">
                  <span>Text size</span>
                  <span className="text-muted-foreground text-sm">{Math.round(fontScale * 100)}%</span>
                </Label>
                <Slider
                  min={0.85} max={1.3} step={0.05}
                  value={[fontScale]}
                  onValueChange={([v]) => setFontScale(v)}
                />
                <p className="text-sm text-muted-foreground">Scales the entire app's text.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── LAYOUT ──────────────────────────────────────── */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><LayoutGrid size={16}/> Corner radius</span>
                  <span className="text-muted-foreground text-sm">{radius.toFixed(2)}rem</span>
                </Label>
                <Slider min={0} max={1.5} step={0.05} value={[radius]} onValueChange={([v]) => setRadius(v)} />
                <div className="flex gap-2 mt-1">
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

              <div className="space-y-2 pt-4 border-t">
                <Label>UI Density</Label>
                <Select value={density} onValueChange={(v) => setDensity(v as any)}>
                  <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2"><MoveHorizontal size={16}/> Sidebar position</Label>
                <div className="flex gap-2">
                  <Button variant={sidebarPosition === "left" ? "default" : "outline"} size="sm" onClick={() => setSidebarPosition("left")}>Left</Button>
                  <Button variant={sidebarPosition === "right" ? "default" : "outline"} size="sm" onClick={() => setSidebarPosition("right")}>Right</Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Sidebar size</Label>
                <Select value={sidebarSize} onValueChange={(v) => setSidebarSize(v as any)}>
                  <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icons">Icons only</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Reduce motion</Label>
                  <p className="text-sm text-muted-foreground">Disable animations and transitions.</p>
                </div>
                <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {themes.map((t) => {
          const active = activeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
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
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(t.id); }}
                      className="p-1 bg-background/90 backdrop-blur rounded text-foreground hover:bg-background"
                      title="Edit"
                    >
                      <Save size={11} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("Delete this theme?")) onDelete(t.id); }}
                      className="p-1 bg-background/90 backdrop-blur rounded text-destructive hover:bg-background"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </button>
          );
        })}
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

function ThemeCreatorDialog({
  open, onClose, editing, onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: CustomTheme | null;
  onSave: (t: CustomTheme) => void;
}) {
  const [draft, setDraft] = useState<CustomTheme>(editing || DEFAULT_NEW);

  // Reset when opening
  useMemo(() => { if (open) setDraft(editing || { ...DEFAULT_NEW, id: `custom-${Date.now()}` }); }, [open, editing]);

  const update = (patch: Partial<CustomTheme>) => setDraft((d) => {
    const next = { ...d, ...patch };
    next.preview = {
      bg: hslToHex(next.background),
      primary: hslToHex(next.primary),
      text: hslToHex(next.foreground),
    };
    return next;
  });

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Custom Theme" : "Create Custom Theme"}</DialogTitle>
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
              <p className="text-sm">A card with regular text content.</p>
              <p className="text-xs mt-1" style={{ color: hslToHex(draft.mutedForeground) }}>Muted descriptive text.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: hslToHex(draft.accent), color: hslToHex(draft.accentForeground) }}>Accent</span>
              <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: hslToHex(draft.destructive), color: "#fff" }}>Destructive</span>
            </div>
          </div>

          <div>
            <Label>Theme name</Label>
            <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} className="mt-1" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {colorRow("Background", "background", "Main app background")}
            {colorRow("Text", "foreground", "Primary readable text")}
            {colorRow("Primary", "primary", "Buttons, links, brand")}
            {colorRow("On primary", "primaryForeground", "Text on primary buttons")}
            {colorRow("Accent", "accent", "Highlight colour")}
            {colorRow("On accent", "accentForeground", "Text on accent")}
            {colorRow("Card", "card", "Cards / panels")}
            {colorRow("Border", "border", "Dividers and outlines")}
            {colorRow("Muted", "muted", "Subtle backgrounds")}
            {colorRow("Muted text", "mutedForeground", "Subtle helper text")}
            {colorRow("Destructive", "destructive", "Delete / error")}
          </div>
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
