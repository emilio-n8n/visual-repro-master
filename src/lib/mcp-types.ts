/**
 * MCP (Model Context Protocol) Types
 * Defines the core types for MCP server configuration and tool definitions
 */

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
  status: "disconnected" | "connecting" | "connected" | "error";
  lastError?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPInputSchema;
  serverId: string;
  serverName: string;
}

export interface MCPInputSchema {
  type: "object";
  properties: Record<string, MCPProperty>;
  required?: string[];
}

export interface MCPProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: { type: string };
}

export interface MCPToolCall {
  tool: string;
  input: Record<string, unknown>;
  serverId: string;
}

export interface MCPToolResult {
  success: boolean;
  content: unknown;
  error?: string;
}

export interface MCPConfig {
  servers: MCPServer[];
  activeTools: string[];
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  envKeys: string[];
  defaultEnabled: boolean;
}

// MCP Protocol Message Types
export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

// MCP Initialize result
export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}