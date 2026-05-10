import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

type Template = {
  id: string;
  name: string;
  type: string;
  content: string;
  description?: string;
};

type TemplatesContextType = {
  templates: Template[];
  addTemplate: (template: Omit<Template, "id">) => void;
  removeTemplate: (id: string) => void;
  getTemplatesByType: (type: string) => Template[];
};

const TEMPLATES_KEY = "forma_templates";

const TemplatesContext = createContext<TemplatesContextType>({
  templates: [],
  addTemplate: () => {},
  removeTemplate: () => {},
  getTemplatesByType: () => [],
});

export const TemplatesProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  // Persist
  useEffect(() => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);

  const addTemplate = useCallback((template: Omit<Template, "id">) => {
    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    toast({ title: "Template créé", description: newTemplate.name });
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTemplatesByType = useCallback((type: string) => {
    return templates.filter((t) => t.type === type);
  }, [templates]);

  return (
    <TemplatesContext.Provider
      value={{ templates, addTemplate, removeTemplate, getTemplatesByType }}
    >
      {children}
    </TemplatesContext.Provider>
  );
};

export const useTemplates = () => useContext(TemplatesContext);