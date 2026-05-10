import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='dashboard']",
    title: "Bienvenue sur FORMA",
    content: "Votre espace de travail pour gérer vos projets architecturaux.",
  },
  {
    target: "[data-tour='render']",
    title: "Rendus IA",
    content: "Générez des rendus 3D photoréalistes en quelques secondes.",
  },
  {
    target: "[data-tour='mini-archi']",
    title: "Mini Archi",
    content: "Créez des plans d'étage avec l'IA et estimez votre budget.",
  },
];

export function WelcomeTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tour for new users
    const hasSeenTour = localStorage.getItem("forma-tour-seen");
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("forma-tour-seen", "true");
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[#1a1a1a] border border-[#C4A264]/30 rounded-lg shadow-xl p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-[#C4A264] font-medium">{step.title}</h3>
          <button
            onClick={handleClose}
            className="text-[#F0EAE0]/50 hover:text-[#F0EAE0]"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[#F0EAE0]/70 text-sm mb-4">{step.content}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#F0EAE0]/50">
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
          <Button size="sm" onClick={handleNext} className="bg-[#C4A264] text-black">
            {currentStep < TOUR_STEPS.length - 1 ? (
              <>
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              "Terminer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}