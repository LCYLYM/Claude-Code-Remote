# Claude Code Remote - Web UI

> 🎯 A modern, production-ready web interface for remotely controlling Claude Code through an elegant chat interface.

## 🌟 Features

### Core Functionality
- **Beautiful Chat Interface** - Intuitive chat-based interaction with Claude Code
- **Real-time Terminal** - Full xterm.js powered terminal with live output
- **WebSocket Communication** - Low-latency bidirectional communication
- **Multi-Session Management** - Create and switch between multiple sessions
- **PTY Terminal Management** - Full pseudo-terminal support with node-pty
- **Message History** - Persistent chat history with SQLite
- **Dark/Light Theme** - Beautiful themes optimized for both modes

### Advanced Features
- **Markdown Rendering** - Rich text formatting with code highlighting
- **Command History** - Track and replay previous commands
- **Session Persistence** - Auto-save session state
- **Connection Indicators** - Real-time connection status
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Keyboard Shortcuts** - Efficient keyboard-driven workflow

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Express.js - Web server framework
- Socket.io - Real-time WebSocket communication
- node-pty - PTY terminal management
- SQLite (better-sqlite3) - Data persistence
- Winston - Structured logging
- TypeScript - Type-safe development

**Frontend:**
- React 18 - UI framework
- TypeScript - Type safety
- Socket.io-client - WebSocket client
- xterm.js - Terminal emulator
- TailwindCSS - Utility-first styling
- Zustand - State management
- React Query - Data fetching
- React Markdown - Markdown rendering

### Project Structure

```
web-ui/
├── server/               # Backend server
│   ├── src/
│   │   ├── api/         # REST API routes
│   │   ├── config/      # Configuration
│   │   ├── database/    # Database layer
│   │   ├── services/    # Business logic
│   │   ├── websocket/   # WebSocket handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── utils/       # Utilities
│   │   └── types/       # TypeScript types
│   └── package.json
│
├── client/              # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API & WebSocket
│   │   ├── store/       # State management
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # TypeScript types
│   │   └── styles/      # Global styles
│   └── package.json
│
└── package.json         # Workspace root
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
cd web-ui
```

2. **Install dependencies**
```bash
npm install
```

This will install dependencies for all workspaces (server, client, shared).

3. **Configure environment**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

4. **Build the project**
```bash
npm run build
```

5. **Start development servers**
```bash
npm run dev
```

This starts:
- Backend server on http://0.0.0.0:9999
- Frontend dev server on http://localhost:5173

### Production Deployment

1. **Build for production**
```bash
npm run build
```

2. **Start production server**
```bash
npm start
```

## 📖 API Documentation

### REST API Endpoints

#### Sessions

```typescript
GET    /api/sessions              # List all sessions
GET    /api/sessions/:id          # Get session details
POST   /api/sessions              # Create new session
PUT    /api/sessions/:id          # Update session
DELETE /api/sessions/:id          # Delete session
POST   /api/sessions/:id/activate # Activate session (start PTY)
POST   /api/sessions/:id/deactivate # Deactivate session
```

#### Messages

```typescript
GET    /api/messages              # Get messages for session
POST   /api/messages              # Create new message
DELETE /api/messages/:id          # Delete message
```

#### Commands

```typescript
GET    /api/commands              # List commands for session
GET    /api/commands/:id          # Get command details
POST   /api/commands              # Execute command
GET    /api/commands/stats/:sessionId # Get command statistics
```

### WebSocket Events

#### Client → Server

```typescript
join_session        { sessionId, userId }
leave_session       { sessionId }
execute_command     { sessionId, command }
terminal_input      { sessionId, input }
terminal_resize     { sessionId, cols, rows }
activate_session    { sessionId }
deactivate_session  { sessionId }
```

#### Server → Client

```typescript
terminal_output     { sessionId, data, timestamp }
session_joined      { sessionId, session }
session_activated   { sessionId }
session_deactivated { sessionId }
session_terminated  { sessionId, exitCode, signal }
command_executed    { command }
error               { message }
```

## 🎨 UI Components

### Layout Components
- **MainLayout** - Main application layout with sidebar
- **Sidebar** - Session list and navigation
- **ConnectionIndicator** - Real-time connection status

### Chat Components
- **ChatPanel** - Main chat interface
- **MessageList** - Scrollable message history
- **MessageItem** - Individual message rendering
- **MessageInput** - Command input with autocomplete

### Terminal Components
- **TerminalView** - Full xterm.js terminal emulator

## 🔧 Configuration

### Server Configuration

Edit `server/.env`:

```env
# Server
PORT=9999
HOST=0.0.0.0
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key

# Database
DATABASE_PATH=./data/claude-remote.db

# Logging
LOG_LEVEL=info

# WebSocket
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000
```

### Client Configuration

The client automatically connects to the backend server configured in `vite.config.ts`.

## 🧪 Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## 📊 Database Schema

### Tables

**users**
- id (TEXT PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- created_at, updated_at (DATETIME)

**sessions**
- id (TEXT PRIMARY KEY)
- user_id (TEXT FOREIGN KEY)
- name (TEXT)
- pty_pid (INTEGER)
- status (TEXT: active/inactive/terminated)
- created_at, updated_at, last_activity_at (DATETIME)

**messages**
- id (TEXT PRIMARY KEY)
- session_id (TEXT FOREIGN KEY)
- type (TEXT: user/assistant/system/terminal/error)
- content (TEXT)
- metadata (TEXT JSON)
- timestamp (DATETIME)

**commands**
- id (TEXT PRIMARY KEY)
- session_id (TEXT FOREIGN KEY)
- command (TEXT)
- status (TEXT: pending/executing/completed/failed)
- output, error (TEXT)
- started_at, completed_at, created_at (DATETIME)

**command_templates**
- id (TEXT PRIMARY KEY)
- user_id (TEXT FOREIGN KEY)
- name, description, command, category (TEXT)
- created_at (DATETIME)

## 🔒 Security

### Implemented Security Features

1. **Helmet.js** - Security headers
2. **CORS** - Cross-origin resource sharing control
3. **Rate Limiting** - Prevent abuse
4. **Input Validation** - Joi schema validation
5. **Error Handling** - Secure error messages
6. **SQL Injection Protection** - Prepared statements

### Best Practices

- Never commit secrets to version control
- Use environment variables for configuration
- Keep dependencies updated
- Enable HTTPS in production
- Implement proper authentication (TODO)

## 🚧 Roadmap

### Completed ✅
- [x] Backend server infrastructure
- [x] PTY terminal management
- [x] WebSocket real-time communication
- [x] Session management
- [x] Message persistence
- [x] React frontend with TypeScript
- [x] Chat interface
- [x] Terminal emulator
- [x] Theme system
- [x] Responsive design

### In Progress 🔄
- [ ] /mcp command handler
- [ ] /compare command handler
- [ ] File browser
- [ ] Authentication system

### Planned 📋
- [ ] Command templates
- [ ] Message search
- [ ] Export conversation
- [ ] Performance monitoring
- [ ] Unit tests
- [ ] E2E tests
- [ ] Docker deployment
- [ ] Kubernetes manifests

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Claude Code](https://claude.ai/code) - The amazing AI coding assistant
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [Socket.io](https://socket.io/) - Real-time engine
- [React](https://react.dev/) - UI framework
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

- 🐛 [Report Issues](https://github.com/LCYLYM/Claude-Code-Remote/issues)
- 💬 [Discussions](https://github.com/LCYLYM/Claude-Code-Remote/discussions)
- 📧 Email: support@example.com

---

Built with ❤️ by the Claude Code Remote Team
