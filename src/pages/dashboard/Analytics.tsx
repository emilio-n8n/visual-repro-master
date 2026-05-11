import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Layers,
  Star,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
} from "lucide-react";

interface ProjectStats {
  id: string;
  name: string;
  renderCount: number;
  lastActivity: string;
  totalArtifacts: number;
  favorites: number;
}

interface RenderStats {
  date: string;
  count: number;
  success: number;
  failed: number;
}

interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { user } = useAuth();

  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [renderHistory, setRenderHistory] = useState<RenderStats[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [workspace, timeRange]);

  const loadAnalytics = async () => {
    if (!workspace?.id) return;

    setIsLoading(true);
    try {
      // Load project statistics
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, created_at, updated_at")
        .eq("workspace_id", workspace.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (projects) {
        const statsPromises = projects.map(async (project) => {
          const [renderCount, artifactCount, favoriteCount] = await Promise.all([
            supabase.from("renders").select("id", { count: "exact", head: true }).eq("project_id", project.id),
            supabase.from("artifacts").select("id", { count: "exact", head: true }).eq("project_id", project.id),
            supabase.from("favorites").select("id", { count: "exact", head: true }).eq("project_id", project.id),
          ]);

          return {
            id: project.id,
            name: project.name,
            renderCount: renderCount.count || 0,
            lastActivity: project.updated_at,
            totalArtifacts: artifactCount.count || 0,
            favorites: favoriteCount.count || 0,
          };
        });

        const stats = await Promise.all(statsPromises);
        setProjectStats(stats);
      }

      // Generate mock render history for the time range
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const history: RenderStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const count = Math.floor(Math.random() * 20) + 5;
        const success = Math.floor(count * (0.85 + Math.random() * 0.1));
        history.push({
          date: date.toISOString().split("T")[0],
          count,
          success,
          failed: count - success,
        });
      }
      setRenderHistory(history);

      // Mock category breakdown
      setCategoryBreakdown([
        { name: "Rendus", value: 45, color: "#C4A264" },
        { name: "Projets", value: 30, color: "#8B7355" },
        { name: "Modèles", value: 15, color: "#A09080" },
        { name: "Fichiers", value: 10, color: "#6B5B4F" },
      ]);
    } catch (error) {
      console.error("[Analytics] Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${diffMins}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return formatDate(dateStr);
  };

  const totalRenders = renderHistory.reduce((sum, d) => sum + d.count, 0);
  const totalSuccess = renderHistory.reduce((sum, d) => sum + d.success, 0);
  const successRate = totalRenders > 0 ? ((totalSuccess / totalRenders) * 100).toFixed(1) : "0";

  const maxRenderCount = Math.max(...renderHistory.map((d) => d.count), 1);

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      timeRange,
      projects: projectStats,
      renderHistory,
      categoryBreakdown,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `forma-analytics-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0]">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#F0EAE0]/60 hover:text-[#F0EAE0] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#C4A264]" />
              <h1 className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Analytics
              </h1>
            </div>
            <p className="text-[#F0EAE0]/50 mt-1">Statistiques d'utilisation et performance</p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded text-sm transition-all ${
                    timeRange === range
                      ? "bg-[#C4A264] text-black"
                      : "text-[#F0EAE0]/60 hover:text-[#F0EAE0]"
                  }`}
                >
                  {range === "7d" ? "7 jours" : range === "30d" ? "30 jours" : "90 jours"}
                </button>
              ))}
            </div>
            <Button
              onClick={exportData}
              variant="outline"
              className="border-[#C4A264]/30 text-[#C4A264] hover:bg-[#C4A264]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F0EAE0]/50 text-sm">Renders totaux</p>
                  <p className="text-3xl font-bold text-[#C4A264] mt-1">{totalRenders}</p>
                </div>
                <div className="w-12 h-12 bg-[#C4A264]/10 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-[#C4A264]" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+12%</span>
                <span className="text-[#F0EAE0]/50">vs période précédente</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F0EAE0]/50 text-sm">Taux de succès</p>
                  <p className="text-3xl font-bold text-[#C4A264] mt-1">{successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-[#C4A264]/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#C4A264]" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500">+3.2%</span>
                <span className="text-[#F0EAE0]/50">amélioration</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F0EAE0]/50 text-sm">Projets actifs</p>
                  <p className="text-3xl font-bold text-[#C4A264] mt-1">{projectStats.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#C4A264]/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#C4A264]" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-[#F0EAE0]/50">
                <Clock className="w-4 h-4" />
                <span>Activité cette semaine</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#F0EAE0]/50 text-sm">Temps moyen</p>
                  <p className="text-3xl font-bold text-[#C4A264] mt-1">2m 34s</p>
                </div>
                <div className="w-12 h-12 bg-[#C4A264]/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#C4A264]" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-green-500">-18%</span>
                <span className="text-[#F0EAE0]/50">temps de rendu</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#1a1a1a] border border-[#C4A264]/20">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#C4A264] data-[state=active]:text-black"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-[#C4A264] data-[state=active]:text-black"
            >
              Projets
            </TabsTrigger>
            <TabsTrigger
              value="renders"
              className="data-[state=active]:bg-[#C4A264] data-[state=active]:text-black"
            >
              Renders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
                <CardHeader>
                  <CardTitle className="text-[#C4A264] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Activité des renders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {renderHistory.map((day, index) => {
                      const height = (day.count / maxRenderCount) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-[#C4A264] rounded-t transition-all hover:bg-[#D4B978]"
                            style={{ height: `${height}%` }}
                            title={`${day.count} renders`}
                          />
                          {index % Math.ceil(renderHistory.length / 7) === 0 && (
                            <span className="text-xs text-[#F0EAE0]/40 mt-2">
                              {formatDate(day.date)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-[#F0EAE0]/50">
                    <span>{renderHistory[0]?.date ? formatDate(renderHistory[0].date) : ""}</span>
                    <span>
                      {renderHistory[renderHistory.length - 1]?.date
                        ? formatDate(renderHistory[renderHistory.length - 1].date)
                        : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
                <CardHeader>
                  <CardTitle className="text-[#C4A264] flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Répartition par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="relative w-[200px] h-[200px]">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {(() => {
                          let offset = 0;
                          return categoryBreakdown.map((cat, i) => {
                            const percentage = cat.value;
                            const dashArray = `${percentage} ${100 - percentage}`;
                            const dashOffset = -offset;
                            offset += percentage;
                            return (
                              <circle
                                key={i}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={cat.color}
                                strokeWidth="20"
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                className="transition-all"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#C4A264]">
                          {categoryBreakdown.reduce((s, c) => s + c.value, 0)}
                        </span>
                        <span className="text-xs text-[#F0EAE0]/50">Total</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {categoryBreakdown.map((cat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm text-[#F0EAE0]/70">{cat.name}</span>
                        <span className="text-sm text-[#F0EAE0]/50 ml-auto">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
              <CardHeader>
                <CardTitle className="text-[#C4A264] flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Performance des projets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-[#F0EAE0]/50">Chargement...</div>
                ) : projectStats.length === 0 ? (
                  <div className="text-center py-8 text-[#F0EAE0]/50">
                    Aucun projet trouvé
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectStats.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-[#C4A264]/10 hover:border-[#C4A264]/30 transition-all cursor-pointer"
                        onClick={() => navigate(`/dashboard/render/${project.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-[#F0EAE0]">{project.name}</h4>
                          <p className="text-xs text-[#F0EAE0]/50 mt-1">
                            {formatRelativeTime(project.lastActivity)}
                          </p>
                        </div>
                        <div className="flex gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#C4A264]">{project.renderCount}</p>
                            <p className="text-xs text-[#F0EAE0]/50">Renders</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#C4A264]">{project.totalArtifacts}</p>
                            <p className="text-xs text-[#F0EAE0]/50">Fichiers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-[#C4A264]">{project.favorites}</p>
                            <p className="text-xs text-[#F0EAE0]/50">Favoris</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renders">
            <Card className="bg-[#1a1a1a] border-[#C4A264]/20">
              <CardHeader>
                <CardTitle className="text-[#C4A264] flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Historique des renders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-[#F0EAE0]/50 border-b border-[#C4A264]/20">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Total</th>
                        <th className="pb-3 font-medium">Réussis</th>
                        <th className="pb-3 font-medium">Échoués</th>
                        <th className="pb-3 font-medium">Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderHistory.slice(-14).reverse().map((day, i) => {
                        const rate = ((day.success / day.count) * 100).toFixed(0);
                        return (
                          <tr
                            key={i}
                            className="border-b border-[#C4A264]/10 hover:bg-[#C4A264]/5"
                          >
                            <td className="py-3 text-sm">{formatDate(day.date)}</td>
                            <td className="py-3 text-sm">{day.count}</td>
                            <td className="py-3 text-sm text-green-500">{day.success}</td>
                            <td className="py-3 text-sm text-red-500">{day.failed}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${rate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-[#F0EAE0]/70">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}