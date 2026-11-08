import { JSX } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Trash2, Pin, PinOff, Minimize2, Eye } from 'lucide-preact'
import { IconButton } from './IconButton'
import { Tooltip } from './Tooltip'
import { STRINGS } from '../strings/id'

export interface BottomBarProps {
  fontSize: number
  alwaysOnTop: boolean
  opacity: number
  onFontSizeChange: (size: number) => void
  onToggleAlwaysOnTop: () => void
  onOpacityChange: (opacity: number) => void
  onClearDisplay: () => void
  onToggleMiniMode: () => void
}

export function BottomBar({
  fontSize,
  alwaysOnTop,
  opacity,
  onFontSizeChange,
  onToggleAlwaysOnTop,
  onOpacityChange,
  onClearDisplay,
  onToggleMiniMode
}: BottomBarProps): JSX.Element {
  const [localOpacity, setLocalOpacity] = useState(opacity)

  useEffect(() => {
    setLocalOpacity(opacity)
  }, [opacity])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        flexShrink: 0
      }}
      className="tokflow-bottom-bar"
    >
      {/* Font Size A- / A+ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          aria-label={STRINGS.bottomBar.fontSizeDec}
          title={STRINGS.bottomBar.fontSizeDec}
          disabled={fontSize <= 11}
          onClick={() => onFontSizeChange(Math.max(11, fontSize - 1))}
          className="tokflow-btn tokflow-btn-secondary"
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: fontSize <= 11 ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            opacity: fontSize <= 11 ? 0.4 : 1
          }}
        >
          A-
        </button>
        <span className="font-mono" style={{ fontSize: '11px', minWidth: '18px', textAlign: 'center' }}>
          {fontSize}
        </span>
        <button
          type="button"
          aria-label={STRINGS.bottomBar.fontSizeInc}
          title={STRINGS.bottomBar.fontSizeInc}
          disabled={fontSize >= 18}
          onClick={() => onFontSizeChange(Math.min(18, fontSize + 1))}
          className="tokflow-btn tokflow-btn-secondary"
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: fontSize >= 18 ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            opacity: fontSize >= 18 ? 0.4 : 1
          }}
        >
          A+
        </button>
      </div>

      {/* Slider Transparansi & Always On Top & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Slider Transparansi Ringkas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} title={STRINGS.bottomBar.opacityTooltip}>
          <Eye size={13} style={{ color: 'var(--text-muted)' }} />
          <input
            type="range"
            min={30}
            max={100}
            value={localOpacity}
            onInput={(e) => {
              const val = Number((e.target as HTMLInputElement).value)
              setLocalOpacity(val)
              window.tokflow?.setWindowOpacity(val)
            }}
            onChange={(e) => {
              const val = Number((e.target as HTMLInputElement).value)
              onOpacityChange(val)
            }}
            style={{ width: '50px', accentColor: 'var(--brand-lime)', cursor: 'pointer' }}
          />
        </div>

        {/* Always On Top Toggle */}
        <Tooltip content={STRINGS.bottomBar.alwaysOnTop}>
          <IconButton
            label={STRINGS.bottomBar.alwaysOnTop}
            size={28}
            onClick={onToggleAlwaysOnTop}
            style={{ color: alwaysOnTop ? 'var(--brand-lime)' : 'var(--text-muted)' }}
          >
            {alwaysOnTop ? <Pin size={14} /> : <PinOff size={14} />}
          </IconButton>
        </Tooltip>

        {/* Hapus Tampilan */}
        <Tooltip content={STRINGS.bottomBar.clearDisplay}>
          <IconButton
            label={STRINGS.bottomBar.clearDisplay}
            size={28}
            onClick={onClearDisplay}
            variant="danger"
          >
            <Trash2 size={14} />
          </IconButton>
        </Tooltip>

        {/* Mode Mini */}
        <Tooltip content={STRINGS.bottomBar.miniMode}>
          <IconButton
            label={STRINGS.bottomBar.miniMode}
            size={28}
            onClick={onToggleMiniMode}
          >
            <Minimize2 size={14} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}
