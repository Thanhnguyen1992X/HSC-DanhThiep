import { db } from "./db";
import {
  employees,
  cardViews,
  type Employee,
  type InsertEmployee,
  type UpdateEmployeeRequest,
  type CardView,
  type InsertCardView
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  
  trackView(view: InsertCardView): Promise<CardView>;
  getAnalyticsSummary(): Promise<{
    totalViews: number;
    viewsBySource: { source: string; count: number }[];
    topEmployees: { employeeId: string; fullName: string; viewCount: number }[];
    recentViews: { date: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: string, updates: UpdateEmployeeRequest): Promise<Employee> {
    const [updated] = await db.update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: string): Promise<void> {
    // remove any analytics entries first (FK constraint)
    await db.delete(cardViews).where(eq(cardViews.employeeId, id));
    await db.delete(employees).where(eq(employees.id, id));
  }

  async trackView(view: InsertCardView): Promise<CardView> {
    const [created] = await db.insert(cardViews).values(view).returning();
    return created;
  }

  async getAnalyticsSummary() {
    // Total views
    const [{ count }] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(cardViews);
    
    // Views by source
    const sourceStats = await db.select({
      source: cardViews.source,
      count: sql<number>`cast(count(*) as integer)`
    }).from(cardViews).groupBy(cardViews.source);

    // Top employees
    const topEmpStats = await db.execute(sql`
      SELECT e.id as "employeeId", e.full_name as "fullName", count(v.id) as "viewCount"
      FROM employees e
      LEFT JOIN card_views v ON e.id = v.employee_id
      GROUP BY e.id, e.full_name
      ORDER BY "viewCount" DESC
      LIMIT 10
    `);

    // Recent views (last 7 days by date)
    const recent = await db.execute(sql`
      SELECT date_trunc('day', viewed_at) as date, count(*) as count
      FROM card_views
      WHERE viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date ASC
    `);

    return {
      totalViews: count,
      viewsBySource: sourceStats,
      topEmployees: topEmpStats.rows.map(r => ({
        employeeId: String(r.employeeId),
        fullName: String(r.fullName),
        viewCount: Number(r.viewCount)
      })),
      recentViews: recent.rows.map(r => ({
        date: String(r.date),
        count: Number(r.count)
      }))
    };
  }
}

export const storage = new DatabaseStorage();
