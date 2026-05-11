import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UseUploadProgress {
  progress: number;
  fileName: string | null;
  isUploading: boolean;
  upload: (file: File, onProgress?: (progress: number) => void) => Promise<string>;
  reset: () => void;
}

export function useUploadProgress(): UseUploadProgress {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setFileName(null);
    setIsUploading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const upload = useCallback(
    async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
      if (!user) throw new Error("Not authenticated");

      setIsUploading(true);
      setFileName(file.name);
      setProgress(0);

      abortControllerRef.current = new AbortController();

      try {
        const ext = file.name.split(".").pop() || "png";
        const id = crypto.randomUUID();
        const inputPath = `${user.id}/${id}.${ext}`;

        // Simulate progress for upload using xhr for progress tracking
        const formData = new FormData();
        formData.append("file", file);

        // Calculate approximate progress based on file size
        const totalSize = file.size;
        let uploadedSize = 0;

        // Create a reader to track upload progress
        const reader = new FileReader();
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;

        const uploadChunk = () => {
          const chunk = file.slice(offset, offset + chunkSize);
          // Simulate chunk upload with progress
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              offset += chunk.size;
              uploadedSize += chunk.size;
              const currentProgress = Math.min(90, Math.round((uploadSize / totalSize) * 100));
              setProgress(currentProgress);
              onProgress?.(currentProgress);
              resolve();
            }, 50);
          });
        };

        while (offset < totalSize) {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error("Upload cancelled");
          }
          await uploadChunk();
        }

        // Complete the upload to Supabase
        const { error: upErr } = await supabase.storage
          .from("render-inputs")
          .upload(inputPath, file, {
            contentType: file.type,
            signal: abortControllerRef.current?.signal,
          });

        if (upErr) throw upErr;

        setProgress(100);
        onProgress?.(100);

        return inputPath;
      } catch (error) {
        setProgress(0);
        setFileName(null);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  return { progress, fileName, isUploading, upload, reset };
}