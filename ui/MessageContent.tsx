// app/components/MessageContent.tsx
"use client";

import React from "react";

const MessageContent = ({ text }: { text: string }) => {
  if (!text) return null;

  // Убираем $ и заменяем формулы на текст в красивом оформлении
  const processText = (content: string) => {
    // Разбиваем текст по паттерну $...$
    const parts = content.split(/(\$[^$]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        // Это формула — убираем $ и показываем как код
        const formula = part.slice(1, -1);
        return (
          <code
            key={index}
            style={{
              backgroundColor: "#f5f5f5",
              padding: "2px 8px",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.95em",
              color: "#555555",
            }}
          >
            {formula}
          </code>
        );
      } else {
        // Обычный текст
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="message-content" style={{ lineHeight: 1.6 }}>
      {processText(text)}
    </div>
  );
};

export default MessageContent;
