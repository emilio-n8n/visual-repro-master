export interface Keybinding {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  { id: "search", key: "k", ctrl: true, description: "Ouvrir la recherche", action: "OPEN_SEARCH" },
  { id: "generate", key: "g", ctrl: true, description: "Générer avec l'IA", action: "GENERATE" },
  { id: "save", key: "s", ctrl: true, description: "Sauvegarder", action: "SAVE" },
  { id: "dashboard", key: "d", ctrl: true, description: "Aller au dashboard", action: "DASHBOARD" },
  { id: "render", key: "r", ctrl: true, description: "Aller aux rendus", action: "RENDER" },
  { id: "archi", key: "a", ctrl: true, description: "Aller à Mini Archi", action: "ARCHI" },
  { id: "newArtifact", key: "n", ctrl: true, description: "Nouvel artifact", action: "NEW_ARTIFACT" },
  { id: "shortcuts", key: "?", shift: true, description: "Afficher les raccourcis", action: "SHOW_SHORTCUTS" },
  { id: "escape", key: "Escape", description: "Fermer modal/annuler", action: "CLOSE" },
  { id: "undo", key: "z", ctrl: true, description: "Annuler", action: "UNDO" },
  { id: "redo", key: "z", ctrl: true, shift: true, description: "Rétablir", action: "REDO" },
  { id: "copy", key: "c", ctrl: true, description: "Copier", action: "COPY" },
  { id: "paste", key: "v", ctrl: true, description: "Coller", action: "PASTE" },
  { id: "bold", key: "b", ctrl: true, description: "Gras", action: "BOLD" },
  { id: "italic", key: "i", ctrl: true, description: "Italique", action: "ITALIC" },
];

export const STORAGE_KEY = "forma_keybindings";

export function loadKeybindings(): Keybinding[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_KEYBINDINGS;
}

export function saveKeybindings(bindings: Keybinding[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function resetKeybindings(): Keybinding[] {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_KEYBINDINGS;
}

export function formatShortcut(binding: Keybinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.shift) parts.push("Shift");
  if (binding.alt) parts.push("Alt");
  parts.push(binding.key.toUpperCase());
  return parts.join("+");
}

export function parseShortcut(str: string): Partial<Keybinding> {
  const parts = str.toLowerCase().split("+").map((p) => p.trim());
  return {
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    key: parts[parts.length - 1],
  };
}
