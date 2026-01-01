import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Error boundary for React rendering errors
try {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:7',message:'Starting React render',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:13',message:'Render error caught',data:{errorMessage:error.message,errorStack:error.stack,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.error('Failed to render app:', error)
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F8F8; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 500px; text-align: center;">
        <h1 style="color: #3D6456; font-size: 1.5rem; margin-bottom: 1rem;">⚠️ Fout bij laden</h1>
        <p style="color: #666; margin-bottom: 1.5rem;">
          Er is een fout opgetreden bij het laden van de applicatie.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background: #3D6456; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600;"
        >
          Pagina verversen
        </button>
        <details style="margin-top: 1rem; text-align: left;">
          <summary style="cursor: pointer; color: #999; font-size: 0.875rem;">Technische details</summary>
          <pre style="background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.75rem; margin-top: 0.5rem;">${error.message}\n${error.stack}</pre>
        </details>
      </div>
    </div>
  `
} 