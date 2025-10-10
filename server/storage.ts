import {
  users,
  templates,
  executionLogs,
  type User,
  type UpsertUser,
  type Template,
  type ExecutionLog,
  type InsertExecutionLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<User>;
  
  // Template operations
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  
  // Execution log operations
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  getUserExecutionLogs(userId: string): Promise<ExecutionLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Template operations
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.isActive, 1));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  // Execution log operations
  async createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog> {
    const [executionLog] = await db
      .insert(executionLogs)
      .values(log)
      .returning();
    return executionLog;
  }

  async getUserExecutionLogs(userId: string): Promise<ExecutionLog[]> {
    return await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.userId, userId))
      .orderBy(desc(executionLogs.executedAt));
  }
}

export const storage = new DatabaseStorage();
