import { pgTable, text, serial, timestamp, integer, date, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const studySessionsTable = pgTable(
  "study_sessions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id"),
    date: date("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time"),
    durationMinutes: integer("duration_minutes"),
    sessionType: text("session_type").notNull().default("regular"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("study_sessions_user_id_idx").on(t.userId)],
);

export const insertStudySessionSchema = createInsertSchema(studySessionsTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type StudySession = typeof studySessionsTable.$inferSelect;
