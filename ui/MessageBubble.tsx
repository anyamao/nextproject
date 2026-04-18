"use client";

import { useState } from "react";
import MessageContent from "./MessageContent";
import { Pencil, Trash, Copy, RotateCw } from "lucide-react";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
  onCopy?: (text: string) => void;
  onRegenerate?: (id: string) => void;
}

export default function MessageBubble({
  id,
  role,
  content,
  onEdit,
  onDelete,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showCopied, setShowCopied] = useState(false);

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

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(id);
    }
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
      <div className="flex flex-col pt-[10px]">
        <div
          className={`w-full px-4 py-3  ${isUser ? "bg-white smaller-text rounded-[15px] flex w-full mt-[10px] items-center" : " ord-text "}`}
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
              <div>1212</div>
              <div className="flex gap-2 justify-end">
                <button onClick={handleSaveEdit} className=" text-black">
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
            </>
          )}
        </div>
        {isUser && onEdit && onDelete && (
          <div className=" flex items-center justify-end mr-[10px] mt-[10px] ">
            <button
              onClick={() => setIsEditing(true)}
              className="ml-[10px]"
              title="Редактировать"
            >
              <Pencil className="w-[15px] h-[15px] text-gray-500 " />
            </button>
            <button
              onClick={handleCopy}
              className="ml-[10px]"
              title="Копировать"
            >
              <Copy className="w-[15px] h-[15px] text-gray-500 " />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="ml-[10px]"
              title="Удалить"
            >
              <Trash className="w-[15px] h-[15px] text-gray-500 " />
            </button>
          </div>
        )}
        {!isUser && (
          <div className=" flex items-center justify-start mr-[10px] mt-[10px] ">
            <button
              onClick={handleCopy}
              className="ml-[10px]"
              title="Копировать"
            >
              {showCopied ? (
                <span className="text-green-500 text-xs ml-[10px]">
                  Скопировано!
                </span>
              ) : (
                <Copy className="w-[15px] h-[15px] text-gray-500 " />
              )}
            </button>
            <button
              onClick={handleRegenerate}
              className="ml-[10px]"
              title="Перегенерировать"
            >
              <RotateCw className="w-[15px] h-[15px] text-gray-500 " />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
