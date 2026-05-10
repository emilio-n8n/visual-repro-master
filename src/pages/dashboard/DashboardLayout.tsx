import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  Sparkles,
  Image as ImageIcon,
  Bot,
  Settings,
  LogOut,
  Home,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Sparkles, label: "Vue d'ensemble", end: true },
  { to: "/archi", icon: Home, label: "Mini Archi" },
  { to: "/dashboard/render", icon: ImageIcon, label: "Render AI" },
  { to: "/dashboard/agent", icon: Bot, label: "Agent IA" },
  { to: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();

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

        <div className="px-3 pt-3">
          <ProjectSwitcher />
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

        <div className="p-4 border-t border-[#C4A264]/15 space-y-3">
          <PresenceIndicator />
          <NotificationCenter />
          <div className="text-xs text-[#F0EAE0]/50 truncate">{user?.email}</div>
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
        <Outlet />
      </main>
    </div>
  );
}