import {
  users,
  templates,
  executionLogs,
  customers,
  quotations,
  quotationItems,
  emailTemplates,
  quotationTemplates,
  smtpConfigs,
  userSettings,
  serviceCatalog,
  priceLists,
  bulkCampaigns,
  campaignRecipients,
  campaignAttachments,
  type User,
  type RegisterUser,
  type Template,
  type ExecutionLog,
  type InsertExecutionLog,
  type Customer,
  type InsertCustomer,
  type Quotation,
  type InsertQuotation,
  type QuotationItem,
  type InsertQuotationItem,
  type EmailTemplate,
  type InsertEmailTemplate,
  type QuotationTemplate,
  type InsertQuotationTemplate,
  type SmtpConfig,
  type InsertSmtpConfig,
  type ServiceCatalog,
  type InsertServiceCatalog,
  type PriceList,
  type InsertPriceList,
  type BulkCampaign,
  type InsertBulkCampaign,
  type CampaignRecipient,
  type InsertCampaignRecipient,
  type CampaignAttachment,
  type InsertCampaignAttachment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  registerUser(userData: Omit<RegisterUser, "confirmPassword">): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<User>;
  upsertUser(userData: { id: string; email: string; firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User>;
  
  // Email verification operations
  setVerificationToken(userId: string, token: string, expiry: Date): Promise<void>;
  verifyEmail(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  
  // Password reset operations
  setResetToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  resetPassword(token: string, newPasswordHash: string): Promise<User | undefined>;
  
  // Template operations
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  
  // Execution log operations
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  getUserExecutionLogs(userId: string): Promise<ExecutionLog[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  getAllTemplatesAdmin(): Promise<Template[]>;
  createTemplate(template: Omit<Template, "id" | "createdAt">): Promise<Template>;
  updateTemplate(templateId: string, data: Partial<Template>): Promise<Template>;
  deleteTemplate(templateId: string): Promise<void>;
  reorderTemplate(templateId: string, direction: 'up' | 'down'): Promise<void>;
  bulkUpdateTemplateSortOrder(templateOrders: Array<{ id: string; sortOrder: number }>): Promise<void>;
  getStats(): Promise<{
    totalUsers: number;
    totalExecutions: number;
    totalRevenue: number;
    activeTemplates: number;
  }>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getUserCustomers(userId: string): Promise<Customer[]>;
  updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<void>;
  
  // Quotation operations
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  getQuotation(id: string): Promise<Quotation | undefined>;
  getUserQuotations(userId: string): Promise<Quotation[]>;
  updateQuotation(quotationId: string, data: Partial<Quotation>): Promise<Quotation>;
  deleteQuotation(quotationId: string): Promise<void>;
  generateQuotationNumber(): Promise<string>;
  
  // Quotation items operations
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<QuotationItem[]>;
  updateQuotationItem(itemId: string, data: Partial<QuotationItem>): Promise<QuotationItem>;
  deleteQuotationItem(itemId: string): Promise<void>;
  deleteQuotationItems(quotationId: string): Promise<void>;
  
  // Email template operations
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getUserEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  updateEmailTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(templateId: string): Promise<void>;
  
  // Quotation template operations
  createQuotationTemplate(template: InsertQuotationTemplate): Promise<QuotationTemplate>;
  getQuotationTemplate(id: string): Promise<QuotationTemplate | undefined>;
  getUserQuotationTemplates(userId: string): Promise<QuotationTemplate[]>;
  updateQuotationTemplate(templateId: string, data: Partial<QuotationTemplate>): Promise<QuotationTemplate>;
  deleteQuotationTemplate(templateId: string): Promise<void>;
  
  // SMTP config operations
  createSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig>;
  getSmtpConfig(userId: string): Promise<SmtpConfig | undefined>;
  getAllSmtpConfigs(): Promise<SmtpConfig[]>;
  updateSmtpConfig(userId: string, data: Partial<SmtpConfig>): Promise<SmtpConfig>;
  deleteSmtpConfig(userId: string): Promise<void>;
  getSystemDefaultSmtpConfig(): Promise<SmtpConfig | undefined>;
  setSystemDefaultSmtpConfig(userId: string): Promise<void>;

  // Quotation email sending
  getQuotationWithDetails(quotationId: string): Promise<any | undefined>;
  getUserSettings(userId: string): Promise<any | undefined>;
  updateQuotationSentAt(quotationId: string): Promise<void>;

  // Analytics
  getAnalytics(userId: string): Promise<any>;
  
  // Service Catalog operations
  createServiceCatalog(item: InsertServiceCatalog): Promise<ServiceCatalog>;
  getUserServiceCatalog(userId: string): Promise<ServiceCatalog[]>;
  updateServiceCatalog(itemId: string, data: Partial<ServiceCatalog>): Promise<ServiceCatalog>;
  deleteServiceCatalog(itemId: string): Promise<void>;
  bulkCreateServiceCatalog(items: InsertServiceCatalog[]): Promise<ServiceCatalog[]>;
  
  // Price Lists
  getUserPriceLists(userId: string): Promise<PriceList[]>;
  createPriceList(data: InsertPriceList): Promise<PriceList>;
  updatePriceList(id: string, data: Partial<PriceList>): Promise<PriceList>;
  deletePriceList(id: string): Promise<void>;
  
  // Bulk Campaign operations
  createBulkCampaign(campaign: InsertBulkCampaign): Promise<BulkCampaign>;
  getBulkCampaign(id: string): Promise<BulkCampaign | undefined>;
  getUserBulkCampaigns(userId: string): Promise<BulkCampaign[]>;
  updateBulkCampaign(campaignId: string, data: Partial<BulkCampaign>): Promise<BulkCampaign>;
  deleteBulkCampaign(campaignId: string): Promise<void>;
  getBulkCampaignWithDetails(campaignId: string): Promise<any | undefined>;
  
  // Campaign Recipient operations
  createCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;
  getCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  updateCampaignRecipient(recipientId: string, data: Partial<CampaignRecipient>): Promise<CampaignRecipient>;
  
  // Campaign Attachment operations
  createCampaignAttachment(attachment: InsertCampaignAttachment): Promise<CampaignAttachment>;
  getCampaignAttachments(campaignId: string): Promise<CampaignAttachment[]>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
        emailVerified: 0,
        role: "user",
        credits: 100,
      })
      .returning();
    return user;
  }

  async setVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        verificationToken: token,
        verificationTokenExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return user;
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    const user = await this.getUserByVerificationToken(token);
    if (!user || !user.verificationTokenExpiry) {
      return undefined;
    }

    if (new Date() > user.verificationTokenExpiry) {
      return undefined;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerified: 1,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  async setResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token));
    return user;
  }

  async resetPassword(token: string, newPasswordHash: string): Promise<User | undefined> {
    const user = await this.getUserByResetToken(token);
    if (!user || !user.resetTokenExpiry) {
      return undefined;
    }

    if (new Date() > user.resetTokenExpiry) {
      return undefined;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }

  async updateUserCredits(userId: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upsertUser(userData: { id: string; email: string; firstName?: string; lastName?: string; profileImageUrl?: string }): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      const [user] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      const [user] = await db
        .insert(users)
        .values({
          username: userData.email.split('@')[0],
          email: userData.email,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImageUrl: userData.profileImageUrl || null,
          passwordHash: await bcrypt.hash('oauth-user-no-password', 10),
          role: "user",
          credits: 100,
        } as any)
        .returning();
      return user;
    }
  }

  // Template operations
  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.sortOrder, desc(templates.createdAt));
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

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllTemplatesAdmin(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(templates.sortOrder, desc(templates.createdAt));
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

  async reorderTemplate(templateId: string, direction: 'up' | 'down'): Promise<void> {
    // Get the current template
    const [currentTemplate] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, templateId));
    
    if (!currentTemplate) {
      throw new Error("Template not found");
    }

    // Get all templates sorted by sortOrder
    const allTemplates = await db
      .select()
      .from(templates)
      .orderBy(templates.sortOrder);

    // Find current template index
    const currentIndex = allTemplates.findIndex(t => t.id === templateId);
    
    if (currentIndex === -1) {
      throw new Error("Template not found in list");
    }

    // Determine swap target
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= allTemplates.length) {
      // Already at the edge, nothing to do
      return;
    }

    const targetTemplate = allTemplates[targetIndex];

    // Swap sortOrder values
    await db
      .update(templates)
      .set({ sortOrder: targetTemplate.sortOrder })
      .where(eq(templates.id, currentTemplate.id));

    await db
      .update(templates)
      .set({ sortOrder: currentTemplate.sortOrder })
      .where(eq(templates.id, targetTemplate.id));
  }

  async bulkUpdateTemplateSortOrder(templateOrders: Array<{ id: string; sortOrder: number }>): Promise<void> {
    // Update each template's sortOrder
    for (const { id, sortOrder } of templateOrders) {
      await db
        .update(templates)
        .set({ sortOrder })
        .where(eq(templates.id, id));
    }
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
  
  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer as any)
      .returning();
    return newCustomer;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getUserCustomers(userId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(and(eq(customers.userId, userId), eq(customers.isActive, 1)))
      .orderBy(desc(customers.createdAt));
  }

  async updateCustomer(customerId: string, data: Partial<Customer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
      .returning();
    return customer;
  }

  async deleteCustomer(customerId: string): Promise<void> {
    await db
      .update(customers)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }
  
  // Quotation operations
  async generateQuotationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const allQuotations = await db.select().from(quotations);
    const currentYearQuotations = allQuotations.filter(q => 
      q.quotationNumber.startsWith(`BG-${year}`)
    );
    const nextNumber = currentYearQuotations.length + 1;
    return `BG-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [newQuotation] = await db
      .insert(quotations)
      .values(quotation as any)
      .returning();
    return newQuotation;
  }

  async getQuotation(id: string): Promise<Quotation | undefined> {
    const [quotation] = await db.select().from(quotations).where(eq(quotations.id, id));
    return quotation;
  }

  async getUserQuotations(userId: string): Promise<Quotation[]> {
    return await db
      .select()
      .from(quotations)
      .where(eq(quotations.userId, userId))
      .orderBy(desc(quotations.createdAt));
  }

  async updateQuotation(quotationId: string, data: Partial<Quotation>): Promise<Quotation> {
    const [quotation] = await db
      .update(quotations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotations.id, quotationId))
      .returning();
    return quotation;
  }

  async deleteQuotation(quotationId: string): Promise<void> {
    await db.delete(quotations).where(eq(quotations.id, quotationId));
  }
  
  // Quotation items operations
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [newItem] = await db
      .insert(quotationItems)
      .values(item as any)
      .returning();
    return newItem;
  }

  async getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
    return await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId))
      .orderBy(quotationItems.sortOrder);
  }

  async updateQuotationItem(itemId: string, data: Partial<QuotationItem>): Promise<QuotationItem> {
    const [item] = await db
      .update(quotationItems)
      .set(data)
      .where(eq(quotationItems.id, itemId))
      .returning();
    return item;
  }

  async deleteQuotationItem(itemId: string): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.id, itemId));
  }

  async deleteQuotationItems(quotationId: string): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }
  
  // Email template operations
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template as any)
      .returning();
    return newTemplate;
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async getUserEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.createdBy, userId))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async updateEmailTemplate(templateId: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const [template] = await db
      .update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailTemplates.id, templateId))
      .returning();
    return template;
  }

  async deleteEmailTemplate(templateId: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
  }
  
  // Quotation template operations
  async createQuotationTemplate(template: InsertQuotationTemplate): Promise<QuotationTemplate> {
    const [newTemplate] = await db
      .insert(quotationTemplates)
      .values(template as any)
      .returning();
    return newTemplate;
  }

  async getQuotationTemplate(id: string): Promise<QuotationTemplate | undefined> {
    const [template] = await db.select().from(quotationTemplates).where(eq(quotationTemplates.id, id));
    return template;
  }

  async getUserQuotationTemplates(userId: string): Promise<QuotationTemplate[]> {
    return await db
      .select()
      .from(quotationTemplates)
      .where(eq(quotationTemplates.createdBy, userId))
      .orderBy(desc(quotationTemplates.createdAt));
  }

  async updateQuotationTemplate(templateId: string, data: Partial<QuotationTemplate>): Promise<QuotationTemplate> {
    const [updated] = await db
      .update(quotationTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotationTemplates.id, templateId))
      .returning();
    return updated;
  }

  async deleteQuotationTemplate(templateId: string): Promise<void> {
    await db.delete(quotationTemplates).where(eq(quotationTemplates.id, templateId));
  }
  
  // SMTP config operations
  async createSmtpConfig(config: InsertSmtpConfig): Promise<SmtpConfig> {
    const [newConfig] = await db
      .insert(smtpConfigs)
      .values(config as any)
      .returning();
    return newConfig;
  }

  async getSmtpConfig(userId: string): Promise<SmtpConfig | undefined> {
    const [config] = await db.select().from(smtpConfigs).where(eq(smtpConfigs.userId, userId));
    return config;
  }

  async getAllSmtpConfigs(): Promise<SmtpConfig[]> {
    return await db.select().from(smtpConfigs).orderBy(desc(smtpConfigs.isSystemDefault));
  }

  async updateSmtpConfig(userId: string, data: Partial<SmtpConfig>): Promise<SmtpConfig> {
    const [config] = await db
      .update(smtpConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smtpConfigs.userId, userId))
      .returning();
    return config;
  }

  async deleteSmtpConfig(userId: string): Promise<void> {
    await db.delete(smtpConfigs).where(eq(smtpConfigs.userId, userId));
  }

  async getSystemDefaultSmtpConfig(): Promise<SmtpConfig | undefined> {
    const [config] = await db
      .select()
      .from(smtpConfigs)
      .where(eq(smtpConfigs.isSystemDefault, 1));
    return config;
  }

  async setSystemDefaultSmtpConfig(userId: string): Promise<void> {
    await db.update(smtpConfigs).set({ isSystemDefault: 0 });
    
    await db
      .update(smtpConfigs)
      .set({ isSystemDefault: 1 })
      .where(eq(smtpConfigs.userId, userId));
  }

  // Quotation email sending operations
  async getQuotationWithDetails(quotationId: string): Promise<any | undefined> {
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, quotationId));

    if (!quotation) return undefined;

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, quotation.customerId));

    // Get items
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId))
      .orderBy(quotationItems.sortOrder);

    return {
      ...quotation,
      customer,
      items,
    };
  }

  async getUserSettings(userId: string): Promise<any | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async updateQuotationSentAt(quotationId: string): Promise<void> {
    await db
      .update(quotations)
      .set({ sentAt: new Date() })
      .where(eq(quotations.id, quotationId));
  }

  // Analytics operations
  async getAnalytics(userId: string): Promise<any> {
    // Get total quotations
    const allQuotations = await db
      .select()
      .from(quotations)
      .where(eq(quotations.userId, userId));

    // Get total customers
    const allCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId));

    // Calculate totals
    const totalQuotations = allQuotations.length;
    const totalCustomers = allCustomers.length;
    const totalRevenue = allQuotations.reduce((sum, q) => sum + (q.total || 0), 0);
    const emailsSent = allQuotations.filter(q => q.sentAt).length;

    // Group quotations by status
    const quotationsByStatus = allQuotations.reduce((acc: any[], q) => {
      const existing = acc.find(item => item.status === q.status);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ status: q.status, count: 1 });
      }
      return acc;
    }, []);

    // Get top customers by total spent
    const customerRevenue = new Map<string, { name: string; totalSpent: number }>();
    
    for (const quotation of allQuotations) {
      const customer = allCustomers.find(c => c.id === quotation.customerId);
      if (customer) {
        const quotationTotal = quotation.total ?? 0;
        const existing = customerRevenue.get(customer.id);
        if (existing) {
          existing.totalSpent += quotationTotal;
        } else {
          customerRevenue.set(customer.id, {
            name: customer.name,
            totalSpent: quotationTotal,
          });
        }
      }
    }

    const topCustomers = Array.from(customerRevenue.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalQuotations,
      totalCustomers,
      totalRevenue,
      emailsSent,
      quotationsByStatus,
      revenueByMonth: [], // TODO: Implement monthly revenue
      topCustomers,
    };
  }

  // Service Catalog operations
  async createServiceCatalog(item: InsertServiceCatalog): Promise<ServiceCatalog> {
    const [catalogItem] = await db
      .insert(serviceCatalog)
      .values(item)
      .returning();
    return catalogItem;
  }

  async getUserServiceCatalog(userId: string): Promise<ServiceCatalog[]> {
    return await db
      .select()
      .from(serviceCatalog)
      .where(and(eq(serviceCatalog.userId, userId), eq(serviceCatalog.isActive, 1)))
      .orderBy(desc(serviceCatalog.createdAt));
  }

  async updateServiceCatalog(itemId: string, data: Partial<ServiceCatalog>): Promise<ServiceCatalog> {
    const [catalogItem] = await db
      .update(serviceCatalog)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceCatalog.id, itemId))
      .returning();
    return catalogItem;
  }

  async deleteServiceCatalog(itemId: string): Promise<void> {
    await db.delete(serviceCatalog).where(eq(serviceCatalog.id, itemId));
  }

  async bulkCreateServiceCatalog(items: InsertServiceCatalog[]): Promise<ServiceCatalog[]> {
    if (items.length === 0) return [];
    return await db.insert(serviceCatalog).values(items).returning();
  }

  // Price Lists operations
  async getUserPriceLists(userId: string): Promise<PriceList[]> {
    return await db
      .select()
      .from(priceLists)
      .where(and(eq(priceLists.userId, userId), eq(priceLists.isActive, 1)))
      .orderBy(desc(priceLists.createdAt));
  }

  async createPriceList(data: InsertPriceList): Promise<PriceList> {
    const [priceList] = await db
      .insert(priceLists)
      .values(data)
      .returning();
    return priceList;
  }

  async updatePriceList(id: string, data: Partial<PriceList>): Promise<PriceList> {
    const [priceList] = await db
      .update(priceLists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(priceLists.id, id))
      .returning();
    return priceList;
  }

  async deletePriceList(id: string): Promise<void> {
    await db.delete(priceLists).where(eq(priceLists.id, id));
  }

  // Bulk Campaign operations
  async createBulkCampaign(campaign: InsertBulkCampaign): Promise<BulkCampaign> {
    const [newCampaign] = await db
      .insert(bulkCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async getBulkCampaign(id: string): Promise<BulkCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(bulkCampaigns)
      .where(eq(bulkCampaigns.id, id));
    return campaign;
  }

  async getUserBulkCampaigns(userId: string): Promise<BulkCampaign[]> {
    return await db
      .select()
      .from(bulkCampaigns)
      .where(eq(bulkCampaigns.userId, userId))
      .orderBy(desc(bulkCampaigns.createdAt));
  }

  async updateBulkCampaign(campaignId: string, data: Partial<BulkCampaign>): Promise<BulkCampaign> {
    const [campaign] = await db
      .update(bulkCampaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bulkCampaigns.id, campaignId))
      .returning();
    return campaign;
  }

  async deleteBulkCampaign(campaignId: string): Promise<void> {
    await db.delete(bulkCampaigns).where(eq(bulkCampaigns.id, campaignId));
  }

  async getBulkCampaignWithDetails(campaignId: string): Promise<any | undefined> {
    const [campaign] = await db
      .select()
      .from(bulkCampaigns)
      .where(eq(bulkCampaigns.id, campaignId));

    if (!campaign) return undefined;

    const recipients = await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId));

    const attachments = await db
      .select()
      .from(campaignAttachments)
      .where(eq(campaignAttachments.campaignId, campaignId));

    return {
      ...campaign,
      recipients,
      attachments,
    };
  }

  // Campaign Recipient operations
  async createCampaignRecipients(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (recipients.length === 0) return [];
    return await db.insert(campaignRecipients).values(recipients).returning();
  }

  async getCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return await db
      .select()
      .from(campaignRecipients)
      .where(eq(campaignRecipients.campaignId, campaignId));
  }

  async updateCampaignRecipient(recipientId: string, data: Partial<CampaignRecipient>): Promise<CampaignRecipient> {
    const [recipient] = await db
      .update(campaignRecipients)
      .set(data)
      .where(eq(campaignRecipients.id, recipientId))
      .returning();
    return recipient;
  }

  // Campaign Attachment operations
  async createCampaignAttachment(attachment: InsertCampaignAttachment): Promise<CampaignAttachment> {
    const [newAttachment] = await db
      .insert(campaignAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getCampaignAttachments(campaignId: string): Promise<CampaignAttachment[]> {
    return await db
      .select()
      .from(campaignAttachments)
      .where(eq(campaignAttachments.campaignId, campaignId));
  }
}

export const storage = new DatabaseStorage();
