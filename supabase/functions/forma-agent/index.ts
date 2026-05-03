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
- Expliquer comment utiliser FORMA Render AI (upload de rendu 3D brut → photoréalisme).

Style : élégant, précis, concis. Vouvoiement. Français par défaut.

Tu peux générer des rendus directement via l'outil "create_render". Quand l'utilisateur demande une image / un rendu / une variante, utilise cet outil avec un prompt riche et une style ('photoreal' | 'twilight' | 'scandi' | 'editorial').`;

const tools = [
  {
    type: "function",
    function: {
      name: "create_render",
      description:
        "Lance un nouveau rendu IA FORMA à partir d'un prompt textuel uniquement (sans image source). Utile pour explorer une ambiance ou une palette.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Description détaillée de la scène à générer.",
          },
          style: {
            type: "string",
            enum: ["photoreal", "twilight", "scandi", "editorial"],
            description: "Style visuel.",
          },
        },
        required: ["prompt", "style"],
        additionalProperties: false,
      },
    },
  },
];

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

    // Persist user message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Load history
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
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits AI épuisés. Ajoutez du crédit dans votre workspace Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream + collect content + detect tool calls
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

        // Persist assistant message
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: assistantContent,
          tool_calls: toolCalls.length ? toolCalls : null,
        });

        // Execute tools (create_render)
        for (const tc of toolCalls) {
          if (tc.function.name === "create_render") {
            try {
              const args = JSON.parse(tc.function.arguments || "{}");
              // Get workspace
              const { data: ws } = await supabase
                .from("workspaces")
                .select("id")
                .limit(1)
                .maybeSingle();

              const { data: render, error: rErr } = await supabase
                .from("renders")
                .insert({
                  user_id: user.id,
                  workspace_id: ws?.id ?? null,
                  status: "pending",
                  prompt: args.prompt,
                  style: args.style,
                  input_path: "agent://text-only",
                })
                .select()
                .single();

              if (rErr) throw rErr;

              // Trigger forma-render in background
              fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/forma-render`, {
                method: "POST",
                headers: {
                  Authorization: authHeader,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ renderId: render.id }),
              }).catch((e) => console.error("forma-render trigger", e));

              const result = { renderId: render.id, status: "pending" };
              await supabase.from("messages").insert({
                conversation_id: conversationId,
                user_id: user.id,
                role: "tool",
                content: JSON.stringify(result),
                tool_call_id: tc.id,
              });
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: "create_render", result })}\n\n`));
            } catch (e) {
              console.error("tool error", e);
            }
          }
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
