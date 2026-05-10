// frontend/components/Contactform.tsx
"use client";

import { useEffect } from "react";
import useContactStore from "@/store/states";
import { LogIn } from "lucide-react";

function Contactform() {
  const isAuthenticated = useContactStore((state) => state.isAuthenticated);
  const user = useContactStore((state) => state.user);
  const toggleRegister = useContactStore((state) => state.toggleRegister);
  const toggleprofilenavigation = useContactStore(
    (state) => state.toggleprofilenavigation,
  );

  const avatarUrl = user?.avatar_url || "gray_cat.jpg";

  return (
    <div className="cursor-pointer">
      {!isAuthenticated && (
        <LogIn onClick={toggleRegister} className="text-gray-700 w-[20px]" />
      )}

      {isAuthenticated && (
        <div onClick={toggleprofilenavigation} className="relative group">
          <div className="w-[35px] h-[35px] rounded-full overflow-hidden  shadow-sm bg-gray-100">
            <img
              key={`${avatarUrl}-${Date.now()}`}
              src={`/avatars/white_cat.jpg`}
              alt={user?.username || "Avatar"}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              onError={(e) => {
                console.error("❌ Failed to load avatar:", avatarUrl);
                (e.target as HTMLImageElement).src = "/avatars/default_cat.jpg";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Contactform;
