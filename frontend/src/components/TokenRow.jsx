// src/components/TokenRow.jsx

/**
 * Displays tokens as colored chips.
 * Heat-maps each token by its average attention *to* the selected token
 * (column of the attention matrix for the selected source token).
 */
export default function TokenRow({ tokens, matrix, selectedToken, onSelectToken }) {
  if (!tokens || tokens.length === 0) return null;

  // Compute max for normalisation
  let maxVal = 0;
  if (matrix && selectedToken !== null) {
    const row = matrix[selectedToken] ?? [];
    maxVal = Math.max(...row, 1e-9);
  }

  const getColor = (idx) => {
    if (!matrix || selectedToken === null) {
      return { bg: 'var(--bg-input)', color: 'var(--text-secondary)' };
    }
    const val = (matrix[selectedToken]?.[idx] ?? 0) / maxVal;
    // Gradient: dark-blue → indigo → gold
    const r = Math.round(99  + (245 - 99)  * val);
    const g = Math.round(102 + (158 - 102) * val);
    const b = Math.round(241 + (11  - 241) * val);
    const alpha = 0.15 + val * 0.55;
    return {
      bg: `rgba(${r},${g},${b},${alpha})`,
      color: val > 0.5 ? '#fff' : 'var(--text-secondary)',
      borderColor: val > 0.3 ? `rgba(${r},${g},${b},0.7)` : 'var(--border)',
    };
  };

  return (
    <div className="card fade-in">
      <div className="card-title">
        Tokens
        {selectedToken !== null && (
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--accent-3)', marginLeft: 8 }}>
            query: {tokens[selectedToken]}
          </span>
        )}
      </div>
      <div className="token-row-wrap">
        {tokens.map((tok, i) => {
          const style = getColor(i);
          return (
            <button
              key={i}
              id={`token-${i}`}
              className={`token-chip ${selectedToken === i ? 'selected' : ''}`}
              style={{
                background: style.bg,
                color: style.color,
                borderColor: style.borderColor ?? 'var(--border)',
              }}
              onClick={() => onSelectToken(selectedToken === i ? null : i)}
              title={`Token ${i}: ${tok}`}
            >
              {tok}
            </button>
          );
        })}
      </div>
      {selectedToken === null && tokens.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          ↑ Click a token to highlight attention weights
        </div>
      )}
    </div>
  );
}
