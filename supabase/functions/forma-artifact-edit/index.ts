// Edit an artifact (HTML or CSV) via AI based on a natural-language instruction
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );

    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const { artifactId, instruction, selection } = await req.json();
    if (!artifactId || !instruction) return json({ error: "Missing fields" }, 400);

    const { data: art, error: aErr } = await supabase
      .from("artifacts").select("id, type, title, content, mime_type")
      .eq("id", artifactId).maybeSingle();
    if (aErr || !art) return json({ error: "Artifact not found" }, 404);

    const isCsv = art.type === "spreadsheet";
    const lang = isCsv ? "CSV" : "HTML";

    const sys = `Tu es un éditeur expert en ${lang}. On te fournit un document ${lang} et une instruction de modification.
Renvoie UNIQUEMENT le nouveau document ${lang} complet, sans explication, sans bloc markdown \`\`\`.
${isCsv ? "Conserve l'entête et le format CSV." : "Conserve un document HTML autonome et complet (doctype, head, body, styles inline)."}
${selection ? `L'utilisateur a sélectionné une portion spécifique du document à modifier. Modifie principalement cette portion, garde le reste intact.` : ""}`;

    const userMsg = `Document actuel :\n\n${art.content}\n\n---\n${selection ? `PORTION SÉLECTIONNÉE:\n${selection}\n\n---\n` : ""}INSTRUCTION:\n${instruction}`;

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) return json({ error: "AI key missing" }, 500);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("AI error", r.status, t);
      return json({ error: r.status === 429 ? "Trop de requêtes" : r.status === 402 ? "Crédits IA épuisés" : "Erreur IA" }, 500);
    }

    const data = await r.json();
    let content: string = data?.choices?.[0]?.message?.content ?? "";
    // Strip ```html / ```csv fences if present
    content = content.trim()
      .replace(/^```(?:html|csv|HTML|CSV)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    if (!content) return json({ error: "Réponse IA vide" }, 500);

    const { error: upErr } = await supabase
      .from("artifacts").update({ content }).eq("id", artifactId);
    if (upErr) return json({ error: upErr.message }, 500);

    return json({ ok: true, content });
  } catch (e: any) {
    console.error(e);
    return json({ error: e.message ?? "Erreur" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
