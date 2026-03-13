# CloudBase AI 开发规则与 MCP 功能指南

本指南概述了如何利用 CloudBase MCP (Model Context Protocol) 工具集进行全栈应用与 AI 功能开发。

## 1. CloudBase MCP 功能概览

CloudBase MCP 提供了一套完整的工具链，允许 AI 助手直接与腾讯云开发环境交互。主要分为以下六大模块：

### 🔐 身份认证 (Auth)
*   **工具**: `mcp_cloudbase_auth`
*   **功能**:
    *   检查当前登录状态 (`status`)。
    *   执行登录/登出操作 (`login`, `logout`)。
    *   **AI 开发场景**: 确保 AI 在操作敏感资源前具备正确的权限身份。

### 🌍 环境与域名管理 (Environment)
*   **工具**: `mcp_cloudbase_envQuery`, `mcp_cloudbase_envDomainManagement`
*   **功能**:
    *   查询环境列表与详情 (`list`, `info`)。
    *   管理安全域名 (`create`, `delete`, `list`)。
    *   **AI 开发场景**: 快速配置 CORS 白名单（如 `localhost`），解决前端调试时的跨域问题。

### ⚡ 云函数管理 (Functions)
*   **工具**: `mcp_cloudbase_functionManagement`, `mcp_cloudbase_invokeFunction`
*   **功能**:
    *   **调用**: 直接触发云函数 (`invokeFunction`)，获取 AI 推理结果。
    *   **管理**: 创建 (`create`)、删除 (`delete`)、更新代码 (`updateCode`)、更新配置 (`updateConfig`)。
    *   **运维**: 查看列表 (`list`)、版本管理 (`listVersions`, `publishVersion`)、灰度发布 (`grayRelease`)。
    *   **AI 开发场景**: 将 LLM 调用逻辑（如调用 DeepSeek, Zhipu API）封装在云函数中，通过 MCP 部署和调试，保护 API Key 不泄露。

### 🗄️ 数据库操作 (Database)
*   **工具**: `mcp_cloudbase_database`
*   **功能**:
    *   **集合管理**: 创建/删除集合 (`addCollection`, `deleteCollection`)。
    *   **文档操作**: 增 (`add`)、删 (`delete`)、改 (`update`)、查 (`query`)。
    *   **高级查询**: 支持聚合管道 (`aggregate`)。
    *   **AI 开发场景**: 存储 AI 会话历史、用户偏好设置（Profile）、RAG 知识库索引数据。

### 📦 文件存储 (Storage)
*   **工具**: `mcp_cloudbase_fileStorage`
*   **功能**:
    *   上传文件 (`uploadFile`)、下载文件 (`downloadFile`)。
    *   管理文件元数据 (`getFileMeta`) 和删除文件 (`deleteFile`)。
    *   **AI 开发场景**: 存储用户上传的图片/文档（用于多模态分析）或生成的语音/视频文件。

### 🧩 数据模型 (Models)
*   **工具**: `mcp_cloudbase_model`
*   **功能**:
    *   管理低代码数据模型 (`list`, `info`, `build`)。
    *   **AI 开发场景**: 快速构建业务实体的结构化定义。

---

## 2. CloudBase AI 开发最佳实践规则

### 规则一：云端推理，前端展示
*   **原则**: 所有的 AI 模型调用（OpenAI, Zhipu, DeepSeek 等）**必须**封装在云函数中。
*   **原因**: 防止 API Key 在前端泄露；利用云端更稳定的网络环境；便于实施超时控制（如设置 60s 超时）。
*   **MCP 实践**: 使用 `updateCode` 部署含 API Key 的云函数，使用 `invokeFunction` 进行测试。

### 规则二：安全域名先行
*   **原则**: 本地开发（localhost）前，**必须**先将调试域名加入安全域名白名单。
*   **原因**: 浏览器端 SDK 调用云资源受 CORS 策略限制。
*   **MCP 实践**: 项目初始化时，调用 `envDomainManagement` 添加 `localhost:5173` 等地址。

### 规则三：配置与代码分离
*   **原则**: 敏感配置（如 API Key、超时时间）应通过环境变量或配置文件管理，不硬编码在逻辑中。
*   **MCP 实践**: 使用 `functionManagement` 的 `updateConfig` 接口独立更新环境变量（如 `ZHIPU_API_KEY`）和超时设置（如 `timeout: 60`）。

### 规则四：无状态与幂等
*   **原则**: 云函数应设计为无状态，依赖数据库或存储桶持久化数据。
*   **MCP 实践**: 对话历史存入 Database，函数只负责处理单次请求；生成的文件存入 FileStorage 并返回临时访问链接。

## 3. 常用 MCP 调用示例 (Prompt 参考)

*   **部署 AI 函数**: "帮我创建一个名为 `ai-chat` 的云函数，超时设置为 60秒，并部署当前目录下的代码。"
*   **配置环境**: "把 `localhost:3000` 添加到当前环境的安全域名里。"
*   **查询数据**: "查询 `users` 集合中 `nickname` 为 'Aaron' 的记录。"
*   **测试调用**: "调用 `ai-chat` 函数，参数是 `{ message: 'Hello' }`，看看返回什么。"
