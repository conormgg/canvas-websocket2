
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'sonner'
import { ClipboardProvider } from './context/ClipboardContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClipboardProvider>
      <App />
      <Toaster position="top-center" />
    </ClipboardProvider>
  </React.StrictMode>,
)
