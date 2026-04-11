// app/page.tsx
"use client";

import { useState } from "react";
import MessageContent from "@/ui/MessageContent";
export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askTeacher = async () => {
    if (!question.trim()) {
      setError("Пожалуйста, введите вопрос");
      return;
    }

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      console.log("Отправляем вопрос:", question);

      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: question }),
      });

      console.log("Статус ответа:", response.status);

      // Сначала получаем текст ответа
      const responseText = await response.text();
      console.log("Сырой ответ от сервера:", responseText);

      // Пробуем распарсить JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        setError(
          `Сервер вернул некорректный ответ: ${responseText.substring(0, 100)}`,
        );
        return;
      }

      if (response.ok) {
        if (data.response) {
          setAnswer(data.response);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Неожиданный формат ответа от сервера");
        }
      } else {
        setError(data.error || `Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
      setError(
        "Не удалось соединиться с сервером. Проверьте консоль сервера для деталей.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🤖 ИИ-Учитель от Яндекса</h1>

      <div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Задайте вопрос по школьному предмету или грамматике..."
          rows={4}
          style={{
            width: "100%",
            marginBottom: "1rem",
            padding: "0.5rem",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={askTeacher}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "ИИ думает..." : "Спросить"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ff0000",
            borderRadius: "8px",
            backgroundColor: "#ffeeee",
          }}
        >
          <h2 style={{ color: "#ff0000" }}>Ошибка:</h2>
          <p>{error}</p>
        </div>
      )}
      {answer && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #4caf50",
            borderRadius: "8px",
          }}
        >
          <h2>Ответ учителя:</h2>
          {/* Вместо <p>{answer}</p> используйте: */}
          <MessageContent text={answer} />
        </div>
      )}
    </div>
  );
}
