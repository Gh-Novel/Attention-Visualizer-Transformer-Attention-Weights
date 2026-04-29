// src/components/ModelSelector.jsx
export default function ModelSelector({ models, selected, onSelect, disabled }) {
  return (
    <div className="card">
      <div className="card-title">Model</div>
      <div className="model-cards">
        {models.map((m) => (
          <button
            key={m.id}
            className={`model-card ${selected === m.id ? 'selected' : ''}`}
            onClick={() => !disabled && onSelect(m.id)}
            disabled={disabled}
            title={`${m.size_mb} MB`}
          >
            <div className="model-card-header">
              <span className="model-card-label">{m.label}</span>
              <span className={`model-type-badge ${m.type}`}>{m.type}</span>
            </div>
            <div className="model-card-desc">{m.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
