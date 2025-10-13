import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth } from "./localAuth";
import { insertExecutionLogSchema, registerUserSchema, loginUserSchema } from "@shared/schema";
import passport from "passport";
import type { User } from "@shared/schema";

// Sanitize user object by removing sensitive fields
const sanitizeUser = (user: User | null): Omit<User, 'passwordHash'> | null => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

// Auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please login" });
};

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Local Auth
  setupLocalAuth(app);

  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username đã tồn tại" });
      }

      const user = await storage.registerUser(validatedData);
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Đăng ký thành công nhưng đăng nhập thất bại" });
        }
        res.json(sanitizeUser(user));
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error.errors?.[0]?.message || "Đăng ký thất bại" 
      });
    }
  });

  // Login route
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Lỗi đăng nhập" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Đăng nhập thất bại" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Lỗi đăng nhập" });
        }
        res.json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Template routes
  app.get("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Execute workflow
  app.post("/api/execute", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { templateId, inputData } = req.body;

      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      // Get template and user
      const template = await storage.getTemplate(templateId);
      const user = await storage.getUser(userId);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has enough credits
      if (user.credits < template.creditCost) {
        return res.status(400).json({ 
          message: "Không đủ credits để thực thi tính năng này" 
        });
      }

      // Deduct credits
      const newCredits = user.credits - template.creditCost;
      await storage.updateUserCredits(userId, newCredits);

      // Create execution log
      const executionLog = await storage.createExecutionLog({
        userId,
        templateId,
        status: "success",
        creditsUsed: template.creditCost,
        inputData: inputData || {},
        resultData: {
          success: true,
          message: "Workflow executed successfully",
          timestamp: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        executionLog,
        remainingCredits: newCredits,
      });
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  // Execution logs
  app.get("/api/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const logs = await storage.getUserExecutionLogs(userId);
      
      // Enrich logs with template data
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const template = await storage.getTemplate(log.templateId);
          return {
            ...log,
            template,
          };
        })
      );

      res.json(enrichedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch execution logs" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(user => sanitizeUser(user));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { credits, role } = req.body;
      
      // Validate and whitelist allowed fields
      const updates: any = {};
      if (credits !== undefined && typeof credits === 'number' && credits >= 0) {
        updates.credits = credits;
      }
      if (role !== undefined && (role === 'user' || role === 'admin')) {
        updates.role = role;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const user = await storage.updateUser(id, updates);
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get all templates (admin only, including inactive)
  app.get("/api/admin/templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllTemplatesAdmin();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Create template (admin only)
  app.post("/api/admin/templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const template = await storage.createTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update template (admin only)
  app.patch("/api/admin/templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, creditCost, nameVi, descriptionVi } = req.body;
      
      // Validate and whitelist allowed fields
      const updates: any = {};
      if (isActive !== undefined && (isActive === 0 || isActive === 1)) {
        updates.isActive = isActive;
      }
      if (creditCost !== undefined && typeof creditCost === 'number' && creditCost >= 0) {
        updates.creditCost = creditCost;
      }
      if (nameVi !== undefined && typeof nameVi === 'string') {
        updates.nameVi = nameVi;
      }
      if (descriptionVi !== undefined && typeof descriptionVi === 'string') {
        updates.descriptionVi = descriptionVi;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const template = await storage.updateTemplate(id, updates);
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template (admin only)
  app.delete("/api/admin/templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Get admin stats
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ============ QUOTATION MODULE ROUTES ============
  
  // Customer routes
  app.post("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const customerData = {
        ...req.body,
        userId: req.user.id,
      };
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const customers = await storage.getUserCustomers(req.user.id);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer || customer.userId !== req.user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.patch("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer || customer.userId !== req.user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Whitelist mutable fields only
      const { name, email, phone, address, company, taxCode, notes } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (company !== undefined) updates.company = company;
      if (taxCode !== undefined) updates.taxCode = taxCode;
      if (notes !== undefined) updates.notes = notes;
      
      const updatedCustomer = await storage.updateCustomer(req.params.id, updates);
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer || customer.userId !== req.user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      await storage.deleteCustomer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Bulk import customers from CSV data
  app.post("/api/customers/bulk-import", isAuthenticated, async (req: any, res) => {
    try {
      const { customers: customersData } = req.body;
      
      if (!Array.isArray(customersData) || customersData.length === 0) {
        return res.status(400).json({ message: "Invalid data: customers array required" });
      }

      const results: {
        success: Array<{ row: number; customer: any }>;
        errors: Array<{ row: number; data: any; error: string }>;
      } = {
        success: [],
        errors: [],
      };

      for (let i = 0; i < customersData.length; i++) {
        const row = customersData[i];
        try {
          // Trim and normalize all string values
          const trimmedRow = Object.keys(row).reduce((acc, key) => {
            acc[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            return acc;
          }, {} as any);

          // Validate required fields (after trim)
          if (!trimmedRow.name || !trimmedRow.email) {
            results.errors.push({
              row: i + 1,
              data: trimmedRow,
              error: "Missing required fields: name and email",
            });
            continue;
          }

          const customerData = {
            userId: req.user.id,
            name: trimmedRow.name,
            email: trimmedRow.email,
            phone: trimmedRow.phone || null,
            address: trimmedRow.address || null,
            company: trimmedRow.company || null,
            taxCode: trimmedRow.taxCode || null,
            notes: trimmedRow.notes || null,
          };

          const customer = await storage.createCustomer(customerData);
          results.success.push({ row: i + 1, customer });
        } catch (error: any) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: error.message || "Failed to create customer",
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error bulk importing customers:", error);
      res.status(500).json({ message: "Failed to import customers" });
    }
  });

  // Quotation routes
  app.post("/api/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const quotationNumber = await storage.generateQuotationNumber();
      const { items, ...data } = req.body;
      
      // Validate customer ownership
      if (!data.customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }
      const customer = await storage.getCustomer(data.customerId);
      if (!customer || customer.userId !== req.user.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Validate and compute totals server-side from items
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Quotation must have at least one item" });
      }
      
      let subtotal = 0;
      for (const item of items) {
        if (!item.name || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
          return res.status(400).json({ message: "Invalid item data" });
        }
        subtotal += item.quantity * item.unitPrice;
      }
      
      const discount = Math.max(0, data.discount || 0);
      const vatRate = Math.max(0, data.vatRate || 10);
      const discountAmount = subtotal * (discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const vatAmount = Math.round(taxableAmount * (vatRate / 100));
      const total = Math.round(taxableAmount + vatAmount);
      
      const quotationData = {
        userId: req.user.id,
        quotationNumber,
        customerId: data.customerId,
        templateId: data.templateId || null,
        emailTemplateId: data.emailTemplateId || null,
        title: data.title,
        validUntil: data.validUntil ? (data.validUntil instanceof Date ? data.validUntil : new Date(data.validUntil)) : new Date(),
        status: data.status || 'draft',
        notes: data.notes || null,
        terms: data.terms || null,
        watermarkType: data.watermarkType || 'none',
        watermarkText: data.watermarkText || null,
        autoExpire: data.autoExpire !== undefined ? data.autoExpire : 1,
        subtotal,
        discount,
        vatRate,
        vatAmount,
        total,
      };
      
      const quotation = await storage.createQuotation(quotationData);
      
      // Create quotation items with server-computed values
      for (const item of items) {
        await storage.createQuotationItem({
          name: item.name,
          description: item.description || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          sortOrder: item.sortOrder || 0,
          quotationId: quotation.id,
        });
      }
      
      res.json(quotation);
    } catch (error) {
      console.error("Error creating quotation:", error);
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.get("/api/quotations", isAuthenticated, async (req: any, res) => {
    try {
      const quotations = await storage.getUserQuotations(req.user.id);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation || quotation.userId !== req.user.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      const items = await storage.getQuotationItems(quotation.id);
      const customer = await storage.getCustomer(quotation.customerId);
      
      res.json({
        ...quotation,
        items,
        customer,
      });
    } catch (error) {
      console.error("Error fetching quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.patch("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation || quotation.userId !== req.user.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      const { items, ...data } = req.body;
      
      // Validate customer ownership if customerId is being updated
      if (data.customerId !== undefined && data.customerId !== quotation.customerId) {
        const customer = await storage.getCustomer(data.customerId);
        if (!customer || customer.userId !== req.user.id) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Whitelist mutable fields
      const updates: any = {};
      if (data.customerId !== undefined) updates.customerId = data.customerId;
      if (data.templateId !== undefined) updates.templateId = data.templateId;
      if (data.emailTemplateId !== undefined) updates.emailTemplateId = data.emailTemplateId;
      if (data.title !== undefined) updates.title = data.title;
      if (data.validUntil !== undefined) {
        updates.validUntil = data.validUntil instanceof Date ? data.validUntil : new Date(data.validUntil);
      }
      if (data.status !== undefined) updates.status = data.status;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.terms !== undefined) updates.terms = data.terms;
      if (data.watermarkType !== undefined) updates.watermarkType = data.watermarkType;
      if (data.watermarkText !== undefined) updates.watermarkText = data.watermarkText;
      if (data.autoExpire !== undefined) updates.autoExpire = data.autoExpire;
      
      // Re-compute totals if items are provided
      if (items && Array.isArray(items) && items.length > 0) {
        let subtotal = 0;
        for (const item of items) {
          if (!item.name || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
            return res.status(400).json({ message: "Invalid item data" });
          }
          subtotal += item.quantity * item.unitPrice;
        }
        
        const discount = Math.max(0, data.discount !== undefined ? data.discount : quotation.discount);
        const vatRate = Math.max(0, data.vatRate !== undefined ? data.vatRate : quotation.vatRate);
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const vatAmount = Math.round(taxableAmount * (vatRate / 100));
        const total = Math.round(taxableAmount + vatAmount);
        
        updates.subtotal = subtotal;
        updates.discount = discount;
        updates.vatRate = vatRate;
        updates.vatAmount = vatAmount;
        updates.total = total;
        
        // Delete existing items and create new ones
        await storage.deleteQuotationItems(req.params.id);
        
        for (const item of items) {
          await storage.createQuotationItem({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            sortOrder: item.sortOrder || 0,
            quotationId: req.params.id,
          });
        }
      } else if (data.discount !== undefined || data.vatRate !== undefined) {
        // If only discount/vatRate changed, re-compute from existing subtotal
        const discount = Math.max(0, data.discount !== undefined ? data.discount : quotation.discount);
        const vatRate = Math.max(0, data.vatRate !== undefined ? data.vatRate : quotation.vatRate);
        const subtotal = quotation.subtotal;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const vatAmount = Math.round(taxableAmount * (vatRate / 100));
        const total = Math.round(taxableAmount + vatAmount);
        
        updates.discount = discount;
        updates.vatRate = vatRate;
        updates.vatAmount = vatAmount;
        updates.total = total;
      }
      
      const updatedQuotation = await storage.updateQuotation(req.params.id, updates);
      res.json(updatedQuotation);
    } catch (error) {
      console.error("Error updating quotation:", error);
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const quotation = await storage.getQuotation(req.params.id);
      if (!quotation || quotation.userId !== req.user.id) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      await storage.deleteQuotation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quotation:", error);
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
