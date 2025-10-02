# Claude Code Remote - Quick Reference Card

## 🚀 Quick Start

```bash
# Clone and deploy in 3 commands
git clone https://github.com/LCYLYM/Claude-Code-Remote.git
cd Claude-Code-Remote
./quick-start-telegram.sh
```

## 📋 Essential Commands

### Setup & Configuration
```bash
./deploy.sh                    # Interactive deployment menu
./quick-start-telegram.sh      # One-click Telegram setup
npm install                    # Install dependencies
npm run test:setup             # Validate configuration
```

### Running Services
```bash
npm run telegram               # Start Telegram webhook
npm run webhooks               # Start all enabled platforms
npm run daemon:start           # Start email daemon
./start.sh                     # Quick start (Telegram)
```

### Testing
```bash
node claude-hook-notify.js completed  # Test "completed" notification
node claude-hook-notify.js waiting    # Test "waiting" notification
npm run test:setup                    # Run setup validation
```

### Claude Integration
```bash
# Start Claude with hooks in tmux
tmux new-session -s claude-code
export CLAUDE_HOOKS_CONFIG=$(pwd)/claude-hooks.json
claude
```

## 📝 Configuration Quick Reference

### Required .env Variables (Telegram)
```env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-chat-id>
```

### Optional .env Variables
```env
TELEGRAM_WEBHOOK_URL=https://your-url.ngrok-free.app
TELEGRAM_WHITELIST=123456789,987654321
TELEGRAM_FORCE_IPV4=true
LOG_LEVEL=debug
```

## 🤖 Telegram Bot Commands

### In Telegram
```
/start                           # Welcome message
/help                            # Show help
/cmd TOKEN123 <command>          # Send command
TOKEN123 <command>               # Alternative format (no /cmd)
```

### Command Examples
```
/cmd ABC12345 请分析这段代码的性能
/cmd ABC12345 list files in current directory
ABC12345 请优化这个函数
```

## 🔧 Troubleshooting

### Bot Not Sending Messages
```bash
# 1. Check bot token
grep TELEGRAM_BOT_TOKEN .env

# 2. Check chat ID
grep TELEGRAM_CHAT_ID .env

# 3. Send /start to your bot in Telegram
```

### Cannot Receive Commands
```bash
# 1. Check webhook is set
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# 2. Verify ngrok is running
curl http://localhost:4040/api/tunnels

# 3. Check webhook server logs
npm run telegram
```

### Dependencies Missing
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📁 File Structure

```
Claude-Code-Remote/
├── quick-start-telegram.sh      # One-click setup
├── deploy.sh                    # Unified deployment
├── start.sh                     # Quick start (auto-generated)
├── .env                         # Your configuration
├── .env.example                 # Configuration template
├── claude-hooks.json            # Claude hooks config
├── claude-hook-notify.js        # Notification script
├── start-telegram-webhook.js    # Telegram webhook server
├── test-setup-flow.js          # Setup validation
├── src/
│   ├── channels/
│   │   └── telegram/
│   │       ├── telegram.js     # Telegram channel
│   │       └── webhook.js      # Webhook handler
│   └── data/
│       └── sessions/           # Session storage
└── docs/
    ├── README.md               # Main documentation
    ├── TELEGRAM_QUICKSTART.md  # 5-min guide
    ├── GETTING_STARTED_CN.md   # Chinese guide
    └── DEPLOYMENT_SUMMARY.md   # Technical details
```

## 🔑 Getting Credentials

### Telegram Bot Token
1. Search **@BotFather** in Telegram
2. Send `/newbot`
3. Follow prompts
4. Copy token: `1234567890:ABCdef...`

### Telegram Chat ID
1. Search **@userinfobot** in Telegram
2. Send any message
3. Copy ID: `123456789`

### ngrok URL (Optional)
1. Install ngrok: https://ngrok.com/
2. Run: `ngrok http 3001`
3. Copy HTTPS URL: `https://abc123.ngrok-free.app`

## 📊 System Status Check

```bash
# Check if webhook server is running
ps aux | grep start-telegram-webhook

# Check tmux sessions
tmux list-sessions

# Check webhook status
curl http://localhost:3001/health

# Check Telegram API connection
curl https://api.telegram.org/bot<TOKEN>/getMe
```

## 🔄 Common Workflows

### First Time Setup
```bash
1. ./quick-start-telegram.sh
2. Edit .env with credentials
3. npm run telegram
4. node claude-hook-notify.js completed
5. Check Telegram for notification
```

### Daily Usage
```bash
1. tmux attach -t claude-code  (or create new)
2. export CLAUDE_HOOKS_CONFIG=$(pwd)/claude-hooks.json
3. claude
4. Work with Claude
5. Receive notifications in Telegram
6. Reply with commands
```

### Updating Configuration
```bash
1. nano .env
2. Make changes
3. Ctrl+C to stop webhook server
4. npm run telegram to restart
```

## 🆘 Quick Help

| Issue | Solution |
|-------|----------|
| Can't install deps | `npm install --force` |
| Bot not responding | Check TELEGRAM_BOT_TOKEN |
| No notifications | Check webhook server is running |
| Token expired | Wait for new notification (24h) |
| Network error | Try TELEGRAM_FORCE_IPV4=true |
| Port in use | Change TELEGRAM_WEBHOOK_PORT |

## 📞 Support Links

- 📚 Full Documentation: [README.md](README.md)
- 🚀 Quick Start: [TELEGRAM_QUICKSTART.md](TELEGRAM_QUICKSTART.md)
- 🇨🇳 中文指南: [GETTING_STARTED_CN.md](GETTING_STARTED_CN.md)
- 🐛 Issues: https://github.com/LCYLYM/Claude-Code-Remote/issues

## 💡 Tips

- Keep ngrok running in a separate terminal
- Use tmux for persistent sessions
- Check logs when troubleshooting
- Test with `node claude-hook-notify.js completed` first
- Configure whitelist for security
- Tokens expire after 24 hours

---

**Version**: 1.0.0 | **Last Updated**: 2025-10-02
