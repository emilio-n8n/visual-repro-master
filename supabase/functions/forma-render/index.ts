import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_PROMPTS: Record<string, string> = {
  photoreal:
    "Transform this 3D architectural rendering into a photorealistic professional architectural photograph. Natural daylight, accurate materials, realistic textures, atmospheric perspective, subtle shadows. Preserve the exact composition, geometry, perspective and proportions of the original.",
  twilight:
    "Transform this 3D architectural rendering into a photorealistic dusk/twilight architectural photograph. Warm interior lighting glowing from windows, deep blue sky, ambient atmosphere, cinematic mood. Preserve geometry, composition and perspective exactly.",
  scandinavian:
    "Transform this 3D architectural rendering into a photorealistic photograph in a minimal Scandinavian style. Soft diffuse natural light, pale wood, white walls, light textiles, calm atmosphere. Preserve the exact composition and geometry.",
  editorial:
    "Transform this 3D architectural rendering into a high-end editorial architecture magazine photograph. Dramatic natural lighting, refined materials, deep contrast, AD/Wallpaper* aesthetic. Preserve composition and geometry exactly.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { renderId } = body as { renderId?: string };
    if (!renderId) {
      return new Response(JSON.stringify({ error: "renderId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Fetch render
    const { data: render, error: rErr } = await admin
      .from("renders")
      .select("*")
      .eq("id", renderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (rErr || !render) {
      return new Response(JSON.stringify({ error: "Render not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("renders").update({ status: "processing", error: null }).eq("id", renderId);

    const isTextOnly = render.input_path === "agent://text-only" && !render.parent_id;

    // If this render has a parent (modification request), use parent's output as input
    let bucket = "render-inputs";
    let path = render.input_path;
    if (render.parent_id) {
      const { data: parent } = await admin
        .from("renders")
        .select("output_path")
        .eq("id", render.parent_id)
        .maybeSingle();
      if (parent?.output_path) {
        bucket = "render-outputs";
        path = parent.output_path;
      }
    }

    const stylePrompt = STYLE_PROMPTS[render.style ?? "photoreal"] ?? STYLE_PROMPTS.photoreal;
    const userPrompt = render.prompt
      ? `${stylePrompt}\n\nAdditional direction: ${render.prompt}`
      : stylePrompt;

    const userContent: any[] = [{ type: "text", text: userPrompt }];

    if (!isTextOnly) {
      // Download input image (chunked base64 to avoid stack overflow on large files)
      const { data: inputBlob, error: dlErr } = await admin.storage.from(bucket).download(path);
      if (dlErr || !inputBlob) throw new Error(`Could not download input: ${dlErr?.message}`);

      const inputBuf = await inputBlob.arrayBuffer();
      const bytes = new Uint8Array(inputBuf);
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const base64 = btoa(binary);
      const mime = inputBlob.type || "image/png";
      userContent.push({ type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } });
    }

    // Call Lovable AI Gateway with image input
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Add funds in Settings.");
      throw new Error(`AI gateway error ${aiRes.status}: ${txt}`);
    }

    const aiJson = await aiRes.json();
    const imgUrl: string | undefined =
      aiJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imgUrl) throw new Error("AI did not return an image");

    // imgUrl is a data URL: data:image/png;base64,xxxx
    const match = imgUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) throw new Error("Invalid AI image format");
    const outMime = match[1];
    const outB64 = match[2];
    const outBytes = Uint8Array.from(atob(outB64), (c) => c.charCodeAt(0));

    const ext = outMime.includes("jpeg") ? "jpg" : outMime.split("/")[1] || "png";
    const outputPath = `${userId}/${renderId}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("render-outputs")
      .upload(outputPath, outBytes, { contentType: outMime, upsert: true });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    await admin
      .from("renders")
      .update({ status: "completed", output_path: outputPath })
      .eq("id", renderId);

    return new Response(JSON.stringify({ ok: true, output_path: outputPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("forma-render error:", msg);
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.renderId) {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await admin
          .from("renders")
          .update({ status: "failed", error: msg })
          .eq("id", body.renderId);
      }
    } catch (_) {}
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
