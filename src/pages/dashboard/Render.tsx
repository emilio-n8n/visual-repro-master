import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

type Render = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string | null;
  style: string | null;
  input_path: string;
  output_path: string | null;
  error: string | null;
  created_at: string;
};

const STYLES = [
  { id: "photoreal", label: "Photoréaliste" },
  { id: "twilight", label: "Crépuscule" },
  { id: "scandinavian", label: "Scandinave" },
  { id: "editorial", label: "Éditorial" },
];

export default function RenderPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState("photoreal");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [renders, setRenders] = useState<Render[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load + realtime
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
          setRenders((curr) => {
            if (payload.eventType === "DELETE")
              return curr.filter((r) => r.id !== (payload.old as Render).id);
            const row = payload.new as Render;
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
  }, [user]);

  // Sign output URLs
  useEffect(() => {
    const need = renders.filter((r) => r.output_path && !signedUrls[r.id]);
    if (!need.length) return;
    (async () => {
      const updates: Record<string, string> = {};
      for (const r of need) {
        const { data } = await supabase.storage
          .from("render-outputs")
          .createSignedUrl(r.output_path!, 3600);
        if (data?.signedUrl) updates[r.id] = data.signedUrl;
      }
      if (Object.keys(updates).length) setSignedUrls((s) => ({ ...s, ...updates }));
    })();
  }, [renders, signedUrls]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    try {
      // 1. Upload to render-inputs/<userId>/<uuid>.<ext>
      const ext = file.name.split(".").pop() || "png";
      const id = crypto.randomUUID();
      const inputPath = `${user.id}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("render-inputs")
        .upload(inputPath, file, { contentType: file.type });
      if (upErr) throw upErr;

      // 2. Insert render row
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

      // 3. Trigger edge function
      const { error: fnErr } = await supabase.functions.invoke("forma-render", {
        body: { renderId: inserted.id },
      });
      if (fnErr) throw fnErr;

      toast.success("Rendu lancé. Quelques secondes…");
      handleFile(null);
      setPrompt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      <h1
        className="text-4xl mb-2 text-[#F0EAE0]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        FORMA Render AI
      </h1>
      <p className="text-[#F0EAE0]/60 mb-10">
        Importez un rendu 3D, choisissez une atmosphère, obtenez une image photoréaliste.
      </p>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mb-12">
        {/* Upload form */}
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
            disabled={!file || submitting}
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

        {/* Latest result */}
        <div className="border border-[#C4A264]/20 bg-black/20 min-h-[400px] flex items-center justify-center p-4">
          {renders[0] ? (
            <RenderCard r={renders[0]} url={signedUrls[renders[0].id]} large />
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
            {renders.slice(1).map((r) => (
              <RenderCard key={r.id} r={r} url={signedUrls[r.id]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RenderCard({ r, url, large }: { r: Render; url?: string; large?: boolean }) {
  const aspect = large ? "aspect-[4/3]" : "aspect-square";
  return (
    <div className={`relative ${aspect} bg-black/40 border border-[#C4A264]/15 overflow-hidden`}>
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
        <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent text-[10px] tracking-[0.2em] text-[#C4A264] uppercase">
          {r.style}
        </div>
      )}
    </div>
  );
}
