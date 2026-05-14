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

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          const balanceData = await apiFetch("/profile/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserBalance(balanceData.token_balance ?? 0);
        }

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

          const itemsData = await apiFetch("/shop/items");
          setItems(itemsData);

          const balanceData = await apiFetch("/profile/balance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserBalance(balanceData.token_balance ?? 0);

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

  const handleEquip = async (item: ShopItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      openLogin();
      return;
    }

    try {
      const equipItemId = item.is_equipped ? 0 : item.id;

      await apiFetch(`/shop/items/${equipItemId}/equip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const itemsData = await apiFetch("/shop/items");
      setItems(itemsData);

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

  const handlePreview = (item: ShopItem) => {
    if (item.is_owned) {
      handleEquip(item);
      return;
    }
    setPreviewItem(item);
    setToast({
      message: `Примеряете "${item.name}" (не сохраняется)`,
      type: "info",
    });
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  const ownedItems = items.filter((item) => item.is_owned);
  const availableItems = items.filter((item) => !item.is_owned);

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
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1400px] mx-auto">
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

      <div className="w-full mb-8 max-w-[1100px]">
        <Link
          href="/"
          className="text-gray-600 hover:text-purple-600 transition flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> На главную
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Магазин</h1>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-6 mb-8 max-w-[1100px]">
        <div className="flex-1 bg-purple-200 rounded-lg p-6 ">
          <div className="flex flex-col items-center text-center">
            <span className="text-purple-700 font-medium text-sm uppercase tracking-wide">
              Ваш баланс
            </span>
            <div className="mt-2">
              <span className="text-purple-900 font-black text-4xl">
                {userBalance}
              </span>
              <span className="text-purple-700 font-semibold text-lg ml-1">
                XP
              </span>
            </div>
            <p className="text-purple-600 text-xs mt-2">
              Продолжайте учиться, чтобы зарабатывать больше!
            </p>
          </div>
        </div>

        <div className="flex-1 bg-purple-700 rounded-lg text-xs p-6 ">
          <div className="flex items-center gap-1 mb-1 ">
            <p className="font-bold text-white text-base">
              Как заработать токены?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm">Запись на курс</span>
            </div>
            <div className="text-right">
              <span className=" text-white font-semibold text-sm">+30 XP</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm">Тест на 75%</span>
            </div>
            <div className="text-right">
              <span className="text-white font-semibold text-sm">+300 XP</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm">Тест на 90%</span>
            </div>
            <div className="text-right">
              <span className="text-white font-semibold text-sm">+40 XP</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/90 text-sm">Оставить отзыв</span>
            </div>
            <div className="text-right">
              <span className="text-white font-semibold text-sm">+30 XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Секция 1: Текущая аватарка + купленные предметы */}
      <div className="w-full bg-white rounded-lg shadow-xs max-w-[1100px] p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          Ваша аватарка
        </h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <AvatarWithOverlay
                baseAvatar={user?.avatar_url || "default_cat.jpg"}
                overlayImage={getPreviewOverlay()}
                alt={user?.username || "Avatar"}
                className="w-60 h-60"
              />

              {previewItem && (
                <div className="absolute -top-4 cursor-pointer -right-2 bg-amber-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md flex items-center gap-1">
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

          <div className="flex-1 lg:ml-[20px]">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Ваши предметы ({ownedItems.length})
            </h3>

            {ownedItems.length === 0 ? (
              <p className="text-gray-500 text-sm">
                У вас пока нет купленных предметов. Посетите раздел ниже, чтобы
                купить первый! 🛍️
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ownedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-3 rounded-xl border transition ${
                      item.is_equipped && !previewItem
                        ? "border-pink-300 border-[2px]"
                        : previewItem?.id === item.id
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 bg-gray-100 hover:border-pink-300"
                    }`}
                  >
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
                          className="flex-1 px-2 py-1 bg-purple-300 text-purple-800 text-xs rounded-lg hover:bg-purple-400 transition"
                        >
                          Экипировать
                        </button>
                      )}
                    </div>

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
      <div className="w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
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
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg bg-pink-300 shadow-xs transition-all duration-300 group"
              >
                <div className="aspect-square bg-white m-[15px] rounded-lg flex flex-col items-center justify-center p-3 relative">
                  <img
                    src={`/shop-items/${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />

                  <button
                    onClick={() => handlePreview(item)}
                    className="p-2 ml-[50%] hover:bg-yellow-500 text-yellow-900 duration-300 rounded-lg bg-yellow-400"
                    title="Примерить на аватар"
                  >
                    <p className="text-xs font-bold">Примерить</p>
                  </button>
                </div>

                <div className="p-5 pt-[0px]">
                  <h3 className="text-xl font-bold text-pink-950 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-pink-800 text-sm mb-4">
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
                      className="px-4 py-2 bg-purple-700 w-[150px] h-[50px] hover:bg-purple-800 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Купить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
