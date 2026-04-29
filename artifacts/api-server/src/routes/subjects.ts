import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, subjectsTable } from "@workspace/db";
import {
  CreateSubjectBody,
  UpdateSubjectParams,
  UpdateSubjectBody,
  UpdateSubjectResponse,
  DeleteSubjectParams,
  ListSubjectsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/subjects", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.userId, req.user!.id))
    .orderBy(subjectsTable.name);
  res.json(ListSubjectsResponse.parse(subjects));
});

router.post("/subjects", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .insert(subjectsTable)
    .values({ ...parsed.data, userId: req.user!.id })
    .returning();
  res.status(201).json(subject);
});

router.patch("/subjects/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [subject] = await db
    .update(subjectsTable)
    .set(parsed.data)
    .where(and(eq(subjectsTable.id, params.data.id), eq(subjectsTable.userId, req.user!.id)))
    .returning();
  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json(UpdateSubjectResponse.parse(subject));
});

router.delete("/subjects/:id", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(subjectsTable)
    .where(and(eq(subjectsTable.id, params.data.id), eq(subjectsTable.userId, req.user!.id)));
  res.sendStatus(204);
});

export default router;
