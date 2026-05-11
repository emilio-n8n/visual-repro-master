/**
 * MCP Tools Panel Component
 * Displays available MCP servers and tools with connection controls
 */

import { useState } from "react";
import { X, Plus, Trash2, RefreshCw, Loader2, Check, AlertCircle, Plug, Unplug, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMCP } from "@/hooks/useMCP";
import type { MCPServer, MCPTool } from "@/lib/mcp-types";
import { toast } from "@/hooks/use-toast";

interface MCPToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MCPToolsPanel({ isOpen, onClose }: MCPToolsPanelProps) {
  const { servers, tools, templates, loading, connect, disconnect, removeServer, toggleServer, addFromTemplate } = useMCP();
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f0f0f] border border-[#C4A264]/20 rounded-sm w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4A264]/15">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#C4A264]/10 flex items-center justify-center">
              <Plug className="w-4 h-4 text-[#C4A264]" />
            </div>
            <div>
              <h2 className="text-lg text-[#C4A264]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Outils MCP
              </h2>
              <p className="text-xs text-[#F0EAE0]/50">
                Connectez des outils externes à l'agent
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#F0EAE0]/60 hover:text-[#F0EAE0]">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Servers Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-[0.15em] text-[#C4A264]/70">
                Serveurs MCP
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModal(true)}
                className="border-[#C4A264]/30 text-[#C4A264] hover:bg-[#C4A264]/10"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>

            {servers.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#C4A264]/15 rounded-sm">
                <Plug className="w-8 h-8 text-[#C4A264]/30 mx-auto mb-3" />
                <p className="text-sm text-[#F0EAE0]/50">Aucun serveur MCP configuré</p>
                <p className="text-xs text-[#F0EAE0]/30 mt-1">
                  Ajoutez un serveur pour accéder à des outils supplémentaires
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {servers.map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onConnect={() => connect(server.id)}
                    onDisconnect={() => disconnect(server.id)}
                    onToggle={() => toggleServer(server.id)}
                    onRemove={() => {
                      if (confirm(`Supprimer ${server.name} ?`)) {
                        removeServer(server.id);
                      }
                    }}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Available Tools Section */}
          {tools.length > 0 && (
            <section>
              <h3 className="text-sm uppercase tracking-[0.15em] text-[#C4A264]/70 mb-4">
                Outils disponibles ({tools.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {tools.map((tool) => (
                  <ToolCard key={`${tool.serverId}:${tool.name}`} tool={tool} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Add Server Modal */}
      {showAddModal && (
        <AddServerModal
          templates={templates}
          onAdd={(server) => {
            addFromTemplate(server);
            toast({ title: "Serveur ajouté", description: `${server.name} a été ajouté.` });
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// Server Card Component
interface ServerCardProps {
  server: MCPServer;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggle: () => void;
  onRemove: () => void;
  loading: boolean;
}

function ServerCard({ server, onConnect, onDisconnect, onToggle, onRemove, loading }: ServerCardProps) {
  const statusColors = {
    disconnected: "bg-[#F0EAE0]/20",
    connecting: "bg-yellow-500/20 animate-pulse",
    connected: "bg-green-500/20",
    error: "bg-red-500/20",
  };

  const statusText = {
    disconnected: "Déconnecté",
    connecting: "Connexion...",
    connected: "Connecté",
    error: "Erreur",
  };

  return (
    <div className="flex items-center justify-between p-4 bg-black/20 border border-[#C4A264]/10 rounded-sm hover:border-[#C4A264]/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
        <div>
          <div className="text-sm text-[#F0EAE0]">{server.name}</div>
          <div className="text-xs text-[#F0EAE0]/40">{server.description}</div>
          {server.lastError && (
            <div className="text-xs text-red-400 mt-1">{server.lastError}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggle}
          className={`h-8 px-2 ${server.enabled ? "text-green-400" : "text-[#F0EAE0]/40"}`}
          title={server.enabled ? "Désactiver" : "Activer"}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>

        {server.status === "connected" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDisconnect}
            className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]"
            title="Déconnecter"
          >
            <Unplug className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={onConnect}
            disabled={loading || server.status === "connecting"}
            className="h-8 px-2 text-[#F0EAE0]/70 hover:text-[#C4A264]"
            title="Connecter"
          >
            {loading && server.status === "connecting" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plug className="w-3.5 h-3.5" />
            )}
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="h-8 px-2 text-[#F0EAE0]/40 hover:text-red-400"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Tool Card Component
interface ToolCardProps {
  tool: MCPTool;
}

function ToolCard({ tool }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="p-3 bg-black/20 border border-[#C4A264]/10 rounded-sm hover:border-[#C4A264]/20 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono text-[#C4A264] truncate">{tool.name}</div>
          <div className="text-xs text-[#F0EAE0]/40 mt-1 line-clamp-2">{tool.description}</div>
        </div>
        <div className="text-[10px] text-[#F0EAE0]/30 ml-2 shrink-0">{tool.serverName}</div>
      </div>

      {expanded && tool.inputSchema.properties && (
        <div className="mt-3 pt-3 border-t border-[#C4A264]/10">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#C4A264]/50 mb-2">
            Paramètres
          </div>
          {Object.entries(tool.inputSchema.properties).map(([key, prop]) => (
            <div key={key} className="text-xs mb-1">
              <span className="font-mono text-[#C4A264]/70">{key}</span>
              <span className="text-[#F0EAE0]/30">: {prop.description}</span>
            </div>
          ))}
          {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
            <div className="text-[10px] text-[#F0EAE0]/30 mt-2">
              Requis: {tool.inputSchema.required.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Add Server Modal
interface AddServerModalProps {
  templates: import("@/lib/mcp-types").MCPServerTemplate[];
  onAdd: (template: import("@/lib/mcp-types").MCPServerTemplate) => void;
  onClose: () => void;
}

function AddServerModal({ templates, onAdd, onClose }: AddServerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});

  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-[#0f0f0f] border border-[#C4A264]/20 rounded-sm w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C4A264]/15">
          <h3 className="text-[#C4A264]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Ajouter un serveur MCP
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#F0EAE0]/60">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
          {/* Template selection */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.1em] text-[#F0EAE0]/50">
              Choisir un template
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id)}
                  className={`p-3 text-left rounded-sm border transition-colors ${
                    selectedId === template.id
                      ? "border-[#C4A264] bg-[#C4A264]/10"
                      : "border-[#C4A264]/15 bg-black/20 hover:border-[#C4A264]/30"
                  }`}
                >
                  <div className="text-sm text-[#F0EAE0]">{template.name}</div>
                  <div className="text-xs text-[#F0EAE0]/40 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Environment variables */}
          {selected && selected.envKeys.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-[0.1em] text-[#F0EAE0]/50">
                Variables d'environnement
              </Label>
              {selected.envKeys.map((key) => (
                <div key={key}>
                  <Label className="text-xs text-[#F0EAE0]/60 mb-1 block">{key}</Label>
                  <Input
                    type="password"
                    value={customEnv[key] || ""}
                    onChange={(e) => setCustomEnv({ ...customEnv, [key]: e.target.value })}
                    placeholder={`Votre ${key}`}
                    className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#C4A264]/15">
          <Button variant="outline" onClick={onClose} className="border-[#C4A264]/30 text-[#F0EAE0]">
            Annuler
          </Button>
          <Button
            onClick={() => selected && onAdd(selected)}
            disabled={!selectedId}
            className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}