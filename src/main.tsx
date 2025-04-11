import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Renderização mais simples
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento root não encontrado no HTML');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
