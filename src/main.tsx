// Ensure window.fetch has both getter and setter to prevent "Cannot set property fetch of #<Window>" errors
try {
  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    let currentFetch = originalFetch.bind(window);
    Object.defineProperty(window, 'fetch', {
      get() {
        return currentFetch;
      },
      set(fn) {
        if (typeof fn === 'function') {
          currentFetch = fn;
        }
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore descriptor errors
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}


