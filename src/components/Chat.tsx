import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Paperclip, Sparkles, Image, FileText, 
  Mic, MicOff, Smile, MoreHorizontal, CornerUpLeft
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  actions?: string[]
}

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `你好！我是 ExRobot，一个智能助手。

我可以帮助你：
• 💬 回答问题和对话
• 📁 管理文件和代码
• ⚡ 执行系统命令
• 🔍 搜索和信息查询
• 🤖 自动化任务

有什么我可以帮你的吗？`,
  timestamp: new Date()
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到！我理解你的问题是关于"${input.trim()}"。

我可以帮你实现这个功能。让我分析一下需要哪些步骤...`,
        timestamp: new Date(),
        actions: ['执行', '取消']
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'var(--bg-primary)'
    }}>
      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '24px 32px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} />
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                padding: '16px 0'
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: 'white'
              }}>
                E
              </div>
              <div style={{
                display: 'flex',
                gap: 4,
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)'
              }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)'
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        style={{
          padding: '20px 32px 28px',
          background: 'var(--bg-primary)'
        }}
      >
        <div style={{ 
          maxWidth: 800, 
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          transition: 'all 0.3s'
        }}
        >
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)'
          }}>
            <ToolbarBtn icon={Paperclip} tooltip="附件" />
            <ToolbarBtn icon={Image} tooltip="图片" />
            <ToolbarBtn icon={FileText} tooltip="文件" />
            <ToolbarBtn icon={Sparkles} tooltip="AI 建议" />
            <div style={{ flex: 1 }} />
            {isRecording ? (
              <ToolbarBtn 
                icon={MicOff} 
                tooltip="停止录音"
                onClick={() => setIsRecording(false)}
                active 
              />
            ) : (
              <ToolbarBtn 
                icon={Mic} 
                tooltip="语音输入"
                onClick={() => setIsRecording(true)}
              />
            )}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            padding: '12px 16px'
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: 150
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ToolbarBtn icon={Smile} tooltip="表情" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: input.trim() 
                    ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
                    : 'var(--bg-tertiary)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  opacity: input.trim() ? 1 : 0.5
                }}
              >
                <Send size={18} color="white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 12,
            color: 'var(--text-muted)'
          }}
        >
          按 <kbd style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '2px 8px', 
            borderRadius: 4,
            fontFamily: 'inherit'
          }}>Enter</kbd> 发送，<kbd style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '2px 8px', 
            borderRadius: 4,
            fontFamily: 'inherit'
          }}>Shift + Enter</kbd> 换行
        </motion.div>
      </motion.div>
    </div>
  )
}

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px 0'
        }}
      >
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--text-muted)'
        }}>
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 20
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 12,
        maxWidth: '80%'
      }}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: isUser 
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0
          }}
        >
          {isUser ? 'U' : 'E'}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: isUser ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: isUser 
              ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
              : 'var(--bg-secondary)',
            color: isUser ? 'white' : 'var(--text-primary)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            borderTopRightRadius: isUser ? 4 : 'var(--radius-lg)',
            borderTopLeftRadius: isUser ? 'var(--radius-lg)' : 4,
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            position: 'relative'
          }}
        >
          {message.content}
          <div style={{
            position: 'absolute',
            bottom: -8,
            [isUser ? 'left' : 'right']: 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--accent)',
            opacity: isUser ? 1 : 0
          }} />
        </motion.div>

        {/* Actions */}
        {isLast && !isUser && message.actions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 8 }}
          >
            {message.actions.map(action => (
              <motion.button
                key={action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {action}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function ToolbarBtn({ icon: Icon, tooltip, active, onClick }: { 
  icon: any
  tooltip: string
  active?: boolean
  onClick?: () => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, background: 'var(--bg-hover)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={tooltip}
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent-glow)' : 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? 'var(--accent-light)' : 'var(--text-muted)'
      }}
    >
      <Icon size={16} />
    </motion.button>
  )
}
