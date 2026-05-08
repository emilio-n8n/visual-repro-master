// FORMA Agent - chat with tool calling, streamed via SSE
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_PROMPT = `Tu es FORMA Agent, l'assistant IA intégré à la plateforme FORMA (un studio créatif IA pour architectes).
IMPORTANT : "FORMA" est le nom de la plateforme/outil que vous utilisez, ce n'est PAS le nom du cabinet de l'utilisateur. Le nom réel du cabinet vous est donné plus bas dans la section "Cabinet". Référez-vous toujours à ce nom-là (ou à "votre cabinet") lorsque vous parlez du studio de l'utilisateur. Ne dites jamais "le cabinet FORMA".

Ton rôle :
- Aider à formuler des prompts pour la génération de rendus photoréalistes.
- Conseiller sur les ambiances (Photoréaliste, Twilight, Scandinave, Éditorial).
- Proposer des palettes de matériaux, lumière, mobilier.
- Produire des livrables clients : diaporamas, tableurs, visualisations de données, mini-sites.

Style : élégant, précis, concis. Vouvoiement. Français par défaut.

OUTILS DISPONIBLES — utilise-les dès que pertinent, sans demander confirmation :
- create_render, create_slideshow, create_spreadsheet, create_dataviz, create_website, create_document, create_moodboard
- web_search, fetch_url, calculate
- remember : sauvegarde un fait important. Choisis le bon scope : 'project' (lié au projet courant), 'workspace' (lié au cabinet, partagé avec l'équipe), 'global' (préférences personnelles transverses).
- recall_memories : recherche dans tes souvenirs (par scope/projet).
- list_projects, list_team, list_team_work : explore le studio et le travail des membres.
- mention_member : notifie un membre du studio (mention).

Règles de qualité :
- HTML toujours complet et auto-suffisant.
- Pour info récente / chiffrée : web_search puis fetch_url. Cite les sources.
- Sauvegarde activement avec remember dès qu'un fait nouveau est appris (préférence du cabinet, contrainte projet, décision client). N'attends pas qu'on te le demande.
- Réponse textuelle : annonce brièvement ce que tu produis, puis appelle l'outil.`;

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
  {
    type: "function",
    function: {
      name: "remember",
      description: "Sauvegarde un fait/préférence en mémoire. Scopes: 'project' (projet courant), 'workspace' (cabinet, partagé équipe), 'global' (préférences perso transverses).",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["project", "workspace", "global"] },
          key: { type: "string", description: "Étiquette courte (ex: 'preference_couleurs', 'contrainte_budget')" },
          content: { type: "string", description: "Le souvenir, en une phrase claire." },
        },
        required: ["scope", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recall_memories",
      description: "Recherche des souvenirs (par scope, ou tous).",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["project", "workspace", "global", "all"] },
          query: { type: "string", description: "Mots-clés (optionnel)." },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "Liste les projets du studio.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_team",
      description: "Liste les membres de l'équipe et leur rôle.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_team_work",
      description: "Liste les derniers livrables/conversations produits par l'équipe (filtrable par membre ou projet).",
      parameters: {
        type: "object",
        properties: {
          member_id: { type: "string", description: "user_id d'un membre (optionnel)" },
          project_id: { type: "string", description: "id d'un projet (optionnel)" },
          limit: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mention_member",
      description: "Notifie un membre de l'équipe (mention).",
      parameters: {
        type: "object",
        properties: {
          team_member_id: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["team_member_id", "title"],
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

    const { conversationId, message, projectId } = await req.json();
    if (!conversationId || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure conversation has correct project_id
    if (projectId !== undefined) {
      await supabase.from("conversations").update({ project_id: projectId }).eq("id", conversationId);
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Load workspace, cabinet profile, project, and memories context
    const { data: ws } = await supabase
      .from("workspaces").select("id, name").limit(1).maybeSingle();
    const wsId = ws?.id ?? null;

    const [{ data: cabinet }, { data: project }, { data: memList }] = await Promise.all([
      wsId ? supabase.from("cabinet_profile").select("*").eq("workspace_id", wsId).maybeSingle() : Promise.resolve({ data: null }),
      projectId ? supabase.from("projects").select("*").eq("id", projectId).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("memories").select("scope, key, content, project_id").or(
        `scope.eq.global,workspace_id.eq.${wsId ?? "00000000-0000-0000-0000-000000000000"}`
      ).order("created_at", { ascending: false }).limit(60),
    ]);

    let contextBlock = "";
    if (cabinet) {
      contextBlock += `\n\n## Cabinet (${cabinet.name ?? ""})\n`;
      const fields = ["style","project_types","tone","email_signature","tools","deliverables","clientele","brand_values","references_text","process","materials_pref","suppliers","typical_pricing"];
      for (const f of fields) {
        const v = (cabinet as any)[f];
        if (v) contextBlock += `- ${f}: ${String(v).slice(0, 300)}\n`;
      }
      const tpl = (cabinet as any).email_templates;
      if (tpl && Object.keys(tpl).length) {
        contextBlock += `- email_templates: ${Object.keys(tpl).join(", ")}\n`;
      }
    }
    if (project) {
      contextBlock += `\n## Projet courant: ${project.name}\n`;
      for (const f of ["client","location","type","surface","budget","deadline","brief"]) {
        const v = (project as any)[f];
        if (v) contextBlock += `- ${f}: ${v}\n`;
      }
    } else {
      contextBlock += `\n## Projet courant: (hors projet)\n`;
    }
    const relevantMems = (memList ?? []).filter((m: any) =>
      m.scope === "global" || m.scope === "workspace" || (m.scope === "project" && m.project_id === projectId)
    );
    if (relevantMems.length) {
      contextBlock += `\n## Mémoires (${relevantMems.length})\n`;
      for (const m of relevantMems.slice(0, 30)) {
        contextBlock += `- [${m.scope}${m.key ? ":"+m.key : ""}] ${String(m.content).slice(0, 240)}\n`;
      }
    }

    const SYSTEM_PROMPT = BASE_PROMPT + contextBlock;

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

    // Portable AI config — works with Lovable Gateway, OpenAI, or Gemini's OpenAI-compatible endpoint
    const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1";
    const AI_MODEL = Deno.env.get("AI_MODEL") ?? "google/gemini-2.5-flash";
    if (!AI_API_KEY) throw new Error("AI_API_KEY (or LOVABLE_API_KEY) missing");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const safeEnqueue = (s: string) => {
          try { controller.enqueue(encoder.encode(s)); } catch {}
        };


        try {
          const MAX_TURNS = 5;
          for (let turn = 0; turn < MAX_TURNS; turn++) {
            const aiResp = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: AI_MODEL,
                messages: apiMessages,
                tools,
                stream: true,
              }),
            });

            if (!aiResp.ok || !aiResp.body) {
              const t = await aiResp.text().catch(() => "");
              console.error("AI error", aiResp.status, t);
              const msg = aiResp.status === 429
                ? "Trop de requêtes, réessayez dans un instant."
                : aiResp.status === 402
                  ? "Crédits AI épuisés."
                  : "Erreur de la passerelle AI.";
              safeEnqueue(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`);
              break;
            }

            const reader = aiResp.body.getReader();
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
                    safeEnqueue(`data: ${JSON.stringify({ type: "delta", content: delta.content })}\n\n`);
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

            apiMessages.push({
              role: "assistant",
              content: assistantContent,
              ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
            });

            if (!toolCalls.length) break;

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
            } else if (name === "create_dataviz" || name === "create_website" || name === "create_document") {
              const t = name === "create_dataviz" ? "dataviz" : name === "create_website" ? "website" : "document";
              const { data: a, error } = await supabase.from("artifacts").insert({
                user_id: user.id, workspace_id: ws?.id ?? null,
                type: t,
                title: args.title || (t === "dataviz" ? "Visualisation" : t === "website" ? "Site" : "Document"),
                content: args.html || "", mime_type: "text/html",
              }).select().single();
              if (error) throw error;
              result = { ok: true, kind: t, artifactId: a.id, title: a.title };
            } else if (name === "create_moodboard") {
              const prompts: string[] = (args.prompts || []).slice(0, 6);
              const renderIds: string[] = [];
              for (const p of prompts) {
                const { data: r, error } = await supabase.from("renders").insert({
                  user_id: user.id, workspace_id: ws?.id ?? null,
                  status: "pending", prompt: p, style: args.style || "photoreal",
                  input_path: "agent://text-only",
                }).select().single();
                if (error) throw error;
                renderIds.push(r.id);
                fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/forma-render`, {
                  method: "POST",
                  headers: { Authorization: authHeader, "Content-Type": "application/json" },
                  body: JSON.stringify({ renderId: r.id }),
                }).catch((e) => console.error("forma-render trigger", e));
              }
              const { data: a, error: aerr } = await supabase.from("artifacts").insert({
                user_id: user.id, workspace_id: ws?.id ?? null,
                type: "moodboard", title: args.title || "Moodboard",
                content: JSON.stringify({ renderIds, prompts, style: args.style }),
                mime_type: "application/json",
              }).select().single();
              if (aerr) throw aerr;
              result = { ok: true, kind: "moodboard", artifactId: a.id, title: a.title, renderIds };
            } else if (name === "web_search") {
              const q = encodeURIComponent(args.query || "");
              const max = Math.min(10, args.max_results || 5);
              const r = await fetch(`https://duckduckgo.com/html/?q=${q}`, {
                headers: { "User-Agent": "Mozilla/5.0 FORMA Agent" },
              });
              const html = await r.text();
              const items: any[] = [];
              const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
              let m: RegExpExecArray | null;
              while ((m = re.exec(html)) && items.length < max) {
                const url = decodeURIComponent(m[1].replace(/^.*uddg=/, "").split("&")[0]);
                const title = m[2].replace(/<[^>]+>/g, "").trim();
                const snippet = m[3].replace(/<[^>]+>/g, "").trim();
                items.push({ title, url, snippet });
              }
              result = { ok: true, kind: "web_search", query: args.query, results: items };
            } else if (name === "fetch_url") {
              const r = await fetch(args.url, {
                headers: { "User-Agent": "Mozilla/5.0 FORMA Agent" },
              });
              const html = await r.text();
              const text = html
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 8000);
              result = { ok: true, kind: "fetch_url", url: args.url, text };
            } else if (name === "calculate") {
              const expr = String(args.expression || "");
              if (!/^[\d\s+\-*/().,%^]+$/.test(expr)) throw new Error("Expression invalide");
              const val = Function(`"use strict";return (${expr.replace(/\^/g, "**").replace(/,/g, ".")})`)();
              result = { ok: true, kind: "calculate", expression: expr, value: val };
            } else if (name === "remember") {
              const scope = args.scope as string;
              const { data: mem, error } = await supabase.from("memories").insert({
                user_id: user.id,
                workspace_id: scope === "global" ? null : ws?.id ?? null,
                project_id: scope === "project" ? projectId ?? null : null,
                scope,
                key: args.key ?? null,
                content: String(args.content || ""),
              }).select().single();
              if (error) throw error;
              result = { ok: true, kind: "remember", id: mem.id, scope };
            } else if (name === "recall_memories") {
              const scope = args.scope ?? "all";
              let q = supabase.from("memories").select("scope, key, content, project_id, created_at").order("created_at", { ascending: false }).limit(40);
              if (scope !== "all") q = q.eq("scope", scope);
              const { data } = await q;
              let mems = data ?? [];
              if (args.query) {
                const ql = String(args.query).toLowerCase();
                mems = mems.filter((m: any) => (m.content || "").toLowerCase().includes(ql) || (m.key || "").toLowerCase().includes(ql));
              }
              result = { ok: true, kind: "recall_memories", count: mems.length, memories: mems.slice(0, 20) };
            } else if (name === "list_projects") {
              const { data } = await supabase.from("projects").select("id, name, client, location, type, deadline").order("updated_at", { ascending: false });
              result = { ok: true, kind: "list_projects", projects: data ?? [] };
            } else if (name === "list_team") {
              const { data } = await supabase.from("team_members").select("id, display_name, email, role_label, status, joined_user_id");
              result = { ok: true, kind: "list_team", members: data ?? [] };
            } else if (name === "list_team_work") {
              const limit = Math.min(30, args.limit || 10);
              let aq = supabase.from("artifacts").select("id, type, title, project_id, user_id, created_at").order("created_at", { ascending: false }).limit(limit);
              if (args.project_id) aq = aq.eq("project_id", args.project_id);
              if (args.member_id) aq = aq.eq("user_id", args.member_id);
              let cq = supabase.from("conversations").select("id, title, project_id, user_id, updated_at").order("updated_at", { ascending: false }).limit(limit);
              if (args.project_id) cq = cq.eq("project_id", args.project_id);
              if (args.member_id) cq = cq.eq("user_id", args.member_id);
              const [{ data: arts }, { data: convs }] = await Promise.all([aq, cq]);
              result = { ok: true, kind: "list_team_work", artifacts: arts ?? [], conversations: convs ?? [] };
            } else if (name === "mention_member") {
              const { data: tm } = await supabase.from("team_members").select("joined_user_id, display_name, workspace_id").eq("id", args.team_member_id).maybeSingle();
              if (!tm?.joined_user_id) {
                result = { ok: false, error: "Membre non encore inscrit" };
              } else {
                const { error } = await supabase.from("notifications").insert({
                  workspace_id: tm.workspace_id,
                  user_id: tm.joined_user_id,
                  from_user_id: user.id,
                  type: "mention",
                  title: args.title,
                  body: args.body ?? null,
                });
                if (error) throw error;
                result = { ok: true, kind: "mention_member", to: tm.display_name };
              }
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
          safeEnqueue(`data: ${JSON.stringify({ type: "tool_result", name, result })}\n\n`);

          const compact: any = { ...result };
          if (typeof compact.text === "string" && compact.text.length > 2000) {
            compact.text = compact.text.slice(0, 2000) + "…";
          }
          apiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(compact),
          });
            }
          }
        } catch (e) {
          console.error("agent loop error", e);
          safeEnqueue(`data: ${JSON.stringify({ type: "error", error: e instanceof Error ? e.message : "Unknown" })}\n\n`);
        }

        safeEnqueue(`data: [DONE]\n\n`);
        try { controller.close(); } catch {}
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
