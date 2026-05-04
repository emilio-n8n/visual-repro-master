import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Send, Plus, MessageSquare, Loader2, FolderOpen } from "lucide-react";
import { ArtifactPreview } from "@/components/ArtifactPreview";

type Conversation = { id: string; title: string; created_at: string };
type Message = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls?: any;
  artifactIds?: string[];
};

export default function Agent() {
  const { user } = useAuth();
  const { activeProjectId, projects } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    if (!user) return;
    setActiveId(null);
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeProjectId]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    let q = supabase
      .from("conversations")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });
    q = activeProjectId ? q.eq("project_id", activeProjectId) : q.is("project_id", null);
    const { data } = await q;
    setConversations(data ?? []);
  }

  async function loadMessages(id: string) {
    const { data } = await supabase
      .from("messages")
      .select("id, role, content, tool_calls, tool_call_id, created_at")
      .eq("conversation_id", id)
      .order("created_at");
    const all = (data ?? []) as any[];
    // Collect artifact ids per assistant message via subsequent tool messages
    const result: Message[] = [];
    for (let i = 0; i < all.length; i++) {
      const m = all[i];
      if (m.role === "tool") continue;
      const msg: Message = { id: m.id, role: m.role, content: m.content, tool_calls: m.tool_calls };
      if (m.role === "assistant" && m.tool_calls?.length) {
        const ids: string[] = [];
        for (let j = i + 1; j < all.length && all[j].role === "tool"; j++) {
          try {
            const r = JSON.parse(all[j].content);
            if (r?.artifactId) ids.push(r.artifactId);
          } catch {}
        }
        if (ids.length) msg.artifactIds = ids;
      }
      result.push(msg);
    }
    setMessages(result);
  }

  async function newConversation() {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "Nouvelle conversation",
        project_id: activeProjectId,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setConversations((prev) => [data as Conversation, ...prev]);
    setActiveId(data.id);
    setMessages([]);
  }

  async function send() {
    if (!input.trim() || loading || !user) return;
    let convId = activeId;
    if (!convId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: input.slice(0, 60),
          project_id: activeProjectId,
        })
        .select()
        .single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        return;
      }
      convId = data.id;
      setActiveId(convId);
      setConversations((prev) => [data as Conversation, ...prev]);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    const messageText = input;
    setInput("");
    setLoading(true);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-agent`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: convId, message: messageText, projectId: activeProjectId }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erreur" }));
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Add empty assistant message to update progressively
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "delta") {
              assistantContent += parsed.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
              );
            } else if (parsed.type === "tool_result") {
              if (parsed.name === "create_render") {
                toast({ title: "Rendu lancé", description: "Consultez Render AI." });
              } else if (parsed.name === "create_moodboard") {
                toast({ title: "Moodboard en cours", description: "Génération des visuels…" });
                if (parsed.result?.artifactId) {
                  const aId = parsed.result.artifactId;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, artifactIds: [...(m.artifactIds ?? []), aId] }
                        : m
                    )
                  );
                }
              } else if (parsed.name === "web_search") {
                toast({ title: "Recherche web", description: `${parsed.result?.results?.length ?? 0} résultats` });
              } else if (parsed.name === "fetch_url") {
                toast({ title: "Page récupérée" });
              } else if (parsed.name === "calculate") {
                toast({ title: "Calcul", description: String(parsed.result?.value ?? "") });
              } else if (parsed.result?.artifactId) {
                const aId = parsed.result.artifactId;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, artifactIds: [...(m.artifactIds ?? []), aId] }
                      : m
                  )
                );
                toast({ title: "Livrable prêt", description: parsed.result.title });
              }
            } else if (parsed.type === "error") {
              toast({ title: "Erreur agent", description: parsed.error, variant: "destructive" });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex">
      {/* Conversations sidebar */}
      <aside className="w-64 border-r border-[#C4A264]/15 flex flex-col bg-[#0a0a0a]">
        <div className="p-3 border-b border-[#C4A264]/15">
          <Button
            onClick={newConversation}
            variant="ghost"
            className="w-full justify-start text-[#C4A264] hover:bg-[#C4A264]/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-3 py-2 rounded-sm text-sm flex items-center gap-2 truncate transition-colors ${
                activeId === c.id
                  ? "bg-[#C4A264]/10 text-[#C4A264]"
                  : "text-[#F0EAE0]/60 hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="px-8 py-5 border-b border-[#C4A264]/15 flex items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl text-[#C4A264]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              FORMA Agent
            </h1>
            <p className="text-xs text-[#F0EAE0]/50 mt-1">
              Votre assistant IA pour rendus, ambiances et matériaux.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#C4A264]/20 rounded-sm text-xs">
            <FolderOpen className="w-3 h-3 text-[#C4A264]" />
            <span className="text-[#F0EAE0]/70">
              {activeProject ? activeProject.name : "Hors projet"}
            </span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto px-8 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-[#F0EAE0]/40 mt-20">
              <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl">
                Commencez la conversation.
              </p>
              <p className="text-xs mt-2">
                Décrivez une ambiance, demandez un rendu, ou explorez un style.
              </p>
            </div>
          )}
          {messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-sm text-sm ${
                    m.role === "user"
                      ? "max-w-[75%] bg-[#C4A264]/15 text-[#F0EAE0] border border-[#C4A264]/20"
                      : "max-w-[85%] w-full bg-white/[0.03] text-[#F0EAE0]/90 border border-white/5"
                  }`}
                >
                  {m.content && (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:text-[#C4A264]">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  {m.artifactIds?.map((id) => (
                    <ArtifactPreview key={id} artifactId={id} />
                  ))}
                  {m.tool_calls && !m.artifactIds?.length && m.role === "assistant" && (
                    <div className="mt-2 text-xs text-[#C4A264]/70 italic">
                      ⚡ Outil : {m.tool_calls[0]?.function?.name}…
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="border-t border-[#C4A264]/15 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Décrivez ce que vous voulez créer…"
              disabled={loading}
              className="bg-black/40 border-[#C4A264]/20 text-[#F0EAE0] placeholder:text-[#F0EAE0]/30"
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
