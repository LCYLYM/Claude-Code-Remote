#!/usr/bin/env node

/**
 * Telegram Webhook Server
 * Starts the Telegram webhook server for receiving messages
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Logger = require('./src/core/logger');
const TelegramWebhookHandler = require('./src/channels/telegram/webhook');

// Load environment variables
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('❌ .env file not found. Please run: ./quick-start-telegram.sh');
    console.error('❌ 未找到 .env 文件。请运行: ./quick-start-telegram.sh');
    process.exit(1);
}

// Ensure necessary directories exist
const sessionsDir = path.join(__dirname, 'src/data/sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

const dataDir = path.join(__dirname, 'src/data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const logger = new Logger('Telegram-Webhook-Server');

// Load configuration
const config = {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    groupId: process.env.TELEGRAM_GROUP_ID,
    whitelist: process.env.TELEGRAM_WHITELIST ? process.env.TELEGRAM_WHITELIST.split(',').map(id => id.trim()) : [],
    port: process.env.TELEGRAM_WEBHOOK_PORT || 3001,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL
};

// Validate configuration
if (!config.botToken) {
    logger.error('❌ TELEGRAM_BOT_TOKEN must be set in .env file');
    logger.error('❌ TELEGRAM_BOT_TOKEN 必须在 .env 文件中配置');
    logger.error('');
    logger.error('📝 Steps to configure / 配置步骤:');
    logger.error('1. Search @BotFather in Telegram / 在 Telegram 中搜索 @BotFather');
    logger.error('2. Send /newbot to create a bot / 发送 /newbot 创建 bot');
    logger.error('3. Copy the token to .env file / 复制 token 到 .env 文件');
    process.exit(1);
}

if (!config.chatId && !config.groupId) {
    logger.error('❌ Either TELEGRAM_CHAT_ID or TELEGRAM_GROUP_ID must be set in .env file');
    logger.error('❌ 必须配置 TELEGRAM_CHAT_ID 或 TELEGRAM_GROUP_ID');
    logger.error('');
    logger.error('📝 Steps to get Chat ID / 获取 Chat ID 步骤:');
    logger.error('1. Search @userinfobot in Telegram / 在 Telegram 中搜索 @userinfobot');
    logger.error('2. Send any message to get your ID / 发送任意消息获取你的 ID');
    logger.error('3. Copy the ID to .env file / 复制 ID 到 .env 文件');
    process.exit(1);
}

// Create and start webhook handler
const webhookHandler = new TelegramWebhookHandler(config);

async function start() {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  🚀 Starting Telegram Webhook Server                               ║');
    console.log('║  🚀 启动 Telegram Webhook 服务器                                   ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    logger.info('⚙️  Configuration / 配置:');
    logger.info(`   - Port: ${config.port}`);
    logger.info(`   - Chat ID: ${config.chatId || 'Not set'}`);
    logger.info(`   - Group ID: ${config.groupId || 'Not set'}`);
    logger.info(`   - Whitelist: ${config.whitelist.length > 0 ? config.whitelist.join(', ') : 'None (using configured IDs)'}`);
    logger.info('');
    
    // Set webhook if URL is provided
    if (config.webhookUrl) {
        try {
            const webhookEndpoint = `${config.webhookUrl}/webhook/telegram`;
            logger.info(`🔗 Setting webhook to: ${webhookEndpoint}`);
            await webhookHandler.setWebhook(webhookEndpoint);
            logger.info('✅ Webhook configured successfully! / Webhook 配置成功！');
        } catch (error) {
            logger.error('❌ Failed to set webhook:', error.message);
            logger.warn('');
            logger.warn('⚠️  You can manually set the webhook using:');
            logger.warn(`curl -X POST https://api.telegram.org/bot${config.botToken.substring(0, 10)}***/setWebhook -d "url=${config.webhookUrl}/webhook/telegram"`);
        }
    } else {
        logger.warn('⚠️  TELEGRAM_WEBHOOK_URL not set / 未设置 TELEGRAM_WEBHOOK_URL');
        logger.warn('');
        logger.warn('💡 To enable remote command injection / 启用远程命令注入:');
        logger.warn('   1. Run ngrok: ngrok http ' + config.port);
        logger.warn('   2. Copy the HTTPS URL from ngrok');
        logger.warn('   3. Add to .env: TELEGRAM_WEBHOOK_URL=https://your-url.ngrok-free.app');
        logger.warn('   4. Restart this server');
        logger.warn('');
        logger.warn('📝 Notifications will still work! / 通知功能仍然可用！');
    }
    
    logger.info('');
    webhookHandler.start(config.port);
    logger.info('');
    logger.info('✅ Server is running! / 服务器运行中！');
    logger.info('');
    logger.info('📋 Next steps / 下一步:');
    logger.info('   1. Test notification: node claude-hook-notify.js completed');
    logger.info('   2. Start Claude with hooks in tmux session');
    logger.info('   3. Send /start to your bot in Telegram');
    logger.info('');
}

start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down Telegram webhook server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down Telegram webhook server...');
    process.exit(0);
});