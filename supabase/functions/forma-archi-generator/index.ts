// FORMA Archi Generator - generates floor plans from constraints
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Detailed system prompt for architecture floor plan generation
const ARCHI_SYSTEM_PROMPT = `Tu es un architecteen Intelligence Artificielle spécialisé dans la génération de plans d'étage résidentiels créatifs et fonctionnels.

Ta tâche: générer EXACTEMENT 6 plans d'étage différents en SVG, basés sur les contraintes du client.

FORMAT DE RÉPONSE STRICT - JSON seul, pas de markdown:

\`\`\`json
{
  "plans": [
    {
      "title": "Nom du style (ex: Plan Ouvert, Plan Classique, Plan L, etc.)",
      "description": "Description courte en une phrase",
      "svg": "Code SVG complet avec viewBox 0 0 100 100"
    }
  ]
}
\`\`\`

EXEMPLES DE STYLES ARCHITECTURAUX (utilise ces noms ou invente des variantes cohérentes):

1. **Plan Ouvert** - Open space salon/cuisine, circulation fluide, minimum de couloirs
2. **Plan Classique** - Séparation traditionnelle avec couloir central, pièces distinctes
3. **Plan en L** - Aile jour/aile nuit en L, souvent avec patio ou terrasse
4. **Plan Circulaire** - Circulation autour d'un nucleus central (escalier, cuisine)
5. **Plan Biologique** - Formes organiques, murs arrondis, lumière naturelle maximale
6. **Plan Compact** - Optimisation maximale, tous les m² utilisés, fonction密集
7. **Plan Duplex** - Deux niveaux intégrés, escalier visible
8. **Plan Panoramique** - Grande baie vitrée, vue extérieure privilégiée

RÈGLES SVG TRÈS IMPORTANTES:
1. viewBox="0 0 100 100" OBLIGATOIRE
2. Utilise ces couleurs précises:
   - Murs: #C4A264 (or)
   - Sol: #2a2a2a (gris foncé)
   - Texte: #F0EAE0 (ivoire)
3. Chaque pièce doit avoir un label texte lisible
4. Style SVG: minimaliste, architectural, propre
5. Pas de gradients, pas d'images, que des formes géométriques simples
6. Utilise rect, line, circle, text uniquement

Exemples de pièces à inclure selon demande: chambre, salon, cuisine, salle de bain, bureau, entrée, dressing, terrasse, patio.

Sois créatif avec les dispositions: open space, séparation classique, en L, circulaire, organique, compact, duplex, etc.

IMPORTANT: Renvoie UNIQUEMENT du JSON valide, pas de texte avant ou après.`;

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

    // Build detailed prompt for AI
    const userPrompt = `Génère EXACTEMENT 6 plans d'étage différents et créatifs pour une maison.

CONTRAINTES DU CLIENT:
${constraints}

SPÉCIFICATIONS:
- Surface: ${surface || "150m²"}
- Pièces demandées: ${rooms || "3 chambres, salon, cuisine, salle de bain"}
- Budget: ${budget || "medium"}

Pour chaque plan:
1. Donne un nom unique et distinctif (ex: Plan Ouvert, Plan Classique, Plan L, Plan Circulaire, Plan Biologique, Plan Compact)
2. Écris une description d'une ligne
3. Crée un SVG propre avec viewBox="0 0 100 100"

Le SVG doit-show:
- Les murs extérieurs (rect avec stroke)
- Les cloisons intérieures (line)
- Les différentes pièces avec labels
- Une disposition unique pour chacun

IMPORTANT: Renvoie uniquement du JSON valide avec un array "plans" contenant 6 objets avec title, description, et svg.`;

    // Call AI with better settings for code generation
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
        temperature: 0.7,
        max_tokens: 4000,
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

    console.log("AI response:", content.slice(0, 500));

    // Parse JSON from response - try multiple approaches
    let plans = null;

    // Try 1: Direct parse
    try {
      plans = JSON.parse(content);
    } catch (e) {
      console.log("Direct parse failed");
    }

    // Try 2: Extract from markdown code block
    if (!plans) {
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          plans = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        console.log("Markdown extract failed");
      }
    }

    // Try 3: Extract any JSON object from the text
    if (!plans) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"plans"[\s\S]*\}/);
        if (jsonMatch) {
          plans = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log("Regex extract failed");
      }
    }

    // Validate the plans
    if (!plans || !plans.plans || !Array.isArray(plans.plans) || plans.plans.length < 6) {
      console.log("Invalid plans format, using fallback");
      throw new Error("Invalid AI response format");
    }

    // Validate each SVG has required elements
    const validPlans = plans.plans.slice(0, 6).map((plan: any, index: number) => ({
      id: String(index + 1),
      title: plan.title || getDefaultTitle(index),
      description: plan.description || "Plan généré par IA",
      svg: plan.svg || generateFallbackSvg(index),
    }));

    console.log("Generated plans:", validPlans.map(p => p.title).join(", "));

    return new Response(JSON.stringify({ plans: validPlans }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    // Only use fallback as last resort
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Generation failed",
      plans: getFallbackPlans()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDefaultTitle(index: number): string {
  const titles = [
    "Plan Ouvert", "Plan Classique", "Plan en L",
    "Plan Circulaire", "Plan Biologique", "Plan Compact"
  ];
  return titles[index] || "Plan";
}

function generateFallbackSvg(index: number): string {
  const svgs = [
    `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="10" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" opacity="0.5"/><text x="27" y="30" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><rect x="55" y="10" width="35" height="35" fill="#2a2a2a" stroke="#C4A264" opacity="0.5"/><text x="72" y="30" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><rect x="10" y="55" width="80" height="35" fill="#2a2a2a" stroke="#C4A264" opacity="0.5"/><text x="50" y="75" fill="#F0EAE0" font-size="8" text-anchor="middle">SALON / CUISINE</text></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><line x1="50" y1="5" x2="50" y2="95" stroke="#C4A264"/><line x1="5" y1="50" x2="95" y2="50" stroke="#C4A264"/><text x="27" y="30" fill="#F0EAE0" font-size="5" text-anchor="middle">SALON</text><text x="72" y="30" fill="#F0EAE0" font-size="5" text-anchor="middle">CUISINE</text><text x="27" y="75" fill="#F0EAE0" font-size="5" text-anchor="middle">CHAMBRE</text><text x="72" y="75" fill="#F0EAE0" font-size="5" text-anchor="middle">CHAMBRE</text></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="60" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><rect x="70" y="5" width="25" height="60" fill="none" stroke="#C4A264" stroke-width="2"/><text x="35" y="33" fill="#F0EAE0" font-size="6" text-anchor="middle">SALON</text><text x="35" y="75" fill="#F0EAE0" font-size="6" text-anchor="middle">CHAMBRE</text><text x="82" y="38" fill="#F0EAE0" font-size="5" text-anchor="middle">SDB</text><circle cx="85" cy="55" r="8" fill="none" stroke="#C4A264"/></svg>`,
    `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#C4A264" stroke-width="2"/><circle cx="50" cy="50" r="25" fill="none" stroke="#C4A264"/><text x="30" y="33" fill="#F0EAE0" font-size="5" text-anchor="middle">CH1</text><text x="70" y="33" fill="#F0EAE0" font-size="5" text-anchor="middle">CH2</text><text x="30" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">SDB</text><text x="70" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">BUREAU</text><text x="50" y="53" fill="#F0EAE0" font-size="5" text-anchor="middle">CUISINE</text></svg>`,
    `<svg viewBox="0 0 100 100"><path d="M10,50 Q10,10 50,10 Q90,10 90,50 Q90,90 50,90 Q10,90 10,50" fill="none" stroke="#C4A264" stroke-width="2"/><text x="40" y="43" fill="#F0EAE0" font-size="5" text-anchor="middle">CH</text><text x="70" y="43" fill="#F0EAE0" font-size="5" text-anchor="middle">CH</text><text x="47" y="73" fill="#F0EAE0" font-size="5" text-anchor="middle">SALON</text><text x="77" y="68" fill="#F0EAE0" font-size="4" text-anchor="middle">SDB</text></svg>`,
    `<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="none" stroke="#C4A264" stroke-width="2"/><text x="22" y="25" fill="#F0EAE0" font-size="5" text-anchor="middle">CH1</text><text x="52" y="25" fill="#F0EAE0" font-size="5" text-anchor="middle">CH2</text><text x="80" y="25" fill="#F0EAE0" font-size="4" text-anchor="middle">SDB</text><text x="50" y="68" fill="#F0EAE0" font-size="7" text-anchor="middle">OPEN SPACE</text></svg>`,
  ];
  return svgs[index] || svgs[0];
}

function getFallbackPlans() {
  return [
    { id: "1", title: "Plan Ouvert", description: "Space ouvert avec cuisine ouverte sur salon", svg: generateFallbackSvg(0) },
    { id: "2", title: "Plan Classique", description: "Séparation traditionnelle avec couloir", svg: generateFallbackSvg(1) },
    { id: "3", title: "Plan en L", description: "Disposition compacte avec patio", svg: generateFallbackSvg(2) },
    { id: "4", title: "Plan Circulaire", description: "Circulation autour d'un nucleus central", svg: generateFallbackSvg(3) },
    { id: "5", title: "Plan Biologique", description: "Formes organiques et lumière naturelle", svg: generateFallbackSvg(4) },
    { id: "6", title: "Plan Compact", description: "Optimisation maximale de l'espace", svg: generateFallbackSvg(5) },
  ];
}