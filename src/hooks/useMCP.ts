/**
 * MCP React Hook
 * Provides a clean interface to the MCP service for React components
 */

import { useState, useEffect, useCallback } from "react";
import type { MCPServer, MCPTool, MCPToolCall, MCPToolResult } from "@/lib/mcp-types";
import {
  initMCPService,
  onConnectionChange,
  connectToServer,
  disconnectFromServer,
  executeTool,
  getAvailableTools,
  getToolsForModel,
  getMCPServers,
  addMCPServer,
  removeMCPServer,
  toggleMCPServer,
  updateServerConfig,
} from "@/services/mcp-service";
import {
  loadMCPConfig,
  saveMCPConfig,
  createServerFromTemplate,
  MCPTemplates,
  getTemplateById,
} from "@/lib/mcp-config";
import type { MCPServerTemplate } from "@/lib/mcp-types";

export function useMCP() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and subscribe to changes
  useEffect(() => {
    initMCPService();
    const unsubscribe = onConnectionChange((updatedServers) => {
      setServers(updatedServers);
      setTools(getAvailableTools());
    });
    return unsubscribe;
  }, []);

  // Connect to a server
  const connect = useCallback(async (serverId: string) => {
    setLoading(true);
    setError(null);
    const result = await connectToServer(serverId);
    if (!result.success) {
      setError(result.error || "Erreur de connexion");
    }
    setLoading(false);
    return result;
  }, []);

  // Disconnect from a server
  const disconnect = useCallback(async (serverId: string) => {
    setLoading(true);
    await disconnectFromServer(serverId);
    setLoading(false);
  }, []);

  // Execute a tool
  const execute = useCallback(async (call: MCPToolCall): Promise<MCPToolResult> => {
    const result = await executeTool(call);
    return result;
  }, []);

  // Add server from template
  const addFromTemplate = useCallback((template: MCPServerTemplate, customEnv?: Record<string, string>) => {
    const server = createServerFromTemplate(template, customEnv);
    addMCPServer(server);
    return server;
  }, []);

  // Add custom server
  const addCustomServer = useCallback((server: MCPServer) => {
    addMCPServer(server);
  }, []);

  // Remove server
  const removeServer = useCallback((serverId: string) => {
    removeMCPServer(serverId);
  }, []);

  // Toggle server
  const toggleServer = useCallback((serverId: string) => {
    toggleMCPServer(serverId);
  }, []);

  // Get tools for AI model
  const toolsForModel = useCallback(() => {
    return getToolsForModel();
  }, []);

  // Refresh state
  const refresh = useCallback(() => {
    setServers(getMCPServers());
    setTools(getAvailableTools());
  }, []);

  return {
    servers,
    tools,
    templates: MCPTemplates,
    loading,
    error,
    connect,
    disconnect,
    execute,
    addFromTemplate,
    addCustomServer,
    removeServer,
    toggleServer,
    getToolsForModel: toolsForModel,
    refresh,
  };
}

// Hook for MCP tools panel state
export function useMCPToolsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}