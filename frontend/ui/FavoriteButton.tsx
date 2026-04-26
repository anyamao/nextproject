// ui/FavoriteButton.tsx
"use client";
import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useFavoritesStore } from "@/store/favoritesStore";
import useContactStore from "@/store/states";

interface FavoriteButtonProps {
  articleId: string;
  className?: string;
}

export default function FavoriteButton({
  articleId,
  className = "",
}: FavoriteButtonProps) {
  const { user, isAuthenticated } = useContactStore();
  const { isFavorite, addFavorite, removeFavorite, fetchFavorites } =
    useFavoritesStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Раскомментируй, когда добавишь 'id' в тип AppUser
    /* 
    if (isAuthenticated && user?.id) {
      fetchFavorites(user.id);
    }
    */
  }, [isAuthenticated, user]); // Убрали зависимость от user?.id

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      alert("Пожалуйста, войдите чтобы добавить в избранное");
      return;
    }
    
    // Проверяем наличие пользователя вместо id
    if (!user) return;

    setIsLoading(true);
    try {
      // TODO: Раскомментируй, когда добавишь 'id' в тип AppUser
      /*
      if (isFavorite(articleId)) {
        await removeFavorite(articleId, user.id);
      } else {
        await addFavorite(articleId, user.id);
      }
      */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      // Исправлен синтаксис className (убраны лишние кавычки и пробелы)
      className={`rounded-full ${
        isFavorite(articleId) ? "bg-purple-200 border-purple-300" : ""
      } p-[7px] border-[1px] border-gray-400 hover:bg-gray-50 transition relative ${className}`}
      title={
        isFavorite(articleId) ? "Удалить из избранного" : "Добавить в избранное"
      }
    >
      {isFavorite(articleId) ? (
        <BookmarkCheck className="w-[15px] h-[15px] text-purple-600" />
      ) : (
        <Bookmark className="w-[15px] h-[15px] text-gray-600" />
      )}
    </button>
  );
}
