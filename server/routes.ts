import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertExecutionLogSchema } from "@shared/schema";

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      res.json(users);
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
      res.json(user);
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

  const httpServer = createServer(app);
  return httpServer;
}
