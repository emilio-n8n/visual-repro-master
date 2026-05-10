import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type FavoritesContextType = {
  favorites: string[];
  addFavorite: (artifactId: string) => void;
  removeFavorite: (artifactId: string) => void;
  isFavorite: (artifactId: string) => boolean;
  toggleFavorite: (artifactId: string) => void;
};

const FAVORITES_KEY = "forma_favorites";

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
  toggleFavorite: () => {},
});

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = useCallback((artifactId: string) => {
    setFavorites((prev) => {
      if (prev.includes(artifactId)) return prev;
      return [...prev, artifactId];
    });
  }, []);

  const removeFavorite = useCallback((artifactId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== artifactId));
  }, []);

  const isFavorite = useCallback((artifactId: string) => {
    return favorites.includes(artifactId);
  }, [favorites]);

  const toggleFavorite = useCallback((artifactId: string) => {
    if (favorites.includes(artifactId)) {
      removeFavorite(artifactId);
    } else {
      addFavorite(artifactId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);