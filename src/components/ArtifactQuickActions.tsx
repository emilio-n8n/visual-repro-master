import { FileText, FileSpreadsheet, LayoutGrid, BarChart3, Globe, Images, Image } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  key: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  prompt: string;
};

export const ARTIFACT_ITEMS: Item[] = [
  {
    key: "document",
    label: "Document",
    desc: "Note, compte-rendu, descriptif technique",
    icon: FileText,
    prompt: "Rédige un document : ",
  },
  {
    key: "spreadsheet",
    label: "Tableur",
    desc: "Métré, planning, budget en CSV",
    icon: FileSpreadsheet,
    prompt: "Crée un tableur (CSV) pour : ",
  },
  {
    key: "slideshow",
    label: "Diaporama",
    desc: "Présentation client en slides",
    icon: LayoutGrid,
    prompt: "Génère un diaporama de présentation sur : ",
  },
  {
    key: "dataviz",
    label: "Visualisation",
    desc: "Graphiques et data-viz HTML",
    icon: BarChart3,
    prompt: "Crée une visualisation de données pour : ",
  },
  {
    key: "website",
    label: "Site web",
    desc: "Mini-site / landing page HTML",
    icon: Globe,
    prompt: "Construis un mini-site web sur : ",
  },
  {
    key: "moodboard",
    label: "Moodboard",
    desc: "Planche d'ambiance générée en IA",
    icon: Images,
    prompt: "Compose un moodboard avec ces ambiances : ",
  },
  {
    key: "render",
    label: "Rendu image",
    desc: "Image photoréaliste IA",
    icon: Image,
    prompt: "Crée un rendu photoréaliste de : ",
  },
];

export function ArtifactQuickGrid({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto mt-10">
      <div className="text-center mb-6">
        <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl text-[#C4A264]">
          Livrables que je peux générer
        </p>
        <p className="text-xs text-[#F0EAE0]/50 mt-2">
          Cliquez pour pré-remplir, ou décrivez librement votre besoin.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ARTIFACT_ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.key}
              onClick={() => onPick(it.prompt)}
              className="group text-left p-4 border border-[#C4A264]/20 rounded-sm bg-gradient-to-br from-[#C4A264]/5 to-transparent hover:border-[#C4A264]/60 hover:bg-[#C4A264]/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-sm bg-[#C4A264]/10 border border-[#C4A264]/25 flex items-center justify-center group-hover:bg-[#C4A264]/20">
                  <Icon className="w-4 h-4 text-[#C4A264]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#F0EAE0]">{it.label}</div>
                  <div className="text-[11px] text-[#F0EAE0]/50 truncate">{it.desc}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ArtifactQuickChips({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.15em] text-[#F0EAE0]/40 self-center mr-1">
        Livrables :
      </span>
      {ARTIFACT_ITEMS.map((it) => {
        const Icon = it.icon;
        return (
          <button
            key={it.key}
            onClick={() => onPick(it.prompt)}
            title={it.desc}
            className="flex items-center gap-1.5 px-2 py-1 rounded-sm border border-[#C4A264]/20 text-[11px] text-[#F0EAE0]/70 hover:text-[#C4A264] hover:border-[#C4A264]/50 hover:bg-[#C4A264]/5 transition-colors"
          >
            <Icon className="w-3 h-3" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
