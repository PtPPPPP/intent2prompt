import type { PromptVersion, ProviderStatus } from "./types";
import { getEnv } from "./env";

export type LLMProvider = "mock" | "openai" | "claude" | "deepseek";

export interface PromptEnhancementResult {
  promptVersions: PromptVersion[];
  providerStatus: ProviderStatus;
  providerMessage?: string;
}

function getProvider(): LLMProvider {
  const provider = getEnv().llmProvider;
  return provider === "deepseek" || provider === "openai" || provider === "claude"
    ? provider
    : "mock";
}

async function generateWithDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      stream: false,
    }),
    signal: AbortSignal.timeout(getEnv().llmTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek request failed with HTTP ${response.status}.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek returned empty content.");
  }

  return content;
}

function buildEnhancementInstruction(prompt: string): string {
  return [
    "你是中文 Prompt 编辑。请润色下面的 Prompt，使表达更清晰、具体、可执行。",
    "必须保留原有结构、所有关键模块、约束、待补充项和事实边界。",
    "不得删除模块、编造事实、补充未提供的数据，也不要解释你的修改。",
    "只输出润色后的完整 Prompt。",
    "",
    prompt,
  ].join("\n");
}

function isUsableEnhancement(original: string, enhanced: string): boolean {
  const length = enhanced.trim().length;
  return length >= Math.max(80, Math.floor(original.length * 0.5));
}

export async function enhancePromptVersions(
  promptVersions: PromptVersion[],
): Promise<PromptEnhancementResult> {
  const provider = getProvider();
  const env = getEnv();

  if (!env.llmEnabled || env.llmForceRuleMode || provider === "mock") {
    return { promptVersions, providerStatus: "mock" };
  }

  if (provider !== "deepseek") {
    return {
      promptVersions,
      providerStatus: "fallback",
      providerMessage: `${provider} 暂未接入，已使用规则模式。`,
    };
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return {
      promptVersions,
      providerStatus: "fallback",
      providerMessage: "未配置 DeepSeek API Key，已使用规则模式。",
    };
  }

  for (let attempt = 0; attempt <= env.llmMaxRetries; attempt += 1) {
    try {
      const enhancedVersions = await Promise.all(
        promptVersions.map(async (version) => {
          const content = await generateWithDeepSeek(buildEnhancementInstruction(version.content));
          if (!isUsableEnhancement(version.content, content)) {
            throw new Error("DeepSeek returned an incomplete prompt enhancement.");
          }
          return { ...version, content };
        }),
      );
      return { promptVersions: enhancedVersions, providerStatus: "deepseek" };
    } catch (enhanceError) {
      console.warn(JSON.stringify({
        event: "llm_enhancement_fallback",
        attempt,
        error: enhanceError instanceof Error ? enhanceError.message : String(enhanceError),
        timestamp: new Date().toISOString(),
      }));
      // Retry once at most, then keep the rule-generated prompts.
    }
  }

  {
    return {
      promptVersions,
      providerStatus: "fallback",
      providerMessage: "DeepSeek 增强失败，已使用规则模式结果。",
    };
  }
}
