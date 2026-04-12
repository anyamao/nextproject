// app/components/ChatSidebar.tsx
"use client";

import { useState } from "react";
import { MessageCirclePlus, Pencil, Delete, Trash } from "lucide-react";
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

  return (
    <div className="w-[200px] bg-white border-r border-gray-200 flex flex-col min-h-[1200px]">
      <div className="p-[15px]  w-full flex items-center justify-center">
        <button
          onClick={onNewChat}
          className="w-[100px] h-[25px] pointer hover:bg-gray-400 bg-gray-500 text-white rounded-xl smaller-text font-medium transition-colors flex items-center justify-center "
        >
          <span></span> Новый чат
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-3 mb-1 rounded-xl cursor-pointer transition-colors ${
              currentChatId === chat.id
                ? "bg-foxford-gray"
                : "hover:bg-foxford-gray/50"
            }`}
          >
            <div className="flex justify-between items-center">
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
                    className="w-full px-2 py-1 bg-white border border-foxford-green rounded-md text-sm text-foxford-text focus:outline-none"
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
                  <Pencil className="text-gray-400 pointer w-[15px] h-[15px]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="text-foxford-text-light hover:text-red-500 p-1 rounded transition-colors"
                  title="Удалить чат"
                >
                  <Trash className="text-red-400 pointer w-[15px] h-[15px]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
