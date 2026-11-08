// TokFlow OBS Overlay Client
(function () {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token') || ''
  const container = document.getElementById('events-stream')

  let autoHideSeconds = 8
  let eventSource = null

  function connectSse() {
    if (eventSource) {
      eventSource.close()
    }

    const sseUrl = `/events?token=${encodeURIComponent(token)}`
    eventSource = new EventSource(sseUrl)

    eventSource.onopen = function () {
      console.log('[TokFlow Overlay] Terhubung ke SSE')
    }

    eventSource.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data)
        handleEvent(data)
      } catch (err) {
        console.error('Error memproses data SSE:', err)
      }
    }

    eventSource.onerror = function () {
      console.warn('[TokFlow Overlay] Koneksi SSE terputus, mencoba menyambung ulang...')
      eventSource.close()
      setTimeout(connectSse, 3000)
    }
  }

  function handleEvent(data) {
    if (data.type === 'init' && data.snapshot) {
      // Saat init, jika ada pengaturan autoHideSeconds
      if (data.snapshot.recentChats) {
        // Jangan tumpuk seluruh riwayat saat baru buka di OBS
      }
    } else if (data.type === 'chat') {
      renderChat(data.chat)
    } else if (data.type === 'gift') {
      renderGift(data.gift)
    } else if (data.type === 'clear_display' || data.type === 'session_reset') {
      container.innerHTML = ''
    }
  }

  function renderChat(chat) {
    const item = document.createElement('div')
    item.className = 'overlay-item'

    const avatar = document.createElement('div')
    avatar.className = 'overlay-avatar'
    if (chat.profilePictureUrl) {
      const img = document.createElement('img')
      img.src = chat.profilePictureUrl
      avatar.appendChild(img)
    } else {
      avatar.textContent = (chat.nickname || chat.uniqueId || '?').slice(0, 2).toUpperCase()
    }

    const content = document.createElement('div')
    content.className = 'overlay-content'

    const author = document.createElement('div')
    author.className = 'overlay-author'
    author.textContent = chat.nickname || chat.uniqueId

    const text = document.createElement('div')
    text.className = 'overlay-text'
    text.textContent = chat.comment

    content.appendChild(author)
    content.appendChild(text)

    item.appendChild(avatar)
    item.appendChild(content)

    appendAndScheduleRemoval(item)
  }

  function renderGift(gift) {
    // Cari apakah item streak sudah ada di overlay
    const existing = document.getElementById(`overlay-gift-${gift.groupId}`)
    if (existing) {
      const badge = existing.querySelector('.overlay-gift-badge')
      if (badge) {
        badge.textContent = `x${gift.repeatCount}`
        badge.style.animation = 'none'
        void badge.offsetWidth // Trigger reflow
        badge.style.animation = 'popScale 0.2s ease'
      }
      resetRemovalTimer(existing)
      return
    }

    const item = document.createElement('div')
    item.className = 'overlay-item overlay-gift'
    item.id = `overlay-gift-${gift.groupId}`

    const avatar = document.createElement('div')
    avatar.className = 'overlay-avatar'
    avatar.textContent = (gift.nickname || gift.uniqueId || '?').slice(0, 2).toUpperCase()

    const content = document.createElement('div')
    content.className = 'overlay-content'

    const author = document.createElement('div')
    author.className = 'overlay-author'
    author.textContent = gift.nickname || gift.uniqueId

    const text = document.createElement('div')
    text.className = 'overlay-text'
    text.textContent = `Mengirim ${gift.giftName}`

    content.appendChild(author)
    content.appendChild(text)

    const badge = document.createElement('div')
    badge.className = 'overlay-gift-badge'
    badge.textContent = `x${gift.repeatCount}`

    item.appendChild(avatar)
    item.appendChild(content)
    item.appendChild(badge)

    appendAndScheduleRemoval(item)
  }

  function appendAndScheduleRemoval(el) {
    container.appendChild(el)
    // Batasi maksimal 8 item terlihat di overlay
    while (container.children.length > 8) {
      container.removeChild(container.firstChild)
    }
    resetRemovalTimer(el)
  }

  function resetRemovalTimer(el) {
    if (el._timer) {
      clearTimeout(el._timer)
    }
    el._timer = setTimeout(() => {
      el.classList.add('fading-out')
      setTimeout(() => {
        if (el.parentNode === container) {
          container.removeChild(el)
        }
      }, 400)
    }, autoHideSeconds * 1000)
  }

  // Mulai koneksi SSE jika token ada
  if (token) {
    connectSse()
  } else {
    console.error('[TokFlow Overlay] Parameter token tidak ditemukan di URL')
  }
})()
