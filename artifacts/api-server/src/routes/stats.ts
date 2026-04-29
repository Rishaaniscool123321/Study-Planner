import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable, studySessionsTable, subjectsTable } from "@workspace/db";
import {
  GetStatsSummaryResponse,
  GetStreakResponse,
  GetStatsBySubjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/stats/summary", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueCount = allTasks.filter(
    (t) => !t.completed && t.dueDate != null && t.dueDate < todayStr
  ).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const allSessions = await db.select().from(studySessionsTable).where(eq(studySessionsTable.userId, userId));
  const totalStudyMinutes = allSessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
  const weekSessions = allSessions.filter((s) => s.date >= weekAgoStr);
  const weekStudyMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);
  const todaySessions = allSessions.filter((s) => s.date === todayStr);
  const todayStudyMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);

  res.json(GetStatsSummaryResponse.parse({
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueCount,
    totalStudyMinutes,
    weekStudyMinutes,
    todayStudyMinutes,
    completionRate,
  }));
});

router.get("/stats/streak", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const sessions = await db
    .select({ date: studySessionsTable.date })
    .from(studySessionsTable)
    .where(eq(studySessionsTable.userId, req.user!.id))
    .orderBy(studySessionsTable.date);

  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort();
  const todayStr = new Date().toISOString().split("T")[0];
  const studiedToday = uniqueDates.includes(todayStr);

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const lastStudyDate: string | null = uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : null;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    if (streak > longestStreak) longestStreak = streak;
  }

  if (uniqueDates.length > 0) {
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const today = new Date(todayStr);
    const diffFromToday = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffFromToday <= 1) {
      currentStreak = streak;
    } else {
      currentStreak = 0;
    }
  }

  res.json(GetStreakResponse.parse({
    currentStreak,
    longestStreak,
    lastStudyDate,
    studiedToday,
  }));
});

router.get("/stats/by-subject", async (req: Request, res: Response): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const userId = req.user!.id;
  const subjects = await db.select().from(subjectsTable).where(eq(subjectsTable.userId, userId));
  const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
  const allSessions = await db.select().from(studySessionsTable).where(eq(studySessionsTable.userId, userId));

  const result = subjects.map((subject) => {
    const subjectTasks = allTasks.filter((t) => t.subjectId === subject.id);
    const totalTasks = subjectTasks.length;
    const completedTasks = subjectTasks.filter((t) => t.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const subjectSessions = allSessions.filter((s) => s.subjectId === subject.id);
    const totalStudyMinutes = subjectSessions.reduce((acc, s) => acc + (s.durationMinutes ?? 0), 0);

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color,
      totalTasks,
      completedTasks,
      completionRate,
      totalStudyMinutes,
    };
  });

  res.json(GetStatsBySubjectResponse.parse(result));
});

// Suppress unused import warning for `and` if linter complains
void and;

export default router;
