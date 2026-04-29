// src/components/TextInput.jsx
import { useState } from 'react';

const MAX = 400;

const EXAMPLES = [
  'The cat sat on the mat and watched the dog sleep.',
  'Attention is all you need to understand transformers.',
  'The bank can guarantee deposits will eventually cover future tuition costs.',
  'She saw the man with the telescope on the hill.',
];

export default function TextInput({ value, onChange, onSubmit, loading }) {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="card text-input-wrap">
      <div className="card-title">Input Text</div>
      <textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        placeholder="Type or paste a sentence…"
        maxLength={MAX}
        rows={4}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit();
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 0',
            textDecoration: 'underline dotted',
          }}
          onClick={() => setShowExamples((v) => !v)}
        >
          {showExamples ? 'hide examples' : 'load example'}
        </button>
        <div className="char-count">{value.length} / {MAX}</div>
      </div>

      {showExamples && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }} className="fade-in">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { onChange(ex); setShowExamples(false); }}
              style={{
                textAlign: 'left',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                padding: '7px 10px',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <button
        className="btn-analyze"
        style={{ marginTop: 14 }}
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        id="analyze-btn"
      >
        {loading ? '⏳ Analyzing…' : '⚡ Analyze Attention'}
      </button>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
        ⌘ + Enter to run
      </div>
    </div>
  );
}
