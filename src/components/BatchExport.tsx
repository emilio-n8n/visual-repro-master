import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Download, FolderZip, Loader2 } from "lucide-react";
import JSZip from "file-saver";

type Artifact = {
  id: string;
  type: string;
  title: string;
  content: string;
  mime_type: string;
};

export function BatchExportButton({ projectId }: { projectId: string | null }) {
  const [exporting, setExporting] = useState(false);

  const exportAll = useCallback(async () => {
    setExporting(true);
    try {
      // Fetch all artifacts
      let query = supabase
        .from("artifacts")
        .select("id, type, title, content, mime_type")
        .eq("workspace_id", projectId);

      const { data: artifacts, error } = await query;

      if (error || !artifacts?.length) {
        toast({
          title: "Aucun livrable",
          description: "Aucun livrable à exporter",
          variant: "destructive",
        });
        return;
      }

      const zip = new JSZip();

      // Add each artifact to zip
      for (const a of artifacts) {
        const ext = getExtension(a.type, a.mime_type);
        const filename = `${sanitizeFilename(a.title)}.${ext}`;
        zip.file(filename, a.content);
      }

      // Generate zip
      const blob = await zip.generateAsync({ type: "blob" });
      const filename = `exports-${new Date().toISOString().slice(0, 10)}.zip`;

      // Download
      zip.saveAs(blob, filename);

      toast({
        title: "Export réussi",
        description: `${artifacts.length} livrables exportés`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur d'export";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [projectId]);

  return (
    <Button
      onClick={exportAll}
      disabled={exporting}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FolderZip className="w-4 h-4" />
      )}
      Tout exporter
    </Button>
  );
}

function getExtension(type: string, mimeType: string): string {
  switch (type) {
    case "document":
      return "html";
    case "spreadsheet":
      return "csv";
    case "slideshow":
    case "website":
    case "dataviz":
    case "moodboard":
      return "html";
    default:
      return "txt";
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 50);
}