
import { useState } from 'react'
import './App.css'

const navigation = [
  { label: 'Overview', icon: '◫' },
  { label: 'Register Dataset', icon: '↑' },
  { label: 'Verify Integrity', icon: '◇' },
  { label: 'Version History', icon: '◷' },
]

function App() {
  const [activePage, setActivePage] = useState('Overview')

  return (
    <div className="app-shell">
      <aside className="sidebar glass">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <h2>DATAGUARD</h2>
            <p>TRUSTED DATA SYSTEMS</p>
          </div>
        </div>

        <p className="nav-caption">WORKSPACE</p>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activePage === item.label ? 'selected' : ''}`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {activePage === item.label && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="connection-dot" />
          <div>
            <strong>Workspace active</strong>
            <p>Local development</p>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">DATA PROVENANCE <span>/</span> WORKSPACE</p>
            <h1>{activePage}</h1>
          </div>
          <div className="environment-pill">
            <span className="connection-dot" />
            Frontend preview
          </div>
        </header>

        {activePage === 'Overview' && <Dashboard onNavigate={setActivePage} />}
        {activePage === 'Register Dataset' && <RegisterPage />}
        {activePage === 'Verify Integrity' && <PlaceholderPage title="Verify integrity" description="Compare a CSV file against a registered SHA-256 fingerprint." />}
        {activePage === 'Version History' && <PlaceholderPage title="Version history" description="Review dataset versions, previous fingerprints and ledger records." />}
      </main>
    </div>
  )
}

function Dashboard({ onNavigate }) {
  return (
    <>
      <section className="hero glass">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> DATASET PROVENANCE FRAMEWORK</div>
          <h2>Your data.<br />Its <span>proof of origin.</span></h2>
          <p>Fingerprint datasets, inspect quality and verify file integrity across versions — all in one workspace.</p>
          <button className="primary-button" onClick={() => onNavigate('Register Dataset')}>
            <span>＋</span> Register dataset <span>↗</span>
          </button>
        </div>

        <div className="fingerprint-art" aria-hidden="true">
          <div className="glow-orb" />
          <div className="fingerprint-ring ring-a" />
          <div className="fingerprint-ring ring-b" />
          <div className="fingerprint-ring ring-c" />
          <div className="fingerprint-core">
            <span>SHA</span>
            <strong>256</strong>
            <small>FINGERPRINT</small>
          </div>
          <span className="orbit-point point-a" />
          <span className="orbit-point point-b" />
        </div>
        <span className="hero-index">01 — INTEGRITY FIRST</span>
      </section>

      <div className="section-title">
        <div>
          <p className="eyebrow">AT A GLANCE</p>
          <h2>Workspace overview</h2>
        </div>
        <span className="preview-tag">DEMO ENVIRONMENT</span>
      </div>

      <section className="stats-grid">
        <article className="stat-card glass">
          <div className="stat-top"><span>Registered datasets</span><span className="stat-symbol">▤</span></div>
          <strong className="stat-value">—</strong>
          <p>Awaiting backend data</p>
          <div className="stat-line"><span style={{ width: '42%' }} /></div>
        </article>
        <article className="stat-card glass">
          <div className="stat-top"><span>Integrity verifications</span><span className="stat-symbol">⌁</span></div>
          <strong className="stat-value">—</strong>
          <p>Checks will appear here</p>
          <div className="stat-line"><span style={{ width: '65%' }} /></div>
        </article>
        <article className="stat-card glass">
          <div className="stat-top"><span>Blockchain records</span><span className="stat-symbol">⛓</span></div>
          <strong className="stat-value">—</strong>
          <p>Chain connection unconfirmed</p>
          <div className="stat-line"><span style={{ width: '28%' }} /></div>
        </article>
      </section>

      <section className="dataset-panel glass">
        <div className="panel-header">
          <div>
            <p className="eyebrow">YOUR DATA LIBRARY</p>
            <h2>Recent datasets</h2>
          </div>
          <button className="subtle-button" onClick={() => onNavigate('Version History')}>View history <span>↗</span></button>
        </div>
        <div className="empty-state">
          <div className="empty-art"><span>CSV</span><i>＋</i></div>
          <h3>Your workspace starts here</h3>
          <p>Register a dataset to generate its fingerprint and begin tracking versions.</p>
          <button className="outline-button" onClick={() => onNavigate('Register Dataset')}>Upload your first dataset <span>→</span></button>
        </div>
        <div className="panel-foot"><span>●</span> No dataset records loaded <span className="foot-right">Connect API to view records</span></div>
      </section>
    </>
  )
}

function RegisterPage() {
  const [file, setFile] = useState(null)
  const [datasetId, setDatasetId] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function selectFile(event) {
    const selected = event.target.files?.[0]
    setFile(selected || null)
    setMessage('')
  }
    async function registerDataset() {
    if (!file) {
      setMessage('Please choose a CSV file first.')
      return
    }

    setLoading(true)
    setMessage('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:4000/api/datasets', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed.')
      }

      setResult(data)
      setMessage('Dataset uploaded successfully!')
    } catch (error) {
      setMessage(error.message || 'Could not connect to the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="inner-page">
      <div className="page-intro">
        <p className="eyebrow">DATA INTAKE / 01</p>
        <h2>Bring your dataset<br />into the <span>chain of trust.</span></h2>
        <p>Register a CSV file to prepare its fingerprint, quality report and version history.</p>
      </div>

      <div className="registration-layout">
        <div className="form-card glass">
          <div className="card-heading"><span className="step-number">01</span><div><h3>Dataset file</h3><p>Choose the CSV you want to register.</p></div></div>
          <label className="upload-zone" htmlFor="csv-file">
            <span className="upload-symbol">↑</span>
            <strong>{file ? file.name : 'Drop your CSV here'}</strong>
            <span>{file ? `${(file.size / 1024).toFixed(1)} KB · Selected` : 'or browse files from your computer'}</span>
            <span className="file-types">CSV FILES ONLY</span>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={selectFile} />
          </label>

          <label className="input-label" htmlFor="dataset-id">Existing dataset ID <span>OPTIONAL</span></label>
          <input id="dataset-id" className="text-input" value={datasetId} onChange={(event) => setDatasetId(event.target.value)} placeholder="Enter an ID to create a new version" />

          <div className="notice-card"><span>i</span><p><strong>What happens next?</strong><br />The backend calculates the actual SHA-256 hash and returns the stored filename and file size. Version history and quality analysis are not connected yet.</p></div>
          
<button
  className="primary-button register-button"
  onClick={registerDataset}
  disabled={loading}
>
  {loading ? 'Uploading...' : 'Register dataset'} <span>→</span>
</button>

          {message && <p className="form-message" role="status">{message}</p>}
          
{result && (
  <div className="notice-card">
    <span>✓</span>
    <p>
      <strong>Dataset fingerprint generated</strong>
      <br />
      <br />
      <strong>Stored filename:</strong> {result.fileName}
      <br />
      <strong>File size:</strong> {result.sizeBytes} bytes
      <br />
      <strong>SHA-256:</strong>
      <br />
      <code>{result.sha256}</code>
    </p>
  </div>
)}

        </div>

        <aside className="side-info glass">
          <p className="eyebrow">THE WORKFLOW</p>
          <div className="workflow-step"><span>01</span><div><strong>Fingerprint</strong><p>Calculate the file's SHA-256 hash.</p></div></div>
          <div className="workflow-step"><span>02</span><div><strong>Assess quality</strong><p>Inspect missing values, duplicates and statistics.</p></div></div>
          <div className="workflow-step"><span>03</span><div><strong>Register version</strong><p>Store provenance metadata and the fingerprint.</p></div></div>
          <div className="side-note"><span className="connection-dot" /> Backend connected — CSV fingerprinting active.</div>
        </aside>
      </div>
    </section>
  )
}

function PlaceholderPage({ title, description }) {
  return (
    <section className="inner-page">
      <div className="page-intro"><p className="eyebrow">DATA PROVENANCE</p><h2>{title}</h2><p>{description}</p></div>
      <div className="coming-card glass"><div className="coming-icon">◇</div><h3>Ready for integration</h3><p>This screen will use the team's API when the relevant endpoints are available.</p></div>
    </section>
  )
}

export default App
