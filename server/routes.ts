import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkspaceSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import { processAetherCommand } from "./openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // WebSocket setup for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    clients.add(ws);

    ws.on("message", (message) => {
      // Broadcast to all other clients
      const data = message.toString();
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket connection closed");
    });
  });

  // AI Terminal endpoint
  app.post("/api/ai/command", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await processAetherCommand(message);
      res.json(result);
    } catch (error) {
      console.error("AI command error:", error);
      res.status(500).json({ error: "Failed to process command" });
    }
  });

  // Workspace CRUD routes
  app.get("/api/workspaces", async (req, res) => {
    try {
      const workspaces = await storage.getAllWorkspaces();
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  app.get("/api/workspaces/:id", async (req, res) => {
    try {
      const workspace = await storage.getWorkspace(req.params.id);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  app.post("/api/workspaces", async (req, res) => {
    try {
      const validatedData = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace(validatedData);
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(400).json({ error: "Invalid workspace data" });
    }
  });

  app.patch("/api/workspaces/:id", async (req, res) => {
    try {
      const validatedData = insertWorkspaceSchema.partial().parse(req.body);
      const workspace = await storage.updateWorkspace(req.params.id, validatedData);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.json(workspace);
    } catch (error) {
      console.error("Error updating workspace:", error);
      res.status(400).json({ error: "Invalid workspace data" });
    }
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteWorkspace(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).json({ error: "Failed to delete workspace" });
    }
  });

  return httpServer;
}
