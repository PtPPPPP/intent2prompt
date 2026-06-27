export type LLMProvider = "mock" | "openai" | "claude" | "deepseek";

/**
 * 调用 DeepSeek（OpenAI 兼容）聊天补全接口。
 * 文档：https://api-docs.deepseek.com/
 * 依赖环境变量：
 *   DEEPSEEK_API_KEY  必填，DeepSeek 平台申请的 API Key
 *   DEEPSEEK_BASE_URL 可选，默认 https://api.deepseek.com（可指向自建网关/代理）
 *   DEEPSEEK_MODEL    可选，默认 deepseek-chat（也可用 deepseek-reasoner）
 */
async function generateWithDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置后再使用 LLM_PROVIDER=deepseek。"
    );
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `DeepSeek 请求失败（HTTP ${response.status}）：${detail.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回内容为空。");
  }

  return content.trim();
}

export async function generateWithLLM(prompt: string): Promise<string> {
  const provider = (process.env.LLM_PROVIDER ?? "mock") as LLMProvider;

  if (provider === "mock") {
    return `mock:${prompt.slice(0, 80)}`;
  }

  if (provider === "deepseek") {
    return generateWithDeepSeek(prompt);
  }

  if (provider === "openai") {
    throw new Error("OpenAI provider is not connected yet. Set LLM_PROVIDER=mock or deepseek.");
  }

  if (provider === "claude") {
    throw new Error("Claude provider is not connected yet. Set LLM_PROVIDER=mock or deepseek.");
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}
