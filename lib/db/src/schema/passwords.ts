import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const passwordsTable = pgTable("passwords", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 512 }),
  username: varchar("username", { length: 255 }),
  encryptedPassword: text("encrypted_password"),
  encryptedTwoFactorSecret: text("encrypted_two_factor_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
