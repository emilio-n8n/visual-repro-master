// FORMA Agent - chat with tool calling, streamed via SSE
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es FORMA Agent, l'assistant IA dédié aux architectes et designers d'intérieur de la marque FORMA.

Ton rôle :
- Aider à formuler des prompts pour la génération de rendus photoréalistes.
- Conseiller sur les ambiances (Photoréaliste, Twilight, Scandinave, Éditorial).
- Proposer des palettes de matériaux, lumière, mobilier.
- Produire des livrables clients : diaporamas, tableurs, visualisations de données, mini-sites.

Style : élégant, précis, concis. Vouvoiement. Français par défaut.

OUTILS DISPONIBLES — utilise-les dès que pertinent, sans demander confirmation :
- create_render : génère une image / rendu IA (style: photoreal, twilight, scandi, editorial).
- create_slideshow : crée un diaporama. Tu fournis un tableau de slides, chacune codée en HTML complet (un <section> autonome avec styles inline, ratio 16:9). Soigne la typo (Cormorant Garamond pour les titres, Inter pour le texte), respecte une charte sobre et premium (or #C4A264, ivoire #F0EAE0, fond sombre #0b0b0b ou clair #faf7f2 selon le contexte).
- create_spreadsheet : crée un tableur. Fournis un CSV propre (séparateur virgule, première ligne = entêtes).
- create_dataviz : crée une visualisation. Fournis un document HTML complet et autonome (avec <html>, <head>, <body>) embarquant Chart.js via CDN OU du SVG inline. Les données doivent être visibles immédiatement.
- create_website : crée un mini-site one-page. Fournis un document HTML complet et autonome, responsive, avec styles inline ou <style> dans le <head>.
- create_document : crée un document long format (rapport, note de cadrage, mémoire technique). Fournis un HTML complet, mise en page A4, typographie soignée.
- create_moodboard : crée une planche d'ambiance composée de 3 à 6 visuels générés à partir de prompts distincts (chaque prompt = un rendu IA), assemblés dans un layout HTML élégant.
- web_search : interroge le web (DuckDuckGo) pour obtenir des résultats récents (titres + extraits + URLs). À utiliser dès qu'une question requiert des infos d'actualité, prix, références produits, normes, tendances.
- fetch_url : récupère le contenu textuel d'une page web (article, fiche produit, doc technique). À combiner avec web_search pour approfondir une source.
- calculate : évalue une expression mathématique (devis, surfaces, ratios, conversions). Utilise-le plutôt que de calculer toi-même.

Règles de qualité :
- HTML toujours complet et auto-suffisant (pas de dépendances locales).
- Pour toute info récente, factuelle ou chiffrée externe : utilise web_search puis fetch_url. Cite les sources dans ta réponse.
- Réponse textuelle : annonce brièvement ce que tu produis, puis appelle l'outil. N'inclus PAS le HTML/CSV dans le texte.`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_render",
      description: "Lance un rendu IA FORMA à partir d'un prompt textuel.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          style: { type: "string", enum: ["photoreal", "twilight", "scandi", "editorial"] },
        },
        required: ["prompt", "style"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_slideshow",
      description: "Crée un diaporama. Chaque slide = un fragment HTML (section) autonome.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          slides: {
            type: "array",
            items: { type: "string", description: "HTML complet d'une slide (section autonome)." },
          },
        },
        required: ["title", "slides"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_spreadsheet",
      description: "Crée un tableur (CSV).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          csv: { type: "string", description: "CSV complet, première ligne = entêtes." },
        },
        required: ["title", "csv"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_dataviz",
      description: "Crée une visualisation de données (HTML autonome avec Chart.js ou SVG).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          html: { type: "string", description: "Document HTML complet et autonome." },
        },
        required: ["title", "html"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_website",
      description: "Crée un mini-site one-page (HTML autonome).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          html: { type: "string", description: "Document HTML complet et autonome." },
        },
        required: ["title", "html"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_document",
      description: "Crée un document long format (HTML mise en page A4).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          html: { type: "string", description: "Document HTML complet, mise en page A4." },
        },
        required: ["title", "html"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_moodboard",
      description: "Crée une planche d'ambiance avec 3 à 6 visuels IA.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          style: { type: "string", enum: ["photoreal", "twilight", "scandi", "editorial"] },
          prompts: { type: "array", items: { type: "string" } },
        },
        required: ["title", "style", "prompts"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Recherche web (DuckDuckGo). Renvoie titres, extraits, URLs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          max_results: { type: "number" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Récupère le contenu textuel d'une page web.",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description: "Évalue une expression mathématique.",
      parameters: {
        type: "object",
        properties: { expression: { type: "string" } },
        required: ["expression"],
        additionalProperties: false,
      },
    },
  },
];

function wrapSlideshow(title: string, slides: string[]): string {
  const slidesHtml = slides
    .map(
      (s, i) => `<article class="slide" data-i="${i}"><div class="slide-inner">${s}</div></article>`
    )
    .join("\n");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0b0b0b;color:#F0EAE0;font-family:Inter,sans-serif;height:100%;overflow:hidden}
.deck{height:100vh;display:flex;align-items:center;justify-content:center;position:relative}
.slide{display:none;width:min(95vw,1600px);aspect-ratio:16/9;background:#faf7f2;color:#1a1a1a;border-radius:4px;box-shadow:0 30px 80px rgba(0,0,0,.5);overflow:hidden;position:relative}
.slide.active{display:block}
.slide-inner{width:100%;height:100%;padding:64px;display:flex;flex-direction:column;justify-content:center;font-family:Inter,sans-serif}
.slide-inner h1,.slide-inner h2,.slide-inner h3{font-family:'Cormorant Garamond',serif;font-weight:500;color:#1a1a1a;margin-bottom:24px}
.slide-inner h1{font-size:64px;letter-spacing:-.02em}
.slide-inner h2{font-size:44px}
.slide-inner p,.slide-inner li{font-size:20px;line-height:1.6;color:#333;margin-bottom:12px}
.slide-inner ul,.slide-inner ol{padding-left:24px}
.nav{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;background:rgba(0,0,0,.6);padding:8px 16px;border-radius:999px;border:1px solid rgba(196,162,100,.3)}
.nav button{background:none;border:none;color:#C4A264;cursor:pointer;font-size:16px;padding:4px 10px}
.nav button:hover{color:#fff}
.nav .num{color:#F0EAE0;font-size:13px;letter-spacing:.1em}
</style></head>
<body><div class="deck">${slidesHtml}</div>
<div class="nav"><button id="p">‹</button><span class="num"><span id="c">1</span> / ${slides.length}</span><button id="n">›</button></div>
<script>
const s=document.querySelectorAll('.slide');let i=0;const c=document.getElementById('c');
function go(d){i=Math.max(0,Math.min(s.length-1,i+d));s.forEach((el,k)=>el.classList.toggle('active',k===i));c.textContent=i+1}
go(0);document.getElementById('n').onclick=()=>go(1);document.getElementById('p').onclick=()=>go(-1);
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
</script></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversationId, message } = await req.json();
    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    const { data: history } = await supabase
      .from("messages")
      .select("role, content, tool_calls, tool_call_id")
      .eq("conversation_id", conversationId)
      .order("created_at");

    const apiMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const m of history ?? []) {
      const msg: any = { role: m.role, content: m.content };
      if (m.tool_calls) msg.tool_calls = m.tool_calls;
      if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
      apiMessages.push(msg);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        tools,
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits AI épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResp.body!.getReader();
        let buffer = "";
        let assistantContent = "";
        let toolCallsMap: Record<number, any> = {};
        let done = false;

        while (!done) {
          const { value, done: rDone } = await reader.read();
          if (rDone) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                assistantContent += delta.content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta.content })}\n\n`));
              }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCallsMap[idx]) {
                    toolCallsMap[idx] = { id: tc.id, type: "function", function: { name: "", arguments: "" } };
                  }
                  if (tc.id) toolCallsMap[idx].id = tc.id;
                  if (tc.function?.name) toolCallsMap[idx].function.name += tc.function.name;
                  if (tc.function?.arguments) toolCallsMap[idx].function.arguments += tc.function.arguments;
                }
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        const toolCalls = Object.values(toolCallsMap);

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
          tool_calls: toolCalls.length ? toolCalls : null,
        });

        const { data: ws } = await supabase
          .from("workspaces").select("id").limit(1).maybeSingle();

        for (const tc of toolCalls) {
          const name = tc.function.name;
          let result: any = { ok: false };
          try {
            const args = JSON.parse(tc.function.arguments || "{}");

            if (name === "create_render") {
              const { data: render, error } = await supabase
                .from("renders")
                .insert({
                  user_id: user.id, workspace_id: ws?.id ?? null,
                  status: "pending", prompt: args.prompt, style: args.style,
                  input_path: "agent://text-only",
                })
                .select().single();
              if (error) throw error;
              fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/forma-render`, {
                method: "POST",
                headers: { Authorization: authHeader, "Content-Type": "application/json" },
                body: JSON.stringify({ renderId: render.id }),
              }).catch((e) => console.error("forma-render trigger", e));
              result = { ok: true, kind: "render", renderId: render.id };
            } else if (name === "create_slideshow") {
              const html = wrapSlideshow(args.title || "Diaporama", args.slides || []);
              const { data: a, error } = await supabase.from("artifacts").insert({
                user_id: user.id, workspace_id: ws?.id ?? null,
                type: "slideshow", title: args.title || "Diaporama",
                content: html, mime_type: "text/html",
              }).select().single();
              if (error) throw error;
              result = { ok: true, kind: "slideshow", artifactId: a.id, title: a.title };
            } else if (name === "create_spreadsheet") {
              const { data: a, error } = await supabase.from("artifacts").insert({
                user_id: user.id, workspace_id: ws?.id ?? null,
                type: "spreadsheet", title: args.title || "Tableur",
                content: args.csv || "", mime_type: "text/csv",
              }).select().single();
              if (error) throw error;
              result = { ok: true, kind: "spreadsheet", artifactId: a.id, title: a.title };
            } else if (name === "create_dataviz" || name === "create_website") {
              const { data: a, error } = await supabase.from("artifacts").insert({
                user_id: user.id, workspace_id: ws?.id ?? null,
                type: name === "create_dataviz" ? "dataviz" : "website",
                title: args.title || (name === "create_dataviz" ? "Visualisation" : "Site"),
                content: args.html || "", mime_type: "text/html",
              }).select().single();
              if (error) throw error;
              result = { ok: true, kind: name === "create_dataviz" ? "dataviz" : "website", artifactId: a.id, title: a.title };
            }
          } catch (e) {
            console.error("tool error", name, e);
            result = { ok: false, error: e instanceof Error ? e.message : "Unknown" };
          }

          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: tc.id,
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name, result })}\n\n`));
        }

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("forma-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
