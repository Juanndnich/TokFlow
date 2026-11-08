import { JSX } from 'preact'

export interface TabItem {
  id: string
  label: string
  badge?: number | string
  badgeCount?: number
  icon?: preact.ComponentChildren
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  trailingElement?: preact.ComponentChildren
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  trailingElement
}: TabsProps): JSX.Element {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIdx = (index + 1) % tabs.length
      onChange(tabs[nextIdx].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIdx = (index - 1 + tabs.length) % tabs.length
      onChange(tabs[prevIdx].id)
    }
  }

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: 'var(--radius-sm)'
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab
          const badgeVal = tab.badgeCount !== undefined ? tab.badgeCount : tab.badge
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: isActive ? 'var(--bg-raised)' : 'transparent',
                color: isActive ? 'var(--brand-lime)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                outline: 'none'
              }}
              className="tokflow-tab-btn"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {badgeVal !== undefined && Number(badgeVal) > 0 ? (
                <span
                  style={{
                    backgroundColor: 'var(--brand-lime)',
                    color: '#0B0D0A',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}
                >
                  {badgeVal}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {trailingElement}
    </div>
  )
}
