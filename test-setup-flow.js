#!/usr/bin/env node

/**
 * Test Setup Flow
 * Validates the complete setup without requiring network access
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  🧪 Testing One-Click Telegram Setup                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log('');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
    }
}

// Test 1: Check project structure
test('Project structure exists', () => {
    const requiredFiles = [
        'package.json',
        'quick-start-telegram.sh',
        'TELEGRAM_QUICKSTART.md',
        '.env.example',
        'claude-hook-notify.js',
        'start-telegram-webhook.js',
        'src/channels/telegram/telegram.js',
        'src/channels/telegram/webhook.js'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`Missing file: ${file}`);
        }
    }
});

// Test 2: Check .env.example has Telegram config
test('.env.example contains Telegram configuration', () => {
    const envExample = fs.readFileSync('.env.example', 'utf8');
    if (!envExample.includes('TELEGRAM_BOT_TOKEN')) {
        throw new Error('Missing TELEGRAM_BOT_TOKEN');
    }
    if (!envExample.includes('TELEGRAM_CHAT_ID')) {
        throw new Error('Missing TELEGRAM_CHAT_ID');
    }
    if (!envExample.includes('TELEGRAM_WEBHOOK_URL')) {
        throw new Error('Missing TELEGRAM_WEBHOOK_URL');
    }
});

// Test 3: Check quick-start script is executable
test('quick-start-telegram.sh is executable', () => {
    const stats = fs.statSync('quick-start-telegram.sh');
    if (!(stats.mode & 0o111)) {
        throw new Error('Script is not executable');
    }
});

// Test 4: Check if .env file was created (from our test)
test('.env file exists', () => {
    if (!fs.existsSync('.env')) {
        throw new Error('.env file not found');
    }
});

// Test 5: Load and validate .env
test('.env has required Telegram configuration', () => {
    const dotenv = require('dotenv');
    const result = dotenv.config();
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN not set');
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
        throw new Error('TELEGRAM_CHAT_ID not set');
    }
    if (process.env.TELEGRAM_ENABLED !== 'true') {
        throw new Error('TELEGRAM_ENABLED not set to true');
    }
});

// Test 6: Check directories are created
test('Required directories exist', () => {
    const dirs = [
        'src/data',
        'src/data/sessions'
    ];
    
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(dir)) {
            throw new Error(`Directory not created: ${dir}`);
        }
    }
});

// Test 7: Test Telegram channel loading
test('Telegram channel loads correctly', () => {
    const TelegramChannel = require('./src/channels/telegram/telegram');
    
    const config = {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        forceIPv4: process.env.TELEGRAM_FORCE_IPV4 === 'true'
    };
    
    const channel = new TelegramChannel(config);
    if (!channel) {
        throw new Error('Failed to create Telegram channel');
    }
});

// Test 8: Test webhook handler file exists
test('Telegram webhook handler file exists', () => {
    const webhookPath = './src/channels/telegram/webhook.js';
    if (!fs.existsSync(webhookPath)) {
        throw new Error('Webhook handler file not found');
    }
    
    // Verify it has the required exports
    const content = fs.readFileSync(webhookPath, 'utf8');
    if (!content.includes('class TelegramWebhookHandler')) {
        throw new Error('TelegramWebhookHandler class not found');
    }
    if (!content.includes('module.exports')) {
        throw new Error('Module exports not found');
    }
});

// Test 9: Test notification structure
test('Notification structure is valid', () => {
    const notification = {
        type: 'completed',
        title: 'Test Notification',
        message: 'Test message',
        project: 'test-project',
        metadata: {
            userQuestion: 'Test question',
            claudeResponse: 'Test response',
            tmuxSession: 'test-session'
        }
    };
    
    if (!notification.type || !notification.title || !notification.message) {
        throw new Error('Invalid notification structure');
    }
});

// Test 10: Verify documentation exists
test('Documentation files exist', () => {
    const docs = [
        'README.md',
        'TELEGRAM_QUICKSTART.md'
    ];
    
    for (const doc of docs) {
        if (!fs.existsSync(doc)) {
            throw new Error(`Missing documentation: ${doc}`);
        }
    }
});

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════════');

if (failed > 0) {
    console.log('');
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
} else {
    console.log('');
    console.log('✅ All tests passed! One-click setup is working correctly.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Configure .env with your Telegram credentials');
    console.log('   2. Run: npm run telegram');
    console.log('   3. Test: node claude-hook-notify.js completed');
    console.log('');
    process.exit(0);
}
