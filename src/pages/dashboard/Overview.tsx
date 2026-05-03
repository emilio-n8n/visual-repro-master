import { Link } from "react-router-dom";
import { Image as ImageIcon, Bot, ArrowRight } from "lucide-react";

export default function Overview() {
  return (
    <div className="p-10 max-w-5xl">
      <h1
        className="text-4xl mb-2 text-[#F0EAE0]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Bienvenue dans votre studio.
      </h1>
      <p className="text-[#F0EAE0]/60 mb-10">
        Deux outils pour transformer votre pratique d'architecte.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/dashboard/render"
          className="group border border-[#C4A264]/20 hover:border-[#C4A264]/60 transition-colors p-8"
        >
          <ImageIcon className="w-6 h-6 text-[#C4A264] mb-4" />
          <h2
            className="text-2xl mb-2 text-[#F0EAE0]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            FORMA Render AI
          </h2>
          <p className="text-sm text-[#F0EAE0]/60 mb-6">
            Transformez vos rendus 3D en images photoréalistes en quelques secondes.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#C4A264] tracking-[0.2em]">
            COMMENCER <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/dashboard/agent"
          className="group border border-[#C4A264]/20 hover:border-[#C4A264]/60 transition-colors p-8"
        >
          <Bot className="w-6 h-6 text-[#C4A264] mb-4" />
          <h2
            className="text-2xl mb-2 text-[#F0EAE0]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            FORMA Agent
          </h2>
          <p className="text-sm text-[#F0EAE0]/60 mb-6">
            Un assistant IA dédié à l'architecture, connecté à vos outils.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#C4A264] tracking-[0.2em]">
            DISCUTER <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
