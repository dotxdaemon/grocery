// ABOUTME: Entry point that mounts the React application onto the DOM.
// ABOUTME: Imports global styles and renders the root App component.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
