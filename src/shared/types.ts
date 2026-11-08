export type ConnectionStatus =
  'disconnected' | 'connecting' | 'connected' | 'offline' | 'no_internet' | 'error'

export interface ChatMessage {
  id: string
  seq: number
  userId: string
  uniqueId: string
  nickname: string
  comment: string
  timestamp: number
  profilePictureUrl?: string
  isPinned?: boolean
}

export interface GiftMessage {
  id: string
  seq: number
  groupId: string
  userId: string
  uniqueId: string
  nickname: string
  giftId: number
  giftName: string
  giftPictureUrl?: string
  userProfilePictureUrl?: string
  diamondCount: number
  repeatCount: number
  totalCoins: number
  timestamp: number
  isComboEnding?: boolean
}

export interface TopGifter {
  userId: string
  uniqueId: string
  nickname: string
  coins: number
  profilePictureUrl?: string
}

export interface SessionStats {
  viewers: number
  isViewerStale: boolean
  likes: number
  totalCoins: number
  durationSeconds: number
  peakViewers: number
  totalComments: number
  topGifters: TopGifter[]
  pinnedComment?: ChatMessage
}

export interface SessionSnapshot {
  seq: number
  status: ConnectionStatus
  statusMessage?: string
  username: string
  stats: SessionStats
  recentChats: ChatMessage[]
  recentGifts: GiftMessage[]
  activeGoals?: {
    likeGoal?: { current: number; target: number }
    coinGoal?: { current: number; target: number }
  }
}

export type SessionEvent =
  | { type: 'status_change'; seq: number; status: ConnectionStatus; message?: string }
  | { type: 'chat'; seq: number; chat: ChatMessage }
  | { type: 'gift'; seq: number; gift: GiftMessage; stats: SessionStats }
  | { type: 'stats_update'; seq: number; stats: SessionStats }
  | { type: 'pin_chat'; seq: number; chat?: ChatMessage }
  | { type: 'clear_display'; seq: number }
  | { type: 'session_reset'; seq: number; summary?: SessionSummary }

export interface SessionSummary {
  id: string
  username: string
  startTime: number
  endTime: number
  durationSeconds: number
  peakViewers: number
  totalComments: number
  totalCoins: number
  totalLikes: number
  topGifters: TopGifter[]
}

export interface AppSettings {
  version: number
  connection: {
    lastUsername: string
    signApiKey: string
    enableHttpPolling: boolean
  }
  overlay: {
    port: number
    token: string
    fontSize: number
    width: number
    autoHideSeconds: number
  }
  display: {
    density: 'comfortable' | 'compact'
    fontSize: number
    windowOpacity: number
    alwaysOnTop: boolean
  }
  features: {
    enableModeration: boolean
    enableFollowEvents: boolean
    enableShareEvents: boolean
    enableJoinEvents: boolean
    enableGoals: boolean
    enableHotkeys: boolean
    enableCheckUpdates: boolean
  }
  moderation: {
    hiddenUsers: string[]
    blockedWords: string[]
    highlightedWords: string[]
    antiSpamDuplicateThreshold: number
  }
  goals: {
    likeTarget: number
    coinTarget: number
  }
  diagnostics: {
    rawLogEnabled: boolean
  }
}

export interface AppMetrics {
  totalRamMB: number
  cpuPercent: number
  messagesPerSecond: number
  droppedEventsCount: number
  activePort: number
  connectionStatus: ConnectionStatus
  libraryVersion: string
}

export interface ViewerSourceStatus {
  sourceA: { value: number; ageSeconds: number }
  sourceB: { value: number; ageSeconds: number }
  sourceC: { value: number; ageSeconds: number }
  activeSource: 'A' | 'B' | 'C' | 'none'
  currentViewer: number
}
