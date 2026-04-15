// app/api/tutor/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GigaChat } from "gigachat-node";
import { Agent } from "node:https";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const httpsAgent = new Agent({ rejectUnauthorized: false });

export async function POST(req: Request) {
  try {
    const { prompt, chatId, isEdit, editedMessageId } = await req.json();
    if (!prompt || !chatId) {
      return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    // 1️⃣ Очистка БД (только для режима редактирования)
    if (isEdit && editedMessageId) {
      const { data: targetMsg } = await supabase
        .from("messages")
        .select("created_at")
        .eq("id", editedMessageId)
        .single();

      if (targetMsg) {
        // Удаляем ТОЛЬКО ответы ассистента, созданные после редактируемого сообщения
        await supabase
          .from("messages")
          .delete()
          .eq("chat_id", chatId)
          .eq("role", "assistant")
          .gte("created_at", targetMsg.created_at);
      }
    } else {
      // 2️⃣ Обычный режим: сохраняем сообщение пользователя
      await supabase.from("messages").insert({
        chat_id: chatId,
        user_id: user.id,
        role: "user",
        content: prompt,
      });
    }

    // 3️⃣ Загружаем историю чата
    const { data: history } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    // 4️⃣ Формируем контекст для GigaChat
    const chatMessages = [
      {
        role: "system",
        content:
          "Ты — опытный и терпеливый учитель. Тебя зовут Мао, ты девочка, но мыслишь как профессор. Дефолтный возраст учеников - старшая школа. Они еще многого не знают, будь беспристрастен, без слащавости. Не заостряй внимание на том, кто ты, твоя функция - объяснять вопросы. Никогда не придумывай, всегда будь терпелив к ученикам. Ни в коем случае не высмеивай за глупые вопросы, отвечай даже на легкие вопросы. Отвечай четко и по делу. Ты помогаешь ученикам изучать школьные предметы и грамматику. Твоя задача — давать точные, понятные и развернутые ответы. Всегда проверяй свои ответы на правильность.",
      },
    ];

    if (history && history.length > 0) {
      history.forEach((msg) => {
        chatMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      });
    }

    // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Гарантируем, что текущий промпт всегда последний в контексте
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== prompt) {
      chatMessages.push({ role: "user", content: prompt });
    }

    // 5️⃣ Запрос к GigaChat
    const client = new GigaChat({
      clientSecretKey: process.env.GIGACHAT_CREDENTIALS!,
      isIgnoreTSL: true,
      isPersonal: true,
      autoRefreshToken: true,
      timeout: 600,
    });

    await client.createToken();

    const response = await client.completion({
      model: "GigaChat:latest",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const answer = response.choices[0]?.message.content;

    // 6️⃣ Сохраняем ответ ассистента
    await supabase.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      role: "assistant",
      content: answer,
    });

    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return NextResponse.json({ response: answer }, { status: 200 });
  } catch (error) {
    console.error("Ошибка GigaChat:", error);
    let errorMessage = "Произошла ошибка";
    if (error instanceof Error) {
      if (error.message.includes("401"))
        errorMessage =
          "Ошибка авторизации. Проверьте ключ GIGACHAT_CREDENTIALS.";
      else if (error.message.includes("402"))
        errorMessage = "Закончились токены GigaChat.";
      else if (error.message.includes("EAI_AGAIN"))
        errorMessage = "Сервер временно недоступен. Попробуйте через минуту.";
      else errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
