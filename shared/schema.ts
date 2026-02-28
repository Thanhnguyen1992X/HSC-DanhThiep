import { pgTable, text, varchar, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id", { length: 50 }).primaryKey(), // Mã NV, ví dụ: "123", "NV001"
  fullName: varchar("full_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  phoneExt: varchar("phone_ext", { length: 20 }),
  avatarUrl: text("avatar_url"),
  companyName: varchar("company_name", { length: 255 }).default("HSC").notNull(),
  companyLogoUrl: text("company_logo_url"),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  zaloPhone: varchar("zalo_phone", { length: 50 }),
  websiteUrl: varchar("website_url", { length: 255 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cardViews = pgTable("card_views", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).references(() => employees.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  source: varchar("source", { length: 20 }).notNull(), // 'qr', 'nfc', 'direct', 'unknown'
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ createdAt: true, updatedAt: true });
export const insertCardViewSchema = createInsertSchema(cardViews).omit({ id: true, viewedAt: true });

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type UpdateEmployeeRequest = Partial<InsertEmployee>;

export type CardView = typeof cardViews.$inferSelect;
export type InsertCardView = z.infer<typeof insertCardViewSchema>;

// Admin auth
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
