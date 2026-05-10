import { useState, useMemo } from "react";
import { useDeadlines } from "@/hooks/useDeadlines";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

type Project = { id: string; name: string };

export function DeadlineCalendar() {
  const { activeWorkspaceId } = useWorkspace();
  const { deadlines, addDeadline, toggleDeadline } = useDeadlines();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: "", date: "", projectId: "" });

  // Load projects
  useMemo(() => {
    if (!activeWorkspaceId) return;
    supabase
      .from("projects")
      .select("id, name")
      .eq("workspace_id", activeWorkspaceId)
      .then(({ data }) => {
        if (data) setProjects(data);
      });
  }, [activeWorkspaceId]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const d = new Date(year, month, -startingDay + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getDeadlinesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return deadlines.filter((d) => d.date === dateStr);
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const days = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddDeadline = async () => {
    if (!newDeadline.title || !newDeadline.date || !newDeadline.projectId) return;
    await addDeadline(newDeadline.projectId, newDeadline.title, newDeadline.date);
    setShowAddModal(false);
    setNewDeadline({ title: "", date: "", projectId: "" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl text-[#F0EAE0]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Calendrier
        </h2>
        <Button onClick={() => setShowAddModal(true)} className="bg-[#C4A264] text-black">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle échéance
        </Button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-[#C4A264]/10 rounded text-[#F0EAE0]/70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-[#F0EAE0] min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-[#C4A264]/10 rounded text-[#F0EAE0]/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-[#0a0a0a] rounded-lg border border-[#C4A264]/15 overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-[#C4A264]/15">
          {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs text-[#C4A264] font-medium uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, index) => {
            const dayDeadlines = getDeadlinesForDate(day.date);
            const isCurrentMonth = day.isCurrentMonth;

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-r border-b border-[#C4A264]/10 ${
                  isCurrentMonth ? "" : "opacity-30"
                }`}
              >
                <div
                  className={`text-sm mb-1 ${
                    isToday(day.date)
                      ? "w-6 h-6 bg-[#C4A264] text-black rounded-full flex items-center justify-center"
                      : "text-[#F0EAE0]/70"
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayDeadlines.slice(0, 2).map((deadline) => (
                    <div
                      key={deadline.id}
                      onClick={() => toggleDeadline(deadline.id)}
                      className={`text-[10px] p-1 rounded cursor-pointer truncate ${
                        deadline.completed
                          ? "bg-[#10B981]/20 text-[#10B981] line-through"
                          : "bg-[#C4A264]/20 text-[#C4A264]"
                      }`}
                    >
                      {deadline.title}
                    </div>
                  ))}
                  {dayDeadlines.length > 2 && (
                    <div className="text-[10px] text-[#F0EAE0]/50">
                      +{dayDeadlines.length - 2} plus
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-[#C4A264]/30 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-[#F0EAE0] mb-4">
              Nouvelle échéance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#F0EAE0]/50 block mb-1">Titre</label>
                <Input
                  value={newDeadline.title}
                  onChange={(e) =>
                    setNewDeadline({ ...newDeadline, title: e.target.value })
                  }
                  placeholder="Nom de l'échéance..."
                  className="bg-[#0a0a0a] border-[#C4A264]/20 text-[#F0EAE0]"
                />
              </div>
              <div>
                <label className="text-xs text-[#F0EAE0]/50 block mb-1">Date</label>
                <Input
                  type="date"
                  value={newDeadline.date}
                  onChange={(e) =>
                    setNewDeadline({ ...newDeadline, date: e.target.value })
                  }
                  className="bg-[#0a0a0a] border-[#C4A264]/20 text-[#F0EAE0]"
                />
              </div>
              <div>
                <label className="text-xs text-[#F0EAE0]/50 block mb-1">Projet</label>
                <select
                  value={newDeadline.projectId}
                  onChange={(e) =>
                    setNewDeadline({ ...newDeadline, projectId: e.target.value })
                  }
                  className="w-full bg-[#0a0a0a] border border-[#C4A264]/20 rounded px-3 py-2 text-sm text-[#F0EAE0]"
                >
                  <option value="">Sélectionner un projet</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAddDeadline}
                  className="flex-1 bg-[#C4A264] text-black"
                >
                  Ajouter
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="text-[#F0EAE0]"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}