import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable, subjectsTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  ListTasksResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function ensureSubjectOwned(
  subjectId: number | null | undefined,
  userId: string,
): Promise<boolean> {
  if (subjectId == null) return true;
  const [row] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.userId, userId)));
  return !!row;
}

router.get("/tasks", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const qp = ListTasksQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const conditions = [eq(tasksTable.userId, req.user!.id)];
  if (qp.data.subjectId != null) {
    conditions.push(eq(tasksTable.subjectId, qp.data.subjectId));
  }
  if (qp.data.priority != null) {
    conditions.push(eq(tasksTable.priority, qp.data.priority));
  }
  if (qp.data.completed != null) {
    conditions.push(eq(tasksTable.completed, qp.data.completed));
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(tasksTable.createdAt);

  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!(await ensureSubjectOwned(parsed.data.subjectId, req.user!.id))) {
    res.status(400).json({ error: "Invalid subjectId" });
    return;
  }
  const insertData = {
    ...parsed.data,
    dueDate: parsed.data.dueDate
      ? (parsed.data.dueDate instanceof Date
          ? parsed.data.dueDate.toISOString().slice(0, 10)
          : parsed.data.dueDate)
      : null,
    userId: req.user!.id,
  };
  const [task] = await db.insert(tasksTable).values(insertData).returning();
  res.status(201).json(task);
});

router.get("/tasks/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, req.user!.id)));
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.subjectId !== undefined && !(await ensureSubjectOwned(parsed.data.subjectId, req.user!.id))) {
    res.status(400).json({ error: "Invalid subjectId" });
    return;
  }
  const updateData: Record<string, unknown> = {
    ...parsed.data,
    ...(parsed.data.dueDate !== undefined && {
      dueDate: parsed.data.dueDate
        ? (parsed.data.dueDate instanceof Date
            ? parsed.data.dueDate.toISOString().slice(0, 10)
            : parsed.data.dueDate)
        : null,
    }),
    updatedAt: new Date(),
  };
  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, req.user!.id)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, req.user!.id)));
  res.sendStatus(204);
});

export default router;
