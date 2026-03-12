import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

export function mountApp(): void {
  const el = document.getElementById('router-content');
  if (el) {
    const root = createRoot(el);
    root.render(<App />);
  }
}
