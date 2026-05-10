import { usePresence } from "@/hooks/usePresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PresenceIndicator() {
  const { onlineUsers } = usePresence();

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 3).map((user) => (
          <Avatar key={user.user_id} className="w-7 h-7 border-2 border-[#0a0a0a]">
            <AvatarImage src={user.user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-[#C4A264] text-black text-xs">
              {user.user?.full_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
        ))}
        {onlineUsers.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] text-[#F0EAE0]">
            +{onlineUsers.length - 3}
          </div>
        )}
      </div>
      <span className="text-xs text-[#F0EAE0]/50">
        {onlineUsers.length} en ligne
      </span>
    </div>
  );
}