import { render, JSX } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { App } from './App'
import { GiftMonitor } from '../pages/GiftMonitor'
import { Styleguide } from '../pages/Styleguide'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '../styles/tokens.css'

function Root(): JSX.Element {
  const [route, setRoute] = useState(window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (route === '#gift-monitor') {
    return <GiftMonitor />
  }

  if (route === '#styleguide') {
    return <Styleguide />
  }

  return <App />
}

const rootElement = document.getElementById('root')
if (rootElement) {
  render(<Root />, rootElement)
}
