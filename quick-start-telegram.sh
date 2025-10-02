#!/bin/bash

###############################################################################
# Claude Code Remote - One-Click Telegram Deployment
# 一键部署 Telegram 通知系统
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  Claude Code Remote - Telegram 一键部署                            ║"
echo "║  One-Click Telegram Deployment                                      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Get absolute project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 项目目录 / Project Directory: $PROJECT_DIR"
echo ""

# Step 1: Check Node.js and npm
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [1/7] 检查环境 / Checking Environment...                        │"
echo "└─────────────────────────────────────────────────────────────────┘"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装 / Node.js is not installed"
    echo "请安装 Node.js 14+ / Please install Node.js 14+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装 / npm is not installed"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $(npm -v)"
echo ""

# Step 2: Install dependencies
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [2/7] 安装依赖 / Installing Dependencies...                     │"
echo "└─────────────────────────────────────────────────────────────────┘"

cd "$PROJECT_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖包..."
    npm install --prefer-offline --no-audit 2>&1 | grep -v "npm WARN" || true
    echo "✅ 依赖安装完成 / Dependencies installed"
else
    echo "✅ 依赖已存在 / Dependencies already installed"
fi
echo ""

# Step 3: Create/Check .env file
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [3/7] 配置环境变量 / Configuring Environment...                 │"
echo "└─────────────────────────────────────────────────────────────────┘"

if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "📝 创建 .env 文件 / Creating .env file..."
    cat > "$PROJECT_DIR/.env" << 'EOF'
# Claude Code Remote - Telegram Configuration
# Telegram 配置文件

# ===== Telegram Bot Configuration =====
# 从 @BotFather 获取 / Get from @BotFather
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=

# 你的 Telegram Chat ID / Your Telegram Chat ID
# 从 @userinfobot 获取 / Get from @userinfobot
TELEGRAM_CHAT_ID=

# Telegram 白名单（可选）/ Whitelist (optional)
# TELEGRAM_WHITELIST=

# Webhook 配置 / Webhook Configuration
TELEGRAM_WEBHOOK_PORT=3001
TELEGRAM_WEBHOOK_URL=

# 强制使用 IPv4（可选）/ Force IPv4 (optional)
# TELEGRAM_FORCE_IPV4=false

# ===== System Configuration =====
SESSION_MAP_PATH=/tmp/claude-remote-sessions
INJECTION_MODE=tmux
CLAUDE_CLI_PATH=claude
LOG_LEVEL=info
PTY_OUTPUT_LOG=false

# ===== Timeout Configuration =====
COMMAND_TIMEOUT=10000
NOTIFICATION_TIMEOUT=3000
NOTIFICATION_DISPLAY_TIME=10000
CHECK_INTERVAL=20
SESSION_TIMEOUT=24

# ===== Other Platforms (Disabled) =====
EMAIL_ENABLED=false
LINE_ENABLED=false
DESKTOP_ENABLED=false
EOF
    echo "✅ .env 文件已创建 / .env file created"
    echo ""
    echo "⚠️  请编辑 .env 文件并填入以下信息："
    echo "⚠️  Please edit .env file and fill in:"
    echo "   - TELEGRAM_BOT_TOKEN (从 @BotFather 获取)"
    echo "   - TELEGRAM_CHAT_ID (从 @userinfobot 获取)"
    echo "   - TELEGRAM_WEBHOOK_URL (你的公网 URL，例如 ngrok)"
    echo ""
    echo "按 Enter 继续编辑 .env 文件..."
    read -r
    ${EDITOR:-nano} "$PROJECT_DIR/.env"
else
    echo "✅ .env 文件已存在 / .env file exists"
fi
echo ""

# Step 4: Validate .env configuration
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [4/7] 验证配置 / Validating Configuration...                    │"
echo "└─────────────────────────────────────────────────────────────────┘"

# Load .env
set -a
source "$PROJECT_DIR/.env"
set +a

MISSING_CONFIG=false

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN 未配置"
    MISSING_CONFIG=true
fi

if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ TELEGRAM_CHAT_ID 未配置"
    MISSING_CONFIG=true
fi

if [ -z "$TELEGRAM_WEBHOOK_URL" ]; then
    echo "⚠️  TELEGRAM_WEBHOOK_URL 未配置（稍后手动设置）"
fi

if [ "$MISSING_CONFIG" = true ]; then
    echo ""
    echo "❌ 配置不完整，请编辑 .env 文件"
    echo "❌ Configuration incomplete, please edit .env file"
    exit 1
fi

echo "✅ 配置验证通过 / Configuration validated"
echo "   - Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}..."
echo "   - Chat ID: $TELEGRAM_CHAT_ID"
echo "   - Webhook Port: ${TELEGRAM_WEBHOOK_PORT:-3001}"
echo ""

# Step 5: Create necessary directories
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [5/7] 创建目录 / Creating Directories...                        │"
echo "└─────────────────────────────────────────────────────────────────┘"

mkdir -p "$PROJECT_DIR/src/data"
mkdir -p "$PROJECT_DIR/src/data/sessions"
mkdir -p "/tmp/claude-remote-sessions"

echo "✅ 目录创建完成 / Directories created"
echo ""

# Step 6: Create claude-hooks.json
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [6/7] 配置 Claude Hooks / Configuring Claude Hooks...          │"
echo "└─────────────────────────────────────────────────────────────────┘"

if [ ! -f "$PROJECT_DIR/claude-hooks.json" ]; then
    cat > "$PROJECT_DIR/claude-hooks.json" << EOF
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node $PROJECT_DIR/claude-hook-notify.js completed",
        "timeout": 5
      }]
    }],
    "SubagentStop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node $PROJECT_DIR/claude-hook-notify.js waiting",
        "timeout": 5
      }]
    }]
  }
}
EOF
    echo "✅ claude-hooks.json 已创建"
else
    echo "✅ claude-hooks.json 已存在"
fi
echo ""

# Step 7: Setup complete
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ [7/7] 设置完成 / Setup Complete!                                │"
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  下一步操作 / Next Steps:                                          ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$TELEGRAM_WEBHOOK_URL" ]; then
    echo "📝 [可选] 设置 Webhook (使用 ngrok 或其他工具):"
    echo "   1. 在新终端运行: ngrok http ${TELEGRAM_WEBHOOK_PORT:-3001}"
    echo "   2. 复制 ngrok 提供的 HTTPS URL"
    echo "   3. 更新 .env 中的 TELEGRAM_WEBHOOK_URL"
    echo ""
fi

echo "🚀 启动 Telegram Webhook 服务器:"
echo "   npm run telegram"
echo "   或"
echo "   node start-telegram-webhook.js"
echo ""

echo "🖥️  在 tmux 中启动 Claude (可选，用于命令注入):"
echo "   tmux new-session -s claude-code"
echo "   export CLAUDE_HOOKS_CONFIG=$PROJECT_DIR/claude-hooks.json"
echo "   claude"
echo ""

echo "🧪 测试通知:"
echo "   node claude-hook-notify.js completed"
echo ""

echo "📚 获取帮助:"
echo "   - README.md: 完整文档"
echo "   - 在 Telegram 中向 bot 发送 /help"
echo ""

# Create a convenience script
cat > "$PROJECT_DIR/start.sh" << 'STARTEOF'
#!/bin/bash
# Quick start script
cd "$(dirname "$0")"
echo "🚀 Starting Telegram Webhook Server..."
node start-telegram-webhook.js
STARTEOF

chmod +x "$PROJECT_DIR/start.sh"

echo "💡 提示: 运行 ./start.sh 快速启动服务"
echo "💡 Tip: Run ./start.sh to quickly start the service"
echo ""

echo "✅ 一键部署完成！/ One-click deployment complete!"
