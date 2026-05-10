import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-[#F0EAE0]/70 hover:text-[#F0EAE0]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C4A264] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#C4A264]/20 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#C4A264]/15">
              <span className="text-sm font-medium text-[#F0EAE0]">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#C4A264] hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-[#F0EAE0]/50 text-sm">
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-[#F0EAE0]/50 text-sm">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read_at && markAsRead(notif.id)}
                    className={`px-4 py-3 border-b border-[#C4A264]/10 cursor-pointer hover:bg-[#C4A264]/5 transition-colors ${
                      !notif.read_at ? "bg-[#C4A264]/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0EAE0] truncate">{notif.title}</p>
                        {notif.body && (
                          <p className="text-xs text-[#F0EAE0]/60 mt-1 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[10px] text-[#F0EAE0]/40 mt-1">
                          {new Date(notif.created_at).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notif.read_at && (
                        <div className="w-2 h-2 rounded-full bg-[#C4A264] shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}