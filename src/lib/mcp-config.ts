/**
 * MCP Configuration and Server Templates
 * Manages available MCP servers and their configurations
 */

import type { MCPServer, MCPServerTemplate, MCPConfig } from "./mcp-types";

const STORAGE_KEY = "forma_mcp_config";

// Predefined server templates
export const MCPTemplates: MCPServerTemplate[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Lecture et écriture de fichiers locaux",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    envKeys: [],
    defaultEnabled: false,
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Recherche d'informations sur le web",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-web-search"],
    envKeys: ["BRAVE_API_KEY"],
    defaultEnabled: false,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Calculatrice pour opérations mathématiques",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-calculator"],
    envKeys: [],
    defaultEnabled: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Intégration Slack pour notifications",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    envKeys: ["SLACK_BOT_TOKEN", "SLACK_TEAM_ID"],
    defaultEnabled: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Intégration GitHub pour gestion de code",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    envKeys: ["GITHUB_PERSONAL_ACCESS_TOKEN"],
    defaultEnabled: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Intégration Notion pour la gestion de notes",
    command: "npx",
    args: ["-y", "@notionhq/mcp-server"],
    envKeys: ["NOTION_API_KEY"],
    defaultEnabled: false,
  },
];

// Default configuration
export const defaultMCPConfig: MCPConfig = {
  servers: [],
  activeTools: [],
};

// Load MCP configuration from localStorage
export function loadMCPConfig(): MCPConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MCPConfig;
      // Validate structure
      if (Array.isArray(parsed.servers) && Array.isArray(parsed.activeTools)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load MCP config:", e);
  }
  return { ...defaultMCPConfig };
}

// Save MCP configuration to localStorage
export function saveMCPConfig(config: MCPConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save MCP config:", e);
  }
}

// Create a new server from a template
export function createServerFromTemplate(
  template: MCPServerTemplate,
  customEnv?: Record<string, string>
): MCPServer {
  const env: Record<string, string> = {};
  for (const key of template.envKeys) {
    // Check for existing env vars first, then use custom or empty
    env[key] = customEnv?.[key] ?? import.meta.env[key] ?? "";
  }

  return {
    id: `${template.id}-${Date.now()}`,
    name: template.name,
    description: template.description,
    command: template.command,
    args: template.args,
    env,
    enabled: template.defaultEnabled,
    status: "disconnected",
  };
}

// Validate a server configuration
export function validateServerConfig(server: MCPServer): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!server.name.trim()) {
    errors.push("Le nom du serveur est requis");
  }

  if (!server.command.trim()) {
    errors.push("La commande est requise");
  }

  if (server.args.length === 0) {
    errors.push("Au moins un argument est requis");
  }

  // Check required env vars
  for (const [key, value] of Object.entries(server.env)) {
    if (value.startsWith("${") && value.endsWith("}")) {
      // This is a placeholder that needs to be filled
      const envKey = value.slice(2, -1);
      if (!import.meta.env[envKey] && !server.env[envKey]) {
        errors.push(`La variable d'environnement ${envKey} est requise`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get template by ID
export function getTemplateById(id: string): MCPServerTemplate | undefined {
  return MCPTemplates.find((t) => t.id === id);
}

// Update server in config
export function updateServer(config: MCPConfig, updatedServer: MCPServer): MCPConfig {
  return {
    ...config,
    servers: config.servers.map((s) => (s.id === updatedServer.id ? updatedServer : s)),
  };
}

// Add server to config
export function addServer(config: MCPConfig, server: MCPServer): MCPConfig {
  return {
    ...config,
    servers: [...config.servers, server],
  };
}

// Remove server from config
export function removeServer(config: MCPConfig, serverId: string): MCPConfig {
  return {
    ...config,
    servers: config.servers.filter((s) => s.id !== serverId),
    activeTools: config.activeTools.filter((t) => !t.startsWith(serverId)),
  };
}

// Toggle server enabled state
export function toggleServer(config: MCPConfig, serverId: string): MCPConfig {
  return {
    ...config,
    servers: config.servers.map((s) =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    ),
  };
}

// Get enabled servers
export function getEnabledServers(config: MCPConfig): MCPServer[] {
  return config.servers.filter((s) => s.enabled && s.status === "connected");
}