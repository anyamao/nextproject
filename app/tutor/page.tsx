// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "@/ui/MessageBubble";
import { createClient } from "@/lib/supabase/client";
import ChatSidebar from "@/ui/ChatSidebar";

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

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = async () => {
    setIsLoadingChats(true);
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
    setIsLoadingChats(false);
  };

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
    }
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase.from("chats").delete().eq("id", chatId);

    if (!error) {
      const newChats = chats.filter((c) => c.id !== chatId);
      setChats(newChats);

      if (currentChatId === chatId) {
        if (newChats.length > 0) {
          setCurrentChatId(newChats[0].id);
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    const { error } = await supabase
      .from("chats")
      .update({ title: newTitle })
      .eq("id", chatId);

    if (!error) {
      setChats(
        chats.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat,
        ),
      );
    }
  };

  const updateChatTitle = async (chatId: string, firstMessage: string) => {
    const title =
      firstMessage.slice(0, 30) + (firstMessage.length > 30 ? "..." : "");
    await supabase.from("chats").update({ title }).eq("id", chatId);

    setChats(
      chats.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
    );
  };

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
          id: Date.now().toString(),
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
  };

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

    const tempUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

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
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setError(data.error || "Ошибка при получении ответа");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Не удалось соединиться с сервером");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
      loadChats();
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    }
  }, [currentChatId]);

  return (
    <div className="flex h-full ">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="py-[10px] bg-gray-100  text-center">
          <p className="smaller-text   mt-1">ИИ-учитель Мао</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-foxford-gray/30">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {messages.length === 0 && !isLoadingChats && currentChatId && (
            <div className="text-center text-foxford-text-light mt-12">
              <p className="ord-text mb-2">Начните диалог с ИИ-учителем!</p>
              <p className="smaller-text">
                Задайте вопрос по математике, физике, русскому языку или любому
                другому предмету
              </p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              id={message.id}
              role={message.role}
              content={message.content}
              onEdit={message.role === "user" ? editMessage : undefined}
              onDelete={message.role === "user" ? deleteMessage : undefined}
            />
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-foxford-gray shadow-sm">
                <div className="flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  >
                    ●
                  </span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  >
                    ●
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-300">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Задайте вопрос по школьному предмету..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl 300 bg-white text-foxford-text text-sm resize-none focus:outline-none focus:border-foxford-green transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-foxford-green text-white rounded-xl text-sm font-medium hover:bg-foxford-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
