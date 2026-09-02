import { useEffect, useState } from 'react'
import './App.css'

interface HealthResponse {
  status: string
  database: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<HealthResponse>
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
  }, [])

  return (
    <main className="app">
      <h1>CRM</h1>
      <p className="subtitle">React + NestJS + PostgreSQL pet project</p>

      <div className="status-card">
        <h2>Backend status</h2>
        {error && <p className="status status-error">❌ {error}</p>}
        {!error && !health && <p className="status">Checking connection…</p>}
        {health && (
          <>
            <p className="status status-ok">✅ API: {health.status}</p>
            <p className="status status-ok">
              ✅ Database: {health.database}
            </p>
            <p className="status-timestamp">
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </main>
  )
}

export default App
