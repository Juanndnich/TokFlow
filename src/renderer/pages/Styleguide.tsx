import { JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Button } from '../components/Button'
import { IconButton } from '../components/IconButton'
import { Input } from '../components/Input'
import { Switch } from '../components/Switch'
import { Slider } from '../components/Slider'
import { Select } from '../components/Select'
import { Tabs } from '../components/Tabs'
import { Badge } from '../components/Badge'
import { StatusPill } from '../components/StatusPill'
import { Card } from '../components/Card'
import { StatCard } from '../components/StatCard'
import { Banner } from '../components/Banner'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { Drawer } from '../components/Drawer'
import { Modal } from '../components/Modal'
import { MessageSquare, Eye, Heart, Coins, Settings, ArrowLeft } from 'lucide-preact'

export function Styleguide(): JSX.Element {
  const [switchVal, setSwitchVal] = useState(true)
  const [sliderVal, setSliderVal] = useState(75)
  const [selectVal, setSelectVal] = useState('1')
  const [activeTab, setActiveTab] = useState('tab1')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <IconButton label="Kembali" onClick={() => (window.location.hash = '')}>
          <ArrowLeft size={18} />
        </IconButton>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: 'var(--brand-lime)' }}>
            TokFlow Design System & Styleguide
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            Dokumentasi visual semua token CSS dan komponen UI
          </p>
        </div>
      </header>

      {/* 1. Color Palette Tokens */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          Palet Warna & Design Tokens
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Base Background', val: '#0B0D0A', token: '--bg-base' },
            { label: 'Panel', val: '#12160F', token: '--bg-panel' },
            { label: 'Panel Raised', val: '#1A2017', token: '--bg-panel-raised' },
            { label: 'Border Subtle', val: '#252D21', token: '--border-subtle' },
            { label: 'Brand Lime', val: '#B6F23C', token: '--brand-lime' },
            { label: 'Accent Purple', val: '#8B7CF6', token: '--accent-purple' },
            { label: 'Accent Cyan', val: '#2DD4BF', token: '--accent-cyan' },
            { label: 'Danger Red', val: '#F43F5E', token: '--color-danger' },
            { label: 'Warning Amber', val: '#F5B83D', token: '--color-warning' },
            { label: 'Text Primary', val: '#E8EDE4', token: '--text-primary' },
            { label: 'Text Muted', val: '#8A9585', token: '--text-muted' }
          ].map((c) => (
            <div
              key={c.token}
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              <div style={{ height: '40px', backgroundColor: c.val, borderBottom: '1px solid var(--border-subtle)' }} />
              <div style={{ padding: '8px', fontSize: '11px' }}>
                <div style={{ fontWeight: 600 }}>{c.label}</div>
                <div className="font-mono" style={{ color: 'var(--text-muted)' }}>{c.val}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Status Pills */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>StatusPill</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusPill status="disconnected" />
          <StatusPill status="connecting" />
          <StatusPill status="connected" />
          <StatusPill status="offline" />
          <StatusPill status="no_internet" />
          <StatusPill status="error" />
        </div>
      </section>

      {/* 3. Stat Cards */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>StatCards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <StatCard label="Penonton" value={1250} icon={<Eye size={14} />} />
          <StatCard label="Like" value={45200} icon={<Heart size={14} />} />
          <StatCard label="Koin" value={840} icon={<Coins size={14} />} />
          <StatCard label="Durasi" value={3665} isDuration />
        </div>
        <div style={{ marginTop: '8px' }}>
          <StatCard label="Penonton Basi (>20s)" value={950} isStale icon={<Eye size={14} />} />
        </div>
      </section>

      {/* 4. Buttons */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Button & IconButton</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="primary">Primary Lime</Button>
          <Button variant="secondary">Secondary Panel</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <IconButton label="Pengaturan" variant="panel"><Settings size={16} /></IconButton>
        </div>
      </section>

      {/* 5. Inputs & Controls */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Input, Switch, Slider, Select</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '360px' }}>
          <Input prefixText="@" placeholder="username_tiktok" />
          <Input placeholder="Normal input..." />
          <Input placeholder="Input error" error="Contoh pesan error validasi" />
          <Input placeholder="Input disabled" disabled value="Nilai terkunci" />
          <Switch checked={switchVal} onChange={setSwitchVal} label="Opsi Sakelar Aktif" description="Penjelasan singkat fitur" />
          <Slider value={sliderVal} min={30} max={100} onChange={setSliderVal} label="Transparansi Jendela" unit="%" />
          <Select
            value={selectVal}
            onChange={setSelectVal}
            label="Pilihan Kepadatan"
            options={[
              { value: '1', label: 'Nyaman (Comfortable)' },
              { value: '2', label: 'Padat (Compact)' }
            ]}
          />
        </div>
      </section>

      {/* 6. Tabs & Badges */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Tabs & Badges</h2>
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'tab1', label: 'Obrolan', badge: 12 },
            { id: 'tab2', label: 'Gift', badge: 5 },
            { id: 'tab3', label: 'Event' }
          ]}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Badge variant="lime">x10 Combo</Badge>
          <Badge variant="warning">500 Koin</Badge>
          <Badge variant="purple">Follow</Badge>
          <Badge variant="cyan">Pin Chat</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
      </section>

      {/* 7. Banner & Skeletons */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Banner & Skeleton</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          <Banner variant="info" message="Pemberitahuan informasi sistem penting." actionText="Pelajari" onAction={() => {}} />
          <Banner variant="warning" message="Koneksi lambat terdeteksi." actionText="Cek" onAction={() => {}} />
          <Banner variant="error" message="Gagal menghubungi server TikTok." actionText="Coba lagi" onAction={() => {}} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' }}>
          <Skeleton height="20px" width="70%" />
          <Skeleton height="14px" width="100%" />
          <Skeleton height="14px" width="85%" />
        </div>
      </section>

      {/* 8. Empty States */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>EmptyState & Cards</h2>
        <Card>
          <EmptyState
            title="Belum ada obrolan live"
            description="Pesan obrolan penonton akan muncul di sini secara realtime."
            icon={<MessageSquare size={24} />}
            action={<Button size="sm" variant="secondary">Mulai Uji Demo</Button>}
          />
        </Card>
      </section>

      {/* 9. Drawer & Modal Triggers */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '15px', marginBottom: '12px' }}>Drawer & Modal</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button onClick={() => setDrawerOpen(true)}>Buka Drawer Pengaturan</Button>
          <Button onClick={() => setModalOpen(true)}>Buka Modal Ringkasan</Button>
        </div>
      </section>

      {/* Drawer Demo */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Pengaturan">
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Bagian 1: Pengaturan Koneksi</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Isi badan drawer dapat di-scroll dengan lancar dan tombol tutup tetap terlihat.
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Bagian 2: Tampilan</h4>
          <Switch checked={switchVal} onChange={setSwitchVal} label="Aktifkan Mode Gelap Ekstra" />
        </div>
      </Drawer>

      {/* Modal Demo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ringkasan Sesi"
        footer={<Button variant="primary" onClick={() => setModalOpen(false)}>Selesai</Button>}
      >
        <p style={{ margin: 0, fontSize: '13px' }}>Ringkasan statistik live stream TokFlow.</p>
      </Modal>
    </div>
  )
}
