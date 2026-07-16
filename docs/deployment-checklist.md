# 部署检查清单

- 运行 `npm test`、`npm run lint`、`npm run build` 与 `npm audit`。
- 生产环境配置 `ANONYMIZATION_SALT`。`LLM_PROVIDER` 可为 `mock` 或 `deepseek`；未配置 DeepSeek key 时自动使用规则结果。
- 单实例内测可用 `RATE_LIMIT_STORE=memory`；多实例使用 Redis REST-compatible HTTP 服务，并配置 URL、token、超时与 `RATE_LIMIT_FAILURE_MODE`。
- `fallback-memory` 会降级，`deny` 会令生成和反馈返回 `503`。检查 `/api/health` 不泄露密钥。
- 环境变量：`APP_VERSION`（版本）；`LLM_ENABLED`、`LLM_FORCE_RULE_MODE`、`LLM_TIMEOUT_MS`、`LLM_MAX_RETRIES`（模型控制）；`DEEPSEEK_*`（仅服务端）；`RATE_LIMIT_*`（限流）；`ANONYMIZATION_SALT`（仅服务端）；`FEEDBACK_MAX_LENGTH`（反馈长度）。默认值见 `.env.example`。
