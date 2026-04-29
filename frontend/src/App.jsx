// src/App.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import TextInput from './components/TextInput';
import ModelSelector from './components/ModelSelector';
import LayerHeadControls from './components/LayerHeadControls';
import AttentionHeatmap from './components/AttentionHeatmap';
import TokenRow from './components/TokenRow';
import InfoPanel from './components/InfoPanel';
import ErrorBoundary from './components/ErrorBoundary';

// Use relative path so Vite's proxy handles it — works on any port Vite picks
const API = import.meta.env.VITE_API_URL ?? '';

export default function App() {
  // ── Input state ──────────────────────────────────────────────────────────
  const [text, setText] = useState('The cat sat on the mat and watched the dog.');
  const [modelId, setModelId] = useState('bert-base-uncased');
  const [models, setModels] = useState([]);

  // ── Result state ─────────────────────────────────────────────────────────
  const [data, setData] = useState(null);   // { tokens, attentions, n_layers, n_heads, model_type }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── View state ───────────────────────────────────────────────────────────
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedHead, setSelectedHead]   = useState(0);
  const [avgHeads, setAvgHeads]           = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  // ── Load model list on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/models`)
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {});
  }, []);

  // ── Run inference ────────────────────────────────────────────────────────
  const analyze = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    setSelectedToken(null);

    try {
      const res = await fetch(`${API}/api/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model_id: modelId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const result = await res.json();
      setData(result);
      setSelectedLayer(0);
      setSelectedHead(0);
      setAvgHeads(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [text, modelId]);

  // ── Derive current attention matrix ──────────────────────────────────────
  const matrix = useMemo(() => {
    if (!data) return null;
    const layerAttn = data.attentions[selectedLayer]; // [n_heads][seq][seq]
    if (avgHeads) {
      // Average over all heads
      const S = layerAttn[0].length;
      const avg = Array.from({ length: S }, () => new Array(S).fill(0));
      const H = layerAttn.length;
      for (let h = 0; h < H; h++) {
        for (let s = 0; s < S; s++) {
          for (let t = 0; t < S; t++) {
            avg[s][t] += layerAttn[h][s][t] / H;
          }
        }
      }
      return avg;
    }
    return layerAttn[selectedHead]; // [seq][seq]
  }, [data, selectedLayer, selectedHead, avgHeads]);

  const modelMeta = models.find((m) => m.id === modelId);

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-logo">🧠</div>
        <div>
          <div className="app-title">Attention Visualizer</div>
          <div className="app-subtitle">Transformer attention weights · per layer · per head</div>
        </div>
        <div className="header-badge">BERTViz-style</div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div className="main-grid">
        {/* Left panel */}
        <aside className="left-panel">
          <TextInput
            value={text}
            onChange={setText}
            onSubmit={analyze}
            loading={loading}
          />

          {models.length > 0 && (
            <ModelSelector
              models={models}
              selected={modelId}
              onSelect={setModelId}
              disabled={loading}
            />
          )}

          {data && (
            <LayerHeadControls
              nLayers={data.n_layers}
              nHeads={data.n_heads}
              selectedLayer={selectedLayer}
              selectedHead={selectedHead}
              avgHeads={avgHeads}
              onLayerChange={setSelectedLayer}
              onHeadChange={setSelectedHead}
              onAvgToggle={() => setAvgHeads((v) => !v)}
              disabled={loading}
            />
          )}
        </aside>

        {/* Right panel */}
        <main className="right-panel">
          {/* Info stats */}
          {data && <InfoPanel data={data} modelMeta={modelMeta} />}

          {/* Token row */}
          {data && (
            <TokenRow
              tokens={data.tokens}
              matrix={matrix}
              selectedToken={selectedToken}
              onSelectToken={setSelectedToken}
            />
          )}

          {/* Error */}
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="card loading-overlay">
              <div className="spinner" />
              <div>Running inference…</div>
              <div className="loading-model-name">{modelMeta?.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 260, textAlign: 'center' }}>
                First run downloads the model (~{modelMeta?.size_mb}MB). Subsequent runs are instant.
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">
              Attention Heatmap
              {data && (
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', fontWeight: 400 }}>
                  layer {selectedLayer} · {avgHeads ? 'avg heads' : `head ${selectedHead}`}
                </span>
              )}
            </div>
            {!loading && (
              <ErrorBoundary>
                <AttentionHeatmap
                  matrix={matrix}
                  tokens={data?.tokens}
                  selectedToken={selectedToken}
                  onSelectToken={setSelectedToken}
                />
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
