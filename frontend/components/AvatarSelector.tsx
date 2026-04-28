// frontend/components/AvatarSelector.tsx
"use client";

import { useState } from "react";

type AvatarOption = {
  name: string;
  label: string;
};

const AVATARS: AvatarOption[] = [
  { name: "default_cat.jpg", label: "Котик по умолчанию" },
  { name: "orange_cat.jpg", label: "Рыжий котик" },
  { name: "black_cat.jpg", label: "Чёрный котик" },
  { name: "gray_cat.jpg", label: "Серый котик" },
  { name: "brown_cat.jpg", label: "Коричневый котик" },
  { name: "light_gray_cat.jpg", label: "Светло-серый котик" },
  { name: "white_cat.jpg", label: "Белый котик" },
];

interface AvatarSelectorProps {
  currentAvatar: string;
  onAvatarSelect: (avatarName: string) => void;
}

export default function AvatarSelector({
  currentAvatar,
  onAvatarSelect,
}: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = (avatarName: string) => {
    setSelectedAvatar(avatarName);
    onAvatarSelect(avatarName);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Выберите аватарку
      </label>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.name}
            type="button"
            onClick={() => handleSelect(avatar.name)}
            className={`relative group flex flex-col items-center gap-2 p-2 rounded-lg transition ${
              selectedAvatar === avatar.name
                ? "ring-2 ring-purple-500 bg-purple-50"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
              <img
                src={`/avatars/${avatar.name}`}
                alt={avatar.label}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-gray-600 text-center">
              {avatar.label}
            </span>

            {/* Галочка при выборе */}
            {selectedAvatar === avatar.name && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
