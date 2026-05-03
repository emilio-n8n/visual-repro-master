import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Bot, Settings, LogOut } from "lucide-react";

type Workspace = { id: string; name: string; slug: string; plan: string };

const navItems = [
  { to: "/dashboard", icon: Sparkles, label: "Vue d'ensemble", end: true },
  { to: "/dashboard/render", icon: ImageIcon, label: "Render AI" },
  { to: "/dashboard/agent", icon: Bot, label: "Agent IA" },
  { to: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workspaces")
      .select("id, name, slug, plan")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setWorkspace(data));
  }, [user]);

  return (
    <div className="min-h-screen flex bg-[#0b0b0b] text-[#F0EAE0]">
      <aside className="w-64 border-r border-[#C4A264]/15 flex flex-col">
        <div className="px-6 py-6 border-b border-[#C4A264]/15">
          <div
            className="text-[#C4A264] tracking-[0.4em] text-sm"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            FORMA
          </div>
          {workspace && (
            <div className="mt-2 text-xs text-[#F0EAE0]/50 truncate">{workspace.name}</div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                  isActive
                    ? "bg-[#C4A264]/10 text-[#C4A264]"
                    : "text-[#F0EAE0]/70 hover:bg-white/5"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#C4A264]/15">
          <div className="text-xs text-[#F0EAE0]/50 mb-2 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[#F0EAE0]/70 hover:text-[#F0EAE0]"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet context={{ workspace }} />
      </main>
    </div>
  );
}
