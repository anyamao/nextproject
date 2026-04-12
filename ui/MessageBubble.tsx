// app/components/MessageBubble.tsx
"use client";

import { useState } from "react";
import MessageContent from "./MessageContent";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}

export default function MessageBubble({
  id,
  role,
  content,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 shadow-sm ${isUser ? "message-user" : "message-assistant"}`}
      >
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full min-w-[250px] p-2 rounded-lg border border-foxford-gray-dark bg-white text-foxford-text text-sm resize-y mb-2 focus:outline-none focus:border-foxford-green"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-foxford-green text-white text-xs rounded-md hover:bg-foxford-green-dark transition-colors"
              >
                💾 Сохранить
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-foxford-gray-dark text-foxford-text-light text-xs rounded-md hover:bg-gray-300 transition-colors"
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageContent text={content} />
            {isUser && onEdit && onDelete && (
              <div className="mt-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-white/70 hover:text-white text-xs p-1 transition-colors"
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(id)}
                  className="text-black bg-red-500 w-[200px] h-[200px]"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
