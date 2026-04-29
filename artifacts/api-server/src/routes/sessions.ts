import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, studySessionsTable, subjectsTable } from "@workspace/db";
import {
  ListSessionsQueryParams,
  CreateSessionBody,
  UpdateSessionParams,
  UpdateSessionBody,
  UpdateSessionResponse,
  DeleteSessionParams,
  ListSessionsResponse,
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

router.get("/sessions", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const qp = ListSessionsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const conditions = [eq(studySessionsTable.userId, req.user!.id)];
  if (qp.data.subjectId != null) {
    conditions.push(eq(studySessionsTable.subjectId, qp.data.subjectId));
  }
  if (qp.data.date != null) {
    const dateStr =
      qp.data.date instanceof Date
        ? qp.data.date.toISOString().slice(0, 10)
        : qp.data.date;
    conditions.push(eq(studySessionsTable.date, dateStr));
  }

  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(and(...conditions))
    .orderBy(studySessionsTable.date);

  res.json(ListSessionsResponse.parse(sessions));
});

router.post("/sessions", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = CreateSessionBody.safeParse(req.body);
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
    date:
      parsed.data.date instanceof Date
        ? parsed.data.date.toISOString().slice(0, 10)
        : parsed.data.date,
    userId: req.user!.id,
  };
  const [session] = await db.insert(studySessionsTable).values(insertData).returning();
  res.status(201).json(session);
});

router.patch("/sessions/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = UpdateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSessionBody.safeParse(req.body);
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
    ...(parsed.data.date !== undefined && {
      date:
        parsed.data.date instanceof Date
          ? parsed.data.date.toISOString().slice(0, 10)
          : parsed.data.date,
    }),
  };
  const [session] = await db
    .update(studySessionsTable)
    .set(updateData)
    .where(and(eq(studySessionsTable.id, params.data.id), eq(studySessionsTable.userId, req.user!.id)))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(UpdateSessionResponse.parse(session));
});

router.delete("/sessions/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = DeleteSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(studySessionsTable)
    .where(and(eq(studySessionsTable.id, params.data.id), eq(studySessionsTable.userId, req.user!.id)));
  res.sendStatus(204);
});

export default router;
