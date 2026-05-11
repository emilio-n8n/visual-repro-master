// Edge function for artifact version management
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json(null);

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

    const { action, artifactId } = await req.json();
    if (!action || !artifactId) return json({ error: "Missing fields" }, 400);

    if (action === "list") {
      const { data, error } = await supabase
        .from("artifact_versions")
        .select("id, version_number, created_at, content, created_by, profiles(full_name)")
        .eq("artifact_id", artifactId)
        .order("version_number", { ascending: false });

      if (error) return json({ error: error.message }, 500);
      return json({ versions: data });
    }

    if (action === "save") {
      const { content } = await req.json();
      if (!content) return json({ error: "Missing content" }, 400);

      // Get current max version number
      const { data: latest } = await supabase
        .from("artifact_versions")
        .select("version_number")
        .eq("artifact_id", artifactId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersion = (latest?.version_number ?? 0) + 1;

      const { data, error } = await supabase
        .from("artifact_versions")
        .insert({ artifact_id: artifactId, content, version_number: newVersion, created_by: u.user.id })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ version: data });
    }

    if (action === "restore") {
      const { versionId } = await req.json();
      if (!versionId) return json({ error: "Missing versionId" }, 400);

      // Get the version content
      const { data: version, error: vErr } = await supabase
        .from("artifact_versions")
        .select("content, artifact_id")
        .eq("id", versionId)
        .maybeSingle();

      if (vErr || !version) return json({ error: "Version not found" }, 404);

      // Update artifact with version content
      const { error: upErr } = await supabase
        .from("artifacts")
        .update({ content: version.content })
        .eq("id", version.artifact_id);

      if (upErr) return json({ error: upErr.message }, 500);
      return json({ ok: true, content: version.content });
    }

    return json({ error: "Invalid action" }, 400);
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
