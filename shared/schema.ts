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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(), // admin or user
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
export const registerUserSchema = createInsertSchema(users).pick({
  username: true,
  firstName: true,
  lastName: true,
  email: true,
}).extend({
  password: z.string().min(6, "Password phải ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password không khớp",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username là bắt buộc"),
  password: z.string().min(1, "Password là bắt buộc"),
});

export const insertExecutionLogSchema = createInsertSchema(executionLogs).omit({
  id: true,
  executedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

// ============ QUOTATION MANAGEMENT MODULE ============

// Customer management
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  company: varchar("company", { length: 255 }),
  taxCode: varchar("tax_code", { length: 50 }),
  
  notes: text("notes"),
  isActive: integer("is_active").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotation templates (HTML với placeholders)
export const quotationTemplates = pgTable("quotation_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  htmlContent: text("html_content").notNull(),
  
  isActive: integer("is_active").default(1).notNull(),
  isDefault: integer("is_default").default(0).notNull(),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  
  isActive: integer("is_active").default(1).notNull(),
  isDefault: integer("is_default").default(0).notNull(),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotations
export const quotations = pgTable("quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  templateId: varchar("template_id").references(() => quotationTemplates.id),
  emailTemplateId: varchar("email_template_id").references(() => emailTemplates.id),
  
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  
  subtotal: integer("subtotal").notNull(),
  vatRate: integer("vat_rate").default(10).notNull(),
  vatAmount: integer("vat_amount").notNull(),
  discount: integer("discount").default(0).notNull(),
  total: integer("total").notNull(),
  
  validUntil: timestamp("valid_until").notNull(),
  
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  
  publicToken: varchar("public_token", { length: 64 }),
  
  notes: text("notes"),
  terms: text("terms"),
  
  watermarkType: varchar("watermark_type", { length: 20 }).default("none"),
  watermarkText: varchar("watermark_text", { length: 255 }),
  autoExpire: integer("auto_expire").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

// Quotation items
export const quotationItems = pgTable("quotation_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationId: varchar("quotation_id").notNull().references(() => quotations.id, { onDelete: "cascade" }),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  
  sortOrder: integer("sort_order").default(0).notNull(),
});

// SMTP configurations (encrypted passwords)
export const smtpConfigs = pgTable("smtp_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").notNull().default(587),
  secure: integer("secure").default(0).notNull(),
  
  username: varchar("username", { length: 255 }).notNull(),
  password: text("password").notNull(),
  
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }),
  
  isVerified: integer("is_verified").default(0).notNull(),
  lastTestedAt: timestamp("last_tested_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Storage configurations (Admin only)
export const storageConfigs = pgTable("storage_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  storageType: varchar("storage_type", { length: 20 }).notNull().default("local"),
  
  ftpHost: varchar("ftp_host", { length: 255 }),
  ftpPort: integer("ftp_port").default(21),
  ftpUsername: varchar("ftp_username", { length: 255 }),
  ftpPassword: text("ftp_password"),
  ftpPath: varchar("ftp_path", { length: 500 }),
  
  isActive: integer("is_active").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User settings (logo, watermark defaults)
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  logoUrl: varchar("logo_url", { length: 500 }),
  companyName: varchar("company_name", { length: 255 }),
  
  defaultWatermarkType: varchar("default_watermark_type", { length: 20 }).default("none"),
  defaultWatermarkText: varchar("default_watermark_text", { length: 255 }),
  defaultAutoExpire: integer("default_auto_expire").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price Lists (manage multiple price lists)
export const priceLists = pgTable("price_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  isActive: integer("is_active").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Catalog (imported from price list)
export const serviceCatalog = pgTable("service_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  priceListId: varchar("price_list_id").references(() => priceLists.id, { onDelete: "cascade" }),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unitPrice: integer("unit_price").notNull(),
  unit: varchar("unit", { length: 255 }),
  category: varchar("category", { length: 255 }),
  
  isActive: integer("is_active").default(1).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============ BULK EMAIL CAMPAIGN MODULE ============

// Bulk Email Campaigns
export const bulkCampaigns = pgTable("bulk_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  quotationTemplateId: varchar("quotation_template_id").references(() => quotationTemplates.id),
  smtpConfigId: varchar("smtp_config_id").references(() => smtpConfigs.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  
  totalRecipients: integer("total_recipients").default(0).notNull(),
  sentCount: integer("sent_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  estimatedCredits: integer("estimated_credits").default(0).notNull(),
  actualCredits: integer("actual_credits").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Recipients
export const campaignRecipients = pgTable("campaign_recipients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => bulkCampaigns.id, { onDelete: "cascade" }),
  
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  customData: jsonb("custom_data"),
  
  attachmentFilename: varchar("attachment_filename", { length: 500 }),
  
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Attachments
export const campaignAttachments = pgTable("campaign_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => bulkCampaigns.id, { onDelete: "cascade" }),
  
  filename: varchar("filename", { length: 500 }).notNull(),
  storagePath: varchar("storage_path", { length: 1000 }).notNull(),
  fileSize: integer("file_size").notNull(),
  
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Relations for quotation module
export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  quotations: many(quotations),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  user: one(users, {
    fields: [quotations.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [quotations.customerId],
    references: [customers.id],
  }),
  template: one(quotationTemplates, {
    fields: [quotations.templateId],
    references: [quotationTemplates.id],
  }),
  emailTemplate: one(emailTemplates, {
    fields: [quotations.emailTemplateId],
    references: [emailTemplates.id],
  }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
}));

// Bulk campaign relations
export const bulkCampaignsRelations = relations(bulkCampaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [bulkCampaigns.userId],
    references: [users.id],
  }),
  quotationTemplate: one(quotationTemplates, {
    fields: [bulkCampaigns.quotationTemplateId],
    references: [quotationTemplates.id],
  }),
  smtpConfig: one(smtpConfigs, {
    fields: [bulkCampaigns.smtpConfigId],
    references: [smtpConfigs.id],
  }),
  recipients: many(campaignRecipients),
  attachments: many(campaignAttachments),
}));

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(bulkCampaigns, {
    fields: [campaignRecipients.campaignId],
    references: [bulkCampaigns.id],
  }),
}));

export const campaignAttachmentsRelations = relations(campaignAttachments, ({ one }) => ({
  campaign: one(bulkCampaigns, {
    fields: [campaignAttachments.campaignId],
    references: [bulkCampaigns.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
});

export const insertQuotationTemplateSchema = createInsertSchema(quotationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmtpConfigSchema = createInsertSchema(smtpConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorageConfigSchema = createInsertSchema(storageConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceListSchema = createInsertSchema(priceLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBulkCampaignSchema = createInsertSchema(bulkCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignAttachmentSchema = createInsertSchema(campaignAttachments).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;

// Quotation module types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;
export type QuotationTemplate = typeof quotationTemplates.$inferSelect;
export type InsertQuotationTemplate = z.infer<typeof insertQuotationTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type SmtpConfig = typeof smtpConfigs.$inferSelect;
export type InsertSmtpConfig = z.infer<typeof insertSmtpConfigSchema>;
export type StorageConfig = typeof storageConfigs.$inferSelect;
export type InsertStorageConfig = z.infer<typeof insertStorageConfigSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type PriceList = typeof priceLists.$inferSelect;
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type ServiceCatalog = typeof serviceCatalog.$inferSelect;
export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;

// Bulk campaign types
export type BulkCampaign = typeof bulkCampaigns.$inferSelect;
export type InsertBulkCampaign = z.infer<typeof insertBulkCampaignSchema>;
export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = z.infer<typeof insertCampaignRecipientSchema>;
export type CampaignAttachment = typeof campaignAttachments.$inferSelect;
export type InsertCampaignAttachment = z.infer<typeof insertCampaignAttachmentSchema>;
