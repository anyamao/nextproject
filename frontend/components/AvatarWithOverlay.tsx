// frontend/components/AvatarWithOverlay.tsx
"use client";

type AvatarWithOverlayProps = {
  baseAvatar: string; // "light_gray_cat.jpg"
  overlayImage?: string | null; // "pink_bow.png" или null
  alt?: string;
  size?: "sm" | "md" | "lg" | "xxxl";
  className?: string;
};

export default function AvatarWithOverlay({
  baseAvatar,
  overlayImage,
  alt = "Avatar",
  size = "md",
  className = "",
}: AvatarWithOverlayProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xxxl: "w-32 h-32",
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      {/* Базовая аватарка */}
      <img
        src={`/avatars/${baseAvatar}`}
        alt={alt}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
        }}
      />

      {/* Наложение (если есть) */}
      {overlayImage && (
        <img
          src={`/shop-items/${overlayImage}`}
          alt="Overlay"
          className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none"
          style={{ mixBlendMode: "normal" }}
          onError={(e) => {
            // Если наложение не загрузилось — просто скрываем
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
