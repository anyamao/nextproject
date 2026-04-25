// app/components/MessageContent.tsx
"use client";

import React from "react";

const processMarkdown = (text: string): string => {
  if (!text) return "";

  let processed = text;

  processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");

  processed = processed.replace(/`(.*?)`/g, "<code>$1</code>");

  processed = processed.replace(/\n/g, "<br/>");

  return processed;
};

const processFormulas = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\$[^$]+\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$")) {
      const formula = part.slice(1, -1);
      return (
        <code
          key={index}
          style={{
            backgroundColor: "#e8e8e8",
            padding: "2px 8px",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.95em",
            color: "#4a4a4a",
            fontWeight: "500",
            border: "1px solid #d4d4d4",
          }}
        >
          {formula}
        </code>
      );
    } else {
      return (
        <span
          key={index}
          dangerouslySetInnerHTML={{ __html: processMarkdown(part) }}
        />
      );
    }
  });
};

const MessageContent = ({ text }: { text: string }) => {
  if (!text) return null;

  return (
    <div className="message-content" style={{ lineHeight: 1.6 }}>
      {processFormulas(text)}
    </div>
  );
};

export default MessageContent;
