import { useEffect, useState, memo } from "react";
import { WifiOff, Wifi, Loader2 } from "lucide-react";

export const OfflineIndicator = memo(function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show indicator when offline or reconnected
  if (online && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all ${
        showReconnected
          ? "bg-green-600 text-white"
          : "bg-yellow-600 text-white"
      }`}
    >
      {showReconnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Hors ligne</span>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        </>
      )}
    </div>
  );
});

// Hook to track pending requests
export function usePendingRequests() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Track XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const originalAbort = XMLHttpRequest.prototype.abort;

    let count = 0;

    XMLHttpRequest.prototype.open = function (...args: unknown[]) {
      count++;
      setPendingCount(count);
      return originalOpen.apply(this, args as Parameters<typeof originalOpen>);
    };

    XMLHttpRequest.prototype.send = function (...args: unknown[]) {
      count++;
      setPendingCount(count);
      return originalSend.apply(this, args as Parameters<typeof originalSend>);
    };

    XMLHttpRequest.prototype.abort = function () {
      count = Math.max(0, count - 1);
      setPendingCount(count);
      return originalAbort.apply(this);
    };

    return () => {
      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;
      XMLHttpRequest.prototype.abort = originalAbort;
    };
  }, []);

  return pendingCount;
}