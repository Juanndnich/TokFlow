import { JSX } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Settings, Play, Square } from 'lucide-preact'
import { ConnectionStatus } from '../../shared/types'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Input } from './Input'
import { StatusPill } from './StatusPill'
import { STRINGS } from '../strings/id'

export interface ConnectionBarProps {
  status: ConnectionStatus
  initialUsername: string
  isDemoActive: boolean
  onConnect: (username: string) => void
  onDisconnect: () => void
  onToggleDemo: () => void
  onOpenSettings: () => void
}

export function ConnectionBar({
  status,
  initialUsername,
  isDemoActive,
  onConnect,
  onDisconnect,
  onToggleDemo,
  onOpenSettings
}: ConnectionBarProps): JSX.Element {
  const [username, setUsername] = useState(initialUsername || '')

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername)
    }
  }, [initialUsername])

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !isConnected && !isConnecting) {
      e.preventDefault()
      onConnect(username)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px 12px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}
      className="tokflow-connection-bar"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <StatusPill status={status} />
        <IconButton label={STRINGS.connection.settings} onClick={onOpenSettings} size={30}>
          <Settings size={16} />
        </IconButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <Input
            prefixText="@"
            placeholder={STRINGS.connection.usernamePlaceholder}
            value={username}
            disabled={isConnected || isConnecting || isDemoActive}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {isConnected ? (
          <Button variant="danger" size="sm" onClick={onDisconnect}>
            {STRINGS.connection.disconnect}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            isLoading={isConnecting}
            disabled={isDemoActive || !username.trim()}
            onClick={() => onConnect(username)}
          >
            {STRINGS.connection.connect}
          </Button>
        )}

        <Button
          variant={isDemoActive ? 'danger' : 'secondary'}
          size="sm"
          onClick={onToggleDemo}
          disabled={isConnected || isConnecting}
        >
          {isDemoActive ? <Square size={12} /> : <Play size={12} />}
          {isDemoActive ? STRINGS.connection.stopDemo : STRINGS.connection.demo}
        </Button>
      </div>
    </div>
  )
}
