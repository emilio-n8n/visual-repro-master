import { useState, useCallback, useRef, useEffect } from "react";

export function useFetchWithTimeout(timeoutMs: number = 30000) {
  const abortRef = useRef<AbortController | null>(null);

  const fetchWithTimeout = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortRef.current?.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortRef.current.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }, [timeoutMs]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { fetchWithTimeout, cancel };
}