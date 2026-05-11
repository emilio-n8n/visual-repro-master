import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useRenderMode } from "@/hooks/useRenderMode";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Wand2,
  X,
  Maximize2,
} from "lucide-react";
import { PresentationMode } from "@/components/PresentationMode";
import { RenderModeToggle } from "@/components/RenderModeToggle";

type Render = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string | null;
  style: string | null;
  input_path: string;
  output_path: string | null;
  error: string | null;
  created_at: string;
  parent_id: string | null;
};

const STYLES = [
  { id: "photoreal", label: "Photoréaliste" },
  { id: "twilight", label: "Crépuscule" },
  { id: "scandinavian", label: "Scandinave" },
  { id: "editorial", label: "Éditorial" },
];

const DAY_BG = "bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]";
const NIGHT_BG = "bg-gradient-to-b from-[#0a0a12] to-[#050508]";

export default function RenderPage() {
  const { user } = useAuth();
  const { permission, sendTestNotification } = usePushNotifications();
  const { mode: renderMode } = useRenderMode();
  const { progress, fileName, isUploading, upload, reset: resetUpload } = useUploadProgress();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState("photoreal");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [renders, setRenders] = useState<Render[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [modifyTarget, setModifyTarget] = useState<Render | null>(null);
  const [modifyPrompt, setModifyPrompt] = useState("");
  const [modifying, setModifying] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("renders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setRenders(data as Render[]);
      });

    const channel = supabase
      .channel("renders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "renders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRender = payload.new as Render;

          // Check if render just completed - send notification
          if (newRender.status === "completed" && payload.eventType === "UPDATE") {
            const prevRender = payload.old as Render;
            if (prevRender && prevRender.status !== "completed") {
              console.warn("[Render] Render completed, sending notification");
              // Send browser notification
              sendTestNotification("new_render");
              toast.success("Votre rendu est prêt !");
            }
          }

          setRenders((curr) => {
            if (payload.eventType === "DELETE")
              return curr.filter((r) => r.id !== (payload.old as Render).id);
            const row = newRender;
            const idx = curr.findIndex((r) => r.id === row.id);
            if (idx === -1) return [row, ...curr];
            const next = curr.slice();
            next[idx] = row;
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sendTestNotification]);

  // Get signed URLs for renders that have output_path but no cached URL
  const neededRenderIds = renders
    .filter((r) => r.output_path && !signedUrls[r.id])
    .map((r) => r.id);

  useEffect(() => {
    if (neededRenderIds.length === 0) return;

    const fetchUrls = async () => {
      const updates: Record<string, string> = {};
      for (const r of renders) {
        if (r.output_path && !signedUrls[r.id]) {
          const { data } = await supabase.storage
            .from("render-outputs")
            .createSignedUrl(r.output_path, 3600);
          if (data?.signedUrl) updates[r.id] = data.signedUrl;
        }
      }
      if (Object.keys(updates).length > 0) {
        setSignedUrls((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neededRenderIds.join(",")]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    resetUpload();
    try {
      // Use upload progress tracking
      const inputPath = await upload(file);

      const { data: inserted, error: insErr } = await supabase
        .from("renders")
        .insert({
          user_id: user.id,
          status: "pending",
          input_path: inputPath,
          style,
          prompt: prompt.trim() || null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const { error: fnErr } = await supabase.functions.invoke("forma-render", {
        body: { renderId: inserted.id },
      });
      if (fnErr) throw fnErr;

      toast.success("Rendu lancé. Quelques secondes…");
      handleFile(null);
      setPrompt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      resetUpload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      resetUpload();
    } finally {
      setSubmitting(false);
    }
  };

  const handleModify = async () => {
    if (!modifyTarget || !user || !modifyPrompt.trim()) return;
    if (!modifyTarget.output_path) {
      toast.error("Image source non disponible");
      return;
    }
    setModifying(true);
    try {
      const { data: inserted, error: insErr } = await supabase
        .from("renders")
        .insert({
          user_id: user.id,
          status: "pending",
          input_path: modifyTarget.output_path,
          style: modifyTarget.style,
          prompt: modifyPrompt.trim(),
          parent_id: modifyTarget.id,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const { error: fnErr } = await supabase.functions.invoke("forma-render", {
        body: { renderId: inserted.id },
      });
      if (fnErr) throw fnErr;

      toast.success("Modification lancée…");
      setModifyTarget(null);
      setModifyPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setModifying(false);
    }
  };

  const completedCount = renders.filter((r) => r.output_path).length;

  return (
    <div className={`p-10 max-w-6xl min-h-screen ${renderMode === "night" ? NIGHT_BG : DAY_BG} transition-colors duration-500`}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-4xl mb-2 text-[#F0EAE0]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            FORMA Render AI
          </h1>
          <p className="text-[#F0EAE0]/60 text-sm">
            Importez un rendu 3D, choisissez une atmosphère, obtenez une image photoréaliste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RenderModeToggle />
          {completedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const completedIdx = renders.findIndex((r) => r.output_path);
                setPresentationIndex(completedIdx >= 0 ? completedIdx : 0);
              }}
              className="border-[#C4A264]/30 text-[#C4A264] hover:bg-[#C4A264]/10 hover:text-[#C4A264]"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Présentation
            </Button>
          )}
        </div>
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-6 p-4 border border-[#C4A264]/20 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-[#C4A264]" />
              <span className="text-sm text-[#F0EAE0] truncate max-w-[200px]">
                {fileName}
              </span>
            </div>
            <span className="text-sm text-[#C4A264]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-[#C4A264]/20 [&>div]:bg-[#C4A264]" />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mb-12">
        <div className="border border-[#C4A264]/20 p-6 space-y-5 bg-black/20">
          <label
            htmlFor="file"
            className="block border border-dashed border-[#C4A264]/30 hover:border-[#C4A264]/60 transition-colors cursor-pointer p-8 text-center"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="aperçu" className="max-h-56 mx-auto" />
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-[#C4A264] mb-3" />
                <div className="text-sm text-[#F0EAE0]/70">Glisser ou cliquer pour importer</div>
                <div className="text-xs text-[#F0EAE0]/40 mt-1">PNG, JPG · max 10 Mo</div>
              </>
            )}
            <input
              id="file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div>
            <div className="text-xs tracking-[0.2em] text-[#F0EAE0]/60 mb-3">ATMOSPHÈRE</div>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`border p-3 text-sm transition-colors ${
                    style === s.id
                      ? "border-[#C4A264] text-[#C4A264] bg-[#C4A264]/5"
                      : "border-[#C4A264]/20 text-[#F0EAE0]/70 hover:border-[#C4A264]/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs tracking-[0.2em] text-[#F0EAE0]/60 mb-2">
              DIRECTION (OPTIONNEL)
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex. lumière du matin, mobilier en chêne, plante verte au premier plan…"
              rows={3}
              className="bg-transparent border-[#C4A264]/30 text-[#F0EAE0] resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!file || submitting || isUploading}
            className="w-full bg-[#C4A264] text-black hover:bg-[#C4A264]/90"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Générer le rendu
          </Button>
        </div>

        <div className="border border-[#C4A264]/20 bg-black/20 min-h-[400px] flex items-center justify-center p-4">
          {renders[0] ? (
            <RenderCard
              r={renders[0]}
              url={signedUrls[renders[0].id]}
              large
              onModify={() => setModifyTarget(renders[0])}
              onPresent={() => {
                const idx = renders.findIndex((r) => r.id === renders[0].id);
                setPresentationIndex(idx >= 0 ? idx : 0);
              }}
            />
          ) : (
            <div className="text-center text-[#F0EAE0]/40">
              <ImageIcon className="w-10 h-10 mx-auto mb-3" />
              <div className="text-sm">Vos rendus apparaîtront ici</div>
            </div>
          )}
        </div>
      </div>

      {renders.length > 1 && (
        <>
          <div className="text-xs tracking-[0.3em] text-[#F0EAE0]/50 mb-4">HISTORIQUE</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {renders.slice(1).map((r, idx) => (
              <RenderCard
                key={r.id}
                r={r}
                url={signedUrls[r.id]}
                onModify={() => setModifyTarget(r)}
                onPresent={() => {
                  const realIdx = renders.findIndex((render) => render.id === r.id);
                  setPresentationIndex(realIdx >= 0 ? realIdx : idx + 1);
                }}
              />
            ))}
          </div>
        </>
      )}

      {modifyTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => !modifying && setModifyTarget(null)}
        >
          <div
            className="bg-[#0b0b0b] border border-[#C4A264]/30 max-w-lg w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-[#F0EAE0]/50 hover:text-[#F0EAE0]"
              onClick={() => setModifyTarget(null)}
              disabled={modifying}
            >
              <X className="w-4 h-4" />
            </button>
            <h2
              className="text-2xl text-[#F0EAE0] mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Demander des modifications
            </h2>
            <p className="text-sm text-[#F0EAE0]/60 mb-5">
              Décrivez les ajustements à appliquer à cette image.
            </p>
            {signedUrls[modifyTarget.id] && (
              <img
                src={signedUrls[modifyTarget.id]}
                alt=""
                className="w-full max-h-48 object-cover mb-4 border border-[#C4A264]/20"
              />
            )}
            <Textarea
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              placeholder="Ex. ajouter un canapé en lin, plus de lumière naturelle, retirer le tapis…"
              rows={4}
              className="bg-transparent border-[#C4A264]/30 text-[#F0EAE0] resize-none mb-4"
              autoFocus
            />
            <Button
              onClick={handleModify}
              disabled={!modifyPrompt.trim() || modifying}
              className="w-full bg-[#C4A264] text-black hover:bg-[#C4A264]/90"
            >
              {modifying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Appliquer les modifications
            </Button>
          </div>
        </div>
      )}

      {/* Presentation Mode */}
      {presentationIndex !== null && (
        <PresentationMode
          renders={renders}
          signedUrls={signedUrls}
          initialIndex={presentationIndex}
          onClose={() => setPresentationIndex(null)}
        />
      )}
    </div>
  );
}

function RenderCard({
  r,
  url,
  large,
  onModify,
  onPresent,
}: {
  r: Render;
  url?: string;
  large?: boolean;
  onModify?: () => void;
  onPresent?: () => void;
}) {
  const aspect = large ? "aspect-[4/3]" : "aspect-square";
  return (
    <div className={`relative ${aspect} bg-black/40 border border-[#C4A264]/15 overflow-hidden group`}>
      {r.status === "completed" && url ? (
        <img src={url} alt="rendu" className="w-full h-full object-cover" />
      ) : r.status === "failed" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-xs text-[#F0EAE0]/60">{r.error ?? "Échec"}</div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#C4A264] animate-spin mb-2" />
          <div className="text-[10px] tracking-[0.3em] text-[#F0EAE0]/50">
            {r.status === "processing" ? "GÉNÉRATION…" : "EN ATTENTE"}
          </div>
        </div>
      )}
      {r.status === "completed" && (
        <>
          <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent text-[10px] tracking-[0.2em] text-[#C4A264] uppercase pointer-events-none">
            {r.style}
            {r.parent_id && " · modif."}
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onPresent && (
              <button
                onClick={onPresent}
                className="bg-black/70 border border-[#C4A264]/40 text-[#C4A264] hover:bg-[#C4A264] hover:text-black p-1.5"
                title="Mode présentation"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
            {onModify && (
              <button
                onClick={onModify}
                className="bg-black/70 border border-[#C4A264]/40 text-[#C4A264] hover:bg-[#C4A264] hover:text-black px-3 py-1.5 text-[10px] tracking-[0.2em] flex items-center gap-1.5"
              >
                <Wand2 className="w-3 h-3" />
                MODIFIER
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}