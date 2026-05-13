// frontend/app/shop/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";

type ShopItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  description: string;
};

const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Розовый бант",
    image: "/pink_bows.png",
    price: 200,
    description: "Красивый розовый бант для вашего профиля",
  },
  {
    id: 2,
    name: "Белые цветы",
    image: "/white_flower.png",
    price: 200,
    description: "Нежные белые цветы для украшения",
  },
];

export default function ShopPage() {
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    itemName?: string;
    price?: number;
  }>({
    isOpen: false,
    onConfirm: () => {},
    itemName: "",
    price: 0,
  });

  const handleBuy = (item: ShopItem) => {
    setConfirmDialog({
      isOpen: true,
      itemName: item.name,
      price: item.price,
      onConfirm: () => {
        // Здесь будет логика покупки (пока без бэкенда)
        setToast({
          message: `Вы успешно купили "${item.name}" за ${item.price} XP! 🎉`,
          type: "success",
        });
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
  };

  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 w-full max-w-[1200px] mx-auto">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
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

      {/* Баланс XP (опционально) */}
      <div className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-white font-semibold">Ваш баланс:</span>
        </div>
        <div className="bg-white/20 rounded-lg px-4 py-2">
          <span className="text-white font-bold text-xl">1250</span>
          <span className="text-white/90 text-sm ml-1">XP</span>
        </div>
      </div>

      {/* Товары */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {shopItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
          >
            {/* Изображение */}
            <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-8">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            </div>

            {/* Информация о товаре */}
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {item.name}
              </h3>
              <p className="text-gray-500 text-sm mb-4">{item.description}</p>

              <div className="flex items-center justify-between">
                {/* Цена */}
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 rounded-lg px-3 py-1.5">
                    <span className="text-amber-700 font-bold text-lg">
                      {item.price}
                    </span>
                    <span className="text-amber-600 text-sm ml-1">XP</span>
                  </div>
                </div>

                {/* Кнопка покупки */}
                <button
                  onClick={() => handleBuy(item)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Купить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Пустой блок, если товаров нет */}
      {shopItems.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl w-full">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Товары пока не добавлены</p>
        </div>
      )}
    </main>
  );
}
