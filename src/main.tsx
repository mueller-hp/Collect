import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { DebtProvider } from './contexts/DebtContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DebtProvider>
      <App />
    </DebtProvider>
  </React.StrictMode>,
)