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

export async function* streamChat(apiKey, model, messages, signal, options = {}) {
  const { outputModalities = [] } = options;

  const requestBody = {
    model,
    messages,
    stream: true,
  };

  // Add modalities if the model supports more than just text
  if (outputModalities.length > 0 && (outputModalities.includes('image') || outputModalities.length > 1)) {
    requestBody.modalities = outputModalities;
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "LLM Client OpenRouter",
    },
    body: JSON.stringify(requestBody),
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
        const choice = json.choices?.[0];
        if (!choice) continue;

        const chunk = {};

        // Handle streaming delta
        const delta = choice.delta;
        if (delta) {
          // Regular content
          if (delta.content) {
            chunk.content = delta.content;
          }

          // Reasoning content (multiple possible field names)
          const reasoning = delta.reasoning || delta.reasoning_content;
          if (reasoning) {
            chunk.reasoning = reasoning;
          }

          // Reasoning details (structured format from OpenRouter)
          if (delta.reasoning_details) {
            for (const detail of delta.reasoning_details) {
              if (detail.type === "reasoning.summary" && detail.summary) {
                chunk.reasoning = (chunk.reasoning || "") + detail.summary;
              }
            }
          }

          // Images in delta (streaming)
          if (delta.images && delta.images.length > 0) {
            chunk.images = delta.images.map((img) => ({
              url: img.image_url?.url || img.url,
            }));
          }
        }

        // Handle complete message (some models send images in message, not delta)
        const message = choice.message;
        if (message) {
          // Handle string content
          if (typeof message.content === 'string' && !chunk.content) {
            chunk.content = message.content;
          }

          // Handle array content (multimodal format)
          if (Array.isArray(message.content)) {
            for (const item of message.content) {
              if (item.type === 'text' && item.text) {
                chunk.content = (chunk.content || '') + item.text;
              } else if (item.type === 'image_url' && item.image_url?.url) {
                chunk.images = chunk.images || [];
                chunk.images.push({ url: item.image_url.url });
              } else if (item.type === 'image' && item.image) {
                chunk.images = chunk.images || [];
                // Handle raw base64 or data URL
                const url = item.image.startsWith('data:') ? item.image : `data:image/png;base64,${item.image}`;
                chunk.images.push({ url });
              }
            }
          }

          // Handle images field directly on message
          if (message.images && message.images.length > 0) {
            chunk.images = chunk.images || [];
            for (const img of message.images) {
              const url = img.image_url?.url || img.url;
              if (url) chunk.images.push({ url });
            }
          }
        }

        // Also check for images in delta with multimodal content format
        if (delta && Array.isArray(delta.content)) {
          for (const item of delta.content) {
            if (item.type === 'text' && item.text) {
              chunk.content = (chunk.content || '') + item.text;
            } else if (item.type === 'image_url' && item.image_url?.url) {
              chunk.images = chunk.images || [];
              chunk.images.push({ url: item.image_url.url });
            } else if (item.type === 'image' && item.image) {
              chunk.images = chunk.images || [];
              const url = item.image.startsWith('data:') ? item.image : `data:image/png;base64,${item.image}`;
              chunk.images.push({ url });
            }
          }
        }

        // Only yield if we have something
        if (chunk.content || chunk.reasoning || chunk.images) {
          yield chunk;
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
