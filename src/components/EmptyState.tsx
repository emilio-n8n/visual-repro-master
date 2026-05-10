import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-[#C4A264]/10 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#C4A264]/50" />
      </div>
      <h3 className="text-lg font-medium text-[#F0EAE0] mb-2">{title}</h3>
      <p className="text-[#F0EAE0]/50 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-[#C4A264] text-black">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-8 h-8 border-2 border-[#C4A264]/20 border-t-[#C4A264] rounded-full animate-spin mb-4" />
      <p className="text-[#F0EAE0]/50 text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Veuillez réessayer plus tard.",
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-[#F0EAE0] mb-2">{title}</h3>
      <p className="text-[#F0EAE0]/50 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-[#C4A264]/30 text-[#F0EAE0]">
          Réessayer
        </Button>
      )}
    </div>
  );
}