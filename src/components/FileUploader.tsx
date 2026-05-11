import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

const ACCEPTED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const MAX_SIZE_MB = 10;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  attachedFiles: File[];
  disabled?: boolean;
}

export function FileUploader({ onFilesChange, attachedFiles, disabled }: FileUploaderProps) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);

  const createPreviews = useCallback((files: File[]) => {
    const newPreviews = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, []);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const valid: File[] = [];
      for (const f of arr) {
        if (!ACCEPTED_TYPES[f.type as keyof typeof ACCEPTED_TYPES]) {
          toast({
            title: "Type non supporté",
            description: `${f.name} n'est pas un format valide (jpg, png, gif, webp, pdf)`,
            variant: "destructive",
          });
          continue;
        }
        if (f.size > MAX_SIZE) {
          toast({
            title: "Fichier trop volumineux",
            description: `${f.name} dépasse ${MAX_SIZE_MB} Mo`,
            variant: "destructive",
          });
          continue;
        }
        valid.push(f);
      }
      if (valid.length) {
        onFilesChange([...attachedFiles, ...valid]);
        createPreviews(valid);
      }
    },
    [attachedFiles, onFilesChange, createPreviews]
  );

  const removeFile = useCallback(
    (index: number) => {
      setPreviews((prev) => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
      onFilesChange(attachedFiles.filter((_, i) => i !== index));
    },
    [attachedFiles, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById("file-input-agent")?.click()}
        className={cn(
          "border-2 border-dashed rounded-sm p-3 text-center cursor-pointer transition-colors",
          dragging
            ? "border-[#C4A264] bg-[#C4A264]/10"
            : "border-[#C4A264]/20 hover:border-[#C4A264]/40 bg-black/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          id="file-input-agent"
          type="file"
          multiple
          accept={Object.keys(ACCEPTED_TYPES).join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 text-[#F0EAE0]/50 text-xs">
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4A264]" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Ajouter des fichiers (jpg, png, gif, webp, pdf)</span>
        </div>
      </div>

      {/* Progress bar during upload */}
      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1 [&>*]:bg-[#C4A264]" />
          <p className="text-[10px] text-[#F0EAE0]/40 text-center">Envoi en cours… {progress}%</p>
        </div>
      )}

      {/* Previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map(({ file, preview }, i) => (
            <div key={preview} className="relative group">
              <img
                src={preview}
                alt={file.name}
                className="w-16 h-16 object-cover rounded-sm border border-[#C4A264]/20"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File list (non-images) */}
      {attachedFiles.filter((f) => !f.type.startsWith("image/")).map((f, i) => (
        <div key={f.name} className="flex items-center gap-2 px-3 py-1.5 border border-[#C4A264]/15 rounded-sm bg-[#C4A264]/5">
          <FileText className="w-3.5 h-3.5 text-[#C4A264] shrink-0" />
          <span className="text-xs text-[#F0EAE0]/70 truncate flex-1">{f.name}</span>
          <button onClick={() => removeFile(attachedFiles.indexOf(f))} className="text-[#F0EAE0]/40 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Upload files to Supabase Storage and return their public URLs */
export async function uploadAttachments(
  files: File[],
  userId: string,
  onProgress?: (p: number) => void
): Promise<Attachment[]> {
  const total = files.length;
  const results: Attachment[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "bin";
    const id = crypto.randomUUID();
    const path = `${userId}/${id}.${ext}`;

    const { error } = await supabase.storage
      .from("conversations-files")
      .upload(path, file, { contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("conversations-files")
      .getPublicUrl(path);

    results.push({
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });

    onProgress?.(Math.round(((i + 1) / total) * 100));
  }

  return results;
}

export function AttachmentDisplay({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith("image/");

  return (
    <div className="mt-2 border border-[#C4A264]/15 rounded-sm overflow-hidden bg-black/30 max-w-xs">
      {isImage ? (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-h-48 object-contain mx-auto hover:opacity-90 transition-opacity"
          />
        </a>
      ) : attachment.type === "application/pdf" ? (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-xs text-[#C4A264] hover:underline"
        >
          <FileText className="w-4 h-4" />
          {attachment.name}
        </a>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#F0EAE0]/60">
          <ImageIcon className="w-4 h-4 text-[#C4A264]" />
          {attachment.name}
        </div>
      )}
      <div className="px-3 py-1.5 border-t border-[#C4A264]/15">
        <span className="text-[10px] text-[#F0EAE0]/40">
          {(attachment.size / 1024).toFixed(1)} Ko
        </span>
      </div>
    </div>
  );
}
