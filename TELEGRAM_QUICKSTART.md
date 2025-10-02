# Telegram 一键部署指南 / Telegram Quick Start Guide

## 🚀 5分钟完成部署 / 5-Minute Setup

### 前置要求 / Prerequisites
- Node.js 14+ 
- npm
- (可选) tmux (用于命令注入功能)

### 步骤 1: 创建 Telegram Bot

1. 在 Telegram 中搜索 **@BotFather**
2. 发送 `/newbot` 命令
3. 按提示设置 bot 名称
4. **保存** BotFather 返回的 Token (类似: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 步骤 2: 获取你的 Chat ID

1. 在 Telegram 中搜索 **@userinfobot**
2. 向它发送任意消息
3. **保存**返回的数字 ID (例如: `123456789`)

### 步骤 3: 一键部署

```bash
# 下载或克隆项目
git clone https://github.com/LCYLYM/Claude-Code-Remote.git
cd Claude-Code-Remote

# 运行一键部署脚本
chmod +x quick-start-telegram.sh
./quick-start-telegram.sh
```

脚本会：
- ✅ 检查环境
- ✅ 安装依赖
- ✅ 创建配置文件
- ✅ 提示你填入 Bot Token 和 Chat ID
- ✅ 创建必要的目录和文件

### 步骤 4: 配置 Webhook (可选但推荐)

如果你想远程控制 Claude，需要设置 webhook：

#### 使用 ngrok (推荐)

```bash
# 在新终端窗口运行
ngrok http 3001
```

复制 ngrok 提供的 HTTPS URL (例如: `https://abc123.ngrok-free.app`)，然后：

```bash
# 编辑 .env 文件
nano .env

# 更新这一行：
TELEGRAM_WEBHOOK_URL=https://abc123.ngrok-free.app
```

### 步骤 5: 启动服务

```bash
# 启动 Telegram webhook 服务器
npm run telegram

# 或
node start-telegram-webhook.js

# 或使用便捷脚本
./start.sh
```

### 步骤 6: 测试

```bash
# 在另一个终端测试通知
node claude-hook-notify.js completed
```

你应该会在 Telegram 收到通知！

## 🎯 与 Claude 集成 / Integration with Claude

### 方式 1: 使用 tmux (推荐用于命令注入)

```bash
# 创建 tmux 会话
tmux new-session -s claude-code

# 设置 hooks
export CLAUDE_HOOKS_CONFIG=$(pwd)/claude-hooks.json

# 启动 Claude
claude
```

### 方式 2: 手动触发

任何时候你想发送通知：

```bash
node claude-hook-notify.js completed
# 或
node claude-hook-notify.js waiting
```

## 💬 使用 Bot

### 接收通知

当 Claude 完成任务时，你会收到 Telegram 消息，包含：
- 📝 任务信息
- 🔑 Session Token (8位大写字母+数字)
- 💬 命令格式示例

### 发送命令回 Claude

收到通知后，在 Telegram 中回复：

```
/cmd TOKEN123 你的命令

例如：
/cmd ABC12345 请分析这段代码的性能
```

或者不用 `/cmd` 前缀：

```
TOKEN123 你的命令
```

## 🔧 故障排除 / Troubleshooting

### Bot 无法发送消息

1. 检查 `TELEGRAM_BOT_TOKEN` 是否正确
2. 检查 `TELEGRAM_CHAT_ID` 是否正确
3. 确保先向 bot 发送过 `/start` 命令

### 无法接收命令

1. 检查 webhook 是否设置成功
2. 确认 ngrok 正在运行
3. 查看服务器日志排查错误

### Token 过期

Token 默认 24 小时后过期，需要等待新的任务通知获取新 token。

## 📚 高级配置 / Advanced Configuration

### 强制使用 IPv4

如果网络环境下 IPv6 不稳定：

```bash
# 在 .env 中添加
TELEGRAM_FORCE_IPV4=true
```

### 配置白名单

限制哪些用户可以使用 bot：

```bash
# 在 .env 中添加（逗号分隔多个 ID）
TELEGRAM_WHITELIST=123456789,987654321
```

### 使用群组

将 bot 添加到群组并使用群组 ID：

```bash
# 在 .env 中
TELEGRAM_GROUP_ID=-1001234567890
```

## 🎉 完成！/ Done!

现在你可以：
- ✅ 在 Telegram 接收 Claude 任务通知
- ✅ 远程发送命令给 Claude
- ✅ 在任何地方控制你的 Claude 会话

需要帮助？在 Telegram 向 bot 发送 `/help` 命令！

## 🔗 相关链接 / Links

- [完整 README](README.md)
- [GitHub Issues](https://github.com/LCYLYM/Claude-Code-Remote/issues)
- [@BotFather](https://t.me/BotFather) - 创建 Telegram Bot
- [@userinfobot](https://t.me/userinfobot) - 获取 Chat ID
- [ngrok](https://ngrok.com/) - 内网穿透工具
