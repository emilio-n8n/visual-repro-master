import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type FavoritesContextType = {
  favorites: string[];
  loading: boolean;
  addFavorite: (artifactId: string) => Promise<void>;
  removeFavorite: (artifactId: string) => Promise<void>;
  isFavorite: (artifactId: string) => boolean;
  toggleFavorite: (artifactId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  loading: true,
  addFavorite: async () => {},
  removeFavorite: async () => {},
  isFavorite: () => false,
  toggleFavorite: async () => {},
});

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from Supabase
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("artifact_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setFavorites(data.map((f) => f.artifact_id));
      }
      setLoading(false);
    };

    loadFavorites();

    // Subscribe to changes
    const channel = supabase
      .channel("favorites-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "favorites",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          setFavorites((prev) => [...prev, payload.new.artifact_id]);
        } else if (payload.eventType === "DELETE") {
          setFavorites((prev) => prev.filter((id) => id !== payload.old.artifact_id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addFavorite = useCallback(async (artifactId: string) => {
    if (!user) return;
    await supabase.from("favorites").insert({
      user_id: user.id,
      artifact_id: artifactId,
    });
  }, [user]);

  const removeFavorite = useCallback(async (artifactId: string) => {
    if (!user) return;
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("artifact_id", artifactId);
  }, [user]);

  const isFavorite = useCallback((artifactId: string) => {
    return favorites.includes(artifactId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (artifactId: string) => {
    if (isFavorite(artifactId)) {
      await removeFavorite(artifactId);
    } else {
      await addFavorite(artifactId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, loading, addFavorite, removeFavorite, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);