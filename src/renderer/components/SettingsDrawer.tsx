import { JSX } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import {
  Copy,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Check,
  AlertTriangle,
  Info
} from 'lucide-preact'
import { AppSettings, AppMetrics, ViewerSourceStatus } from '../../shared/types'
import { Drawer } from './Drawer'
import { Button } from './Button'
import { Input } from './Input'
import { Switch } from './Switch'
import { Slider } from './Slider'
import { Select } from './Select'
import { STRINGS } from '../strings/id'

export interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onSaveSettings: (settings: Partial<AppSettings>) => void
  onCopyText: (text: string) => void
  onShowToast: (msg: string) => void
}

export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onCopyText,
  onShowToast
}: SettingsDrawerProps): JSX.Element | null {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyTesting, setApiKeyTesting] = useState(false)
  const [apiKeyTestResult, setApiKeyTestResult] = useState<string | null>(null)

  const [overlayInfo, setOverlayInfo] = useState({ url: '', port: 8899, token: '', activeCount: 0 })
  const [metrics, setMetrics] = useState<AppMetrics | null>(null)
  const [viewerDiagnostic, setViewerDiagnostic] = useState<ViewerSourceStatus | null>(null)

  const [compViewers, setCompViewers] = useState('')
  const [compLikes, setCompLikes] = useState('')
  const [compSaved, setCompSaved] = useState(false)

  // Update overlay info & metrics saat drawer dibuka
  useEffect(() => {
    if (isOpen && window.tokflow) {
      const api = window.tokflow
      api.getOverlayInfo().then(setOverlayInfo).catch(() => {})
      api.getMetrics().then(setMetrics).catch(() => {})
      api.getViewerDiagnostic().then(setViewerDiagnostic).catch(() => {})

      const interval = setInterval(() => {
        api.getMetrics().then(setMetrics).catch(() => {})
        api.getViewerDiagnostic().then(setViewerDiagnostic).catch(() => {})
      }, 2500)

      return () => clearInterval(interval)
    }
    return undefined
  }, [isOpen])

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim() && !settings.connection.signApiKey) return
    if (!window.tokflow) return
    setApiKeyTesting(true)
    setApiKeyTestResult(null)
    try {
      const res = await window.tokflow.testApiKey(apiKeyInput || settings.connection.signApiKey)
      setApiKeyTesting(false)
      if (res.success) {
        setApiKeyTestResult(STRINGS.drawer.fields.keyValid)
      } else {
        setApiKeyTestResult(res.error || STRINGS.drawer.fields.keyInvalid)
      }
    } catch {
      setApiKeyTesting(false)
      setApiKeyTestResult(STRINGS.drawer.fields.keyInvalid)
    }
  }

  const handleRegenerateToken = async () => {
    if (!window.tokflow) return
    if (window.confirm(STRINGS.drawer.fields.regenerateConfirm)) {
      const newToken = await window.tokflow.regenerateOverlayToken()
      setOverlayInfo((prev) => ({
        ...prev,
        token: newToken,
        url: prev.url.replace(/token=[a-f0-9]+/, `token=${newToken}`)
      }))
      onShowToast('Token overlay berhasil diperbarui')
    }
  }

  const handleSaveComparison = async () => {
    const v = parseInt(compViewers, 10)
    const l = parseInt(compLikes, 10)
    if (!isNaN(v) && !isNaN(l) && window.tokflow) {
      await window.tokflow.logComparison(v, l)
      setCompSaved(true)
      setTimeout(() => setCompSaved(false), 2000)
      onShowToast('Angka pembanding dicatat ke log')
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={STRINGS.drawer.title}>
      {/* 1. KONEKSI & TIKTOK */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--brand-lime)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {STRINGS.drawer.sections.connection}
        </h3>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            {STRINGS.drawer.fields.signApiKey}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <Input
                type="password"
                placeholder={settings.connection.signApiKey || 'Masukkan Sign API Key...'}
                value={apiKeyInput}
                onInput={(e) => setApiKeyInput((e.target as HTMLInputElement).value)}
              />
            </div>
            <Button size="sm" variant="secondary" isLoading={apiKeyTesting} onClick={handleTestApiKey}>
              {STRINGS.drawer.fields.testKey}
            </Button>
            {apiKeyInput && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onSaveSettings({ connection: { ...settings.connection, signApiKey: apiKeyInput } })
                  setApiKeyInput('')
                  onShowToast('Sign API Key disimpan')
                }}
              >
                Simpan
              </Button>
            )}
          </div>
          {apiKeyTestResult && (
            <div style={{ fontSize: '11px', marginTop: '4px', color: apiKeyTestResult === STRINGS.drawer.fields.keyValid ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {apiKeyTestResult}
            </div>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
            {STRINGS.drawer.fields.signApiKeyHelp}
          </span>
        </div>

        <div style={{ padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <Switch
            checked={settings.connection.enableHttpPolling}
            onChange={(enableHttpPolling) =>
              onSaveSettings({ connection: { ...settings.connection, enableHttpPolling } })
            }
            label={STRINGS.drawer.fields.httpPolling}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px', color: 'var(--color-warning)', fontSize: '11px', lineHeight: 1.4 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{STRINGS.drawer.fields.httpPollingWarning}</span>
          </div>
        </div>
      </section>

      {/* 2. OVERLAY OBS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {STRINGS.drawer.sections.overlay}
        </h3>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            {STRINGS.drawer.fields.overlayUrl}
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              readOnly
              value={overlayInfo.url || `http://127.0.0.1:${settings.overlay.port}/overlay?token=...`}
              style={{
                flex: 1,
                padding: '6px 10px',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onCopyText(overlayInfo.url)
                onShowToast('URL Overlay disalin ke clipboard')
              }}
            >
              <Copy size={13} />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.tokflow?.openOverlayInBrowser()}>
              <ExternalLink size={13} />
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {STRINGS.drawer.fields.activePort}: <strong className="font-mono" style={{ color: 'var(--brand-lime)' }}>{overlayInfo.port || settings.overlay.port}</strong>
          </span>
          <Button size="sm" variant="ghost" onClick={handleRegenerateToken}>
            <RefreshCw size={12} />
            {STRINGS.drawer.fields.regenerateToken}
          </Button>
        </div>

        <Slider
          value={settings.overlay.fontSize}
          min={10}
          max={32}
          label={STRINGS.drawer.fields.overlayFontSize}
          unit="px"
          onChange={(fontSize) => onSaveSettings({ overlay: { ...settings.overlay, fontSize } })}
        />

        <Slider
          value={settings.overlay.width}
          min={250}
          max={800}
          step={10}
          label={STRINGS.drawer.fields.overlayWidth}
          unit="px"
          onChange={(width) => onSaveSettings({ overlay: { ...settings.overlay, width } })}
        />

        <Slider
          value={settings.overlay.autoHideSeconds}
          min={2}
          max={60}
          label={STRINGS.drawer.fields.autoHideSeconds}
          unit=" dtk"
          onChange={(autoHideSeconds) => onSaveSettings({ overlay: { ...settings.overlay, autoHideSeconds } })}
        />
      </section>

      {/* 3. TAMPILAN */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {STRINGS.drawer.sections.display}
        </h3>

        <Select
          label={STRINGS.drawer.fields.density}
          value={settings.display.density}
          options={[
            { value: 'comfortable', label: STRINGS.drawer.fields.densityComfortable },
            { value: 'compact', label: STRINGS.drawer.fields.densityCompact }
          ]}
          onChange={(density) =>
            onSaveSettings({ display: { ...settings.display, density: density as 'comfortable' | 'compact' } })
          }
        />

        <Slider
          value={settings.display.fontSize}
          min={11}
          max={18}
          label={STRINGS.drawer.fields.fontSize}
          unit="px"
          onChange={(fontSize) => onSaveSettings({ display: { ...settings.display, fontSize } })}
        />
      </section>

      {/* 4. FITUR PLUS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {STRINGS.drawer.sections.features}
        </h3>

        <Switch
          checked={settings.features.enableModeration}
          onChange={(enableModeration) => onSaveSettings({ features: { ...settings.features, enableModeration } })}
          label={STRINGS.drawer.fields.enableModeration}
        />
        <Switch
          checked={settings.features.enableFollowEvents}
          onChange={(enableFollowEvents) => onSaveSettings({ features: { ...settings.features, enableFollowEvents } })}
          label={STRINGS.drawer.fields.enableFollowEvents}
        />
        <Switch
          checked={settings.features.enableShareEvents}
          onChange={(enableShareEvents) => onSaveSettings({ features: { ...settings.features, enableShareEvents } })}
          label={STRINGS.drawer.fields.enableShareEvents}
        />
        <Switch
          checked={settings.features.enableJoinEvents}
          onChange={(enableJoinEvents) => onSaveSettings({ features: { ...settings.features, enableJoinEvents } })}
          label={STRINGS.drawer.fields.enableJoinEvents}
          description="Default mati untuk mencegah keramaian chat"
        />
        <Switch
          checked={settings.features.enableGoals}
          onChange={(enableGoals) => onSaveSettings({ features: { ...settings.features, enableGoals } })}
          label={STRINGS.drawer.fields.enableGoals}
        />
        <Switch
          checked={settings.features.enableHotkeys}
          onChange={(enableHotkeys) => onSaveSettings({ features: { ...settings.features, enableHotkeys } })}
          label={STRINGS.drawer.fields.enableHotkeys}
        />
        <Switch
          checked={settings.features.enableCheckUpdates}
          onChange={(enableCheckUpdates) => onSaveSettings({ features: { ...settings.features, enableCheckUpdates } })}
          label={STRINGS.drawer.fields.enableCheckUpdates}
          description="Pemeriksaan manual versi rilis resmi melalui GitHub"
        />
      </section>

      {/* 5. DIAGNOSTIK & PERFORMA */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {STRINGS.drawer.sections.diagnostics}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{STRINGS.drawer.fields.ramTotal}</div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-lime)' }}>
              {metrics ? `${metrics.totalRamMB} MB` : '...'}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{STRINGS.drawer.fields.cpuUsage}</div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
              {metrics ? `${metrics.cpuPercent}%` : '...'}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{STRINGS.drawer.fields.messagesPerSec}</div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
              {metrics ? `${metrics.messagesPerSecond}/dtk` : '...'}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)' }}>{STRINGS.drawer.fields.libraryVersion}</div>
            <div className="font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
              {metrics?.libraryVersion || '2.5.0'}
            </div>
          </div>
        </div>

        {/* Tabel Sumber Penonton */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            {STRINGS.drawer.fields.viewerSourcesTitle}
          </label>
          <div style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-panel-raised)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 8px' }}>Sumber</th>
                  <th style={{ padding: '6px 8px' }}>Nilai Terakhir</th>
                  <th style={{ padding: '6px 8px' }}>Umur</th>
                  <th style={{ padding: '6px 8px' }}>Aktif</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 8px' }}>A (Room User)</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic?.sourceA.value ?? '-'}</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic ? `${viewerDiagnostic.sourceA.ageSeconds}s` : '-'}</td>
                  <td style={{ padding: '6px 8px' }}>{viewerDiagnostic?.activeSource === 'A' ? <span style={{ color: 'var(--brand-lime)', fontWeight: 700 }}>Ya</span> : 'Tidak'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 8px' }}>B (Member Join)</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic?.sourceB.value ?? '-'}</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic ? `${viewerDiagnostic.sourceB.ageSeconds}s` : '-'}</td>
                  <td style={{ padding: '6px 8px' }}>{viewerDiagnostic?.activeSource === 'B' ? <span style={{ color: 'var(--brand-lime)', fontWeight: 700 }}>Ya</span> : 'Tidak'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px' }}>C (Room Info)</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic?.sourceC.value ?? '-'}</td>
                  <td className="font-mono" style={{ padding: '6px 8px' }}>{viewerDiagnostic ? `${viewerDiagnostic.sourceC.ageSeconds}s` : '-'}</td>
                  <td style={{ padding: '6px 8px' }}>{viewerDiagnostic?.activeSource === 'C' ? <span style={{ color: 'var(--brand-lime)', fontWeight: 700 }}>Ya</span> : 'Tidak'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Catat Pembanding */}
        <div style={{ padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
            {STRINGS.drawer.fields.comparisonTitle}
          </label>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            {STRINGS.drawer.fields.comparisonHelp}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
            <Input
              placeholder={STRINGS.drawer.fields.tiktokViewerInput}
              value={compViewers}
              onInput={(e) => setCompViewers((e.target as HTMLInputElement).value)}
            />
            <Input
              placeholder={STRINGS.drawer.fields.tiktokLikeInput}
              value={compLikes}
              onInput={(e) => setCompLikes((e.target as HTMLInputElement).value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="secondary" onClick={handleSaveComparison} disabled={!compViewers || !compLikes}>
              {compSaved ? <Check size={13} style={{ color: 'var(--brand-lime)' }} /> : null}
              {STRINGS.drawer.fields.saveComparison}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.tokflow?.openLogFolder()}>
              <FolderOpen size={13} />
              {STRINGS.drawer.fields.openLogFolder}
            </Button>
          </div>
        </div>

        {/* Sakelar Raw Log */}
        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <Switch
            checked={settings.diagnostics.rawLogEnabled}
            onChange={(rawLogEnabled) => onSaveSettings({ diagnostics: { ...settings.diagnostics, rawLogEnabled } })}
            label={STRINGS.drawer.fields.rawLogToggle}
          />
          {settings.diagnostics.rawLogEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'var(--brand-lime)', fontSize: '11px' }}>
              <Info size={13} />
              <span>{STRINGS.drawer.fields.rawLogNotice}</span>
            </div>
          )}
        </div>
      </section>

      {/* 6. TENTANG APLIKASI (Elemen Terakhir, harus terlihat saat di-scroll) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--brand-lime)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {STRINGS.drawer.sections.about}
        </h3>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <div>{STRINGS.drawer.about.version}</div>
          <div>{STRINGS.drawer.about.license}</div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
            {STRINGS.drawer.about.disclaimer}
          </div>
        </div>
      </section>
    </Drawer>
  )
}
