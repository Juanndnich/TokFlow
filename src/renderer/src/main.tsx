import { render } from 'preact'
import { App } from './App'
import '../styles/tokens.css'

const rootElement = document.getElementById('root')
if (rootElement) {
  render(<App />, rootElement)
}
