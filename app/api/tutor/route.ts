// app/api/tutor/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GigaChat } from "gigachat-node";
import { Agent } from "node:https";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

export async function POST(req: Request) {
  try {
    const { prompt, chatId, isEdit, editedMessageId } = await req.json();

    if (!prompt || !chatId) {
      return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
    }

    const supabase = await createClient();

    // Если это редактирование — удаляем старые сообщения после editedMessageId
    if (isEdit && editedMessageId) {
      // Находим время создания редактируемого сообщения
      const { data: editedMessage } = await supabase
        .from("messages")
        .select("created_at")
        .eq("id", editedMessageId)
        .single();

      if (editedMessage) {
        // Удаляем все сообщения после отредактированного
        await supabase
          .from("messages")
          .delete()
          .eq("chat_id", chatId)
          .gte("created_at", editedMessage.created_at);
      }
    } else {
      // Обычный режим — сохраняем сообщение пользователя
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: prompt,
      });
    }

    // Получаем историю чата (последние 20 сообщений для контекста)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Инициализация клиента GigaChat
    const client = new GigaChat({
      clientSecretKey: process.env.GIGACHAT_CREDENTIALS!,
      isIgnoreTSL: true,
      isPersonal: true,
      autoRefreshToken: true,
      timeout: 600,
    });

    // Получаем токен
    await client.createToken();

    // Формируем сообщения с контекстом
    const messages = [
      {
        role: "system",
        content:
          "Ты — опытный и терпеливый учитель. Тебя зовут Мао, ты девочка, но мыслишь как профессор. Дефолтный возраст учеников - старшая школа. Они еще многого не знают, будь беспристрастен, без слащавости. Не заостряй внимание на том, кто ты, твоя функция - обьяснять вопросы. Никогда не придумывай, всегда будь терпелив к ученикам. Ни в коем случае не высмеивай за глупые вопросы, отвечай даже на легкие вопросы. Отвечай четко и по делу.  Ты помогаешь ученикам изучать школьные предметы и грамматику. Твоя задача — давать точные, понятные и развернутые ответы. Всегда проверяй свои ответы на правильность.",
      },
    ];

    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Отправляем запрос к GigaChat
    const response = await client.completion({
      model: "GigaChat:latest",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const answer = response.choices[0]?.message.content;

    // Сохраняем ответ ассистента
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: "assistant",
      content: answer,
    });

    // Обновляем время последнего изменения чата
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return NextResponse.json({ response: answer }, { status: 200 });
  } catch (error) {
    console.error("Ошибка GigaChat:", error);

    let errorMessage = "Произошла ошибка";
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        errorMessage =
          "Ошибка авторизации. Проверьте ключ GIGACHAT_CREDENTIALS в .env.local";
      } else if (error.message.includes("402")) {
        errorMessage =
          "Закончились токены. Пополните баланс в личном кабинете GigaChat";
      } else if (error.message.includes("EAI_AGAIN")) {
        errorMessage =
          "Сервер временно недоступен. Пожалуйста, попробуйте ещё раз через минуту.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
