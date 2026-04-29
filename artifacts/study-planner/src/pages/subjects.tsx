import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, BookOpen } from "lucide-react";

import {
  useListSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  getListSubjectsQueryKey,
  type Subject,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#14b8a6", "#3b82f6",
  "#0ea5e9", "#64748b", "#000000", "#ffffff",
];

type SubjectForm = { name: string; color: string };

export default function Subjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectForm>({ name: "", color: "#6366f1" });

  const { data: subjects, isLoading } = useListSubjects();
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

  function openEdit(s: Subject) {
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
        },
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
        },
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
      },
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">
            Colour-code your study areas. Subjects are private to your account.
          </p>
        </div>
        <Button onClick={openNew} data-testid="button-new-subject">
          <Plus className="h-4 w-4 mr-1" /> Add subject
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : subjects && subjects.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((s) => (
              <Card key={s.id} data-testid={`card-subject-${s.id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 border border-white/20 flex items-center justify-center"
                    style={{ backgroundColor: s.color }}
                  >
                    <BookOpen className="h-5 w-5 text-white/90" />
                  </div>
                  <span className="font-medium flex-1 truncate" data-testid={`text-subject-name-${s.id}`}>
                    {s.name}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                    className="hover:text-destructive"
                    aria-label="Delete"
                    data-testid={`button-delete-subject-${s.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mb-2 opacity-20" />
              <p>No subjects yet.</p>
              <p className="text-sm mt-1">Add one to start organising your tasks and sessions.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit subject" : "New subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="subj-name">Name</Label>
              <Input
                id="subj-name"
                data-testid="input-subject-name"
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
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    aria-label={`Pick ${c}`}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Label htmlFor="custom-color" className="text-xs text-muted-foreground">
                  Custom:
                </Label>
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
            <Button variant="outline" onClick={() => setSubjectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || createSubject.isPending || updateSubject.isPending}
              data-testid="button-save-subject"
            >
              {editingSubject ? "Save changes" : "Add subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
