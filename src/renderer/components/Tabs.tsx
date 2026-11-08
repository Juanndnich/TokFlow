import { JSX } from 'preact'

export interface TabItem {
  id: string
  label: string
  badge?: number | string
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
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 8px',
        backgroundColor: 'var(--bg-panel)'
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeTab
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
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--brand-lime)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--brand-lime)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              className="tokflow-tab"
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== 0 ? (
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--brand-lime)' : 'var(--border-subtle)',
                    color: isActive ? 'var(--text-on-lime)' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}
                  className="font-mono"
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {trailingElement && <div>{trailingElement}</div>}
    </div>
  )
}
