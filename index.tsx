
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("AeroConnect failed to bootstrap:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; text-align: center; color: #ef4444;">
      <h1 style="font-weight: 900; letter-spacing: -0.05em;">BOOTSTRAP ERROR</h1>
      <p style="color: #64748b; font-size: 14px;">The application failed to start. Check the browser console for more details.</p>
    </div>
  `;
}
