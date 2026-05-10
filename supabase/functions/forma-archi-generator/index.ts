// FORMA Archi Generator - generates floor plans from constraints
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ARCHI_SYSTEM_PROMPT = `Tu es un architecte expert en design résidentiel. Tu génères des plans d'étage créatifset fonctionnelsen SVG basées sur les contraintes du client.

Pour chaque plan, tu dois:
1. Créer une disposition unique et distincte des autres
2. Optimiser la circulation et la lumière
3. Respecter les contraintes (surface, budget, nombre de pièces)
4. Renvoyer un SVG simple et lisible

Format de réponse attendu (JSON):
{
  "plans": [
    {
      "id": "plan-1",
      "title": "Nom du style architectural",
      "description": "Courte description de la disposition",
      "svg": "code SVG minimaliste"
    }
  ]
}

Règles pour le SVG:
- Utilise viewBox="0 0 100 100"
- Couleurs: mur=#C4A264, sol=#2a2a2a, texte=#F0EAE0
- Labels simples pour chaque pièce
- Ne pas inclure de texte supplémentaire dans le SVG`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // AI config - same pattern as other functions
    const AI_API_KEY = Deno.env.get("AI_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1";
    const AI_MODEL = Deno.env.get("AI_MODEL") ?? "google/gemini-2.5-flash";

    if (!AI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { constraints, surface, rooms, budget } = await req.json();

    if (!constraints) {
      return new Response(JSON.stringify({ error: "constraints required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt for AI
    const userPrompt = `Génère 6 plans d'étage différents et créatifs pour une maison avec les contraintes suivantes:

- Contraintes: ${constraints}
- Surface: ${surface || "150m²"}
- Pièces: ${rooms || "3 chambres, salon, cuisine, salle de bain"}
- Budget: ${budget || "medium"}

Pour chaque plan:
1. Donne un nom unique (ex: Plan Ouvert, Plan Classique, Plan L, etc.)
2. Décris brevemente la disposition en une phrase
3. Crée un SVG simple et lisible

Sois créatif et propose des styles variés: ouvert, classique, compact, circulaire, organique, en L, etc.`;

    // Call AI
    const aiResp = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: ARCHI_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error("AI error:", aiResp.status, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    let plans;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      const parsed = JSON.parse(jsonStr);
      plans = parsed.plans || parsed;
    } catch (e) {
      console.error("Failed to parse AI response:", e, "Content:", content);
      // Return mock plans as fallback
      plans = getMockPlans();
    }

    // Ensure we have 6 plans
    if (!Array.isArray(plans) || plans.length < 6) {
      plans = getMockPlans();
    }

    return new Response(JSON.stringify({ plans: plans.slice(0, 6) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getMockPlans() {
  return [
    {
      id: "1",
      title: "Plan Ouvert",
      description: "Space ouvert avec cuisine ouverte sur salon, maximum de lumière",
      svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="10" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="27" y="30" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><rect x="55" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="72" y="30" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><rect x="10" y="55" width="80" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="50" y="75" fill="#F0EAE0" font-size="8" text-anchor="middle">SALON / CUISINE</text></svg>`,
    },
    {
      id: "2",
      title: "Plan Classique",
      description: "Séparation traditionnelle avec couloir central",
      svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><line x1="50" y1="5" x2="50" y2="95" stroke="#C4A264" stroke-width="1"/><line x1="5" y1="50" x2="95" y2="50" stroke="#C4A264" stroke-width="1"/><rect x="10" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="27" y="30" fill="#F0EAE0" font-size="5" text-anchor="middle">SALON</text><rect x="55" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="72" y="30" fill="#F0EAE0" font-size="5" text-anchor="middle">CUISINE</text><rect x="10" y="55" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="27" y="75" fill="#F0EAE0" font-size="5" text-anchor="middle">CHAMBRE</text><rect x="55" y="55" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="72" y="75" fill="#F0EAE0" font-size="5" text-anchor="middle">CHAMBRE</text></svg>`,
    },
    {
      id: "3",
      title: "Plan en L",
      description: "Disposition compacte avec patio intérieur",
      svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="60" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="70" y="5" width="25" height="60" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="10" y="10" width="50" height="40" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="35" y="33" fill="#F0EAE0" font-size="6" text-anchor="middle">SALON</text><rect x="10" y="55" width="50" height="35" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="35" y="75" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><rect x="75" y="10" width="15" height="50" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="82" y="38" fill="#F0EAE0" font-size="5" text-anchor="middle">SDB</text><circle cx="85" cy="55" r="8" fill="none" stroke="#C4A264" stroke-width="1"/><text x="85" y="57" fill="#F0EAE0" font-size="4" text-anchor="middle">PATIO</text></svg>`,
    },
    {
      id: "4",
      title: "Plan Circulaire",
      description: "Circulation optimale autour d'un nucleus central",
      svg: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#C4A264" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="#C4A264" stroke-width="1"/><rect x="20" y="20" width="20" height="20" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="30" y="33" fill="#F0EAE0" font-size="5" text-anchor="middle">CH1</text><rect x="60" y="20" width="20" height="20" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="70" y="33" fill="#F0EAE0" font-size="5" text-anchor="middle">CH2</text><rect x="20" y="60" width="20" height="20" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="30" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">SDB</text><rect x="60" y="60" width="20" height="20" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="70" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">BUREAU</text><text x="50" y="53" fill="#F0EAE0" font-size="5" text-anchor="middle">CUISINE</text></svg>`,
    },
    {
      id: "5",
      title: "Plan Biologique",
      description: "Formes organiques avec maximum de lumière naturelle",
      svg: `<svg viewBox="0 0 100 100"><path d="M10,50 Q10,10 50,10 Q90,10 90,50 Q90,90 50,90 Q10,90 10,50" fill="none" stroke="#C4A264" stroke-width="2"/><path d="M30,30 Q40,20 50,30 Q60,40 50,50 Q40,60 30,50 Q20,40 30,30" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="40" y="43" fill="#F0EAE0" font-size="5" text-anchor="middle">CH</text><path d="M60,30 Q70,20 80,30 Q80,40 70,50 Q60,40 60,30" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="70" y="43" fill="#F0EAE0" font-size="5" text-anchor="middle">CH</text><path d="M30,60 Q40,50 50,60 Q70,80 60,80 Q40,80 30,60" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="47" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">SALON</text><path d="M70,60 Q80,50 85,60 Q85,70 75,70 Q65,70 70,60" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="77" y="68" fill="#F0EAE0" font-size="4" text-anchor="middle">SDB</text></svg>`,
    },
    {
      id: "6",
      title: "Plan Compact",
      description: "Optimisation maximale de l'espace, ideal pour petit terrain",
      svg: `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="10" y="10" width="25" height="25" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="22" y="25" fill="#F0EAE0" font-size="5" text-anchor="middle">CH1</text><rect x="40" y="10" width="25" height="25" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="52" y="25" fill="#F0EAE0" font-size="5" text-anchor="middle">CH2</text><rect x="70" y="10" width="20" height="25" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="80" y="25" fill="#F0EAE0" font-size="4" text-anchor="middle">SDB</text><rect x="10" y="40" width="80" height="50" fill="#2a2a2a" stroke="#C4A264" stroke-width="1" opacity="0.5"/><text x="50" y="68" fill="#F0EAE0" font-size="7" text-anchor="middle">OPEN SPACE</text></svg>`,
    },
  ];
}