# Claude Code Remote - 完整入门指南

## 🎯 这是什么？

Claude Code Remote 让你可以在任何地方通过 Telegram 远程控制 Claude Code：
- 📱 在手机上收到 Claude 任务完成通知
- 💬 直接在 Telegram 回复发送新命令
- 🌍 随时随地控制你的开发环境
- 🔒 安全的白名单验证机制

## 📋 前置条件

1. **Node.js** - 版本 14 或更高
   ```bash
   node --version  # 检查版本
   ```

2. **Telegram 账号** - 需要创建一个 Bot

3. **（可选）tmux** - 用于命令注入功能
   ```bash
   # macOS
   brew install tmux
   
   # Ubuntu/Debian
   apt install tmux
   ```

4. **（可选）ngrok** - 用于远程命令功能
   - 访问 https://ngrok.com/ 注册账号
   - 下载并安装 ngrok

## 🚀 一键部署

### 步骤 1: 下载项目

```bash
git clone https://github.com/LCYLYM/Claude-Code-Remote.git
cd Claude-Code-Remote
```

### 步骤 2: 运行一键部署脚本

```bash
chmod +x quick-start-telegram.sh
./quick-start-telegram.sh
```

脚本会自动：
- ✅ 检查你的 Node.js 环境
- ✅ 安装所有需要的依赖包
- ✅ 创建配置文件 (.env)
- ✅ 提示你填入 Telegram 配置
- ✅ 创建必要的目录
- ✅ 配置 Claude hooks

### 步骤 3: 获取 Telegram Bot Token

1. 在 Telegram 中搜索 **@BotFather**
2. 发送命令: `/newbot`
3. 按照提示设置 bot 名称（例如：My Claude Bot）
4. 设置 bot 用户名（必须以 bot 结尾，例如：my_claude_bot）
5. **保存** BotFather 返回的 Token

示例 Token：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 步骤 4: 获取你的 Chat ID

1. 在 Telegram 中搜索 **@userinfobot**
2. 向它发送任意消息
3. **保存**返回的 ID 号码（例如：`123456789`）

### 步骤 5: 配置 .env 文件

脚本会自动打开编辑器让你填入配置。如果需要手动编辑：

```bash
nano .env
```

必填项：
```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=你的Bot Token
TELEGRAM_CHAT_ID=你的Chat ID
```

可选项（用于远程命令）：
```env
TELEGRAM_WEBHOOK_URL=https://你的ngrok地址.ngrok-free.app
```

### 步骤 6: 启动服务

```bash
# 启动 Telegram webhook 服务器
npm run telegram

# 或者
node start-telegram-webhook.js

# 或者使用快捷脚本
./start.sh
```

你应该看到：
```
╔════════════════════════════════════════════════════════════════════╗
║  🚀 Starting Telegram Webhook Server                               ║
║  🚀 启动 Telegram Webhook 服务器                                   ║
╚════════════════════════════════════════════════════════════════════╝

✅ Server is running! / 服务器运行中！
```

### 步骤 7: 测试通知

在另一个终端窗口：

```bash
node claude-hook-notify.js completed
```

你应该会在 Telegram 收到一条测试通知！🎉

## 🔧 配置 Webhook（可选）

如果你想从 Telegram 发送命令回 Claude，需要配置 webhook：

### 使用 ngrok

1. **安装并启动 ngrok**
   ```bash
   # 在新终端窗口运行
   ngrok http 3001
   ```

2. **复制 HTTPS URL**
   
   ngrok 会显示类似这样的信息：
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
   ```
   
   复制 `https://abc123.ngrok-free.app` 这个地址

3. **更新 .env 文件**
   ```bash
   nano .env
   ```
   
   添加或修改：
   ```env
   TELEGRAM_WEBHOOK_URL=https://abc123.ngrok-free.app
   ```

4. **重启 webhook 服务器**
   ```bash
   # 按 Ctrl+C 停止当前服务
   # 然后重新启动
   npm run telegram
   ```

## 🖥️ 与 Claude 集成

### 方法 1: 使用 tmux（推荐）

tmux 可以让系统自动注入命令到 Claude 会话：

```bash
# 1. 创建 tmux 会话
tmux new-session -s claude-code

# 2. 设置 hooks
export CLAUDE_HOOKS_CONFIG=$(pwd)/claude-hooks.json

# 3. 启动 Claude
claude
```

现在当 Claude 完成任务时，会自动发送 Telegram 通知！

### 方法 2: 手动触发通知

不使用 tmux 也可以，只需要在需要时手动运行：

```bash
node claude-hook-notify.js completed   # 任务完成通知
node claude-hook-notify.js waiting     # 等待输入通知
```

## 💬 使用 Bot

### 接收通知

当 Claude 完成任务时，你会收到这样的消息：

```
✅ Claude Task Completed
Project: your-project
Session Token: ABC12345

📝 Your Question:
请帮我分析这段代码...

🤖 Claude Response:
我已经分析了代码，发现...

💬 To send a new command:
Reply with: /cmd ABC12345 <your command>
Example: /cmd ABC12345 Please analyze this code
```

### 发送命令

有两种方式发送命令：

**方式 1: 使用 /cmd 命令**
```
/cmd ABC12345 请帮我优化这段代码
```

**方式 2: 直接输入（不带 /cmd）**
```
ABC12345 请帮我优化这段代码
```

### 其他命令

- `/start` - 显示欢迎消息
- `/help` - 显示帮助信息

## 🔍 故障排查

### Bot 无法发送消息

**问题**: 收不到 Telegram 通知

**解决方案**:
1. 检查 `TELEGRAM_BOT_TOKEN` 是否正确
2. 检查 `TELEGRAM_CHAT_ID` 是否正确
3. 确保先向 bot 发送过 `/start` 命令
4. 检查 webhook 服务器是否正在运行

### 无法接收远程命令

**问题**: 在 Telegram 发送命令后没有反应

**解决方案**:
1. 确认 webhook URL 已配置
2. 确认 ngrok 正在运行
3. 检查 webhook 服务器日志
4. 确认 tmux 会话名称正确

### Token 过期

**问题**: 显示 "Token has expired"

**解决方案**:
Token 默认 24 小时后过期。等待下一次任务完成获取新 token。

### 网络连接问题

**问题**: "getaddrinfo ENOTFOUND api.telegram.org"

**解决方案**:
1. 检查网络连接
2. 如果在中国大陆，可能需要使用代理
3. 尝试设置 `TELEGRAM_FORCE_IPV4=true`

## 📚 高级配置

### 配置白名单

限制哪些用户可以使用你的 bot：

```env
TELEGRAM_WHITELIST=123456789,987654321
```

### 使用群组

将 bot 添加到 Telegram 群组：

1. 将 bot 添加到群组
2. 获取群组 ID（通常是负数）
3. 配置：
   ```env
   TELEGRAM_GROUP_ID=-1001234567890
   ```

### 强制使用 IPv4

如果 IPv6 不稳定：

```env
TELEGRAM_FORCE_IPV4=true
```

### 调整日志级别

```env
LOG_LEVEL=debug  # debug, info, warn, error
```

## 🎓 使用场景示例

### 场景 1: 远程代码审查

1. 在办公室启动 Claude 进行代码审查
2. 回家后收到 Telegram 通知
3. 直接在手机上查看结果
4. 通过 Telegram 发送下一步指令

### 场景 2: 长时间运行任务

1. 启动一个耗时的分析任务
2. 离开电脑去做其他事情
3. 任务完成时收到通知
4. 远程查看结果并发送新任务

### 场景 3: 团队协作

1. 在群组中添加 bot
2. 团队成员都能收到通知
3. 任何成员都可以发送命令
4. 集中管理开发任务

## 🔐 安全建议

1. **不要分享** Bot Token - 这是机密信息
2. **使用白名单** - 限制谁可以使用 bot
3. **定期更新** - 保持依赖包最新
4. **审查日志** - 定期检查访问日志

## 📞 获取帮助

- **查看完整文档**: [README.md](README.md)
- **报告问题**: [GitHub Issues](https://github.com/LCYLYM/Claude-Code-Remote/issues)
- **快速指南**: [TELEGRAM_QUICKSTART.md](TELEGRAM_QUICKSTART.md)

## 🎉 完成！

现在你已经成功设置了 Claude Code Remote！享受远程控制 Claude 的便利吧！

**下一步**:
- 尝试在不同场景下使用
- 配置更多高级选项
- 加入 Telegram 群组进行团队协作

祝使用愉快！🚀
