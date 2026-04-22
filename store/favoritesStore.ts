// store/favoritesStore.ts
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface FavoritesStore {
  favorites: Set<string>;
  isLoading: boolean;
  fetchFavorites: (userId: string) => Promise<void>;
  addFavorite: (articleId: string, userId: string) => Promise<boolean>;
  removeFavorite: (articleId: string, userId: string) => Promise<boolean>;
  isFavorite: (articleId: string) => boolean;
}

const supabase = createClient();

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: new Set(),
  isLoading: false,

  fetchFavorites: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("article_favorites")
        .select("article_id")
        .eq("user_id", userId);

      if (error) throw error;

      const favoritesSet = new Set(data.map((item) => item.article_id));
      set({ favorites: favoritesSet });
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addFavorite: async (articleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("article_favorites")
        .insert({ article_id: articleId, user_id: userId });

      if (error) throw error;

      set((state) => ({
        favorites: new Set([...state.favorites, articleId]),
      }));
      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      return false;
    }
  },

  removeFavorite: async (articleId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("article_favorites")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", userId);

      if (error) throw error;

      set((state) => {
        const newFavorites = new Set(state.favorites);
        newFavorites.delete(articleId);
        return { favorites: newFavorites };
      });
      return true;
    } catch (error) {
      console.error("Error removing favorite:", error);
      return false;
    }
  },

  isFavorite: (articleId: string) => {
    return get().favorites.has(articleId);
  },
}));
