# ExRobot

<div align="center">

![ExRobot](https://via.placeholder.com/800x400/0a0a0f/6366f1?text=ExRobot+AI+Assistant)

**A modern, sleek AI assistant desktop application built with Electron, React, and TypeScript**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)

</div>

---

## ✨ Features

### 💬 Intelligent Chat Interface

- Real-time messaging with smooth animations
- Typing indicators with animated feedback
- Markdown support for rich text formatting
- Conversation history with search capability
- Quick action buttons for common operations

### 📁 Advanced File Management

- Tree and grid view modes for flexible browsing
- Drag-and-drop file operations
- Quick access shortcuts to common directories
- Advanced search with content filtering
- Multi-select batch operations

### ⚡ Command Execution Panel

- Terminal-like command input with syntax highlighting
- Command history with execution status tracking
- Quick command shortcuts for frequent operations
- Output capture and display with syntax highlighting
- Copy, export, and share capabilities

### 🔒 Enterprise-Grade Security

- Command whitelist system for controlled execution
- Dangerous pattern detection and prevention
- Comprehensive audit logging for all operations
- Confirmation dialogs for destructive actions
- Checkpoint-based state recovery system

### 🎨 Premium UI/UX

- Smooth animations powered by Framer Motion
- Dark theme with customizable accent colors
- Glassmorphism and modern design patterns
- Responsive layout for all screen sizes
- Micro-interactions for delightful user feedback

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (or pnpm/yarn)
- **Git**: For version control

### Installation

```bash
# Clone the repository
git clone https://github.com/wwsb196-ai/ex-robot.git
cd ex-robot

# Install dependencies
npm install

# Start development server
npm run dev

# In a separate terminal, run Electron
npm run electron:dev
```

### Building for Production

```bash
# Build the React application
npm run build

# Package for your platform
npm run electron:build
```

## 📁 Project Structure

```
ex-robot/
├── electron/                      # Electron main process
│   ├── main.js                    # Application entry point & IPC handlers
│   ├── preload/
│   │   └── index.js              # Context bridge & secure API exposure
│   ├── services/                  # Core business logic services
│   │   ├── audit.js              # Operation audit & logging service
│   │   ├── checkpoint.js         # State checkpoint & recovery service
│   │   ├── codeExecution.js      # Multi-language code execution engine
│   │   ├── fileSystem.js         # File operations & management service
│   │   ├── planner.js            # Task planning & execution service
│   │   ├── search.js             # Search utilities service
│   │   ├── security.js           # Security whitelist & validation service
│   │   └── systemCommand.js      # System command execution service
│   └── utils/                    # Utility functions
│       └── appState.js           # Application state management
├── hooks/                         # React custom hooks
│   └── index.ts                  # Custom hooks for components
├── src/                          # React frontend application
│   ├── main.tsx                  # Application entry point
│   ├── App.tsx                   # Root component & routing
│   ├── index.css                 # Global styles & CSS variables
│   └── components/               # React components
│       ├── Chat.tsx              # Chat interface component
│       ├── CommandPanel.tsx      # Command execution panel
│       ├── FileManager.tsx       # File browser component
│       ├── Settings.tsx          # Settings page component
│       └── Sidebar.tsx           # Navigation sidebar component
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
├── .vscode/                      # VS Code configuration
├── tests/                        # Test files
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime environment |
| **Framework** | Electron 27 | Desktop application framework |
| **UI Library** | React 18 | Component-based UI library |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **Build Tool** | Vite 5 | Fast build tool & dev server |
| **Animation** | Framer Motion 10 | Production-ready animations |
| **State Management** | Zustand 4 | Lightweight state management |
| **Icons** | Lucide React | Beautiful icon library |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework |
| **Testing** | Vitest | Fast unit testing framework |

## 📖 API Reference

### File System Operations

```typescript
// Read file content
const result = await ops.fs.read('/path/to/file.txt');

// Write file content
await ops.fs.write('/path/to/file.txt', 'Hello, ExRobot!');

// List directory contents
const files = await ops.fs.ls('/path/to/directory');

// Find files by pattern
const results = await ops.fs.find('/path', '*.ts');

// Create directory
await ops.fs.mkdir('/path/to/new/dir');

// Delete file or directory
await ops.fs.del('/path/to/file');
await ops.fs.del('/path/to/dir', true); // recursive
```

### Command Execution

```typescript
// Execute system command
const result = await ops.cmd.run('ls -la');

// Check command safety
const check = await ops.cmd.check('npm install');

// List allowed commands
const whitelist = await ops.cmd.list();

// Process management
const processes = await ops.cmd.ps();
await ops.cmd.kill(pid);
```

### Code Execution

```typescript
// Execute code in specified language
const result = await ops.code.run('console.log("Hello")', 'js');

// Format code
const formatted = await ops.code.fmt(code, 'ts');

// Lint code
const issues = await ops.code.lint(code, 'ts');

// Install packages
await ops.code.install(['lodash', 'axios'], { pm: 'npm' });
```

### Search Operations

```typescript
// Web search
const results = await ops.search.web('TypeScript best practices', 10);

// Grep search in files
const matches = await ops.search.grep('/project', 'TODO', { recursive: true });

// File name search
const files = await ops.search.file('/project', '*.config');
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Shift + A` | Toggle main window visibility |
| `Ctrl + Shift + C` | Focus quick chat input |
| `Ctrl + Enter` | Send message / Execute command |
| `Ctrl + /` | Focus global search |
| `Esc` | Close modal / Cancel operation |

## 🎨 Theme Customization

ExRobot supports multiple accent colors that can be configured programmatically:

```typescript
// Available accent colors
const accentColors = [
  { id: 'indigo', color: '#6366f1', label: 'Indigo' },
  { id: 'purple', color: '#8b5cf6', label: 'Purple' },
  { id: 'pink', color: '#ec4899', label: 'Pink' },
  { id: 'blue', color: '#3b82f6', label: 'Blue' },
  { id: 'cyan', color: '#06b6d4', label: 'Cyan' },
  { id: 'green', color: '#10b981', label: 'Green' },
];
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📦 Building

```bash
# Build for current platform
npm run electron:build

# Build for all platforms
npm run electron:build -- --mac --win --linux

# Build for specific platform
npm run electron:build -- --win
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Framer Motion](https://www.framer.com/motion/) - Beautiful animations
- [Lucide Icons](https://lucide.dev/) - Consistent icon design
- [Electron](https://www.electronjs.org/) - Desktop app capabilities
- [Vite](https://vitejs.dev/) - Lightning fast development
- [React](https://reactjs.org/) - Component-based architecture
- [TypeScript](https://www.typescriptlang.org/) - Type safety

---

<div align="center">

**Built with ❤️ by Bruce Wong**

[GitHub](https://github.com/wwsb196-ai) • [Issues](https://github.com/wwsb196-ai/ex-robot/issues)

</div>
