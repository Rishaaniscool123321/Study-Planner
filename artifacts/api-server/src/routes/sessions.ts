import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, studySessionsTable } from "@workspace/db";
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

router.get("/sessions", async (req, res): Promise<void> => {
  const qp = ListSessionsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const conditions = [];
  if (qp.data.subjectId != null) {
    conditions.push(eq(studySessionsTable.subjectId, qp.data.subjectId));
  }
  if (qp.data.date != null) {
    conditions.push(eq(studySessionsTable.date, qp.data.date));
  }

  const sessions = conditions.length > 0
    ? await db.select().from(studySessionsTable).where(and(...conditions)).orderBy(studySessionsTable.date)
    : await db.select().from(studySessionsTable).orderBy(studySessionsTable.date);

  res.json(ListSessionsResponse.parse(sessions));
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(studySessionsTable).values(parsed.data).returning();
  res.status(201).json(session);
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
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
  const [session] = await db
    .update(studySessionsTable)
    .set(parsed.data)
    .where(eq(studySessionsTable.id, params.data.id))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(UpdateSessionResponse.parse(session));
});

router.delete("/sessions/:id", async (req, res): Promise<void> => {
  const params = DeleteSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(studySessionsTable).where(eq(studySessionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
