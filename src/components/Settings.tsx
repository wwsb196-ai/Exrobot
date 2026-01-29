import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, User, Bell, Shield, Palette, Globe, 
  Keyboard, Terminal, Save, RefreshCw, Download, Upload
} from 'lucide-react'

const settingsSections = [
  { id: 'profile', icon: User, label: '个人资料' },
  { id: 'appearance', icon: Palette, label: '外观' },
  { id: 'notifications', icon: Bell, label: '通知' },
  { id: 'security', icon: Shield, label: '安全' },
  { id: 'keyboard', icon: Keyboard, label: '快捷键' },
  { id: 'advanced', icon: Terminal, label: '高级' },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState('indigo')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile': return <ProfileSection />
      case 'appearance': return <AppearanceSection theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} />
      case 'notifications': return <NotificationsSection />
      case 'security': return <SecuritySection />
      case 'keyboard': return <KeyboardSection />
      case 'advanced': return <AdvancedSection />
      default: return <ProfileSection />
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: '100%',
      background: 'var(--bg-primary)'
    }}>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        style={{
          width: 240,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: '16px 12px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          padding: '0 8px 16px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 16
        }}>
          <Settings size={20} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>设置</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {settingsSections.map((section, i) => (
            <motion.button
              key={section.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              onClick={() => setActiveSection(section.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: activeSection === section.id ? 'var(--accent-glow)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: activeSection === section.id ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontSize: 14,
                textAlign: 'left'
              }}
            >
              <section.icon size={18} />
              <span>{section.label}</span>
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              {settingsSections.find(s => s.id === activeSection)?.label}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              管理你的{settingsSections.find(s => s.id === activeSection)?.label}设置
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw size={16} />
              </motion.div>
            ) : (
              <Save size={16} />
            )}
            保存更改
          </motion.button>
        </motion.div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}

function ProfileSection() {
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 20,
        marginBottom: 32,
        padding: 20,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)'
      }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 700,
            color: 'white'
          }}
        >
          U
        </motion.div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>用户名</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>user@example.com</div>
        </div>
      </div>

      <SettingItem label="显示名称" placeholder="输入显示名称" defaultValue="ExRobot" />
      <SettingItem label="邮箱" placeholder="输入邮箱" defaultValue="user@example.com" type="email" />
      <SettingItem label="个人简介" placeholder="介绍一下自己" textarea />
    </div>
  )
}

function AppearanceSection({ 
  theme, setTheme, accentColor, setAccentColor 
}: { 
  theme: string
  setTheme: (t: string) => void
  accentColor: string
  setAccentColor: (c: string) => void
}) {
  const colors = [
    { id: 'indigo', color: '#6366f1', label: '靛蓝' },
    { id: 'purple', color: '#8b5cf6', label: '紫色' },
    { id: 'pink', color: '#ec4899', label: '粉色' },
    { id: 'blue', color: '#3b82f6', label: '蓝色' },
    { id: 'cyan', color: '#06b6d4', label: '青色' },
    { id: 'green', color: '#10b981', label: '绿色' },
  ]

  return (
    <div style={{ maxWidth: 600 }}>
      <SectionTitle title="主题" description="选择应用的外观主题" />
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {['dark', 'light', 'system'].map(t => (
          <motion.button
            key={t}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTheme(t)}
            style={{
              flex: 1,
              padding: 16,
              background: theme === t ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 'var(--radius-sm)', 
              background: t === 'dark' ? '#1a1a1a' : t === 'light' ? '#f0f0f0' : 'linear-gradient(135deg, #1a1a1a 50%, #f0f0f0 50%)',
              margin: '0 auto 8px',
              border: '1px solid var(--border)'
            }} />
            <div style={{ 
              fontSize: 14, 
              fontWeight: 500,
              color: theme === t ? 'var(--accent-light)' : 'var(--text-primary)' 
            }}>
              {t === 'dark' ? '深色' : t === 'light' ? '浅色' : '跟随系统'}
            </div>
          </motion.button>
        ))}
      </div>

      <SectionTitle title="强调色" description="选择界面的强调色" />
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {colors.map(c => (
          <motion.button
            key={c.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAccentColor(c.id)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: c.color,
              border: `3px solid ${accentColor === c.id ? 'white' : 'transparent'}`,
              boxShadow: accentColor === c.id ? `0 0 0 2px ${c.color}` : 'none',
              cursor: 'pointer'
            }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div style={{ maxWidth: 500 }}>
      <ToggleItem label="桌面通知" description="接收桌面通知" defaultChecked />
      <ToggleItem label="消息提示音" description="新消息时播放提示音" defaultChecked={false} />
      <ToggleItem label="完成提示" description="任务完成时通知" defaultChecked />
      <ToggleItem label="错误警告" description="发生错误时通知" defaultChecked />
    </div>
  )
}

function SecuritySection() {
  return (
    <div style={{ maxWidth: 500 }}>
      <ToggleItem label="确认执行危险命令" description="执行删除等危险操作前需要确认" defaultChecked />
      <ToggleItem label="记录所有操作" description="保存所有操作的审计日志" defaultChecked />
      <ToggleItem label="自动锁定" description="空闲10分钟后自动锁定" defaultChecked={false} />
      <SettingItem label="会话超时" placeholder="输入分钟数" defaultValue="30" type="number" />
    </div>
  )
}

function KeyboardSection() {
  const shortcuts = [
    { keys: 'Ctrl + Shift + A', action: '显示/隐藏主窗口' },
    { keys: 'Ctrl + Shift + C', action: '快速对话' },
    { keys: 'Ctrl + Enter', action: '发送消息' },
    { keys: 'Ctrl + /', action: '聚焦搜索' },
  ]

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="快捷键" description="管理全局快捷键" />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shortcuts.map((s, i) => (
          <motion.div
            key={s.keys}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}
          >
            <span style={{ color: 'var(--text-primary)' }}>{s.action}</span>
            <kbd style={{
              padding: '4px 10px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: 13,
              color: 'var(--accent-light)'
            }}>
              {s.keys}
            </kbd>
          </motion.div>
        ))}
      </div>
</div>
  )
}

function AdvancedSection() {
  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="数据管理" description="导出或导入你的设置" />
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          <Download size={16} />
          导出数据
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          <Upload size={16} />
          导入数据
        </motion.button>
      </div>

      <SectionTitle title="重置" description="将所有设置恢复为默认值" />
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%',
          padding: '12px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        重置所有设置
      </motion.button>
    </div>
  )
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</div>
    </div>
  )
}

function SettingItem({ 
  label, placeholder, defaultValue, type = 'text', textarea 
}: { 
  label: string
  placeholder: string
  defaultValue?: string
  type?: string
  textarea?: boolean
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ 
        display: 'block', 
        fontSize: 14, 
        fontWeight: 500, 
        color: 'var(--text-primary)',
        marginBottom: 8
      }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          className="input"
          placeholder={placeholder}
          defaultValue={defaultValue}
          rows={3}
          style={{ width: '100%' }}
        />
      ) : (
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      )}
    </div>
  )
}

function ToggleItem({ label, description, defaultChecked }: {
  label: string
  description: string
  defaultChecked: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setChecked(!checked)}
        style={{
          width: 48,
          height: 26,
          borderRadius: 13,
          background: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
          border: 'none',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <motion.div
          animate={{ x: checked ? 22 : 0 }}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 2,
            left: 2
          }}
        />
      </motion.button>
    </motion.div>
  )
}
