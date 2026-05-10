import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, Home, Box, LayoutGrid, ChevronRight, Check } from "lucide-react";

type FloorPlan = {
  id: string;
  title: string;
  description: string;
  svg: string;
  selected: boolean;
};

export default function MiniArchi() {
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [step, setStep] = useState<"constraints" | "generating" | "plans" | "3d">("constraints");
  const [constraints, setConstraints] = useState("");
  const [surface, setSurface] = useState("");
  const [rooms, setRooms] = useState("");
  const [budget, setBudget] = useState("");
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generatePlans = async () => {
    if (!constraints.trim()) return;
    setLoading(true);
    setStep("generating");

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-archi-generator`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          constraints,
          surface: surface || "150m²",
          rooms: rooms || "3 chambres, salon, cuisine, salle de bain",
          budget: budget || "medium",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
        setStep("plans");
      } else {
        // Fallback: generate mock plans if function doesn't exist yet
        const mockPlans: FloorPlan[] = [
          { id: "1", title: "Plan Ouvert", description: "Space ouvert avec cuisine ouverte sur salon", svg: generateMockSvg("open"), selected: false },
          { id: "2", title: "Plan Classique", description: "Séparation traditionnelle salon/salle à manger", svg: generateMockSvg("classic"), selected: false },
          { id: "3", title: "Plan L", description: "Disposition en L avec patio intérieur", svg: generateMockSvg("L"), selected: false },
          { id: "4", title: "Plan Circulaire", description: "Circulation optimale autour d'un nucleus", svg: generateMockSvg("circular"), selected: false },
          { id: "5", title: "Plan Biologique", description: "Formes organiques avec maximum de lumière", svg: generateMockSvg("organic"), selected: false },
          { id: "6", title: "Plan Compact", description: "Optimisation maximale de l'espace", svg: generateMockSvg("compact"), selected: false },
        ];
        setPlans(mockPlans);
        setStep("plans");
      }
    } catch (error) {
      console.error("Error generating plans:", error);
      // Generate mock plans as fallback
      const mockPlans: FloorPlan[] = [
        { id: "1", title: "Plan Ouvert", description: "Space ouvert avec cuisine ouverte sur salon", svg: generateMockSvg("open"), selected: false },
        { id: "2", title: "Plan Classique", description: "Séparation traditionnelle salon/salle à manger", svg: generateMockSvg("classic"), selected: false },
        { id: "3", title: "Plan L", description: "Disposition en L avec patio intérieur", svg: generateMockSvg("L"), selected: false },
        { id: "4", title: "Plan Circulaire", description: "Circulation optimale autour d'un nucleus", svg: generateMockSvg("circular"), selected: false },
        { id: "5", title: "Plan Biologique", description: "Formes organiques avec maximum de lumière", svg: generateMockSvg("organic"), selected: false },
        { id: "6", title: "Plan Compact", description: "Optimisation maximale de l'espace", svg: generateMockSvg("compact"), selected: false },
      ];
      setPlans(mockPlans);
      setStep("plans");
    } finally {
      setLoading(false);
    }
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  const generate3D = () => {
    setStep("3d");
  };

  if (step === "constraints") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#F0EAE0]/60 hover:text-[#F0EAE0] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Home className="w-8 h-8 text-[#C4A264]" />
            <span className="text-xs tracking-[0.3em] text-[#C4A264] uppercase">Mini Archi</span>
          </div>
          <h1
            className="text-4xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Créez votre maison
          </h1>
          <p className="text-[#F0EAE0]/60 mb-8">
            Décrivez vos contraintes et laissez l'IA générer plusieurs plans différents.
          </p>

          <div className="space-y-6">
            <div>
              <label className="text-xs tracking-[0.2em] text-[#C4A264] uppercase mb-2 block">
                Contraintes & Envie
              </label>
              <Textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="Ex: Terrain en pente, vue sur montagne au sud, famille avec 2 enfants, besoin d'un bureau..."
                className="bg-[#1a1a1a] border-[#C4A264]/20 text-[#F0EAE0] min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#F0EAE0]/50 mb-2 block">Surface</label>
                <Input
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="150m²"
                  className="bg-[#1a1a1a] border-[#C4A264]/20 text-[#F0EAE0]"
                />
              </div>
              <div>
                <label className="text-xs text-[#F0EAE0]/50 mb-2 block">Pièces</label>
                <Input
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  placeholder="4 chambres"
                  className="bg-[#1a1a1a] border-[#C4A264]/20 text-[#F0EAE0]"
                />
              </div>
              <div>
                <label className="text-xs text-[#F0EAE0]/50 mb-2 block">Budget</label>
                <Input
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="medium"
                  className="bg-[#1a1a1a] border-[#C4A264]/20 text-[#F0EAE0]"
                />
              </div>
            </div>

            <Button
              onClick={generatePlans}
              disabled={!constraints.trim() || loading}
              className="w-full bg-[#C4A264] text-black py-6 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Générer 6 plans
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#C4A264] animate-spin mx-auto mb-4" />
          <h2 className="text-xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            L'IA conçoit vos plans...
          </h2>
          <p className="text-[#F0EAE0]/50">
            Analyse des contraintes et génération de 6 propositions uniques
          </p>
        </div>
      </div>
    );
  }

  if (step === "plans") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => setStep("constraints")}
              className="flex items-center gap-2 text-[#F0EAE0]/60 hover:text-[#F0EAE0] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Modifier les contraintes
            </button>
            <h1
              className="text-3xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              6 propositions
            </h1>
            <p className="text-[#F0EAE0]/50">Cliquez sur ceux que vous voulez développer en 3D</p>
          </div>
          {selectedPlans.length > 0 && (
            <Button onClick={generate3D} className="bg-[#C4A264] text-black">
              <Box className="w-5 h-5 mr-2" />
              Développer en 3D ({selectedPlans.length})
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              onClick={() => togglePlanSelection(plan.id)}
              className={`bg-[#1a1a1a] border-[#C4A264]/20 cursor-pointer transition-all hover:border-[#C4A264]/50 ${
                selectedPlans.includes(plan.id) ? "ring-2 ring-[#C4A264]" : ""
              }`}
            >
              <div className="aspect-square bg-[#0a0a0a] p-4 flex items-center justify-center relative">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: plan.svg }}
                />
                {selectedPlans.includes(plan.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-[#C4A264] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-[#F0EAE0] mb-1">{plan.title}</h3>
                <p className="text-sm text-[#F0EAE0]/50">{plan.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (step === "3d") {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => setStep("plans")}
              className="flex items-center gap-2 text-[#F0EAE0]/60 hover:text-[#F0EAE0] mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux plans
            </button>
            <h1
              className="text-3xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Vue 3D
            </h1>
            <p className="text-[#F0EAE0]/50">{selectedPlans.length} plans sélectionnés</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {selectedPlans.map((planId) => {
            const plan = plans.find((p) => p.id === planId);
            return (
              <div key={planId} className="bg-[#1a1a1a] rounded-lg border border-[#C4A264]/20 overflow-hidden">
                <div className="p-4 border-b border-[#C4A264]/15">
                  <h3 className="font-medium text-[#C4A264]">{plan?.title}</h3>
                </div>
                <div className="aspect-video bg-[#0a0a0a] flex items-center justify-center">
                  <div className="text-center">
                    <Box className="w-16 h-16 text-[#C4A264]/30 mx-auto mb-4" />
                    <p className="text-[#F0EAE0]/40">Rendu 3D en cours...</p>
                    <p className="text-xs text-[#F0EAE0]/30 mt-2">Intégration Three.js à venir</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

function generateMockSvg(type: string): string {
  const colors = {
    wall: "#C4A264",
    floor: "#2a2a2a",
    text: "#F0EAE0",
  };

  const patterns: Record<string, string> = {
    open: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <rect x="10" y="10" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="27" y="30" fill="${colors.text}" font-size="6" text-anchor="middle">CHAMBRE</text>
        <rect x="55" y="10" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="72" y="30" fill="${colors.text}" font-size="6" text-anchor="middle">CHAMBRE</text>
        <rect x="10" y="55" width="80" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="50" y="75" fill="${colors.text}" font-size="8" text-anchor="middle">SALON / CUISINE</text>
        <rect x="85" y="45" width="5" height="10" fill="${colors.wall}"/>
      </svg>
    `,
    classic: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <line x1="50" y1="5" x2="50" y2="95" stroke="${colors.wall}" stroke-width="1"/>
        <line x1="5" y1="50" x2="95" y2="50" stroke="${colors.wall}" stroke-width="1"/>
        <rect x="10" y="10" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="27" y="30" fill="${colors.text}" font-size="5" text-anchor="middle">SALON</text>
        <rect x="55" y="10" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="72" y="30" fill="${colors.text}" font-size="5" text-anchor="middle">CUISINE</text>
        <rect x="10" y="55" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="27" y="75" fill="${colors.text}" font-size="5" text-anchor="middle">CHAMBRE</text>
        <rect x="55" y="55" width="35" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="72" y="75" fill="${colors.text}" font-size="5" text-anchor="middle">CHAMBRE</text>
      </svg>
    `,
    L: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <rect x="5" y="5" width="60" height="90" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <rect x="70" y="5" width="25" height="60" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <rect x="10" y="10" width="50" height="40" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="35" y="33" fill="${colors.text}" font-size="6" text-anchor="middle">SALON</text>
        <rect x="10" y="55" width="50" height="35" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="35" y="75" fill="${colors.text}" font-size="6" text-anchor="middle">CHAMBRE</text>
        <rect x="75" y="10" width="15" height="50" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="82" y="38" fill="${colors.text}" font-size="5" text-anchor="middle">SDB</text>
        <circle cx="85" cy="55" r="8" fill="none" stroke="${colors.wall}" stroke-width="1"/>
        <text x="85" y="57" fill="${colors.text}" font-size="4" text-anchor="middle">PATIO</text>
      </svg>
    `,
    circular: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <circle cx="50" cy="50" r="25" fill="none" stroke="${colors.wall}" stroke-width="1"/>
        <rect x="20" y="20" width="20" height="20" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="30" y="33" fill="${colors.text}" font-size="5" text-anchor="middle">CH1</text>
        <rect x="60" y="20" width="20" height="20" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="70" y="33" fill="${colors.text}" font-size="5" text-anchor="middle">CH2</text>
        <rect x="20" y="60" width="20" height="20" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="30" y="73" fill="${colors.text}" font-size="5" text-anchor="middle">SDB</text>
        <rect x="60" y="60" width="20" height="20" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="70" y="73" fill="${colors.text}" font-size="5" text-anchor="middle">BUREAU</text>
        <text x="50" y="53" fill="${colors.text}" font-size="5" text-anchor="middle">CUISINE</text>
      </svg>
    `,
    organic: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <path d="M10,50 Q10,10 50,10 Q90,10 90,50 Q90,90 50,90 Q10,90 10,50" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <path d="M30,30 Q40,20 50,30 Q60,40 50,50 Q40,60 30,50 Q20,40 30,30" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="40" y="43" fill="${colors.text}" font-size="5" text-anchor="middle">CH</text>
        <path d="M60,30 Q70,20 80,30 Q80,40 70,50 Q60,40 60,30" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="70" y="43" fill="${colors.text}" font-size="5" text-anchor="middle">CH</text>
        <path d="M30,60 Q40,50 50,60 Q70,80 60,80 Q40,80 30,60" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="47" y="73" fill="${colors.text}" font-size="5" text-anchor="middle">SALON</text>
        <path d="M70,60 Q80,50 85,60 Q85,70 75,70 Q65,70 70,60" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="77" y="68" fill="${colors.text}" font-size="4" text-anchor="middle">SDB</text>
      </svg>
    `,
    compact: `
      <svg viewBox="0 0 100 100" class="w-full h-full">
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="${colors.wall}" stroke-width="2"/>
        <rect x="10" y="10" width="25" height="25" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="22" y="25" fill="${colors.text}" font-size="5" text-anchor="middle">CH1</text>
        <rect x="40" y="10" width="25" height="25" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="52" y="25" fill="${colors.text}" font-size="5" text-anchor="middle">CH2</text>
        <rect x="70" y="10" width="20" height="25" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="80" y="25" fill="${colors.text}" font-size="4" text-anchor="middle">SDB</text>
        <rect x="10" y="40" width="80" height="50" fill="${colors.floor}" stroke="${colors.wall}" stroke-width="1" opacity="0.5"/>
        <text x="50" y="68" fill="${colors.text}" font-size="7" text-anchor="middle">OPEN SPACE</text>
      </svg>
    `,
  };

  return patterns[type] || patterns.open;
}