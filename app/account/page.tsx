"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save } from "lucide-react";
import useContactStore from "@/store/states";
import EditableField from "../../ui/EditableField"; // ✅ Import component

type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  about: string | null;
  updated_at: string | null;
};

export default function AccountPage() {
  const { user, isAuthenticated } = useContactStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        const profileData = data || {
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          first_name: null,
          last_name: null,
          status: null,
          about: null,
          updated_at: null,
        };

        setProfile(profileData);
      } catch (err) {
        console.error("Fetch profile error:", err);
        const fallback = {
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          first_name: null,
          last_name: null,
          status: null,
          about: null,
          updated_at: null,
        };
        setProfile(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, isAuthenticated]);

  // ✅ Handler passed to EditableField
  const handleSaveField = async (field: keyof Profile, newValue: string) => {
    if (!user) return;

    // Validation
    const validations: Record<
      string,
      { min?: number; max: number; pattern?: RegExp }
    > = {
      username: { min: 3, max: 20, pattern: /^[a-zA-Z0-9_]+$/ },
      first_name: { max: 50 },
      last_name: { max: 50 },
      status: { max: 50 },
      about: { max: 200 },
    };

    const rules = validations[field];
    if (rules) {
      if (rules.min && newValue.length < rules.min) {
        throw new Error(`Минимум ${rules.min} символов`);
      }
      if (newValue.length > rules.max) {
        throw new Error(`Максимум ${rules.max} символов`);
      }
      if (rules.pattern && !rules.pattern.test(newValue)) {
        throw new Error("Недопустимые символы");
      }
    }

    // Save to database
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      [field]: newValue.trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Update local state
    setProfile((prev) =>
      prev ? { ...prev, [field]: newValue.trim() || null } : null,
    );
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[1300px] bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto mb-4 text-purple-500" />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-gray-100">
        <p className="text-gray-600">Пожалуйста, войдите в аккаунт</p>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col items-center px-[10px] sm:px-[20px] py-[30px] min-w-full min-h-full bg-gray-100">
      <div className="text-wrap flex w-full ">
        {/* Avatar Section */}
        <div className="flex flex-col w-full justify-center md:flex-row items-start gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <img
              src="/aiclose.png"
              alt="Avatar"
              className="w-[250px] h-[250px] rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex items-center justify-center mt-[10px] shadow-xs  bg-blue-500 rounded-lg w-[210px] h-[50px] cursor-pointer transition-all duration-300 hover:bg-blue-400 text-white font-semibold">
              Переодеть Мао
            </div>
          </div>

          <div className="flex-1 flex flex-col w-full">
            <EditableField
              label="Юзернейм"
              field="username"
              value={profile?.username ?? null}
              placeholder="Не указан"
              onSave={handleSaveField}
            />

            <EditableField
              label="Имя"
              field="first_name"
              value={profile?.first_name ?? null}
              placeholder="Например: Катя"
              onSave={handleSaveField}
            />

            <EditableField
              label="Фамилия"
              field="last_name"
              value={profile?.last_name ?? null}
              placeholder="Например: Иванова"
              onSave={handleSaveField}
            />
          </div>
        </div>
      </div>
      <div className="text-wrap">
        {/* Status Section */}
        <EditableField
          label="Статус"
          field="status"
          value={profile?.status ?? null}
          placeholder="О чём вы думаете сейчас?"
          helper="Максимум 50 символов"
          onSave={handleSaveField}
        />

        <EditableField
          label="О себе"
          field="about"
          value={profile?.about ?? null}
          placeholder="Расскажите немного о себе..."
          multiline
          helper="Максимум 200 символов"
          onSave={handleSaveField}
        />
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-500 smaller-text mb-2">Email:</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-gray-600">{user.email}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Email нельзя изменить. Для смены почты создайте новый аккаунт.
          </p>
        </div>
      </div>

      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Save size={16} /> Изменения сохранены!
        </div>
      )}

      {profile?.updated_at && (
        <p className="text-xs text-gray-400 mt-6 text-center">
          Последнее обновление:{" "}
          {new Date(profile.updated_at).toLocaleString("ru-RU")}
        </p>
      )}
    </div>
  );
}
