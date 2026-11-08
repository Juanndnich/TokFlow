import { JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { X } from 'lucide-preact'
import { IconButton } from './IconButton'
import { STRINGS } from '../strings/id'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: preact.ComponentChildren
  footer?: preact.ComponentChildren
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer
}: DrawerProps): JSX.Element | null {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus drawer on open
      setTimeout(() => {
        const closeBtn = drawerRef.current?.querySelector('button')
        closeBtn?.focus()
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        previousFocusRef.current?.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(2px)'
      }}
      className="tokflow-drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: 'min(420px, 100%)',
          height: '100%',
          backgroundColor: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        className="tokflow-drawer-container"
      >
        {/* Header: Judul + Tombol Tutup (TIDAK ikut scroll, SELALU terlihat) */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-panel-raised)',
            flexShrink: 0,
            zIndex: 10
          }}
          className="tokflow-drawer-header"
        >
          <h2
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            {title}
          </h2>
          <IconButton
            label={STRINGS.drawer.close}
            size={32}
            onClick={onClose}
            className="tokflow-drawer-close"
          >
            <X size={18} />
          </IconButton>
        </header>

        {/* Badan: Scrollable, min-height: 0, overflow-x: hidden */}
        <div
          ref={bodyRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
          className="tokflow-drawer-body"
        >
          {children}
        </div>

        {/* Footer Tetap Opsional */}
        {footer && (
          <footer
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-panel-raised)',
              flexShrink: 0
            }}
            className="tokflow-drawer-footer"
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
