import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Applique le thème (clair/sombre/auto) dès le chargement, sur toutes les routes.
import './lib/theme'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
