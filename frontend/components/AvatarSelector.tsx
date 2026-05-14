"use client";

import { useState } from "react";

const AVATARS = [
  "default_cat.jpg",
  "orange_cat.jpg",
  "black_cat.jpg",
  "gray_cat.jpg",
  "brown_cat.jpg",
  "light_gray_cat.jpg",
  "white_cat.jpg",
];

interface AvatarSelectorProps {
  currentAvatar: string;
  onAvatarSelect: (avatar: string) => void;
}

export default function AvatarSelector({
  currentAvatar,
  onAvatarSelect,
}: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    onAvatarSelect(avatar);
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Выберите аватар:
      </h3>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => handleSelect(avatar)}
            className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              selectedAvatar === avatar
                ? "border-purple-600 ring-2 ring-purple-200 scale-105"
                : "border-gray-200 hover:border-purple-300 hover:scale-105"
            }`}
            title={avatar.replace(".jpg", "").replace("_", " ")}
          >
            <img
              src={`/avatars/${avatar}`}
              alt={avatar.replace(".jpg", "")}
              className="w-full h-full object-cover"
            />

            {selectedAvatar === avatar && (
              <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
          <img
            src={`/avatars/${selectedAvatar}`}
            alt="Selected"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Выбран аватар:</p>
          <p className="text-xs text-gray-500">{selectedAvatar}</p>
        </div>
        <div className="bg-purple-300 p-[10px] text-xs rounded-lg text-purple-900">
          Сохранить на кнопку снизу
        </div>
      </div>
    </div>
  );
}
