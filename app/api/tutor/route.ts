// app/api/tutor/route.ts
import { NextResponse } from "next/server";
import GigaChat from "gigachat";
import { Agent } from "node:https";

export const runtime = "nodejs";

// Создаем HTTPS агент для обхода проблемы с сертификатом
const httpsAgent = new Agent({
  rejectUnauthorized: false, // Отключаем проверку сертификата (для разработки)
});

// Инициализируем клиент GigaChat
const client = new GigaChat({
  credentials: process.env.GIGACHAT_CREDENTIALS!, // Authorization Key из кабинета
  scope: "GIGACHAT_API_PERS", // Для физических лиц
  model: "GigaChat-2-Pro", // Или GigaChat-2-Lite для экономии токенов
  httpsAgent: httpsAgent,
  timeout: 600,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Сообщение не может быть пустым" },
        { status: 400 },
      );
    }

    const systemPrompt = `Ты — опытный и терпеливый ИИ-учитель. Ты помогаешь ученикам изучать школьные предметы и грамматику. Твоя задача — давать точные, понятные и развернутые ответы. Всегда проверяй свои ответы на правильность.`;

    const response = await client.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const answer = response.choices[0]?.message.content;
    return NextResponse.json({ response: answer }, { status: 200 });
  } catch (error) {
    console.error("Ошибка GigaChat:", error);

    let errorMessage = "Произошла ошибка";
    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage =
          "Ошибка авторизации. Проверьте правильность Authorization Key.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
