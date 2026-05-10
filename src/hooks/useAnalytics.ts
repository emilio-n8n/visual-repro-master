import { useEffect, useCallback, useRef } from "react";

type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

const ANALYTICS_QUEUE_KEY = "forma_analytics_queue";

export function useAnalytics() {
  const queueRef = useRef<AnalyticsEvent[]>([]);

  // Flush queue on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ANALYTICS_QUEUE_KEY);
      if (saved) {
        queueRef.current = JSON.parse(saved);
        localStorage.removeItem(ANALYTICS_QUEUE_KEY);
        // In production, send to analytics service
        if (queueRef.current.length > 0) {
          console.log("[Analytics] Flushing queued events:", queueRef.current);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const track = useCallback((name: string, properties?: Record<string, unknown>) => {
    const event = { name, properties, timestamp: new Date().toISOString() };

    // Always queue first in case analytics is down
    queueRef.current.push(event);
    try {
      localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queueRef.current));
    } catch { /* quota exceeded */ }

    // In production: send to analytics service
    // For now, just log
    console.log("[Analytics]", event);
  }, []);

  const trackPageView = useCallback((page: string) => {
    track("page_view", { page });
  }, [track]);

  const trackButtonClick = useCallback((button: string, context?: string) => {
    track("button_click", { button, context });
  }, [track]);

  const trackError = useCallback((error: string, details?: string) => {
    track("error", { error, details });
  }, [track]);

  return { track, trackPageView, trackButtonClick, trackError };
}