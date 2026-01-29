import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import FileManager from './components/FileManager'
import CommandPanel from './components/CommandPanel'
import Settings from './components/Settings'
import { useWindowControls } from '../hooks'

type View = 'chat' | 'files' | 'commands' | 'settings'

export default function App() {
  const [view, setView] = useState<View>('chat')
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { close, min, max } = useWindowControls()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const renderView = () => {
    switch (view) {
      case 'chat': return <Chat />
      case 'files': return <FileManager />
      case 'commands': return <CommandPanel />
      case 'settings': return <Settings />
      default: return <Chat />
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: 'var(--bg-primary)' }}>
      {/* Title Bar */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          zIndex: 1000,
          WebkitAppRegion: 'drag'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              boxShadow: '0 0 10px var(--accent-glow)'
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>ExRobot</span>
        </div>

        <div style={{ display: 'flex', gap: 8, WebkitAppRegion: 'no-drag' }}>
          <WindowBtn icon="─" onClick={min} />
          <WindowBtn icon="□" onClick={max} />
          <WindowBtn icon="✕" onClick={close} danger />
        </div>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: 280, flexShrink: 0 }}
          >
            <Sidebar activeView={view} onViewChange={setView} onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginTop: 40,
          height: 'calc(100vh - 40px)',
          overflow: 'hidden'
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              style={{
                padding: 8,
                background: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              ☰
            </button>
            <span style={{ fontWeight: 600 }}>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
          </motion.div>
        )}

        {/* View Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  )
}

function WindowBtn({ icon, onClick, danger }: { icon: string; onClick?: () => void; danger?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: danger ? 'transparent' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        color: danger ? 'var(--error)' : 'var(--text-secondary)',
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--error)' : 'var(--bg-hover)'
        e.currentTarget.style.color = danger ? 'white' : 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-secondary)'
      }}
    >
      {icon}
    </motion.button>
  )
}
