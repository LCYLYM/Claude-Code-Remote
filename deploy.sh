#!/bin/bash

###############################################################################
# Claude Code Remote - Complete Deployment Script
# 完整部署脚本
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  Claude Code Remote - Complete Deployment                          ║"
echo "║  Claude Code Remote - 完整部署                                      ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Show menu
echo "Choose deployment method / 选择部署方式:"
echo ""
echo "1. 🚀 One-Click Telegram Setup (Recommended)"
echo "   一键 Telegram 部署（推荐）"
echo ""
echo "2. 📧 Email Setup"
echo "   邮件部署"
echo ""
echo "3. 💬 Multi-Platform Setup (Telegram + Email + LINE)"
echo "   多平台部署（Telegram + 邮件 + LINE）"
echo ""
echo "4. 🧪 Test Current Setup"
echo "   测试当前配置"
echo ""
echo "5. ❌ Exit"
echo "   退出"
echo ""

read -p "Enter your choice (1-5) / 输入选项 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting One-Click Telegram Setup..."
        echo "🚀 开始一键 Telegram 部署..."
        echo ""
        chmod +x quick-start-telegram.sh
        ./quick-start-telegram.sh
        ;;
    
    2)
        echo ""
        echo "📧 Email setup requires manual configuration..."
        echo "📧 邮件部署需要手动配置..."
        echo ""
        
        if [ ! -f ".env" ]; then
            echo "Creating .env from template..."
            cp .env.example .env
        fi
        
        echo "Please edit .env and configure email settings:"
        echo "请编辑 .env 文件并配置邮件设置："
        echo ""
        echo "Required settings / 必需设置:"
        echo "  - EMAIL_ENABLED=true"
        echo "  - SMTP_USER=your-email@gmail.com"
        echo "  - SMTP_PASS=your-app-password"
        echo "  - EMAIL_TO=notification-email@gmail.com"
        echo ""
        
        read -p "Press Enter to edit .env file / 按回车编辑 .env 文件..." dummy
        ${EDITOR:-nano} .env
        
        echo ""
        echo "✅ Configuration updated!"
        echo "✅ 配置已更新！"
        echo ""
        echo "Start email daemon with: npm run daemon:start"
        echo "启动邮件守护进程: npm run daemon:start"
        ;;
    
    3)
        echo ""
        echo "💬 Multi-Platform Setup..."
        echo "💬 多平台部署..."
        echo ""
        
        if [ ! -f ".env" ]; then
            echo "Creating .env from template..."
            cp .env.example .env
        fi
        
        echo "Please configure all platforms in .env file:"
        echo "请在 .env 文件中配置所有平台："
        echo ""
        echo "Telegram:"
        echo "  - TELEGRAM_ENABLED=true"
        echo "  - TELEGRAM_BOT_TOKEN=..."
        echo "  - TELEGRAM_CHAT_ID=..."
        echo ""
        echo "Email:"
        echo "  - EMAIL_ENABLED=true"
        echo "  - SMTP_USER=..."
        echo "  - EMAIL_TO=..."
        echo ""
        echo "LINE:"
        echo "  - LINE_ENABLED=true"
        echo "  - LINE_CHANNEL_ACCESS_TOKEN=..."
        echo ""
        
        read -p "Press Enter to edit .env file / 按回车编辑 .env 文件..." dummy
        ${EDITOR:-nano} .env
        
        echo ""
        echo "✅ Configuration updated!"
        echo "✅ 配置已更新！"
        echo ""
        echo "Start all webhooks with: npm run webhooks"
        echo "启动所有 webhook: npm run webhooks"
        ;;
    
    4)
        echo ""
        echo "🧪 Testing current setup..."
        echo "🧪 测试当前配置..."
        echo ""
        
        if [ ! -f ".env" ]; then
            echo "❌ .env file not found!"
            echo "❌ 未找到 .env 文件！"
            echo ""
            echo "Please run setup first:"
            echo "请先运行部署脚本："
            echo "  ./deploy.sh"
            exit 1
        fi
        
        # Run setup validation
        echo "Running setup validation tests..."
        echo "运行配置验证测试..."
        echo ""
        node test-setup-flow.js
        
        echo ""
        echo "Testing notification..."
        echo "测试通知..."
        echo ""
        node claude-hook-notify.js completed
        ;;
    
    5)
        echo ""
        echo "👋 Goodbye! / 再见！"
        exit 0
        ;;
    
    *)
        echo ""
        echo "❌ Invalid choice / 无效选项"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Deployment complete! / 部署完成！"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation / 文档:"
echo "  - English: README.md, TELEGRAM_QUICKSTART.md"
echo "  - 中文: GETTING_STARTED_CN.md"
echo ""
echo "🆘 Need help? / 需要帮助？"
echo "  - GitHub Issues: https://github.com/LCYLYM/Claude-Code-Remote/issues"
echo ""
