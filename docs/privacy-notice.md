# 内测隐私说明

服务端不会保存用户完整输入、完整生成 Prompt、原始 IP 或原始匿名客户端 ID，也不会将它们发送到 analytics。限流使用匿名标识的单向加盐哈希；浏览器历史仅保存在当前浏览器 localStorage。

日志可包含 requestId、路由、状态码、耗时、输入长度、任务类型和模型状态，不应包含密钥、Redis token、完整 Redis URL、原始身份、完整输入或 Prompt。

启用 DeepSeek 时，待润色 Prompt 会发送给模型服务。请不要提交敏感内容。本说明面向小范围内测，不是正式法律文件。
