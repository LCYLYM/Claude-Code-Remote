# 🚀 Claude Code Remote Web UI - Quick Start Guide

> Get up and running in 5 minutes!

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- A terminal application

Check your versions:
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## ⚡ 5-Minute Setup

### Step 1: Navigate to Project

```bash
cd web-ui
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for both server and client.

### Step 3: Configure Environment

```bash
cd server
cp .env.example .env
```

The default configuration works out of the box for development! 

**Optional**: Edit `.env` if you want to customize:
```bash
nano .env
```

### Step 4: Start Development Servers

```bash
cd ..  # Return to web-ui root
npm run dev
```

This starts both servers:
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend**: http://localhost:9999

### Step 5: Open Your Browser

Open http://localhost:5173 in your browser and you're ready to go! 🎉

## 🎯 First Steps

### 1. Create Your First Session

1. Click the **"New Session"** button in the sidebar
2. Enter a name (e.g., "My First Session")
3. Click **"Create"**

### 2. Start the Session

1. Click the **"Start"** button in the header
2. The session status will change to "Active"
3. A terminal will be initialized

### 3. Send Your First Command

1. Type a command in the input box (e.g., `ls -la`)
2. Press **Enter** to send
3. See the output in real-time!

### 4. Switch Views

Toggle between:
- **Chat View**: Clean message-based interface
- **Terminal View**: Full terminal emulator

## 🎨 UI Overview

```
┌─────────────────────────────────────────────────────┐
│  ☰ Claude Code Remote              🟢 Connected    │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sessions │         Chat / Terminal View            │
│          │                                          │
│  ● New   │  Messages or Terminal Output            │
│          │                                          │
│  Session │                                          │
│  List    │                                          │
│          │                                          │
│          │                                          │
│  ☾ Theme │  ┌────────────────────────────────────┐ │
│  ⚙ Settings│  Type a command...                 │ │
│          │  └────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

## 💡 Common Commands

### Basic Commands
```bash
# List files
ls -la

# Check current directory
pwd

# View file content
cat filename.txt

# Run a script
./script.sh

# Install dependencies
npm install

# Start a server
npm start
```

### Multi-line Commands

Use **Shift + Enter** for multi-line input:
```bash
echo "Line 1"
echo "Line 2"
echo "Line 3"
```

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message/command |
| `Shift + Enter` | New line in input |
| `Ctrl/Cmd + K` | Focus input (future) |
| `Ctrl/Cmd + /` | Toggle sidebar (future) |

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev servers (both) |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

## 🌙 Theme

Toggle between light and dark modes:
- Click the **sun/moon** icon in the sidebar
- Your preference is automatically saved

## 📱 Mobile Support

The UI is fully responsive:
- On mobile, tap the **menu icon** to show/hide sidebar
- All features work on touch devices
- Optimized for tablets

## 🔍 Troubleshooting

### Port Already in Use

If you see "Port 9999 is already in use":

```bash
# Find and kill the process
lsof -ti:9999 | xargs kill -9

# Or change the port in server/.env
PORT=8888
```

### WebSocket Connection Failed

1. Check that both servers are running
2. Clear browser cache
3. Check browser console for errors
4. Ensure no firewall is blocking connections

### Terminal Not Working

1. Make sure the session is **Active** (green status)
2. Click **Start** if the session is inactive
3. Check server logs for PTY errors

### Module Not Found

```bash
# Clean install
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
npm install
```

## 🎓 Learn More

### Documentation
- [📘 Full README](./README.md) - Complete documentation
- [🚀 Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [🔌 API Reference](./README.md#api-documentation) - REST API & WebSocket

### Features to Explore

1. **Session Management**
   - Create multiple sessions
   - Switch between sessions
   - Delete old sessions

2. **Message Types**
   - User messages (blue)
   - Assistant responses (gray)
   - Terminal output (black/green)
   - System messages (yellow)
   - Error messages (red)

3. **Terminal Features**
   - Full terminal emulation
   - Color support
   - Scrollback buffer
   - Clickable links
   - Auto-resize

4. **Real-time Updates**
   - Live terminal output
   - Connection status
   - Session state changes

## 💻 Example Workflow

### Basic Usage

```bash
# 1. Create a session named "My Project"
# 2. Start the session
# 3. Navigate to your project
cd /path/to/project

# 4. Install dependencies
npm install

# 5. Run your application
npm run dev

# 6. Check logs
tail -f logs/app.log

# 7. Stop when done
# Click "Stop" button
```

### Working with Claude Code

```bash
# 1. Start Claude Code in terminal view
claude-code

# 2. Switch to chat view to interact
# 3. Send commands through chat
# 4. See responses in real-time
# 5. Switch back to terminal to see full output
```

## 🎉 What's Next?

Now that you're set up, explore:

1. **Create Multiple Sessions** - Organize different projects
2. **Try Both Views** - Chat for clarity, Terminal for power
3. **Experiment with Commands** - It's a full terminal!
4. **Customize Theme** - Make it yours
5. **Read Full Docs** - Learn advanced features

## 📞 Need Help?

- 📧 **Email**: support@example.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/LCYLYM/Claude-Code-Remote/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/LCYLYM/Claude-Code-Remote/discussions)
- 📖 **Docs**: [Full README](./README.md)

## 🌟 Pro Tips

1. **Keep Sessions Organized**
   - Use descriptive names
   - Delete inactive sessions
   - One session per project

2. **Use Chat View**
   - Better for reading responses
   - Markdown formatting
   - Code highlighting
   - Persistent history

3. **Use Terminal View**
   - Better for interactive programs
   - See raw output
   - Full terminal features
   - Debugging

4. **Connection Status**
   - Green = Connected
   - Yellow = Reconnecting
   - Red = Disconnected
   - Always visible in header

5. **Message Input**
   - Type naturally
   - Use Shift+Enter for multi-line
   - Commands execute on Enter
   - Input persists across views

---

**Ready to build something amazing? Let's go! 🚀**

Need more details? Check out the [Full Documentation](./README.md) or [Deployment Guide](./DEPLOYMENT.md).
