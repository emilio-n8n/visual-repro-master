import { useEffect, useState } from "react";
import { WifiOff, Wifi, Loader2 } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Show indicator when offline or when there are pending requests
  if (online) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-yellow-600 text-white px-3 py-2 rounded-lg shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Hors ligne</span>
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
    </div>
  );
}

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