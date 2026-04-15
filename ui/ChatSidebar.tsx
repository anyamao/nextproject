// app/components/ChatSidebar.tsx
"use client";
import toast from "react-hot-toast";
import useContactStore from "@/store/states";
import { useState, useEffect } from "react";
import {
  MessageCirclePlus,
  Pencil,
  Delete,
  Trash,
  PanelRight,
} from "lucide-react";

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export default function ChatSidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    visible: boolean;
  }>({ message: "", visible: false });

  const startRename = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (chatId: string) => {
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      saveRename(chatId);
    }
    if (e.key === "Escape") {
      setEditingChatId(null);
      setEditTitle("");
    }
  };

  const handleDeleteChat = (chatId: string) => {
    onDeleteChat(chatId);
    // Показываем уведомление
    toast.success("Чат успешно удален");
    setNotification({ message: "Чат успешно удален", visible: true });
    // Скрываем уведомление через 2 секунды
    setTimeout(() => {
      setNotification({ message: "", visible: false });
    }, 2000);
  };

  const { aisidebarState, toggleAiSidebar } = useContactStore();

  return (
    <div
      className={`w-[250px] z-20 flex flex-col fixed ml-[-20px] pl-[20px]  ${aisidebarState ? "min-h-screen bg-white bg-white border-r border-gray-200 " : "fixed h-[50px] left-0 "} `}
    >
      {/* Уведомление об удалении */}
      {notification.visible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-fade-in-out">
          {notification.message}
        </div>
      )}

      <div
        className={`p-[15px] ${!aisidebarState ? " w-[80px] mt-[5px] ml-[20px] bg-purple-500 rounded-full h-[30px]" : "fixed bg-white"}  flex items-center  justify-center`}
      >
        <button
          onClick={onNewChat}
          className={` ${aisidebarState ? "w-[115px]  hover:bg-purple-400 bg-purple-500 text-white " : "w-[25px] bg-none text-purple-500 "}  h-[25px] pointer  rounded-xl smaller-text font-medium transition-colors flex items-center justify-center `}
        >
          <MessageCirclePlus
            className={`w-[15px] h-[15px] ${aisidebarState ? "mr-[8px]" : "text-white mr-[0px]"}  `}
          />{" "}
          <p className={`${aisidebarState ? "" : "hidden"}`}>Новый чат</p>
        </button>
        <PanelRight
          onClick={toggleAiSidebar}
          className={`w-[15px] h-[15px]  ${!aisidebarState ? "text-white ml-[10px]" : " ml-[20px] text-purple-500"}  `}
        />
      </div>

      <div
        className={` ${aisidebarState ? "" : "hidden"} max-h-[800px]  mt-[40px] flex-1 overflow-y-auto p-2`}
      >
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-[10px] my-[5px] mb-1 rounded-xl cursor-pointer transition-colors ${
              currentChatId === chat.id
                ? "bg-gray-100" // ← Подсветка активного чата
                : "hover:bg-foxford-gray/50"
            }`}
          >
            <div className={`flex justify-between items-center`}>
              <div
                className="flex-1 overflow-hidden"
                onClick={() => onSelectChat(chat.id)}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, chat.id)}
                    onBlur={() => saveRename(chat.id)}
                    className="w-full px-[10px] py-[5px] bg-white border border-gray-200 rounded-md smaller-text focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="smaller-text font-medium text-foxford-text truncate">
                      {chat.title}
                    </div>
                    <div className="text-[11px] text-foxford-text-light mt-1">
                      {new Date(chat.updated_at).toLocaleDateString("ru-RU")}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(chat);
                  }}
                  className="text-foxford-text-light hover:text-foxford-green p-1 rounded transition-colors"
                  title="Переименовать"
                >
                  <Pencil className="text-gray-400 cursor-pointer w-[15px] h-[15px]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="text-foxford-text-light hover:text-red-500 p-1 rounded transition-colors"
                  title="Удалить чат"
                >
                  <Trash className="text-red-400 cursor-pointer w-[15px] h-[15px]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Добавляем CSS-анимацию для уведомления */}
      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          85% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
