import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for FORMA
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    {
      key: "g",
      ctrl: true,
      handler: () => navigate("/dashboard"),
      description: "Aller au dashboard",
    },
    {
      key: "r",
      ctrl: true,
      handler: () => navigate("/dashboard/render"),
      description: "Aller aux rendus",
    },
    {
      key: "a",
      ctrl: true,
      handler: () => navigate("/archi"),
      description: "Aller à Mini Archi",
    },
    {
      key: "k",
      ctrl: true,
      handler: () => {
        const cmdPalette = document.querySelector('[cmdk-dialog]') as HTMLDialogElement;
        cmdPalette?.showModal();
      },
      description: "Ouvrir la palette de commandes",
    },
    {
      key: "?",
      shift: true,
      handler: () => {
        alert("Raccourcis clavier:\n\nCtrl+G - Dashboard\nCtrl+R - Rendus\nCtrl+A - Mini Archi\nCtrl+K - Command palette\nÉchap - Fermer");
      },
      description: "Afficher l'aide",
    },
  ];

  useKeyboardShortcuts(shortcuts);
}