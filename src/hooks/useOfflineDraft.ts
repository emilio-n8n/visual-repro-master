import { useEffect, useCallback, useRef } from "react";

const DRAFT_PREFIX = "forma_draft_";

export function useOfflineDraft<T>(key: string, data: T | null) {
  const draftKey = `${DRAFT_PREFIX}${key}`;
  const isOnline = useRef(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { isOnline.current = true; };
    const handleOffline = () => { isOnline.current = false; };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (data) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(data));
      } catch { /* quota exceeded or other error */ }
    }
  }, [data, draftKey]);

  // Load from localStorage
  const loadDraft = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(draftKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [draftKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  // Check if online
  const online = useCallback(() => isOnline.current, []);

  return { loadDraft, clearDraft, online };
}