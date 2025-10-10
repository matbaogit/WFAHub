import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").default(100).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Template/Feature definitions
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameVi: varchar("name_vi").notNull(),
  description: varchar("description").notNull(),
  descriptionVi: varchar("description_vi").notNull(),
  icon: varchar("icon").notNull(),
  creditCost: integer("credit_cost").default(10).notNull(),
  inputSchema: jsonb("input_schema").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Execution logs
export const executionLogs = pgTable("execution_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").notNull().references(() => templates.id),
  status: varchar("status").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  inputData: jsonb("input_data"),
  resultData: jsonb("result_data"),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  executionLogs: many(executionLogs),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  executionLogs: many(executionLogs),
}));

export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  user: one(users, {
    fields: [executionLogs.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [executionLogs.templateId],
    references: [templates.id],
  }),
}));

// Schemas
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertExecutionLogSchema = createInsertSchema(executionLogs).omit({
  id: true,
  executedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
