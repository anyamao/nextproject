"use client";

type AvatarWithOverlayProps = {
  baseAvatar: string;
  overlayImage?: string | null;
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
    xxxl: "w-38 h-38",
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      <img
        src={`/avatars/${baseAvatar}`}
        alt={alt}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
        }}
      />

      {overlayImage && (
        <img
          src={`/shop-items/${overlayImage}`}
          alt="Overlay"
          className="absolute inset-0 w-full h-full rounded-full object-cover pointer-events-none"
          style={{ mixBlendMode: "normal" }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </div>
  );
}
