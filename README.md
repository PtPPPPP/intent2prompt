# Intent2Prompt

Intent2Prompt 是面向中文学生创新场景的“意图到提示词编译器”。它把一句简短需求转换为意图分析、缺失信息、澄清问题、结构化 Prompt、三种可复制版本和质量评分。

## v0.4.1 Pilot Hardening 状态

v0.4.1 已加入统一 API 响应、匿名客户端哈希、内存与 Redis REST 兼容限流，以及 Redis 故障策略。它只适合 10–30 人的小范围内测，不适合公开收费商用。

- 成功和失败响应均包含 `requestId`；`429` 同时返回 `Retry-After` 和 `retryAfter`。
- `RATE_LIMIT_STORE=memory` 仅适用于本地、测试或单实例内测；多实例请使用 Redis REST-compatible HTTP 服务。
- Redis 故障时，`fallback-memory` 会切换到内存限流并使健康检查显示降级；`deny` 会让生成和反馈接口返回 `503`。
- 不记录用户完整输入、完整 Prompt、原始 IP 或原始匿名客户端 ID。启用 DeepSeek 时，待润色 Prompt 会发送给该模型服务。

当前版本是可控内测版，不是完整商用产品。

- 默认使用规则、模板和 mock 链路，不需要 API Key 即可完整演示。
- 可选启用 DeepSeek，对规则链路生成的三份 Prompt 做润色增强。
- DeepSeek 不接管意图识别、评分或整体系统；模型未配置或调用失败时，会自动返回原始规则结果。
- 当前没有账号、支付、订阅、云端历史记录或服务端数据库。
- 请不要输入敏感个人信息、账号密码、未公开资料或商业机密。

详细边界、部署说明和依赖风险见 [v0.3 Beta 说明](docs/beta-readiness.md)。

## 快速开始

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。

## 可选启用 DeepSeek

复制配置模板：

```bash
copy .env.example .env.local
```

默认配置如下，保持该配置即可运行规则模式：

```env
LLM_PROVIDER=mock
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

如需使用增强模式，将 `LLM_PROVIDER` 改为 `deepseek` 并填入 `DEEPSEEK_API_KEY`。系统只在已有规则结果的基础上润色 Prompt；未配置 Key、网络异常或模型返回异常时，前端会显示已降级为规则模式，接口仍返回可用结果。

不要将 `.env.local` 或 API Key 提交到仓库。

## 核心流程

```text
用户短意图
  -> 意图分析
  -> 缺失信息检测
  -> 最多 3 个澄清问题
  -> 结构化 Prompt
  -> 三种 Prompt 版本
  -> 规则评分
  -> 可选 DeepSeek 润色
```

## API

`POST /api/generate`

```json
{
  "input": "帮我设计一个大学生 AI 使用情况调查问卷"
}
```

也兼容旧字段 `intent`。输入去除首尾空白后必须为 1–1000 个字符；无效输入返回 `400`。

响应包含原有生成结果，以及：

```ts
providerStatus: "mock" | "deepseek" | "fallback"
providerMessage?: string
```

`fallback` 表示 DeepSeek 不可用，结果已安全降级为规则模式。

## 验证命令

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## 商用前仍需补齐

- 登录与身份体系
- 服务端用量控制与限流
- 支付和订阅
- 服务端存储与备份
- 正式隐私政策
- 监控告警与安全审计

## 许可证

[MIT](LICENSE)
