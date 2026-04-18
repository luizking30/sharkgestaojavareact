import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// --- 1. BIBLIOTECAS EXTERNAS ---
import 'bootstrap/dist/css/bootstrap.min.css'
// ADICIONE ESTA LINHA ABAIXO PARA OS MODAIS FUNCIONAREM:
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// --- 2. ESTILOS PERSONALIZADOS ---
import './App.css'
import './shark-mobile-first.css'
import './Login.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)