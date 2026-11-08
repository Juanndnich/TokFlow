import { JSX } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import { X } from 'lucide-preact'
import { IconButton } from './IconButton'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: preact.ComponentChildren
  footer?: preact.ComponentChildren
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '460px'
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-panel-raised)',
            flexShrink: 0
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h2>
          <IconButton label="Tutup" size={32} onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px'
          }}
        >
          {children}
        </div>

        {footer && (
          <footer
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-panel-raised)',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
