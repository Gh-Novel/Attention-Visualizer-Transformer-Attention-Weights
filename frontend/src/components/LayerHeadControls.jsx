// src/components/LayerHeadControls.jsx

export default function LayerHeadControls({
  nLayers,
  nHeads,
  selectedLayer,
  selectedHead,
  avgHeads,
  onLayerChange,
  onHeadChange,
  onAvgToggle,
  disabled,
}) {
  if (!nLayers) return null;

  const heads = Array.from({ length: nHeads }, (_, i) => i);

  return (
    <div className="card">
      <div className="card-title">Layer &amp; Head</div>
      <div className="lhc-sliders">
        {/* Layer slider */}
        <div className="slider-group">
          <label>
            Layer
            <span>{selectedLayer}</span>
          </label>
          <input
            id="layer-slider"
            type="range"
            min={0}
            max={nLayers - 1}
            value={selectedLayer}
            onChange={(e) => onLayerChange(Number(e.target.value))}
            disabled={disabled}
            style={{
              background: `linear-gradient(
                to right,
                var(--accent) 0%,
                var(--accent) ${(selectedLayer / (nLayers - 1)) * 100}%,
                var(--bg-input) ${(selectedLayer / (nLayers - 1)) * 100}%,
                var(--bg-input) 100%
              )`,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>0</span><span>{nLayers - 1}</span>
          </div>
        </div>

        {/* Head selector */}
        <div className="slider-group">
          <label>
            Head
            <span>{avgHeads ? 'avg' : selectedHead}</span>
          </label>
          <div className="head-grid">
            {heads.map((h) => (
              <button
                key={h}
                id={`head-btn-${h}`}
                className={`head-btn ${!avgHeads && selectedHead === h ? 'active' : ''}`}
                onClick={() => { onHeadChange(h); if (avgHeads) onAvgToggle(); }}
                disabled={disabled}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Average toggle */}
          <button
            className={`avg-toggle ${avgHeads ? 'active' : ''}`}
            onClick={onAvgToggle}
            disabled={disabled}
          >
            {avgHeads ? '✓ Averaging All Heads' : '⊕ Average All Heads'}
          </button>
        </div>
      </div>
    </div>
  );
}
