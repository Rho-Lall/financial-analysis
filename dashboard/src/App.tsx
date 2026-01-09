import './App.css'

function App() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <header>
        <h1>Financial Intelligence Dashboard</h1>
        <p style={{ fontSize: '1.2rem', color: '#888' }}>
          Fundamental & Technical Analysis Platform
        </p>
      </header>

      <main style={{ marginTop: '3rem' }}>
        <div style={{
          padding: '2rem',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2>🚧 Under Construction</h2>
          <p>
            This dashboard is being built to provide comprehensive financial analysis
            combining public and private financial data with technical price analysis.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Income Statement</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Coming Soon</p>
          </div>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Balance Sheet</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Coming Soon</p>
          </div>
          <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Cash Flow</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Coming Soon</p>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#888' }}>
        <p>Powered by dbt Fusion + React + D3.js</p>
      </footer>
    </div>
  )
}

export default App
