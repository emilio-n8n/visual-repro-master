import { useEffect, useCallback } from "react";
import { useRenderMode } from "@/hooks/useRenderMode";

interface UsePresentationModeOptions {
  onEnter?: () => void;
  onExit?: () => void;
}

export function usePresentationMode({ onEnter, onExit }: UsePresentationModeOptions = {}) {
  const { toggleMode } = useRenderMode();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        onEnter?.();
      }
      if (e.key === "Escape") {
        onExit?.();
      }
    },
    [onEnter, onExit]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { enter: onEnter, exit: onExit };
}