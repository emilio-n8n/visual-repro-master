import { useState, useEffect, memo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TagManager } from "@/components/TagManager";
import { Plus, MoreHorizontal, Calendar, GripVertical } from "lucide-react";

type Project = {
  id: string;
  name: string;
  status: string;
  client?: string;
  deadline?: string;
  created_at: string;
};

const COLUMNS = [
  { id: "draft", label: "Brouillon", color: "#6B7280" },
  { id: "active", label: "En cours", color: "#3B82F6" },
  { id: "review", label: "En revue", color: "#F59E0B" },
  { id: "completed", label: "Terminé", color: "#10B981" },
] as const;

export const KanbanBoard = memo(function KanbanBoard() {
  const { activeWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);

  // Load projects on mount or workspace change
  useEffect(() => {
    if (!activeWorkspaceId) return;
    supabase
      .from("projects")
      .select("id, name, status, client, deadline, created_at")
      .eq("workspace_id", activeWorkspaceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as Project[]);
        setLoading(false);
      });
  }, [activeWorkspaceId]);

  const getProjectsByStatus = useCallback((status: string) =>
    projects.filter((p) => p.status === status),
    [projects]
  );

  const handleDragStart = useCallback((projectId: string) => {
    setDraggedProject(projectId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(async (newStatus: string) => {
    if (!draggedProject) return;
    await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", draggedProject);
    setProjects((prev) =>
      prev.map((p) => (p.id === draggedProject ? { ...p, status: newStatus } : p))
    );
    setDraggedProject(null);
  }, [draggedProject]);

  if (loading) {
    return <div className="p-8 text-[#F0EAE0]/50">Chargement des projets...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl text-[#F0EAE0]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Projets
        </h2>
        <Button className="bg-[#C4A264] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-[#0a0a0a] rounded-lg border border-[#C4A264]/15"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="p-3 border-b border-[#C4A264]/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="text-sm font-medium text-[#F0EAE0]">
                  {column.label}
                </span>
              </div>
              <span className="text-xs text-[#F0EAE0]/50">
                {getProjectsByStatus(column.id).length}
              </span>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {getProjectsByStatus(column.id).map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={() => handleDragStart(project.id)}
                  className="p-3 bg-[#1a1a1a] border border-[#C4A264]/10 rounded cursor-move hover:border-[#C4A264]/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm text-[#F0EAE0] font-medium">
                      {project.name}
                    </h4>
                    <button className="opacity-0 group-hover:opacity-100 text-[#F0EAE0]/50 hover:text-[#F0EAE0]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  {project.client && (
                    <p className="text-xs text-[#F0EAE0]/50 mb-2">{project.client}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-[10px] text-[#F0EAE0]/50">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.deadline).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                    <GripVertical className="w-4 h-4 text-[#F0EAE0]/30" />
                  </div>
                </div>
              ))}

              {getProjectsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-[#F0EAE0]/30 text-sm">
                  Aucun projet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});