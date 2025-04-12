import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MainApp from './components/ClassRoom.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainApp />
  </StrictMode>,
)
