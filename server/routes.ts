import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "super-secret-key-for-dev";

// Middleware to verify JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // PUBLIC ENDPOINTS
  app.get(api.public.getEmployee.path, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    if (!employee.isActive) {
      return res.status(404).json({ message: "Employee card is inactive" });
    }
    res.status(200).json(employee);
  });

  app.post(api.analytics.track.path, async (req, res) => {
    try {
      const input = api.analytics.track.input.parse(req.body);
      
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await storage.trackView({
        employeeId: input.employeeId,
        source: input.source,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : Array.isArray(ipAddress) ? ipAddress[0] : null,
        userAgent: typeof userAgent === 'string' ? userAgent : null
      });
      
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ADMIN AUTH
  app.post(api.admin.login.path, async (req, res) => {
    try {
      const input = api.admin.login.input.parse(req.body);
      
      // Default admin credentials as requested
      if (input.username === "admin" && input.password === "admin123") {
        const token = jwt.sign({ username: input.username, role: "admin" }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({ token, message: "Login successful" });
      }
      
      res.status(401).json({ message: "Invalid credentials" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PROTECTED ADMIN ENDPOINTS
  app.get(api.employees.list.path, authenticateToken, async (req, res) => {
    const employees = await storage.getEmployees();
    res.status(200).json(employees);
  });

  app.get(api.employees.get.path, authenticateToken, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  });

  app.post(api.employees.create.path, authenticateToken, async (req, res) => {
    try {
      const input = api.employees.create.input.parse(req.body);
      
      // Check if employee ID already exists
      const existing = await storage.getEmployee(input.id);
      if (existing) {
        return res.status(400).json({ message: "Employee ID already exists", field: "id" });
      }
      
      const employee = await storage.createEmployee(input);
      res.status(201).json(employee);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.employees.update.path, authenticateToken, async (req, res) => {
    try {
      const input = api.employees.update.input.parse(req.body);
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updated = await storage.updateEmployee(req.params.id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.employees.delete.path, authenticateToken, async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    await storage.deleteEmployee(req.params.id);
    res.status(204).end();
  });

  app.patch(api.employees.toggleActive.path, authenticateToken, async (req, res) => {
    try {
      const input = api.employees.toggleActive.input.parse(req.body);
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      const updated = await storage.updateEmployee(req.params.id, { isActive: input.isActive });
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get(api.analytics.summary.path, authenticateToken, async (req, res) => {
    const summary = await storage.getAnalyticsSummary();
    res.status(200).json(summary);
  });

  // Seed DB Function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existing = await storage.getEmployees();
    if (existing.length === 0) {
      const seedEmployees = [
        {
          id: "123",
          fullName: "Nguyễn Văn A",
          position: "Giám đốc Kinh doanh",
          department: "Phòng Kinh Doanh",
          email: "nguyenvana@hsc.com.vn",
          phone: "0901234567",
          phoneExt: "101",
          avatarUrl: "",
          companyName: "HSC",
          linkedinUrl: "https://linkedin.com/in/nguyenvana",
          zaloPhone: "0901234567",
          websiteUrl: "https://hsc.com.vn",
          isActive: true
        },
        {
          id: "456",
          fullName: "Trần Thị B",
          position: "Kế toán trưởng",
          department: "Phòng Tài Chính",
          email: "tranthib@hsc.com.vn",
          phone: "0912345678",
          phoneExt: "102",
          avatarUrl: "",
          companyName: "HSC",
          linkedinUrl: "https://linkedin.com/in/tranthib",
          zaloPhone: "0912345678",
          websiteUrl: "https://hsc.com.vn",
          isActive: true
        },
        {
          id: "001",
          fullName: "Lê Minh C",
          position: "Giám đốc điều hành",
          department: "Ban Giám Đốc",
          email: "leminhc@hsc.com.vn",
          phone: "0923456789",
          phoneExt: "100",
          avatarUrl: "",
          companyName: "HSC",
          linkedinUrl: "https://linkedin.com/in/leminhc",
          zaloPhone: "0923456789",
          websiteUrl: "https://hsc.com.vn",
          isActive: true
        }
      ];

      for (const emp of seedEmployees) {
        await storage.createEmployee(emp);
      }
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
