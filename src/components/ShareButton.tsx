import { useState } from "react";
import { useShareLinks } from "@/hooks/useShareLinks";
import { Share2, Copy, Check, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

type EntityType = "artifact" | "render";

interface ShareButtonProps {
  entityType: EntityType;
  entityId: string;
  entityTitle?: string;
}

export function ShareButton({ entityType, entityId, entityTitle }: ShareButtonProps) {
  const { createShareLink } = useShareLinks();
  const [isOpen, setIsOpen] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleShare = async () => {
    const link = await createShareLink(entityType, entityId, expiryDays);
    if (link) {
      const url = `${window.location.origin}/share/${link.token}`;
      setShareUrl(url);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setShareUrl(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 border-[#C4A264]/30 text-[#F0EAE0] hover:bg-[#C4A264]/10"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Partager
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeModal}>
      <div className="bg-[#1a1a1a] border border-[#C4A264]/30 rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-[#F0EAE0]">Partager {entityTitle || entityType}</h3>
          <button onClick={closeModal} className="text-[#F0EAE0]/50 hover:text-[#C4A264]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!shareUrl ? (
          <div>
            <p className="text-sm text-[#F0EAE0]/60 mb-4">
              Créez un lien de partage pour permettre à d'autres personnes de voir cet élément.
            </p>

            <div className="mb-4">
              <label className="text-xs text-[#F0EAE0]/50 block mb-2">Expiration du lien</label>
              <select
                value={expiryDays ?? ""}
                onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-[#0a0a0a] border border-[#C4A264]/20 rounded px-3 py-2 text-sm text-[#F0EAE0]"
              >
                <option value="">Jamais</option>
                <option value="1">1 jour</option>
                <option value="7">7 jours</option>
                <option value="30">30 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>

            <Button onClick={handleShare} className="w-full bg-[#C4A264] text-black">
              <Calendar className="w-4 h-4 mr-2" />
              Créer le lien
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#F0EAE0]/60 mb-4">Voici votre lien de partage :</p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-[#0a0a0a] border border-[#C4A264]/20 rounded px-3 py-2 text-sm text-[#F0EAE0]"
              />
              <Button onClick={handleCopy} className="bg-[#C4A264] text-black">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-xs text-[#F0EAE0]/40">
              Ce lien permet un accès en lecture seule. Toute personne ayant le lien peut le voir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}