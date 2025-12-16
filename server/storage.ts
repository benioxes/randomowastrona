import { type Workspace, type InsertWorkspace, workspaces } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Workspaces
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getAllWorkspaces(): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);
    return workspace;
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    return db.select().from(workspaces);
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db
      .insert(workspaces)
      .values(insertWorkspace)
      .returning();
    return workspace;
  }

  async updateWorkspace(
    id: string,
    updates: Partial<InsertWorkspace>
  ): Promise<Workspace | undefined> {
    const [workspace] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await db
      .delete(workspaces)
      .where(eq(workspaces.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
