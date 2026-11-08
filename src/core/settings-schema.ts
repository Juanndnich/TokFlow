import { AppSettings } from '../shared/types'

export const CURRENT_SETTINGS_VERSION = 1

export const DEFAULT_SETTINGS: AppSettings = {
  version: CURRENT_SETTINGS_VERSION,
  connection: {
    lastUsername: '',
    signApiKey: '',
    enableHttpPolling: false
  },
  overlay: {
    port: 8899,
    token: '',
    fontSize: 14,
    width: 400,
    autoHideSeconds: 8
  },
  display: {
    density: 'comfortable',
    fontSize: 14,
    windowOpacity: 100,
    alwaysOnTop: false
  },
  features: {
    enableModeration: false,
    enableFollowEvents: true,
    enableShareEvents: true,
    enableJoinEvents: false, // Default MATI per AGENTS.md
    enableGoals: false,
    enableHotkeys: true,
    enableCheckUpdates: false // Default MATI (opt-in) per AGENTS.md
  },
  moderation: {
    hiddenUsers: [],
    blockedWords: [],
    highlightedWords: [],
    antiSpamDuplicateThreshold: 3
  },
  goals: {
    likeTarget: 1000,
    coinTarget: 500
  },
  diagnostics: {
    rawLogEnabled: false
  }
}

/**
 * Validasi dan migrasi konfigurasi pengaturan.
 * Mengembalikan objek AppSettings yang dijamin valid.
 */
export function validateAndMigrateSettings(raw: unknown): AppSettings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_SETTINGS }
  }

  const data = raw as Record<string, unknown>
  let version = typeof data.version === 'number' ? data.version : 0

  // Migrasi jika skema masa depan ditambahkan
  if (version < 1) {
    version = 1
  }

  const conn = (
    data.connection && typeof data.connection === 'object' ? data.connection : {}
  ) as Record<string, unknown>
  const ovl = (data.overlay && typeof data.overlay === 'object' ? data.overlay : {}) as Record<
    string,
    unknown
  >
  const disp = (data.display && typeof data.display === 'object' ? data.display : {}) as Record<
    string,
    unknown
  >
  const feats = (data.features && typeof data.features === 'object' ? data.features : {}) as Record<
    string,
    unknown
  >
  const mod = (
    data.moderation && typeof data.moderation === 'object' ? data.moderation : {}
  ) as Record<string, unknown>
  const goals = (data.goals && typeof data.goals === 'object' ? data.goals : {}) as Record<
    string,
    unknown
  >
  const diag = (
    data.diagnostics && typeof data.diagnostics === 'object' ? data.diagnostics : {}
  ) as Record<string, unknown>

  // Validasi port overlay rentang 8899 - 8909
  let port = typeof ovl.port === 'number' ? ovl.port : DEFAULT_SETTINGS.overlay.port
  if (port < 8899 || port > 8909) {
    port = DEFAULT_SETTINGS.overlay.port
  }

  // Validasi ukuran font (11 - 18 px)
  let fontSize =
    typeof disp.fontSize === 'number' ? disp.fontSize : DEFAULT_SETTINGS.display.fontSize
  if (fontSize < 11 || fontSize > 18) {
    fontSize = DEFAULT_SETTINGS.display.fontSize
  }

  // Validasi transparansi jendela (30 - 100 %)
  let opacity =
    typeof disp.windowOpacity === 'number'
      ? disp.windowOpacity
      : DEFAULT_SETTINGS.display.windowOpacity
  if (opacity < 30 || opacity > 100) {
    opacity = DEFAULT_SETTINGS.display.windowOpacity
  }

  return {
    version: CURRENT_SETTINGS_VERSION,
    connection: {
      lastUsername: typeof conn.lastUsername === 'string' ? conn.lastUsername.trim() : '',
      signApiKey: typeof conn.signApiKey === 'string' ? conn.signApiKey : '',
      enableHttpPolling:
        typeof conn.enableHttpPolling === 'boolean' ? conn.enableHttpPolling : false
    },
    overlay: {
      port,
      token: typeof ovl.token === 'string' ? ovl.token : '',
      fontSize:
        typeof ovl.fontSize === 'number'
          ? Math.max(10, Math.min(32, ovl.fontSize))
          : DEFAULT_SETTINGS.overlay.fontSize,
      width:
        typeof ovl.width === 'number'
          ? Math.max(250, Math.min(800, ovl.width))
          : DEFAULT_SETTINGS.overlay.width,
      autoHideSeconds:
        typeof ovl.autoHideSeconds === 'number'
          ? Math.max(2, Math.min(60, ovl.autoHideSeconds))
          : DEFAULT_SETTINGS.overlay.autoHideSeconds
    },
    display: {
      density: disp.density === 'compact' ? 'compact' : 'comfortable',
      fontSize,
      windowOpacity: opacity,
      alwaysOnTop: typeof disp.alwaysOnTop === 'boolean' ? disp.alwaysOnTop : false
    },
    features: {
      enableModeration:
        typeof feats.enableModeration === 'boolean' ? feats.enableModeration : false,
      enableFollowEvents:
        typeof feats.enableFollowEvents === 'boolean' ? feats.enableFollowEvents : true,
      enableShareEvents:
        typeof feats.enableShareEvents === 'boolean' ? feats.enableShareEvents : true,
      enableJoinEvents:
        typeof feats.enableJoinEvents === 'boolean' ? feats.enableJoinEvents : false,
      enableGoals: typeof feats.enableGoals === 'boolean' ? feats.enableGoals : false,
      enableHotkeys: typeof feats.enableHotkeys === 'boolean' ? feats.enableHotkeys : true,
      enableCheckUpdates:
        typeof feats.enableCheckUpdates === 'boolean' ? feats.enableCheckUpdates : false
    },
    moderation: {
      hiddenUsers: Array.isArray(mod.hiddenUsers)
        ? mod.hiddenUsers.filter((u: unknown): u is string => typeof u === 'string')
        : [],
      blockedWords: Array.isArray(mod.blockedWords)
        ? mod.blockedWords.filter((w: unknown): w is string => typeof w === 'string')
        : [],
      highlightedWords: Array.isArray(mod.highlightedWords)
        ? mod.highlightedWords.filter((w: unknown): w is string => typeof w === 'string')
        : [],
      antiSpamDuplicateThreshold:
        typeof mod.antiSpamDuplicateThreshold === 'number'
          ? Math.max(1, mod.antiSpamDuplicateThreshold)
          : 3
    },
    goals: {
      likeTarget: typeof goals.likeTarget === 'number' ? Math.max(0, goals.likeTarget) : 1000,
      coinTarget: typeof goals.coinTarget === 'number' ? Math.max(0, goals.coinTarget) : 500
    },
    diagnostics: {
      rawLogEnabled: typeof diag.rawLogEnabled === 'boolean' ? diag.rawLogEnabled : false
    }
  }
}
