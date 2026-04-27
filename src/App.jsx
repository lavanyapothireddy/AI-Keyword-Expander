// src/App.jsx
import { useState } from 'react'
import {
  expandKeywords,
  classifyIntent,
  clusterKeywords,
} from './services/groqService'
import { exportToCSV, exportToJSON } from './utils/exportUtils'
import './App.css'

const INTENT_COLORS = {
  Informational:  '#22d3a5',
  Navigational:   '#7c6aff',
  Commercial:     '#f97316',
  Transactional:  '#f472b6',
}

const CLUSTER_PALETTE = [
  '#7c6aff', '#22d3a5', '#f97316', '#f472b6', '#fbbf24',
  '#38bdf8', '#a3e635', '#e879f9', '#fb7185', '#34d399',
]

export default function App() {
  const [seedInput, setSeedInput]       = useState('')
  const [expandCount, setExpandCount]   = useState(10)
  const [keywords, setKeywords]         = useState([])
  const [intentData, setIntentData]     = useState([])
  const [clusters, setClusters]         = useState({})
  const [loading, setLoading]           = useState({ expand: false, intent: false, cluster: false })
  const [error, setError]               = useState('')
  const [activeTab, setActiveTab]       = useState('keywords')
  const [showApiInput, setShowApiInput] = useState(!import.meta.env.VITE_GROQ_API_KEY)

  const seedKeywords = seedInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }))

  async function handleExpand() {
    if (!seedKeywords.length) return setError('Enter at least one keyword to expand.')
    setError('')
    setLoad('expand', true)
    try {
      const result = await expandKeywords(seedKeywords, expandCount)
      setKeywords(result)
      setIntentData([])
      setClusters({})
      setActiveTab('keywords')
    } catch (e) { setError(e.message) }
    setLoad('expand', false)
  }

  async function handleClassify() {
    if (!keywords.length) return setError('Expand keywords first.')
    setError('')
    setLoad('intent', true)
    try {
      const result = await classifyIntent(keywords)
      setIntentData(result)
      setActiveTab('intent')
    } catch (e) { setError(e.message) }
    setLoad('intent', false)
  }

  async function handleCluster() {
    if (!keywords.length) return setError('Expand keywords first.')
    setError('')
    setLoad('cluster', true)
    try {
      const result = await clusterKeywords(keywords)
      setClusters(result)
      setActiveTab('clusters')
    } catch (e) { setError(e.message) }
    setLoad('cluster', false)
  }

  const intentMap = {}
  intentData.forEach(item => { intentMap[item.keyword] = item })
  const clusterNames = Object.keys(clusters)

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">KeywordAI</span>
            <span className="logo-badge">GROQ</span>
          </div>
          <button className="api-btn" onClick={() => setShowApiInput(v => !v)}>
            {showApiInput ? 'Hide Key' : '⚙ API Key'}
          </button>
        </div>
        {showApiInput && (
          <div className="api-bar">
            <input
              className="api-input"
              type="password"
              placeholder="Paste your Groq API key (or set VITE_GROQ_API_KEY in .env)"
              onChange={e => { window.__GROQ_KEY_OVERRIDE__ = e.target.value }}
            />
            <span className="api-hint">Key stays local — never sent anywhere except Groq.</span>
          </div>
        )}
      </header>

      <main className="main">

        {/* ── Input Panel ── */}
        <section className="panel input-panel">
          <div className="panel-header">
            <div>
              <h2>Keyword Universe</h2>
              <p className="panel-sub">Drop a word. Watch it grow into synonyms, variants &amp; semantic relatives.</p>
            </div>
            <span className="tag">Step 1</span>
          </div>
          <textarea
            className="seed-input"
            placeholder={"digital marketing\nseo tools\ncontent strategy"}
            value={seedInput}
            onChange={e => setSeedInput(e.target.value)}
            rows={4}
          />
          <div className="input-row">
            <label className="count-label">
              Variants per keyword
              <select className="count-select" value={expandCount} onChange={e => setExpandCount(Number(e.target.value))}>
                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn btn-primary" onClick={handleExpand} disabled={loading.expand}>
              {loading.expand ? <span className="spinner" /> : '⚡'}
              {loading.expand ? 'Expanding...' : 'Expand Keywords'}
            </button>
          </div>
          {error && <div className="error-bar">{error}</div>}
        </section>

        {/* ── Action Bar ── */}
        {keywords.length > 0 && (
          <section className="action-bar">
            <div className="kw-count">
              <strong>{keywords.length}</strong> keywords generated
            </div>
            <div className="action-btns">
              <button className="btn btn-ghost" onClick={handleClassify} disabled={loading.intent}>
                {loading.intent ? <span className="spinner sm" /> : '🎯'}
                {loading.intent ? 'Analyzing...' : 'Analyze SEO Intent'}
              </button>
              <button className="btn btn-ghost" onClick={handleCluster} disabled={loading.cluster}>
                {loading.cluster ? <span className="spinner sm" /> : '🗂'}
                {loading.cluster ? 'Clustering...' : 'Cluster Groups'}
              </button>
              <div className="export-group">
                <button className="btn btn-outline" onClick={() => exportToCSV(keywords, intentData, clusters)}>↓ CSV</button>
                <button className="btn btn-outline" onClick={() => exportToJSON(keywords, intentData, clusters)}>↓ JSON</button>
              </div>
            </div>
          </section>
        )}

        {/* ── Results Tabs ── */}
        {keywords.length > 0 && (
          <section className="results-panel">
            <div className="tabs">
              {[
                { id: 'keywords', label: `Keywords (${keywords.length})` },
                { id: 'intent',   label: `SEO Intent${intentData.length ? ` (${intentData.length})` : ''}` },
                { id: 'clusters', label: `Clusters${clusterNames.length ? ` (${clusterNames.length})` : ''}` },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Keywords Tab ── */}
            {activeTab === 'keywords' && (
              <div className="kw-grid">
                {keywords.map((kw, i) => (
                  <div key={i} className="kw-chip">
                    <span className="kw-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="kw-text">{kw}</span>
                    <button className="copy-btn" title="Copy" onClick={() => navigator.clipboard.writeText(kw)}>⎘</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── SEO Intent Tab ── */}
            {activeTab === 'intent' && (
              intentData.length === 0 ? (
                <div className="empty-state">
                  <p>Click <strong>Analyze SEO Intent</strong> to classify each keyword by search behavior — Informational, Navigational, Commercial, or Transactional.</p>
                </div>
              ) : (
                <div>
                  <div className="intent-legend">
                    {Object.entries(INTENT_COLORS).map(([label, color]) => (
                      <span key={label} className="legend-chip" style={{ '--c': color }}>{label}</span>
                    ))}
                  </div>
                  <div className="intent-list">
                    {intentData.map((item, i) => (
                      <div key={i} className="intent-row" style={{ '--intent-color': INTENT_COLORS[item.intent] || '#9090a8' }}>
                        <span className="intent-badge">{item.intent}</span>
                        <span className="intent-kw">{item.keyword}</span>
                        <span className="intent-reason">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* ── Clusters Tab ── */}
            {activeTab === 'clusters' && (
              clusterNames.length === 0 ? (
                <div className="empty-state">
                  <p>Click <strong>Cluster Groups</strong> to group keywords by topic.</p>
                </div>
              ) : (
                <div className="cluster-grid">
                  {clusterNames.map((name, ci) => (
                    <div key={name} className="cluster-card" style={{ '--cluster-color': CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length] }}>
                      <div className="cluster-header">
                        <span className="cluster-dot" />
                        <h3 className="cluster-name">{name}</h3>
                        <span className="cluster-count">{clusters[name].length}</span>
                      </div>
                      <ul className="cluster-kws">
                        {clusters[name].map((kw, ki) => <li key={ki}>{kw}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        Built with Groq · LLaMA 3.3 70B · React + Vite
      </footer>
    </div>
  )
}
