import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Plus, CheckCircle2, Circle, Trash2, Edit, AlertCircle, Calendar, Filter
} from "lucide-react";

import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useListSubjects,
  getListTasksQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SubjectBadge } from "@/components/subject-badge";

const PRIORITIES = ["low", "medium", "high"] as const;
type Priority = typeof PRIORITIES[number];

const priorityColors: Record<Priority, string> = {
  low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

type TaskFormData = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  subjectId: string;
};

const defaultForm: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  subjectId: "",
};

export default function Tasks() {
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterCompleted, setFilterCompleted] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState<TaskFormData>(defaultForm);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params: Record<string, any> = {};
  if (filterPriority && filterPriority !== "all") params.priority = filterPriority;
  if (filterCompleted === "true") params.completed = true;
  if (filterCompleted === "false") params.completed = false;
  if (filterSubject && filterSubject !== "all") params.subjectId = Number(filterSubject);

  const { data: tasks, isLoading } = useListTasks(params, {
    query: { queryKey: getListTasksQueryKey(params) },
  });
  const { data: subjects } = useListSubjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  function openNewTask() {
    setEditingTask(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEditTask(task: any) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority as Priority,
      dueDate: task.dueDate ?? "",
      subjectId: task.subjectId ? String(task.subjectId) : "",
    });
    setDialogOpen(true);
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    const payload: any = {
      title: form.title.trim(),
      priority: form.priority,
      description: form.description || null,
      dueDate: form.dueDate || null,
      subjectId: form.subjectId && form.subjectId !== "none" ? Number(form.subjectId) : null,
    };
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, data: payload },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast({ title: "Task updated" });
          },
        }
      );
    } else {
      createTask.mutate(
        { data: { ...payload, completed: false } },
        {
          onSuccess: () => {
            invalidate();
            setDialogOpen(false);
            toast({ title: "Task created" });
          },
        }
      );
    }
  }

  function handleToggle(task: any) {
    updateTask.mutate(
      { id: task.id, data: { completed: !task.completed } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: task.completed ? "Task reopened" : "Task completed" });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteTask.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Task deleted", variant: "destructive" });
        },
      }
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: 10, opacity: 0 },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage all your study tasks in one place.</p>
        </div>
        <Button onClick={openNewTask}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterCompleted} onValueChange={setFilterCompleted}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tasks</SelectItem>
            <SelectItem value="false">Pending</SelectItem>
            <SelectItem value="true">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {subjects && subjects.length > 0 && (
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <motion.div className="space-y-2" variants={containerVariants}>
          <AnimatePresence mode="popLayout">
            {tasks && tasks.length > 0 ? (
              tasks.map((task) => {
                const subject = subjects?.find((s) => s.id === task.subjectId);
                const isOverdue =
                  !task.completed && task.dueDate && task.dueDate < new Date().toISOString().split("T")[0];
                return (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Card className={`${task.completed ? "opacity-60" : ""} hover:shadow-sm transition-shadow`}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(task)}
                          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{task.description}</p>
                          )}
                          {task.dueDate && (
                            <div className={`flex items-center text-xs mt-1 gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                              {isOverdue && <AlertCircle className="h-3 w-3" />}
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                              {isOverdue && " — Overdue"}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          <Badge variant="outline" className={priorityColors[task.priority as Priority]}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                          {subject && <SubjectBadge subject={subject} />}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEditTask(task)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(task.id)}
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-medium">No tasks found</p>
                <p className="text-sm mt-1">Create a new task to get started.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What do you need to do?"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Add details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            {subjects && subjects.length > 0 && (
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subjectId || "none"} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title.trim() || createTask.isPending || updateTask.isPending}
            >
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
