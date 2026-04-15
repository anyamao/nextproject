// app/components/AI.tsx
import useContactStore from "@/store/states";
import Link from "next/link";
import {
  X,
  MessageCirclePlus,
  Send,
  Trash,
  Pencil,
  Copy,
  Check,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageBubble from "@/ui/MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function AI() {
  const { aispaceState, toggleAiSpace } = useContactStore();
  const pathname = usePathname();
  const supabase = createClient();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const loadChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setChats(data);
      if (data.length > 0 && !currentChatId) {
        setCurrentChatId(data[0].id);
      }
    }
  };

  // Загрузка сообщений
  const loadMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMessages(data);
    } else {
      setMessages([]);
    }
  };

  // Создание нового чата
  const createNewChat = async () => {
    const { data, error } = await supabase
      .from("chats")
      .insert({ title: "Новый чат" })
      .select()
      .single();
    if (!error && data) {
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      setMessages([]);
      setShowSidebar(false);
    }
  };

  // Удаление чата
  const deleteChat = async (chatId: string) => {
    const { error } = await supabase.from("chats").delete().eq("id", chatId);
    if (!error) {
      const newChats = chats.filter((c) => c.id !== chatId);
      setChats(newChats);
      if (currentChatId === chatId && newChats.length > 0) {
        setCurrentChatId(newChats[0].id);
      } else if (newChats.length === 0) {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  // Обновление названия чата
  const updateChatTitle = async (chatId: string, firstMessage: string) => {
    const title =
      firstMessage.slice(0, 25) + (firstMessage.length > 25 ? "..." : "");
    await supabase.from("chats").update({ title }).eq("id", chatId);
    setChats(
      chats.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
    );
  };

  // Редактирование сообщения
  const editMessage = async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const { error } = await supabase
      .from("messages")
      .update({ content: newContent })
      .eq("id", messageId);

    if (error) {
      setError("Не удалось обновить сообщение");
      return;
    }

    const messagesToDelete = messages.slice(messageIndex + 1);
    for (const msg of messagesToDelete) {
      await supabase.from("messages").delete().eq("id", msg.id);
    }

    const updatedMessages = [...messages.slice(0, messageIndex + 1)];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
    };
    setMessages(updatedMessages);

    setLoading(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newContent,
          chatId: currentChatId,
          isEdit: true,
          editedMessageId: messageId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(data.error || "Ошибка при перегенерации ответа");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Не удалось соединиться с сервером");
    } finally {
      setLoading(false);
    }

    setEditingMessageId(null);
    setEditContent("");
  };

  // Удаление сообщения
  const deleteMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const messagesToDelete = messages.slice(messageIndex);
    for (const msg of messagesToDelete) {
      await supabase.from("messages").delete().eq("id", msg.id);
    }

    const updatedMessages = messages.slice(0, messageIndex);
    setMessages(updatedMessages);
  };

  // Копирование текста
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Можно добавить уведомление
    } catch (err) {
      console.error("Не удалось скопировать");
    }
  };

  // Перегенерация ответа учителя
  // Перегенерация ответа учителя
  //
  //
  //

  // Перегенерация ответа учителя (из рабочего tutor/page.tsx)
  const regenerateMessage = async (messageId: string) => {
    // Находим индекс сообщения, которое нужно перегенерировать
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Находим предыдущее сообщение пользователя
    let userMessageIndex = messageIndex - 1;
    while (
      userMessageIndex >= 0 &&
      messages[userMessageIndex].role !== "user"
    ) {
      userMessageIndex--;
    }

    if (userMessageIndex < 0) {
      setError("Не найдено сообщение пользователя для перегенерации");
      return;
    }

    const userMessage = messages[userMessageIndex];

    // Удаляем сообщение ассистента и все последующие из базы
    const messagesToDelete = messages.slice(messageIndex);
    for (const msg of messagesToDelete) {
      await supabase.from("messages").delete().eq("id", msg.id);
    }

    // Обновляем локальное состояние
    const updatedMessages = messages.slice(0, messageIndex);
    setMessages(updatedMessages);

    setLoading(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage.content,
          chatId: currentChatId,
          isEdit: true,
          editedMessageId: userMessage.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ СОХРАНЯЕМ НОВЫЙ ОТВЕТ В БАЗУ (как в tutor/page.tsx)
        const { data: savedAssistantMessage } = await supabase
          .from("messages")
          .insert({
            chat_id: currentChatId,
            role: "assistant",
            content: data.response,
          })
          .select()
          .single();

        if (savedAssistantMessage) {
          const assistantMessageObj: Message = {
            id: savedAssistantMessage.id,
            role: "assistant",
            content: data.response,
            created_at: savedAssistantMessage.created_at,
          };
          setMessages((prev) => [...prev, assistantMessageObj]);
        }
      } else {
        setError(data.error || "Ошибка при перегенерации ответа");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Не удалось соединиться с сервером");
    } finally {
      setLoading(false);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input;
    setInput("");
    setLoading(true);
    setError("");

    let chatId = currentChatId;

    if (!chatId) {
      const { data, error } = await supabase
        .from("chats")
        .insert({ title: "Новый чат" })
        .select()
        .single();
      if (error || !data) {
        setLoading(false);
        setError("Не удалось создать чат");
        return;
      }
      chatId = data.id;
      setCurrentChatId(chatId);
      setChats([data, ...chats]);
    }

    // Сохраняем сообщение пользователя
    const { data: savedUserMessage, error: saveError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        role: "user",
        content: userMessage,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Ошибка сохранения:", saveError);
      setError("Не удалось сохранить сообщение");
      setLoading(false);
      return;
    }

    const userMessageObj: Message = {
      id: savedUserMessage.id,
      role: "user",
      content: userMessage,
      created_at: savedUserMessage.created_at,
    };
    setMessages((prev) => [...prev, userMessageObj]);

    if (messages.length === 0 && chatId) {
      updateChatTitle(chatId, userMessage);
    }

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage, chatId }),
      });
      const data = await response.json();

      if (response.ok) {
        const { data: savedAssistantMessage } = await supabase
          .from("messages")
          .insert({
            chat_id: chatId,
            role: "assistant",
            content: data.response,
          })
          .select()
          .single();

        if (savedAssistantMessage) {
          const assistantMessageObj: Message = {
            id: savedAssistantMessage.id,
            role: "assistant",
            content: data.response,
            created_at: savedAssistantMessage.created_at,
          };
          setMessages((prev) => [...prev, assistantMessageObj]);
        }
      } else {
        setError(data.error || "Ошибка");
        await supabase.from("messages").delete().eq("id", savedUserMessage.id);
        setMessages((prev) => prev.filter((m) => m.id !== savedUserMessage.id));
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Ошибка соединения");
      await supabase.from("messages").delete().eq("id", savedUserMessage.id);
      setMessages((prev) => prev.filter((m) => m.id !== savedUserMessage.id));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (aispaceState) {
      loadChats();
    }
  }, [aispaceState]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  if (pathname === "/tutor") {
    return null;
  }

  // Свернутый вид
  if (!aispaceState) {
    return (
      <div className="fixed bottom-0 right-0 z-50">
        <div
          onClick={toggleAiSpace}
          className="shadow-xs cursor-pointer hover:mb-[55px] transition-all duration-300 bg-white mb-[50px] mr-[10px] flex items-center justify-center rounded-[20px] py-[7px] px-[5px]"
        >
          <div className="h-[60px] w-[4px] bg-orange-200 ml-[7px]"></div>
          <div className="flex flex-col">
            <p className="smaller-text font-semibold flex text-right pr-[10px] ml-[10px]">
              ИИ-учитель Мао
            </p>
            <p className="smaller-text font-semibold text-gray-600 flex text-right pr-[10px] ml-[10px]">
              Помогу со всем!
            </p>
          </div>
          <img
            src="/aiclose.png"
            className="rounded-full max-w-[80px] border-orange-400 border-[1px] max-h-80px"
            alt="AI Teacher"
          />
        </div>
      </div>
    );
  }

  // Развернутый вид — используем MessageBubble для отображения сообщений
  return (
    <div className="fixed top-0 right-0 sm:w-[500px] w-full mt-[120px] h-full max-h-[900px] overflow-y-auto bg-white shadow-xl z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <img
            src="/aiclose.png"
            className="rounded-full w-10 h-10 object-cover"
            alt="AI Teacher"
          />
          <div>
            <p className="font-semibold text-sm">
              {currentChatId
                ? chats.find((c) => c.id === currentChatId)?.title ||
                  "Новый чат"
                : "ИИ-учитель Мао"}
            </p>
            <p className="text-xs text-gray-400">ИИ-учитель Мао</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createNewChat}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Новый чат"
          >
            <MessageCirclePlus className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="История чатов"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <Link
            href="/tutor"
            className="bg-purple-500 px-3 py-1.5 rounded-md text-white text-xs font-medium hover:bg-purple-600 transition-colors"
          >
            Полная версия
          </Link>
          <button
            onClick={toggleAiSpace}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Sidebar с чатами */}
      {showSidebar && (
        <div className="absolute left-0 top-[73px] w-64 bg-white border-r border-gray-200 h-[calc(100%-73px)] z-10 shadow-lg">
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={createNewChat}
              className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              + Новый чат
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  currentChatId === chat.id ? "bg-purple-50" : ""
                }`}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setShowSidebar(false);
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(chat.updated_at).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages — используем MessageBubble */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-[150px]">
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-500 rounded-lg text-xs text-center">
            {error}
          </div>
        )}

        {messages.length === 0 && currentChatId && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-sm mb-2">Начните диалог с ИИ-учителем!</p>
            <p className="text-xs">Задайте любой вопрос</p>
          </div>
        )}

        {/* ✅ Используем MessageBubble для каждого сообщения */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            role={message.role}
            content={message.content}
            onEdit={message.role === "user" ? editMessage : undefined}
            onDelete={message.role === "user" ? deleteMessage : undefined}
            onCopy={copyToClipboard}
            onRegenerate={
              message.role === "assistant" ? regenerateMessage : undefined
            }
          />
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="animate-pulse">.</span>
                <span
                  className="animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                >
                  .
                </span>
                <span
                  className="animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                >
                  .
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-50 fixed w-[400px] ml-[50px] bottom-0">
        <div className="flex bg-white gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Задайте вопрос..."
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-400 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-purple-500 text-white rounded-xl px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
