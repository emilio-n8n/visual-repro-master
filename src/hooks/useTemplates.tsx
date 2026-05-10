import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type Template = {
  id: string;
  name: string;
  type: string;
  content: string;
  description?: string;
};

type TemplatesContextType = {
  templates: Template[];
  loading: boolean;
  addTemplate: (template: Omit<Template, "id">) => Promise<void>;
  updateTemplate: (id: string, template: Partial<Template>) => Promise<void>;
  removeTemplate: (id: string) => Promise<void>;
  getTemplatesByType: (type: string) => Template[];
};

const TemplatesContext = createContext<TemplatesContextType>({
  templates: [],
  loading: true,
  addTemplate: async () => {},
  updateTemplate: async () => {},
  removeTemplate: async () => {},
  getTemplatesByType: () => [],
});

export const TemplatesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates from Supabase
  useEffect(() => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
      setLoading(false);
    };

    loadTemplates();

    // Subscribe to changes
    const channel = supabase
      .channel("templates-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "templates",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setTemplates((prev) => [payload.new as Template, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setTemplates((prev) => prev.map((t) => t.id === payload.new.id ? payload.new as Template : t));
        } else if (payload.eventType === "DELETE") {
          setTemplates((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTemplate = useCallback(async (template: Omit<Template, "id">) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name: template.name,
        type: template.type,
        content: template.content,
        description: template.description,
      })
      .select()
      .single();

    if (!error && data) {
      toast({ title: "Template créé", description: data.name });
    }
  }, [user]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<Template>) => {
    await supabase
      .from("templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const removeTemplate = useCallback(async (id: string) => {
    await supabase.from("templates").delete().eq("id", id);
  }, []);

  const getTemplatesByType = useCallback((type: string) => {
    return templates.filter((t) => t.type === type);
  }, [templates]);

  return (
    <TemplatesContext.Provider
      value={{ templates, loading, addTemplate, updateTemplate, removeTemplate, getTemplatesByType }}
    >
      {children}
    </TemplatesContext.Provider>
  );
};

export const useTemplates = () => useContext(TemplatesContext);