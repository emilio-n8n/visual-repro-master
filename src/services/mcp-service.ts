/**
 * MCP Service
 * Manages MCP server connections, tool discovery, and tool execution
 */

import type {
  MCPServer,
  MCPTool,
  MCPToolCall,
  MCPToolResult,
  MCPRequest,
  MCPResponse,
  MCPInitializeResult,
} from "@/lib/mcp-types";
import { loadMCPConfig, saveMCPConfig, getEnabledServers } from "@/lib/mcp-config";

type ToolCache = Map<string, MCPTool[]>;
type ConnectionHandle = Map<string, { process: unknown; requestId: number }>;

// Singleton state
const serverConnections: ConnectionHandle = new Map();
const toolCache: ToolCache = new Map();
let config = loadMCPConfig();
const connectionListeners: ((servers: MCPServer[]) => void)[] = [];

// Event emitter for connection status changes
export function onConnectionChange(callback: (servers: MCPServer[]) => void): () => void {
  connectionListeners.push(callback);
  // Immediately call with current state
  callback(config.servers);
  return () => {
    connectionListeners = connectionListeners.filter((l) => l !== callback);
  };
}

function notifyConnectionChange(): void {
  connectionListeners.forEach((l) => l([...config.servers]));
}

/**
 * Initialize MCP service - starts enabled servers
 */
export async function initMCPService(): Promise<void> {
  config = loadMCPConfig();
  for (const server of config.servers) {
    if (server.enabled && server.status !== "connected") {
      // Don't auto-connect on init to avoid performance issues
      // Let user manually connect or connect on first use
      server.status = "disconnected";
    }
  }
  saveMCPConfig(config);
  notifyConnectionChange();
}

/**
 * Connect to an MCP server
 * Note: Since browsers can't spawn processes, this simulates the connection
 * In production, this would be handled by the backend edge function
 */
export async function connectToServer(serverId: string): Promise<{ success: boolean; error?: string }> {
  const server = config.servers.find((s) => s.id === serverId);
  if (!server) {
    return { success: false, error: "Serveur non trouvé" };
  }

  // Update status to connecting
  updateServerStatus(serverId, "connecting");

  try {
    // Simulate connection (in real app, this would call the backend)
    // For now, we mark as connected and provide mock tools
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock tool discovery based on server type
    const tools = discoverMockTools(server);
    toolCache.set(serverId, tools);

    updateServerStatus(serverId, "connected");
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur de connexion";
    updateServerStatus(serverId, "error", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Disconnect from an MCP server
 */
export async function disconnectFromServer(serverId: string): Promise<void> {
  const server = config.servers.find((s) => s.id === serverId);
  if (!server) return;

  // Clean up connection
  serverConnections.delete(serverId);
  toolCache.delete(serverId);

  // Update status
  server.status = "disconnected";
  server.lastError = undefined;
  saveMCPConfig(config);
  notifyConnectionChange();
}

/**
 * Execute an MCP tool
 */
export async function executeTool(call: MCPToolCall): Promise<MCPToolResult> {
  const server = config.servers.find((s) => s.id === call.serverId);
  if (!server) {
    return { success: false, content: null, error: "Serveur non trouvé" };
  }

  if (server.status !== "connected") {
    return { success: false, content: null, error: "Serveur non connecté" };
  }

  try {
    // In a real implementation, this would send the request to the backend
    // which would then communicate with the MCP server via stdio
    const result = await mockToolExecution(call);

    return {
      success: true,
      content: result,
    };
  } catch (error) {
    return {
      success: false,
      content: null,
      error: error instanceof Error ? error.message : "Erreur d'exécution",
    };
  }
}

/**
 * Get all available tools from connected servers
 */
export function getAvailableTools(): MCPTool[] {
  const allTools: MCPTool[] = [];
  for (const [serverId, tools] of toolCache.entries()) {
    const server = config.servers.find((s) => s.id === serverId);
    if (server?.status === "connected") {
      allTools.push(...tools);
    }
  }
  return allTools;
}

/**
 * Get tools formatted for the AI model
 */
export function getToolsForModel(): unknown[] {
  return getAvailableTools().map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

/**
 * Get current server configuration
 */
export function getMCPServers(): MCPServer[] {
  return [...config.servers];
}

/**
 * Update server configuration
 */
export function updateServerConfig(servers: MCPServer[]): void {
  config.servers = servers;
  saveMCPConfig(config);
  notifyConnectionChange();
}

/**
 * Add a new server
 */
export function addMCPServer(server: MCPServer): void {
  config.servers.push(server);
  saveMCPConfig(config);
  notifyConnectionChange();
}

/**
 * Remove a server
 */
export function removeMCPServer(serverId: string): void {
  // Disconnect if connected
  if (serverConnections.has(serverId)) {
    disconnectFromServer(serverId);
  }

  config.servers = config.servers.filter((s) => s.id !== serverId);
  saveMCPConfig(config);
  notifyConnectionChange();
}

/**
 * Toggle server enabled state
 */
export function toggleMCPServer(serverId: string): void {
  config.servers = config.servers.map((s) =>
    s.id === serverId ? { ...s, enabled: !s.enabled } : s
  );
  saveMCPConfig(config);
  notifyConnectionChange();
}

// Helper functions

function updateServerStatus(serverId: string, status: MCPServer["status"], error?: string): void {
  const server = config.servers.find((s) => s.id === serverId);
  if (server) {
    server.status = status;
    server.lastError = error;
    saveMCPConfig(config);
    notifyConnectionChange();
  }
}

// Mock tool discovery - in production this would come from the MCP server
function discoverMockTools(server: MCPServer): MCPTool[] {
  const serverTools: Record<string, MCPTool[]> = {
    filesystem: [
      {
        name: "read_file",
        description: "Lire le contenu d'un fichier",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Chemin du fichier" },
          },
          required: ["path"],
        },
        serverId: server.id,
        serverName: server.name,
      },
      {
        name: "write_file",
        description: "Écrire du contenu dans un fichier",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Chemin du fichier" },
            content: { type: "string", description: "Contenu à écrire" },
          },
          required: ["path", "content"],
        },
        serverId: server.id,
        serverName: server.name,
      },
      {
        name: "list_directory",
        description: "Lister le contenu d'un répertoire",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Chemin du répertoire" },
          },
          required: ["path"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
    "web-search": [
      {
        name: "web_search",
        description: "Rechercher des informations sur le web",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Requête de recherche" },
            num_results: { type: "number", description: "Nombre de résultats", default: 5 },
          },
          required: ["query"],
        },
        serverId: server.id,
        serverName: server.name,
      },
      {
        name: "fetch_url",
        description: "Récupérer le contenu d'une page web",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL de la page" },
          },
          required: ["url"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
    calculator: [
      {
        name: "calculate",
        description: "Effectuer un calcul mathématique",
        inputSchema: {
          type: "object",
          properties: {
            expression: { type: "string", description: "Expression mathématique" },
          },
          required: ["expression"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
    slack: [
      {
        name: "send_slack_message",
        description: "Envoyer un message sur Slack",
        inputSchema: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Canal ou utilisateur" },
            text: { type: "string", description: "Message à envoyer" },
          },
          required: ["channel", "text"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
    github: [
      {
        name: "github_create_issue",
        description: "Créer une issue GitHub",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Propriétaire du dépôt" },
            repo: { type: "string", description: "Nom du dépôt" },
            title: { type: "string", description: "Titre de l'issue" },
            body: { type: "string", description: "Description de l'issue" },
          },
          required: ["owner", "repo", "title"],
        },
        serverId: server.id,
        serverName: server.name,
      },
      {
        name: "github_get_file",
        description: "Récupérer le contenu d'un fichier",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "Propriétaire du dépôt" },
            repo: { type: "string", description: "Nom du dépôt" },
            path: { type: "string", description: "Chemin du fichier" },
          },
          required: ["owner", "repo", "path"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
    notion: [
      {
        name: "notion_search",
        description: "Rechercher dans Notion",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Texte à rechercher" },
          },
          required: ["query"],
        },
        serverId: server.id,
        serverName: server.name,
      },
      {
        name: "notion_create_page",
        description: "Créer une page Notion",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: { type: "string", description: "ID de la page parente" },
            title: { type: "string", description: "Titre de la page" },
            content: { type: "string", description: "Contenu de la page" },
          },
          required: ["parent_id", "title"],
        },
        serverId: server.id,
        serverName: server.name,
      },
    ],
  };

  return serverTools[server.name.toLowerCase().replace(" ", "-")] || [];
}

// Mock tool execution - in production this would communicate with the MCP server
async function mockToolExecution(call: MCPToolCall): Promise<unknown> {
  // Simulate async execution
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Return mock results based on tool name
  switch (call.tool) {
    case "calculate":
      try {
        // Safe math evaluation
        const expr = String(call.input.expression);
        // Only allow safe characters
        if (!/^[\d+\-*/().\s]+$/.test(expr)) {
          throw new Error("Expression invalide");
        }
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${expr}`)();
        return { value: result, expression: expr };
      } catch {
        return { error: "Erreur de calcul" };
      }

    case "web_search":
      return {
        results: [
          { title: "Résultat 1", url: "https://example.com/1", snippet: "Description..." },
          { title: "Résultat 2", url: "https://example.com/2", snippet: "Description..." },
        ],
        query: call.input.query,
      };

    case "read_file":
      return { path: call.input.path, content: "Contenu simulé du fichier" };

    case "write_file":
      return { path: call.input.path, success: true, bytesWritten: String(call.input.content).length };

    case "list_directory":
      return {
        path: call.input.path,
        entries: [
          { name: "file1.txt", type: "file" },
          { name: "folder", type: "directory" },
        ],
      };

    case "send_slack_message":
      return { success: true, channel: call.input.channel, ts: Date.now() };

    case "github_create_issue":
      return {
        success: true,
        url: `https://github.com/${call.input.owner}/${call.input.repo}/issues/1`,
        number: 1,
      };

    case "github_get_file":
      return { path: call.input.path, content: "Contenu du fichier GitHub" };

    case "notion_search":
      return {
        results: [
          { id: "123", title: "Page Notion 1", type: "page" },
          { id: "456", title: "Page Notion 2", type: "page" },
        ],
      };

    case "notion_create_page":
      return { success: true, id: "new-page-id", title: call.input.title };

    default:
      return { error: `Outil inconnu: ${call.tool}` };
  }
}

/**
 * Request handler for MCP protocol communication
 * This would be called by the backend edge function
 */
export function buildMCPRequest(
  method: string,
  params?: Record<string, unknown>
): MCPRequest {
  const id = Date.now();
  return {
    jsonrpc: "2.0",
    id,
    method,
    params,
  };
}

/**
 * Parse MCP response
 */
export function parseMCPResponse(data: string): MCPResponse | null {
  try {
    return JSON.parse(data) as MCPResponse;
  } catch {
    return null;
  }
}