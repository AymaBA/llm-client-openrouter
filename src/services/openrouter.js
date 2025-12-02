const BASE_URL = "https://openrouter.ai/api/v1";
const TITLE_MODEL = "google/gemini-2.5-flash-lite";

export async function fetchModels(apiKey) {
  const response = await fetch(`${BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function* streamChat(apiKey, model, messages, signal) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "LLM Client OpenRouter",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `API Error: ${response.statusText}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  }
}

export async function generateTitle(apiKey, userMessage, assistantMessage) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "LLM Client OpenRouter",
    },
    body: JSON.stringify({
      model: TITLE_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Génère un titre court (maximum 6 mots) pour cette conversation. Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.",
        },
        {
          role: "user",
          content: `Message utilisateur: ${userMessage}\n\nRéponse assistant: ${assistantMessage.slice(
            0,
            500
          )}`,
        },
      ],
      max_tokens: 30,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate title");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Nouvelle conversation";
}
