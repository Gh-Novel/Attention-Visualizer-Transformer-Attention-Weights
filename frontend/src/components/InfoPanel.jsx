// src/components/InfoPanel.jsx
export default function InfoPanel({ data, modelMeta }) {
  if (!data) return null;

  const { tokens, n_layers, n_heads, model_type } = data;

  const stats = [
    { label: 'Tokens', value: tokens.length, accent: true },
    { label: 'Layers', value: n_layers },
    { label: 'Heads', value: n_heads },
    { label: 'Type', value: model_type, accent: model_type === 'decoder' },
    { label: 'Total Matrices', value: n_layers * n_heads, accent: false },
  ];

  return (
    <div className="info-panel fade-in">
      {stats.map((s) => (
        <div className="info-stat" key={s.label}>
          <div className="info-stat-label">{s.label}</div>
          <div className={`info-stat-value ${s.accent ? 'accent' : ''}`}>{s.value}</div>
        </div>
      ))}
      {modelMeta && (
        <div className="info-stat" style={{ gridColumn: 'span 2' }}>
          <div className="info-stat-label">Model</div>
          <div className="info-stat-value" style={{ fontSize: 12, fontFamily: 'Inter' }}>
            {modelMeta.label}
          </div>
        </div>
      )}
    </div>
  );
}
