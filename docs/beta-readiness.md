# v0.4.1 内测就绪说明

当前版本适合 10–30 人单团队内测，不适合公开收费商用。自动测试覆盖四个 API、规则与模型降级、内存限流和 Redis REST 模拟响应；前端复制、localStorage 异常和实际浏览器流程仍需人工检查。

`RATE_LIMIT_STORE=memory` 仅用于本地、测试或单实例内测。`RATE_LIMIT_STORE=redis` 仅支持 Redis REST-compatible HTTP 服务，不支持任意 `redis://` 原生连接。Redis 使用 `INCR`、`TTL` 和首次计数后的 `EXPIRE`；它是分步 REST 调用，首次并发写入时存在短暂竞态，策略是保守地补设过期时间而不虚称完全原子。

Redis 失败时，`fallback-memory` 会记录结构化警告、切换内存限流并让健康检查显示 `degraded`；`deny` 会阻断 `/api/generate` 和 `/api/feedback`，返回带 `requestId` 的 `503`。所有 API 错误都包含 `requestId`；限流错误还包含 `retryAfter` 与 `Retry-After`。

不保存用户完整输入、完整生成 Prompt、原始 IP 或原始匿名客户端 ID。匿名标识只在服务端加盐哈希后用于限流；生产环境应配置 `ANONYMIZATION_SALT`。启用 DeepSeek 时，待增强 Prompt 会发送至模型服务。
