import {
  users,
  templates,
  executionLogs,
  type User,
  type RegisterUser,
  type Template,
  type ExecutionLog,
  type InsertExecutionLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  registerUser(userData: Omit<RegisterUser, "confirmPassword">): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<User>;
  
  // Template operations
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  
  // Execution log operations
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  getUserExecutionLogs(userId: string): Promise<ExecutionLog[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  getAllTemplatesAdmin(): Promise<Template[]>;
  createTemplate(template: Omit<Template, "id" | "createdAt">): Promise<Template>;
  updateTemplate(templateId: string, data: Partial<Template>): Promise<Template>;
  deleteTemplate(templateId: string): Promise<void>;
  getStats(): Promise<{
    totalUsers: number;
    totalExecutions: number;
    totalRevenue: number;
    activeTemplates: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async registerUser(userData: Omit<RegisterUser, "confirmPassword">): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || null,
        role: "user",
        credits: 100,
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

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllTemplatesAdmin(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async createTemplate(template: Omit<Template, "id" | "createdAt">): Promise<Template> {
    const [newTemplate] = await db
      .insert(templates)
      .values(template as any)
      .returning();
    return newTemplate;
  }

  async updateTemplate(templateId: string, data: Partial<Template>): Promise<Template> {
    const [template] = await db
      .update(templates)
      .set(data)
      .where(eq(templates.id, templateId))
      .returning();
    return template;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, templateId));
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalExecutions: number;
    totalRevenue: number;
    activeTemplates: number;
  }> {
    const [userCount] = await db.select().from(users);
    const allUsers = await db.select().from(users);
    const allExecutions = await db.select().from(executionLogs);
    const activeTemplates = await db.select().from(templates).where(eq(templates.isActive, 1));
    
    const totalRevenue = allExecutions.reduce((sum, log) => sum + log.creditsUsed, 0);
    
    return {
      totalUsers: allUsers.length,
      totalExecutions: allExecutions.length,
      totalRevenue,
      activeTemplates: activeTemplates.length,
    };
  }
}

export const storage = new DatabaseStorage();
