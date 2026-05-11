import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRenderMode } from "@/hooks/useRenderMode";

export function RenderModeToggle() {
  const { mode, toggleMode } = useRenderMode();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="h-8 w-8 text-[#F0EAE0]/70 hover:text-[#C4A264] hover:bg-[#C4A264]/10"
        >
          {mode === "day" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{mode === "day" ? "Mode nuit" : "Mode jour"}</p>
      </TooltipContent>
    </Tooltip>
  );
}