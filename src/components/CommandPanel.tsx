import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, Play, Plus, History, Clock, CheckCircle, 
  XCircle, AlertCircle, ChevronRight, Copy, Trash2, Save
} from 'lucide-react'

interface Command {
  id: string
  cmd: string
  status: 'pending' | 'running' | 'success' | 'error'
  output?: string
  timestamp: Date
  duration?: number
}

const commandHistory = [
  { id: '1', cmd: 'ls -la', status: 'success', timestamp: new Date(), duration: 120 },
  { id: '2', cmd: 'npm run dev', status: 'success', timestamp: new Date(Date.now() - 3600000), duration: 5000 },
  { id: '3', cmd: 'git status', status: 'success', timestamp: new Date(Date.now() - 7200000), duration: 80 },
  { id: '4', cmd: 'python main.py', status: 'error', timestamp: new Date(Date.now() - 10800000), duration: 2000, output: 'Error: Module not found' },
]

const quickCommands = [
  { label: '列出文件', cmd: 'ls -la', icon: '📁' },
  { label: 'Node 版本', cmd: 'node -v', icon: '🟢' },
  { label: 'Git 状态', cmd: 'git status', icon: '🔀' },
  { label: '安装依赖', cmd: 'npm install', icon: '📦' },
  { label: '清理缓存', cmd: 'npm cache clean --force', icon: '🧹' },
  { label: '系统信息', cmd: 'uname -a', icon: '💻' },
]

export default function CommandPanel() {
  const [commands, setCommands] = useState<Command[]>(commandHistory)
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleRun = async () => {
    if (!input.trim() || isRunning) return

    const newCmd: Command = {
      id: Date.now().toString(),
      cmd: input.trim(),
      status: 'running',
      timestamp: new Date()
    }

    setCommands(prev => [newCmd, ...prev])
    setIsRunning(true)
    setInput('')

    setTimeout(() => {
      const isSuccess = Math.random() > 0.1
      setCommands(prev => prev.map(c => 
        c.id === newCmd.id 
          ? { 
              ...c, 
              status: isSuccess ? 'success' : 'error',
              output: isSuccess ? 'Command executed successfully' : 'Error: Command failed',
              duration: Math.floor(Math.random() * 3000)
            }
          : c
      ))
      setIsRunning(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)'
    }}>
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          marginBottom: 16
        }}>
          <Terminal size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>命令执行</span>
          <div style={{ flex: 1 }} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-ghost"
            style={{ padding: '8px 12px' }}
          >
            <History size={16} />
            历史
          </motion.button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickCommands.map((q, i) => (
            <motion.button
              key={q.cmd}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, background: 'var(--bg-hover)' }}
              onClick={() => setInput(q.cmd)}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-secondary)'
              }}
            >
              <span>{q.icon}</span>
              <span>{q.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: 12,
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: 14,
              top: 14,
              color: 'var(--accent)',
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 600
            }}>
              $
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入命令..."
              rows={1}
              style={{
                width: '100%',
                padding: '14px 14px 14px 28px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: 14,
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRun}
            disabled={!input.trim() || isRunning}
            className="btn btn-primary"
            style={{ 
              padding: '12px 20px',
              opacity: (!input.trim() || isRunning) ? 0.5 : 1
            }}
          >
            {isRunning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock size={18} />
              </motion.div>
            ) : (
              <Play size={18} />
            )}
            运行
          </motion.button>
        </div>
      </motion.div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: 'var(--text-muted)', 
          textTransform: 'uppercase',
          marginBottom: 12
        }}>
          输出
        </div>

        {commands.map((cmd, i) => (
          <CommandItem key={cmd.id} command={cmd} index={commands.length - i} />
        ))}
      </div>
    </div>
  )
}

function CommandItem({ command, index }: { command: Command; index: number }) {
  const statusColors = {
    pending: 'var(--text-muted)',
    running: 'var(--accent)',
    success: 'var(--success)',
    error: 'var(--error)'
  }

  const StatusIcon = {
    pending: Clock,
    running: Clock,
    success: CheckCircle,
    error: XCircle
  }[command.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        marginBottom: 12,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        borderBottom: command.status === 'error' ? '1px solid var(--error)' : 'none'
      }}>
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: 12, 
          color: 'var(--text-muted)' 
        }}>
          #{index}
        </span>
        <StatusIcon 
          size={16} 
          style={{ color: statusColors[command.status] }} 
        />
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: 13, 
          color: 'var(--text-primary)',
          flex: 1
        }}>
          {command.cmd}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {command.duration && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {command.duration}ms
            </span>
          )}
          <CopyButton text={command.cmd} />
          <TrashButton />
        </div>
      </div>

      {command.output && (
        <div style={{
          padding: '12px 14px',
          fontFamily: 'monospace',
          fontSize: 13,
          color: command.status === 'error' ? 'var(--error)' : 'var(--text-secondary)',
          background: command.status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
        }}>
          {command.output}
        </div>
      )}
    </motion.div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      style={{
        width: 24,
        height: 24,
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: copied ? 'var(--success)' : 'var(--text-muted)'
      }}
      title="复制"
    >
      {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
    </motion.button>
  )
}

function TrashButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.1, color: 'var(--error)' }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 24,
        height: 24,
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-muted)'
      }}
      title="删除"
    >
      <Trash2 size={14} />
    </motion.button>
  )
}
