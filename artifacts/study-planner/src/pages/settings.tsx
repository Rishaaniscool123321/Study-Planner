import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Plus, Trash2, Pencil, Sun, Moon, Monitor } from "lucide-react";

import {
  useListSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  getListSubjectsQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#14b8a6", "#3b82f6",
  "#0ea5e9", "#64748b", "#000000", "#ffffff",
];

type SubjectForm = { name: string; color: string };

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();

  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [form, setForm] = useState<SubjectForm>({ name: "", color: "#6366f1" });

  const { data: subjects } = useListSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  function invalidateSubjects() {
    queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
  }

  function openNew() {
    setEditingSubject(null);
    setForm({ name: "", color: "#6366f1" });
    setSubjectDialog(true);
  }

  function openEdit(s: any) {
    setEditingSubject(s);
    setForm({ name: s.name, color: s.color });
    setSubjectDialog(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingSubject) {
      updateSubject.mutate(
        { id: editingSubject.id, data: form },
        {
          onSuccess: () => {
            invalidateSubjects();
            setSubjectDialog(false);
            toast({ title: "Subject updated" });
          },
        }
      );
    } else {
      createSubject.mutate(
        { data: form },
        {
          onSuccess: () => {
            invalidateSubjects();
            setSubjectDialog(false);
            toast({ title: "Subject added" });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteSubject.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateSubjects();
          toast({ title: "Subject removed", variant: "destructive" });
        },
      }
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div className="space-y-10 max-w-2xl" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Customise your Study Planner.</p>
      </motion.div>

      {/* ── Colour Theme ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Colour Theme</h2>
          <p className="text-sm text-muted-foreground">Pick the overall look of the app.</p>
        </div>
        {(["Classic", "Terminal", "Editor Famous", "Wild & Crazy", "Nature", "Vibrant"] as const).map((groupLabel) => {
          const tagMap: Record<string, string | undefined> = {
            "Classic": undefined,
            "Terminal": "terminal",
            "Editor Famous": "editor",
            "Wild & Crazy": "wild",
            "Nature": "nature",
            "Vibrant": "vibrant",
          };
          const tag = tagMap[groupLabel];
          const grouped = COLOR_THEMES.filter((t) =>
            tag === undefined ? !t.tag : t.tag === tag
          );
          if (!grouped.length) return null;
          return (
            <div key={groupLabel} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{groupLabel}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {grouped.map((t) => {
                  const active = colorTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setColorTheme(t.id as ColorThemeId)}
                      className={`relative rounded-xl border-2 overflow-hidden transition-all text-left ${
                        active ? "border-primary shadow-md scale-[1.02]" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className="h-12 w-full flex items-end px-3 pb-2"
                        style={{ backgroundColor: t.preview.bg }}
                      >
                        <div className="h-3 w-14 rounded-full" style={{ backgroundColor: t.preview.primary }} />
                      </div>
                      <div className="px-3 py-2 bg-card border-t border-border">
                        <p className="text-xs font-semibold">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{t.description}</p>
                      </div>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ── Light / Dark ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Light / Dark</h2>
          <p className="text-sm text-muted-foreground">Some themes override this — try them both.</p>
        </div>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((m) => {
            const Icon = m === "light" ? Sun : m === "dark" ? Moon : Monitor;
            return (
              <Button
                key={m}
                variant={theme === m ? "default" : "outline"}
                onClick={() => setTheme(m)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Subjects ───────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Subjects</h2>
            <p className="text-sm text-muted-foreground">Colour-code your study areas.</p>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Subject
          </Button>
        </div>

        <div className="space-y-2">
          {subjects && subjects.length > 0 ? (
            subjects.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/20"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-medium flex-1">{s.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4">No subjects yet. Add one to get started.</p>
          )}
        </div>
      </motion.div>

      {/* ── Subject Dialog ─────────────────────────────────────────── */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "New Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="subj-name">Name</Label>
              <Input
                id="subj-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mathematics"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Label htmlFor="custom-color" className="text-xs text-muted-foreground">Custom:</Label>
                <input
                  id="custom-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-border"
                />
                <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
              </div>
            </div>
            <div
              className="h-10 rounded-lg flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor: form.color, color: "#fff" }}
            >
              {form.name || "Preview"}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createSubject.isPending || updateSubject.isPending}
            >
              {editingSubject ? "Save Changes" : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
