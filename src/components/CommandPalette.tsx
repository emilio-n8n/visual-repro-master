import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Command } from "cmdk";
import {
  Search, FileText, Bot, Image, Settings, Plus, LogOut, Moon, Sun,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";

type CommandItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
};

export function CommandPalette() {
  const navigate = useNavigate();
  const { projects, activeProjectId, setActiveProjectId } = useWorkspace();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  // Toggle with keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Build command list
  const items = useCallback((): CommandItem[] => {
    const cmds: CommandItem[] = [
      {
        id: "new-document",
        label: "Nouveau document",
        icon: <FileText className="w-4 h-4" />,
        action: () => { navigate("/dashboard/studio"); setOpen(false); },
        shortcut: "⌘N",
      },
      {
        id: "new-agent",
        label: "Nouvelle conversation",
        icon: <Bot className="w-4 h-4" />,
        action: () => { navigate("/dashboard/agent"); setOpen(false); },
      },
      {
        id: "render",
        label: "Render AI",
        icon: <Image className="w-4 h-4" />,
        action: () => { navigate("/dashboard/render"); setOpen(false); },
      },
      {
        id: "overview",
        label: "Vue d'ensemble",
        icon: <Search className="w-4 h-4" />,
        action: () => { navigate("/dashboard"); setOpen(false); },
      },
      {
        id: "settings",
        label: "Paramètres",
        icon: <Settings className="w-4 h-4" />,
        action: () => { navigate("/dashboard/settings"); setOpen(false); },
      },
    ];

    // Add projects
    projects.forEach((p) => {
      cmds.push({
        id: `project-${p.id}`,
        label: p.name,
        icon: <FileText className="w-4 h-4" />,
        action: () => {
          setActiveProjectId(p.id);
          setOpen(false);
        },
      });
    });

    // Toggle dark mode
    cmds.push({
      id: darkMode ? "light-mode" : "dark-mode",
      label: darkMode ? "Mode clair" : "Mode sombre",
      icon: darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      action: () => {
        document.documentElement.classList.toggle("dark");
        setDarkMode(!darkMode);
        setOpen(false);
      },
    });

    // Sign out
    cmds.push({
      id: "signout",
      label: "Se déconnecter",
      icon: <LogOut className="w-4 h-4" />,
      action: () => { signOut(); navigate("/"); },
    });

    return cmds;
  }, [navigate, projects, darkMode, setActiveProjectId, signOut]);

  const [query, setQuery] = useState("");

  const filteredItems = items().filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden gap-0 max-w-lg">
        <Command className="max-h-[300px] overflow-auto">
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Tapez une commande..."
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List>
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Aucune résultat
            </Command.Empty>
            <Command.Group>
              {filteredItems.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={item.action}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-xs bg-muted px-1 rounded">{item.shortcut}</kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex gap-2">
          <kbd className="bg-muted px-1 rounded">↑↓</kbd> navigate
          <kbd className="bg-muted px-1 rounded">↵</kbd> select
          <kbd className="bg-muted px-1 rounded">esc</kbd> close
        </div>
      </DialogContent>
    </Dialog>
  );
}