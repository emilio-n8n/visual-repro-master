import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PresentationModeProps {
  renders: Array<{
    id: string;
    output_path: string | null;
    style: string | null;
    created_at: string;
  }>;
  signedUrls: Record<string, string>;
  onClose: () => void;
  initialIndex?: number;
}

export function PresentationMode({
  renders,
  signedUrls,
  onClose,
  initialIndex = 0,
}: PresentationModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const completedRenders = renders.filter((r) => r.output_path);
  const currentRender = completedRenders[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < completedRenders.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, completedRenders.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  useEffect(() => {
    hideControlsAfterDelay();
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [hideControlsAfterDelay, controlsTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
      }
      hideControlsAfterDelay();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev, hideControlsAfterDelay]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!currentRender) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onMouseMove={hideControlsAfterDelay}
    >
      {/* Main image */}
      <img
        src={signedUrls[currentRender.id]}
        alt={`Render ${currentIndex + 1}`}
        className="max-w-full max-h-full object-contain"
      />

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < completedRenders.length - 1 && (
        <button
          onClick={goNext}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Bottom navigation bar */}
      <div
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-xs tracking-[0.2em] text-[#C4A264]">
              {currentIndex + 1} / {completedRenders.length}
            </span>
            {currentRender.style && (
              <span className="text-xs text-[#F0EAE0]/60 uppercase tracking-wider">
                {currentRender.style}
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto max-w-[60%]">
            {completedRenders.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? "border-[#C4A264]" : "border-transparent hover:border-[#C4A264]/50"
                }`}
              >
                <img
                  src={signedUrls[r.id]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#F0EAE0]/80 hover:text-[#F0EAE0] transition-colors"
          >
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 flex gap-1">
        {completedRenders.map((_, idx) => (
          <div
            key={idx}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? "bg-[#C4A264]" : idx < currentIndex ? "bg-[#C4A264]/50" : "bg-[#F0EAE0]/20"
            }`}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="absolute top-4 right-4 text-xs text-[#F0EAE0]/40">
        ← → Navigation · Esc Fermer · Ctrl+P Retour au viewer
      </div>
    </div>
  );
}