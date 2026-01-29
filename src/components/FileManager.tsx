import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Folder, File, FileCode, FileText, Image, Music, Video,
  ChevronRight, ChevronDown, Plus, Search, Grid, List,
  Upload, Download, Trash2, Rename, Copy, MoreVertical,
  Home, Desktop, Download as DownloadFolder
} from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  modified: Date
  children?: FileItem[]
}

const mockFiles: FileItem[] = [
  {
    id: '1', name: 'Documents', type: 'folder', modified: new Date(), children: [
      { id: '1-1', name: 'report.pdf', type: 'file', size: 245000, modified: new Date() },
      { id: '1-2', name: 'notes.txt', type: 'file', size: 1200, modified: new Date() },
    ]
  },
  {
    id: '2', name: 'Projects', type: 'folder', modified: new Date(), children: [
      {
        id: '2-1', name: 'ex-robot', type: 'folder', modified: new Date(), children: [
          { id: '2-1-1', name: 'main.ts', type: 'file', size: 4500, modified: new Date() },
          { id: '2-1-2', name: 'App.tsx', type: 'file', size: 3200, modified: new Date() },
          { id: '2-1-3', name: 'package.json', type: 'file', size: 890, modified: new Date() },
        ]
      },
      { id: '2-2', name: 'website', type: 'folder', modified: new Date() },
    ]
  },
  { id: '3', name: 'Downloads', type: 'folder', modified: new Date() },
  { id: '4', name: 'Pictures', type: 'folder', modified: new Date() },
  { id: '5', name: 'config.json', type: 'file', size: 456, modified: new Date() },
]

const quickPaths = [
  { icon: Home, label: '主目录', path: '~' },
  { icon: Desktop, label: '桌面', path: '~/Desktop' },
  { icon: DownloadFolder, label: '下载', path: '~/Downloads' },
]

const fileIcons: Record<string, any> = {
  tsx: FileCode, ts: FileCode, js: FileCode, jsx: FileCode,
  txt: FileText, md: FileText, json: FileText,
  png: Image, jpg: Image, jpeg: Image, gif: Image, svg: Image,
  mp3: Music, wav: Music, ogg: Music,
  mp4: Video, avi: Video, mov: Video,
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return fileIcons[ext] || File
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('~')
  const [files, setFiles] = useState<FileItem[]>(mockFiles)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '2']))
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedFolders(next)
  }

  const getFileIconComponent = (item: FileItem) => {
    if (item.type === 'folder') {
      return expandedFolders.has(item.id) ? ChevronDown : ChevronRight
    }
    const Icon = getFileIcon(item.name)
    return Icon
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
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Quick Access */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase',
            marginBottom: 8
          }}>
            快速访问
          </div>
          {quickPaths.map((p, i) => (
            <motion.button
              key={p.path}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: currentPath === p.path ? 'var(--accent-glow)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: currentPath === p.path ? 'var(--accent-light)' : 'var(--text-secondary)',
                fontSize: 13
              }}
            >
              <p.icon size={16} />
              <span>{p.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Locations */}
        <div style={{ flex: 1, padding: '16px 16px 8px', overflowY: 'auto' }}>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase',
            marginBottom: 8
          }}>
            位置
          </div>
          <FileTree 
            files={files} 
            expandedFolders={expandedFolders}
            selectedFile={selectedFile}
            onToggle={toggleFolder}
            onSelect={setSelectedFile}
          />
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)'
          }}
        >
          {/* Path */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--accent)' }}>📁</span>
            {currentPath}
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ 
              position: 'absolute', 
              left: 12, 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ 
                paddingLeft: 36, 
                width: 200,
                background: 'var(--bg-tertiary)'
              }}
            />
          </div>

          {/* View Toggle */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)',
            padding: 4
          }}>
            <ViewBtn 
              icon={List} 
              active={viewMode === 'list'} 
              onClick={() => setViewMode('list')} 
            />
            <ViewBtn 
              icon={Grid} 
              active={viewMode === 'grid'} 
              onClick={() => setViewMode('grid')} 
            />
          </div>

          {/* Actions */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
          >
            <Plus size={16} />
            新建
          </motion.button>
        </motion.div>

        {/* File List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {viewMode === 'list' ? (
            <FileList 
              files={files}
              expandedFolders={expandedFolders}
              selectedFile={selectedFile}
              onToggle={toggleFolder}
              onSelect={setSelectedFile}
            />
          ) : (
            <FileGrid 
              files={files}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
            />
          )}
        </div>

        {/* Status Bar */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            fontSize: 12,
            color: 'var(--text-muted)'
          }}
        >
          <span>{files.length} 个项目</span>
          <span>{selectedFile ? '1 个选中' : '无选中'}</span>
        </motion.div>
      </div>
    </div>
  )
}

function FileTree({ 
  files, expandedFolders, selectedFile, onToggle, onSelect 
}: {
  files: FileItem[]
  expandedFolders: Set<string>
  selectedFile: string | null
  onToggle: (id: string) => void
  onSelect: (id: string | null) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {files.map((file, i) => (
        <motion.div
          key={file.id}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.03 }}
        >
          <TreeItem 
            item={file}
            level={0}
            expanded={expandedFolders.has(file.id)}
            selected={selectedFile === file.id}
            onToggle={onToggle}
            onSelect={onSelect}
            expandedFolders={expandedFolders}
          />
        </motion.div>
      ))}
    </div>
  )
}

function TreeItem({ 
  item, level, expanded, selected, onToggle, onSelect, expandedFolders 
}: {
  item: FileItem
  level: number
  expanded: boolean
  selected: boolean
  onToggle: (id: string) => void
  onSelect: (id: string | null) => void
  expandedFolders: Set<string>
}) {
  const Icon = item.type === 'folder' 
    ? (expanded ? ChevronDown : ChevronRight)
    : getFileIcon(item.name)

  return (
    <>
      <motion.button
        whileHover={{ background: 'var(--bg-hover)' }}
        onClick={() => {
          if (item.type === 'folder') onToggle(item.id)
          else onSelect(item.id)
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: `8px ${12 - level * 12}px`,
          background: selected ? 'var(--accent-glow)' : 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          color: selected ? 'var(--accent-light)' : 'var(--text-secondary)',
          fontSize: 13,
          textAlign: 'left'
        }}
      >
        <Icon size={14} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>
      </motion.button>
      {item.type === 'folder'&& expanded && item.children && (
        <div>
          {item.children.map((child, i) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              expanded={expandedFolders.has(child.id)}
              selected={selectedFile === child.id}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </>
  )
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const icons: Record<string, any> = {
    tsx: FileCode, ts: FileCode, js: FileCode, jsx: FileCode,
    txt: FileText, md: FileText, json: FileText,
    png: Image, jpg: Image, jpeg: Image, gif: Image, svg: Image,
  }
  return icons[ext] || File
}

function FileList({ 
  files, expandedFolders, selectedFile, onToggle, onSelect 
}: {
  files: FileItem[]
  expandedFolders: Set<string>
  selectedFile: string | null
  onToggle: (id: string) => void
  onSelect: (id: string | null) => void
}) {
  const allFiles = files.flatMap(f => f.type === 'folder' && f.children 
    ? [{ ...f, children: undefined }, ...f.children]
    : f
  )

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th style={{ 
            padding: '10px 12px', 
            textAlign: 'left', 
            fontSize: 12, 
            fontWeight: 600, 
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>名称</th>
          <th style={{ 
            padding: '10px 12px', 
            textAlign: 'left', 
            fontSize: 12, 
            fontWeight: 600, 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            width: 100
          }}>大小</th>
          <th style={{ 
            padding: '10px 12px', 
            textAlign: 'left', 
            fontSize: 12, 
            fontWeight: 600, 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            width: 150
          }}>修改日期</th>
          <th style={{ width: 50 }}></th>
        </tr>
      </thead>
      <tbody>
        {allFiles.map((file, i) => (
          <motion.tr
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            onClick={() => file.type === 'file' && onSelect(file.id)}
            style={{ 
              cursor: file.type === 'file' ? 'pointer' : 'default',
              background: selectedFile === file.id ? 'var(--accent-glow)' : 'transparent'
            }}
          >
            <td style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileItemIcon item={file} />
                <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
              </div>
            </td>
            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
              {file.size ? formatSize(file.size) : '-'}
            </td>
            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>
              {file.modified.toLocaleDateString()}
            </td>
            <td style={{ padding: '10px 12px' }}>
              <ActionMenu />
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  )
}

function FileGrid({ files, selectedFile, onSelect }: {
  files: FileItem[]
  selectedFile: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
      gap: 16 
    }}>
      {files.map((file, i) => (
        <motion.div
          key={file.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => file.type === 'file' && onSelect(file.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 16,
            background: selectedFile === file.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
            border: `1px solid ${selectedFile === file.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <FileItemIcon item={file} size={48} />
          </div>
          <span style={{ 
            fontSize: 12, 
            color: 'var(--text-primary)',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {file.name}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

function FileItemIcon({ item, size = 20 }: { item: FileItem; size?: number }) {
  const Icon = item.type === 'folder' ? Folder : getFileIcon(item.name)
  return (
    <Icon 
      size={size} 
      style={{ 
        color: item.type === 'folder' 
          ? 'var(--warning)' 
          : 'var(--text-secondary)'
      }} 
    />
  )
}

function ViewBtn({ icon: Icon, active, onClick }: { icon: any; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent)' : 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? 'white' : 'var(--text-muted)'
      }}
    >
      <Icon size={14} />
    </motion.button>
  )
}

function ActionMenu() {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-muted)'
      }}
    >
      <MoreVertical size={14} />
    </motion.button>
  )
}
