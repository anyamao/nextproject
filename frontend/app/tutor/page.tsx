// app/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "@/ui/MessageBubble";
import { createClient } from "@/lib/supabase/client";
import ChatSidebar from "@/ui/ChatSidebar";
import { ArrowUp } from "lucide-react";
import useContactStore from "@/store/states";

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const prevMessagesLengthRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);

  const supabase = createClient();
  const { aisidebarState } = useContactStore();

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (!isNearBottom) {
      shouldAutoScrollRef.current = false;
      isUserScrollingRef.current = true;
    } else {
      shouldAutoScrollRef.current = true;
      isUserScrollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevMessagesLengthRef.current;

    if (currentLength > prevLength && shouldAutoScrollRef.current) {
      scrollToBottom();
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messages, scrollToBottom]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    isUserScrollingRef.current = false;
    setTimeout(() => scrollToBottom(), 100);
  }, [currentChatId, scrollToBottom]);

  const loadChats = async () => {
    setIsLoadingChats(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id) // ✅ Фильтруем по user_id
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("user_id")
      .eq("id", chatId)
      .single();

    if (chatError || chat?.user_id !== user.id) {
      console.error("Нет доступа к этому чату");
      setMessages([]);
      return;
    }

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Пожалуйста, войдите в аккаунт");
      return;
    }

    const { data, error } = await supabase
      .from("chats")
      .insert({
        title: "Новый чат",
        user_id: user.id, // ✅ Добавляем user_id
      })
      .select()
      .single();

    if (!error && data) {
      setChats([data, ...chats]);
      setCurrentChatId(data.id);
      setMessages([]);
    } else {
      setError("Не удалось создать чат");
    }
  };

  const deleteChat = async (chatId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", user.id);

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
    } else {
      setError("Не удалось удалить чат");
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("chats")
      .update({ title: newTitle })
      .eq("id", chatId)
      .eq("user_id", user.id); // ✅ Только свой чат

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Не удалось скопировать:", err);
    }
  };

  const regenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

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

    const messagesToDelete = messages.slice(messageIndex);
    for (const msg of messagesToDelete) {
      await supabase.from("messages").delete().eq("id", msg.id);
    }

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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Пожалуйста, войдите в аккаунт");
      return;
    }

    shouldAutoScrollRef.current = true;

    const userMessage = input;
    setInput("");
    setLoading(true);
    setError("");

    let chatId = currentChatId;

    if (!chatId) {
      const { data, error } = await supabase
        .from("chats")
        .insert({
          title: "Новый чат",
          user_id: user.id,
        })
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

    const { data: savedUserMessage, error: saveError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        user_id: user.id, // ✅ Добавляем user_id
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
            user_id: user.id,
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
        setError(data.error || "Ошибка при получении ответа");
        await supabase.from("messages").delete().eq("id", savedUserMessage.id);
        setMessages((prev) => prev.filter((m) => m.id !== savedUserMessage.id));
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Не удалось соединиться с сервером");
      await supabase.from("messages").delete().eq("id", savedUserMessage.id);
      setMessages((prev) => prev.filter((m) => m.id !== savedUserMessage.id));
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
    <div className="flex w-full h-full min-h-[1400px]">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
      />

      <div
        className={`${aisidebarState ? "ml-[200px]" : ""} flex-1 flex flex-col items-center`}
      >
        <div className="flex justify-center max-w-[1300px] w-full">
          <div className="py-[10px] bg-gray-100 fixed w-full text-center z-10">
            <p className="text-[10px] font-semibold mt-1">
              {currentChatId
                ? chats.find((chat) => chat.id === currentChatId)?.title ||
                  "Новый чат"
                : "ИИ-учитель Мао"}
            </p>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 bg-foxford-gray/30 mt-12 mb-24 w-full"
          >
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {messages.length === 0 && !isLoadingChats && currentChatId && (
              <div className="text-center text-foxford-text-light mt-12">
                <p className="ord-text mb-2">Начните диалог с ИИ-учителем!</p>
                <p className="smaller-text">
                  Задайте вопрос по математике, физике, русскому языку или
                  любому другому предмету
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
                onCopy={copyToClipboard}
                onRegenerate={
                  message.role === "assistant" ? regenerateMessage : undefined
                }
              />
            ))}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-foxford-gray shadow-sm">
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
          <div className="p-4 bg-white w-[60%] min-w-[350px] fixed bottom-0 border-gray-300 mb-[20px] rounded-xl shadow-sm z-10">
            <div className="flex gap-3 items-center max-w-3xl mx-auto">
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
                className="flex-1 px-4 py-3 bg-white smaller-text resize-none focus:outline-none focus:border-foxford-green transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-purple-400 cursor-pointer text-white smaller-text rounded-full flex items-center justify-center"
              >
                <ArrowUp className="w-[15px] h-[15px] m-[6px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
