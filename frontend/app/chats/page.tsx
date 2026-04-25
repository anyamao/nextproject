"use client";

import { useState } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  X,
  Edit2,
  Trash2,
  Reply,
  Check,
  CheckCheck,
  ChevronLeft,
  Plus,
  MessageCircle,
} from "lucide-react";

// Types
type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  isEdited: boolean;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  deletedFor?: string[]; // user ids who deleted this message
};

type Chat = {
  id: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
};

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      userId: "user1",
      username: "alex_walker",
      firstName: "Alex",
      lastName: "Walker",
      avatar: "/aiclose.png",
      status: "online",
      lastMessage: "Hey, how are you?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
      unreadCount: 2,
      messages: [
        {
          id: "m1",
          text: "Hey, how are you?",
          senderId: "user1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          isEdited: false,
        },
        {
          id: "m2",
          text: "I'm good, thanks! How about you?",
          senderId: "currentUser",
          timestamp: new Date(Date.now() - 1000 * 60 * 55),
          isEdited: false,
        },
        {
          id: "m3",
          text: "Doing great! Want to grab coffee sometime?",
          senderId: "user1",
          timestamp: new Date(Date.now() - 1000 * 60 * 50),
          isEdited: false,
        },
      ],
    },
    {
      id: "2",
      userId: "user2",
      username: "jessica_parker",
      firstName: "Jessica",
      lastName: "Parker",
      avatar: "/aiclose.png",
      status: "offline",
      lastMessage: "See you tomorrow!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      messages: [
        {
          id: "m4",
          text: "See you tomorrow!",
          senderId: "user2",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isEdited: false,
        },
      ],
    },
    {
      id: "3",
      userId: "user3",
      username: "mike_ross",
      firstName: "Mike",
      lastName: "Ross",
      avatar: "/aiclose.png",
      status: "away",
      lastMessage: "I'll send the files later",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
      unreadCount: 1,
      messages: [
        {
          id: "m5",
          text: "I'll send the files later",
          senderId: "user3",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
          isEdited: false,
        },
      ],
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [dropdownMessageId, setDropdownMessageId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserId = "currentUser";

  // Filter chats based on search
  const filteredChats = chats.filter(
    (chat) =>
      chat.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      senderId: currentUserId,
      timestamp: new Date(),
      isEdited: false,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text,
            senderName:
              replyingTo.senderId === currentUserId
                ? "You"
                : selectedChat.firstName,
          }
        : undefined,
    };

    // Update messages in selected chat
    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChat.id) {
        const updatedMessages = [...chat.messages, newMsg];
        return {
          ...chat,
          messages: updatedMessages,
          lastMessage: newMessage,
          lastMessageTime: new Date(),
          unreadCount: 0,
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, newMsg],
      lastMessage: newMessage,
      lastMessageTime: new Date(),
      unreadCount: 0,
    });
    setNewMessage("");
    setReplyingTo(null);
  };

  // Edit message
  const handleEditMessage = (messageId: string, newText: string) => {
    if (!selectedChat) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChat.id) {
        const updatedMessages = chat.messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: newText, isEdited: true }
            : msg,
        );
        return { ...chat, messages: updatedMessages };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat({
      ...selectedChat,
      messages: selectedChat.messages.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg,
      ),
    });
    setEditingMessage(null);
    setDropdownMessageId(null);
  };

  // Delete message (soft delete - just for current user)
  const handleDeleteMessage = (messageId: string) => {
    if (!selectedChat) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChat.id) {
        const updatedMessages = chat.messages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                text: "This message was deleted",
                deletedFor: [...(msg.deletedFor || []), currentUserId],
              }
            : msg,
        );
        return { ...chat, messages: updatedMessages };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat({
      ...selectedChat,
      messages: selectedChat.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              text: "This message was deleted",
              deletedFor: [...(msg.deletedFor || []), currentUserId],
            }
          : msg,
      ),
    });
    setDropdownMessageId(null);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (hours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Chats List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                selectedChat?.id === chat.id
                  ? "bg-blue-50 border-l-4 border-blue-500"
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(chat.status)} border-2 border-white`}
                ></div>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {chat.firstName} {chat.lastName}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {chat.lastMessage}
                </p>
              </div>

              {/* Unread Badge */}
              {chat.unreadCount > 0 && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">{chat.unreadCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={selectedChat.avatar}
                  alt={selectedChat.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${getStatusColor(selectedChat.status)} border-2 border-white`}
                ></div>
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {selectedChat.firstName} {selectedChat.lastName}
                </h2>
                <p className="text-xs text-gray-500">
                  @{selectedChat.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Video className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setSelectedChat(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedChat.messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId;
              const isDeleted = message.deletedFor?.includes(currentUserId);

              if (isDeleted) return null;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] relative group`}>
                    {/* Reply Indicator */}
                    {message.replyTo && (
                      <div
                        className={`mb-1 px-3 py-1 rounded-t-lg text-xs border-l-4 ${
                          isOwnMessage
                            ? "bg-blue-100 border-blue-400 ml-auto"
                            : "bg-gray-100 border-gray-400"
                        }`}
                      >
                        <span className="font-semibold">
                          ↩️ Replying to {message.replyTo.senderName}:
                        </span>
                        <p className="text-gray-600 truncate">
                          {message.replyTo.text}
                        </p>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative ${
                        isOwnMessage
                          ? "bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl"
                          : "bg-white text-gray-800 rounded-r-2xl rounded-tl-2xl shadow-sm"
                      } p-3`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs ${
                          isOwnMessage ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {message.isEdited && <span>(edited)</span>}
                        {isOwnMessage && (
                          <span className="ml-1">
                            {message.id ===
                            selectedChat.messages[
                              selectedChat.messages.length - 1
                            ]?.id ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Actions Dropdown */}
                    {isOwnMessage && !isDeleted && (
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            setDropdownMessageId(
                              dropdownMessageId === message.id
                                ? null
                                : message.id,
                            )
                          }
                          className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>

                        {dropdownMessageId === message.id && (
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                setEditingMessage(message);
                                setDropdownMessageId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleReply(message)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Reply className="w-4 h-4" />
                              Reply
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reply button for others' messages */}
                    {!isOwnMessage && (
                      <button
                        onClick={() => handleReply(message)}
                        className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-200 rounded-full hover:bg-gray-300 -mb-2 -mr-2"
                      >
                        <Reply className="w-3 h-3 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {replyingTo && (
            <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Reply className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Replying to{" "}
                  <span className="font-semibold">
                    {replyingTo.senderId === currentUserId
                      ? "yourself"
                      : selectedChat.firstName}
                  </span>
                </span>
                <span className="text-gray-400">
                  {replyingTo.text.substring(0, 50)}
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Edit Message Input */}
          {editingMessage && (
            <div className="bg-gray-100 border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={editingMessage.text}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEditMessage(
                        editingMessage.id,
                        e.currentTarget.value,
                      );
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => setEditingMessage(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Paperclip className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Smile className="w-5 h-5 text-gray-500" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Mic className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Empty State
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Your Messages
            </h2>
            <p className="text-gray-500 mb-6">
              Select a conversation to start chatting
            </p>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function for reply
  function handleReply(message: Message) {
    setReplyingTo(message);
    setDropdownMessageId(null);
  }
}
