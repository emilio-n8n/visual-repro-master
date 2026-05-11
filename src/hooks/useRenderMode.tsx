import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type RenderMode = "day" | "night";

type RenderModeContextType = {
  mode: RenderMode;
  toggleMode: () => void;
  setMode: (mode: RenderMode) => void;
};

const RenderModeContext = createContext<RenderModeContextType>({
  mode: "day",
  toggleMode: () => {},
  setMode: () => {},
});

export function RenderModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RenderMode>("day");

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "day" ? "night" : "day"));
  }, []);

  return (
    <RenderModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </RenderModeContext.Provider>
  );
}

export function useRenderMode() {
  return useContext(RenderModeContext);
}