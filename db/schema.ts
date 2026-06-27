import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const competitions = sqliteTable("competitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  deadline: text("deadline").notNull(),
  problemHtml: text("problem_html").notNull(),
  testCases: text("test_cases").notNull(), // JSON string
  active: integer("active", { mode: "boolean" }).default(true),
  listed: integer("listed", { mode: "boolean" }).default(true),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const accessCodes = sqliteTable("access_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  studentName: text("student_name"),
  competitionId: text("competition_id")
    .notNull()
    .references(() => competitions.id),
  usedAt: text("used_at"),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  language: text("language").notNull().default("python"),
  confirmationCode: text("confirmation_code").notNull().unique(),
  shortlisted: integer("shortlisted", { mode: "boolean" }).default(false),
  winner: integer("winner", { mode: "boolean" }).default(false),
  comment: text("comment"),
  submittedAt: text("submitted_at").default(sql`(datetime('now'))`),
  accessCodeId: text("access_code_id")
    .notNull()
    .unique()
    .references(() => accessCodes.id),
  competitionId: text("competition_id")
    .notNull()
    .references(() => competitions.id),
  studentName: text("student_name"),
  pseudonym: text("pseudonym"),
});
