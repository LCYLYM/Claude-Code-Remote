#!/usr/bin/env node

/**
 * Claude Hook Notification Script
 * Called by Claude Code hooks to send Telegram notifications
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from the project directory
const projectDir = path.dirname(__filename);
const envPath = path.join(projectDir, '.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('❌ .env file not found / 未找到 .env 文件');
    console.error('📝 Please run: ./quick-start-telegram.sh');
    console.error('📝 请运行: ./quick-start-telegram.sh');
    process.exit(1);
}

// Ensure necessary directories exist
const dataDir = path.join(projectDir, 'src/data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const sessionsDir = path.join(projectDir, 'src/data/sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Lazy load channels only when needed
let TelegramChannel = null;
let DesktopChannel = null;
let EmailChannel = null;

async function sendHookNotification() {
    try {
        // Get notification type from command line argument
        const notificationType = process.argv[2] || 'completed';
        
        console.log('╔════════════════════════════════════════════════════════════════════╗');
        console.log(`║  🔔 Sending ${notificationType.toUpperCase()} Notification                        ║`);
        console.log('╚════════════════════════════════════════════════════════════════════╝');
        console.log('');
        
        const channels = [];
        const results = [];
        
        // Configure Desktop channel (only if explicitly enabled)
        if (process.env.DESKTOP_ENABLED === 'true') {
            if (!DesktopChannel) {
                DesktopChannel = require('./src/channels/local/desktop');
            }
            const desktopChannel = new DesktopChannel({
                completedSound: 'Glass',
                waitingSound: 'Tink'
            });
            channels.push({ name: 'Desktop', channel: desktopChannel });
        }
        
        // Configure Telegram channel if enabled
        if (process.env.TELEGRAM_ENABLED === 'true' && process.env.TELEGRAM_BOT_TOKEN) {
            if (!TelegramChannel) {
                TelegramChannel = require('./src/channels/telegram/telegram');
            }
            
            const telegramConfig = {
                botToken: process.env.TELEGRAM_BOT_TOKEN,
                chatId: process.env.TELEGRAM_CHAT_ID,
                groupId: process.env.TELEGRAM_GROUP_ID,
                forceIPv4: process.env.TELEGRAM_FORCE_IPV4 === 'true'
            };
            
            if (telegramConfig.botToken && (telegramConfig.chatId || telegramConfig.groupId)) {
                const telegramChannel = new TelegramChannel(telegramConfig);
                channels.push({ name: 'Telegram', channel: telegramChannel });
            }
        }
        
        // Configure Email channel if enabled
        if (process.env.EMAIL_ENABLED === 'true' && process.env.SMTP_USER) {
            if (!EmailChannel) {
                EmailChannel = require('./src/channels/email/smtp');
            }
            
            const emailConfig = {
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                from: process.env.EMAIL_FROM,
                fromName: process.env.EMAIL_FROM_NAME,
                to: process.env.EMAIL_TO
            };
            
            if (emailConfig.smtp.host && emailConfig.smtp.auth.user && emailConfig.to) {
                const emailChannel = new EmailChannel(emailConfig);
                channels.push({ name: 'Email', channel: emailChannel });
            }
        }
        
        // Get current working directory and tmux session
        const currentDir = process.cwd();
        const projectName = path.basename(currentDir);
        
        // Try to get current tmux session
        let tmuxSession = process.env.TMUX_SESSION || 'claude-real';
        try {
            const { execSync } = require('child_process');
            const sessionOutput = execSync('tmux display-message -p "#S"', { 
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore']
            }).trim();
            if (sessionOutput) {
                tmuxSession = sessionOutput;
            }
        } catch (error) {
            // Not in tmux or tmux not available, use default
        }
        
        // Create notification
        const notification = {
            type: notificationType,
            title: `Claude ${notificationType === 'completed' ? 'Task Completed' : 'Waiting for Input'}`,
            message: `Claude has ${notificationType === 'completed' ? 'completed a task' : 'is waiting for input'}`,
            project: projectName
            // Don't set metadata here - let TelegramChannel extract real conversation content
        };
        
        if (channels.length === 0) {
            console.log('❌ No notification channels configured! / 未配置通知渠道！');
            console.log('');
            console.log('📝 Please configure at least one channel in .env:');
            console.log('   - TELEGRAM_ENABLED=true (Recommended)');
            console.log('   - EMAIL_ENABLED=true');
            console.log('   - DESKTOP_ENABLED=true');
            process.exit(1);
        }
        
        console.log(`📋 Project: ${projectName}`);
        console.log(`🖥️  Tmux session: ${tmuxSession}`);
        console.log(`📡 Channels configured: ${channels.map(c => c.name).join(', ')}`);
        console.log('');
        
        // Send notifications to all configured channels
        for (const { name, channel } of channels) {
            try {
                console.log(`📤 [${name}] Sending...`);
                const result = await channel.send(notification);
                results.push({ name, success: result });
                
                if (result) {
                    console.log(`✅ [${name}] Sent successfully!`);
                } else {
                    console.log(`❌ [${name}] Failed to send`);
                }
            } catch (error) {
                console.error(`❌ [${name}] Error: ${error.message}`);
                results.push({ name, success: false, error: error.message });
            }
        }
        console.log('');
        
        // Report overall results
        const successful = results.filter(r => r.success).length;
        const total = results.length;
        
        console.log('═══════════════════════════════════════════════════════════════════');
        if (successful > 0) {
            console.log(`✅ Successfully sent notifications via ${successful}/${total} channels`);
            console.log('✅ 通知发送成功');
            if (results.some(r => r.name === 'Telegram' && r.success)) {
                console.log('');
                console.log('📱 Check your Telegram for the notification!');
                console.log('📱 查看你的 Telegram 获取通知！');
                console.log('');
                console.log('💬 You can reply with commands in this format:');
                console.log('   /cmd TOKEN <your command>');
            }
        } else {
            console.log('❌ All notification channels failed / 所有通知渠道失败');
            console.log('');
            console.log('🔧 Troubleshooting / 故障排查:');
            console.log('   1. Check .env configuration / 检查 .env 配置');
            console.log('   2. Verify credentials are correct / 验证凭据是否正确');
            console.log('   3. Check network connectivity / 检查网络连接');
            process.exit(1);
        }
        console.log('═══════════════════════════════════════════════════════════════════');
        
    } catch (error) {
        console.error('❌ Hook notification error:', error.message);
        process.exit(1);
    }
}

// Show usage if no arguments
if (process.argv.length < 2) {
    console.log('Usage: node claude-hook-notify.js [completed|waiting]');
    process.exit(1);
}

sendHookNotification();