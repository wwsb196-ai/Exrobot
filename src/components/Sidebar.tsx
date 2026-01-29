import { motion } from 'framer-motion'
import { 
  MessageCircle, FolderOpen, Terminal, Settings as SettingsIcon,
  Sparkles, History, Star, GitBranch
} from 'lucide-react'

const navItems = [
  { id: 'chat', icon: MessageCircle, label: 'Chat', desc: 'AI 对话' },
  { id: 'files', icon: FolderOpen, label: 'Files', desc: '文件管理' },
  { id: 'commands', icon: Terminal, label: 'Commands', desc: '命令执行' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings', desc: '系统设置' },
]

const quickActions = [
  { icon: Sparkles, label: '新对话', color: 'var(--accent)' },
  { icon: History, label: '历史记录', color: 'var(--success)' },
  { icon: Star, label: '收藏', color: 'var(--warning)' },
  { icon: GitBranch, label: '任务', color: '#8b5cf6' },
]

interface SidebarProps {
  activeView: string
  onViewChange: (view: 'chat' | 'files' | 'commands' | 'settings') => void
  onClose: () => void
}

export default function Sidebar({ activeView, onViewChange, onClose }: SidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: 280,
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <motion.div
          animate={{ 
            boxShadow: ['0 0 0 var(--accent-glow)', '0 0 20px var(--accent-glow)', '0 0 0 var(--accent-glow)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: 'white'
          }}
        >
          E
        </motion.div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>ExRobot</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI Assistant</div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 8 
        }}>
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 * i, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                aspectRatio: 1,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: 8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = action.color
                e.currentTarget.style.boxShadow = `0 0 15px ${action.color}40`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <action.icon size={16} style={{ color: action.color }} />
              <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        <div style={{ 
          fontSize: 11, 
          fontWeight: 600, 
          color: 'var(--text-muted)', 
          padding: '8px 8px 12px',
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          导航
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item, i) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeView === item.id}
              onClick={() => onViewChange(item.id as any)}
              delay={0.1 + i * 0.05}
            />
          ))}
        </nav>
      </div>

      {/* Status */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-tertiary)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          marginBottom: 12
        }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--success)'
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>在线 · 响应时间 45ms</span>
        </div>
        <div style={{ 
          fontSize: 11, 
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>v1.0.0</span>
          <span style={{ cursor: 'pointer', color: 'var(--accent)' }}>检查更新</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function NavItem({ 
  id, icon: Icon, label, desc, isActive, onClick, delay 
}: { 
  id: string
  icon: any
  label: string
  desc: string
  isActive: boolean
  onClick: () => void
  delay: number
}) {
  return (
    <motion.button
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: isActive ? 'var(--accent-glow)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <motion.div
        animate={{ 
          color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
          scale: isActive ? 1.1 : 1
        }}
        transition={{ type: 'spring' }}
      >
        <Icon size={20} />
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--accent-light)' : 'var(--text-primary)'
        }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          style={{
            width: 3,
            height: 24,
            background: 'var(--accent)',
            borderRadius: 2
          }}
        />
      )}
    </motion.button>
  )
}
