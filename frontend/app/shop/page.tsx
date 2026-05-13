// frontend/app/shop/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Sparkles, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import useContactStore from "@/store/states";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import AvatarWithOverlay from "@/components/AvatarWithOverlay";

type ShopItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  description: string;
  is_owned: boolean;
  is_equipped: boolean;
};

export default function ShopPage() {
  const router = useRouter();
  const { openLogin, setUser, user } = useContactStore();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔹 Состояние для превью "Примерить"
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    itemName?: string;
    price?: number;
    itemId?: number;
  }>({
    isOpen: false,
    onConfirm: () => {},
    itemName: "",
    price: 0,
    itemId: 0,
  });

  // Загрузка данных
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        // Баланс
        if (token) {
          const balanceData = await apiFetch("/profile/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserBalance(balanceData.token_balance ?? 0);
        }

        // Товары с флагами owned/equipped
        const itemsData = await apiFetch("/shop/items");
        setItems(itemsData);
      } catch (err) {
        console.error("❌ Failed to load shop:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Покупка товара
  const handleBuy = (item: ShopItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      openLogin();
      return;
    }

    if (item.is_owned) {
      setToast({ message: "У вас уже есть этот предмет!", type: "info" });
      return;
    }

    if (userBalance < item.price) {
      setToast({
        message: `Недостаточно XP! Нужно ${item.price}, у вас ${userBalance}`,
        type: "error",
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      onConfirm: async () => {
        try {
          await apiFetch(`/shop/items/${item.id}/buy`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          // Обновляем список и баланс
          const itemsData = await apiFetch("/shop/items");
          setItems(itemsData);

          const balanceData = await apiFetch("/profile/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserBalance(balanceData.token_balance ?? 0);

          // Обновляем профиль в сторе (для аватара)
          const profileData = await apiFetch("/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(profileData);

          setToast({
            message: `Вы купили "${item.name}"! 🎉`,
            type: "success",
          });
        } catch (err: any) {
          setToast({
            message: err.message || "Ошибка при покупке",
            type: "error",
          });
        } finally {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      },
    });
  };

  // Экипировка/снятие (сохраняется на сервере)
  const handleEquip = async (item: ShopItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      openLogin();
      return;
    }

    try {
      // item_id=0 для снятия
      const equipItemId = item.is_equipped ? 0 : item.id;

      await apiFetch(`/shop/items/${equipItemId}/equip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем список
      const itemsData = await apiFetch("/shop/items");
      setItems(itemsData);

      // Обновляем профиль
      const profileData = await apiFetch("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(profileData);

      setToast({
        message: item.is_equipped
          ? "Вещь снята"
          : `"${item.name}" экипирована! ✨`,
        type: "success",
      });
    } catch (err: any) {
      setToast({ message: err.message || "Ошибка", type: "error" });
    }
  };

  // 🔹 "Примерить" — только превью, без сохранения
  const handlePreview = (item: ShopItem) => {
    if (item.is_owned) {
      // Если уже куплено — просто экипируем
      handleEquip(item);
      return;
    }
    // Временный превью
    setPreviewItem(item);
    setToast({
      message: `Примеряете "${item.name}" (не сохраняется)`,
      type: "info",
    });
  };

  // Закрыть превью
  const closePreview = () => {
    setPreviewItem(null);
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
  };

  // 🔹 Разделяем товары на купленные и доступные
  const ownedItems = items.filter((item) => item.is_owned);
  const availableItems = items.filter((item) => !item.is_owned);

  // 🔹 Определяем, какое изображение показывать для превью
  const getPreviewOverlay = () => {
    if (previewItem) return previewItem.image;
    return user?.equipped_item?.image || null;
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title="Подтверждение покупки"
        message={`Вы действительно хотите купить "${confirmDialog.itemName || ""}" за ${confirmDialog.price} XP?`}
        confirmText="Купить"
        cancelText="Отмена"
        type="warning"
      />

      {/* Header */}
      <div className="w-full mb-8">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> На главную
        </Link>
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Магазин</h1>
        </div>
        <p className="text-gray-600 mt-2">
          Покупайте украшения за XP, заработанные на платформе
        </p>
      </div>

      {/* Баланс */}
      <div className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Ваш баланс:</span>
        </div>
        <div className="bg-white/20 rounded-lg px-4 py-2">
          <span className="text-white font-bold text-xl">{userBalance}</span>
          <span className="text-white/90 text-sm ml-1">XP</span>
        </div>
      </div>

      {/* 🔹 СЕКЦИЯ 1: Текущая аватарка + купленные предметы */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Ваша аватарка
        </h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 🔹 Превью аватара */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <AvatarWithOverlay
                baseAvatar={user?.avatar_url || "default_cat.jpg"}
                overlayImage={getPreviewOverlay()}
                alt={user?.username || "Avatar"}
                size="lg"
                className="w-24 h-24"
              />

              {/* 🔹 Индикатор превью */}
              {previewItem && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Примерка
                  <button
                    onClick={closePreview}
                    className="ml-1 hover:text-amber-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-3 text-center">
              {previewItem
                ? `Примеряете: ${previewItem.name}`
                : user?.equipped_item
                  ? `Надето: ${user.equipped_item.name}`
                  : "Без украшений"}
            </p>
          </div>

          {/* 🔹 Купленные предметы */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Ваши предметы ({ownedItems.length})
            </h3>

            {ownedItems.length === 0 ? (
              <p className="text-gray-500 text-sm">
                У вас пока нет купленных предметов. Посетите раздел ниже, чтобы
                купить первый! 🛍️
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ownedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-3 rounded-xl border transition ${
                      item.is_equipped && !previewItem
                        ? "border-green-400 bg-green-50"
                        : previewItem?.id === item.id
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {/* Изображение предмета */}
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2">
                      <img
                        src={`/shop-items/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <p className="text-xs font-medium text-gray-900 truncate">
                      {item.name}
                    </p>

                    {/* Кнопки управления */}
                    <div className="flex gap-1 mt-2">
                      {item.is_equipped && !previewItem ? (
                        <button
                          onClick={() => handleEquip(item)}
                          className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Снять
                        </button>
                      ) : previewItem?.id === item.id ? (
                        <button
                          onClick={closePreview}
                          className="flex-1 px-2 py-1 bg-amber-400 text-white text-xs rounded-lg hover:bg-amber-500 transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Оставить
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(item)}
                          className="flex-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200 transition"
                        >
                          Экипировать
                        </button>
                      )}
                    </div>

                    {/* Бейдж статуса */}
                    {item.is_equipped && !previewItem && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        ✓
                      </div>
                    )}
                    {previewItem?.id === item.id && (
                      <div className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        👁
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 СЕКЦИЯ 2: Доступные товары */}
      <div className="w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-purple-600" />
          Доступные товары ({availableItems.length})
        </h2>

        {availableItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Все товары уже в вашей коллекции! 🎉
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                {/* Изображение с превью */}
                <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-8 relative">
                  <img
                    src={`/shop-items/${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />

                  {/* 🔹 Кнопка "Примерить" в углу */}
                  <button
                    onClick={() => handlePreview(item)}
                    className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition opacity-0 group-hover:opacity-100"
                    title="Примерить на аватар"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <div className="bg-amber-100 rounded-lg px-3 py-1.5">
                      <span className="text-amber-700 font-bold text-lg">
                        {item.price}
                      </span>
                      <span className="text-amber-600 text-sm ml-1">XP</span>
                    </div>

                    <button
                      onClick={() => handleBuy(item)}
                      disabled={userBalance < item.price}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Купить
                    </button>
                  </div>

                  {/* 🔹 Подсказка про примерку */}
                  <p className="text-xs text-gray-400 mt-3 text-center">
                    💡 Нажмите на ✨ в углу картинки, чтобы примерить перед
                    покупкой
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
