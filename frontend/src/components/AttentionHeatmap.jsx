// src/components/AttentionHeatmap.jsx
// Pure SVG heatmap — zero external dependencies, works everywhere
import { useRef, useEffect, useCallback } from 'react';

/** Interpolate between two hex colors by t ∈ [0,1] */
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b2})`;
}

/** Map a value [0,1] through our purple→gold colorscale */
function heatColor(v) {
  const stops = [
    [0,    '#080b14'],
    [0.15, '#1e1b4b'],
    [0.35, '#312e81'],
    [0.5,  '#4f46e5'],
    [0.65, '#7c3aed'],
    [0.82, '#c026d3'],
    [1.0,  '#f59e0b'],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (v <= t1) {
      const t = (v - t0) / (t1 - t0);
      return lerpColor(c0, c1, Math.max(0, Math.min(1, t)));
    }
  }
  return stops[stops.length - 1][1];
}

export default function AttentionHeatmap({ matrix, tokens, selectedToken, onSelectToken }) {
  const canvasRef = useRef(null);

  /* ── Draw on canvas ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || !tokens || tokens.length === 0) return;

    const ctx = canvas.getContext('2d');
    const S = tokens.length;

    const LABEL_W = 88;   // left axis label area
    const LABEL_H = 80;   // bottom axis label area
    const PAD_R   = 24;   // right padding
    const PAD_T   = 12;   // top padding

    const availW = canvas.width  - LABEL_W - PAD_R;
    const availH = canvas.height - LABEL_H - PAD_T;
    const cell   = Math.max(4, Math.min(Math.floor(availW / S), Math.floor(availH / S)));
    const gridW  = cell * S;
    const gridH  = cell * S;
    const originX = LABEL_W;
    const originY = PAD_T;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = 'rgba(13,17,32,0.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cells
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        const val = matrix[r]?.[c] ?? 0;
        ctx.fillStyle = heatColor(val);
        ctx.fillRect(originX + c * cell, originY + r * cell, cell - 1, cell - 1);
      }
    }

    // Selected token: highlight row + col
    if (selectedToken !== null && selectedToken < S) {
      ctx.fillStyle = 'rgba(99,102,241,0.18)';
      // Row
      ctx.fillRect(originX, originY + selectedToken * cell, gridW, cell);
      // Col
      ctx.fillRect(originX + selectedToken * cell, originY, cell, gridH);
      // Border row
      ctx.strokeStyle = 'rgba(99,102,241,0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(originX, originY + selectedToken * cell, gridW, cell);
      ctx.strokeRect(originX + selectedToken * cell, originY, cell, gridH);
    }

    // Y-axis labels (query tokens, left side)
    ctx.fillStyle = '#8b9ec7';
    ctx.font = `${Math.max(8, Math.min(11, cell - 2))}px JetBrains Mono, monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < S; r++) {
      const label = tokens[r].length > 10 ? tokens[r].slice(0, 9) + '…' : tokens[r];
      const y = originY + r * cell + cell / 2;
      if (r === selectedToken) {
        ctx.fillStyle = '#a5b4fc';
        ctx.font = `bold ${Math.max(8, Math.min(11, cell - 2))}px JetBrains Mono, monospace`;
      } else {
        ctx.fillStyle = '#8b9ec7';
        ctx.font = `${Math.max(8, Math.min(11, cell - 2))}px JetBrains Mono, monospace`;
      }
      ctx.fillText(label, originX - 6, y);
    }

    // X-axis labels (key tokens, bottom, rotated)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    for (let c = 0; c < S; c++) {
      const label = tokens[c].length > 10 ? tokens[c].slice(0, 9) + '…' : tokens[c];
      const x = originX + c * cell + cell / 2;
      if (c === selectedToken) {
        ctx.fillStyle = '#a5b4fc';
        ctx.font = `bold ${Math.max(8, Math.min(11, cell - 2))}px JetBrains Mono, monospace`;
      } else {
        ctx.fillStyle = '#8b9ec7';
        ctx.font = `${Math.max(8, Math.min(11, cell - 2))}px JetBrains Mono, monospace`;
      }
      ctx.save();
      ctx.translate(x, originY + gridH + 6);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    // Axis titles
    ctx.fillStyle = '#4b5a7a';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Key (attended to)', originX + gridW / 2, canvas.height);

    ctx.save();
    ctx.translate(10, originY + gridH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Query (attends from)', 0, 0);
    ctx.restore();

    // Colorbar
    const cbX = originX + gridW + 8;
    const cbW = 12;
    const cbH = gridH;
    const grad = ctx.createLinearGradient(0, originY, 0, originY + cbH);
    grad.addColorStop(0,    '#f59e0b');
    grad.addColorStop(0.18, '#c026d3');
    grad.addColorStop(0.35, '#7c3aed');
    grad.addColorStop(0.5,  '#4f46e5');
    grad.addColorStop(0.65, '#312e81');
    grad.addColorStop(0.85, '#1e1b4b');
    grad.addColorStop(1,    '#080b14');
    ctx.fillStyle = grad;
    ctx.fillRect(cbX, originY, cbW, cbH);
    ctx.strokeStyle = 'rgba(99,102,241,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cbX, originY, cbW, cbH);
    // Colorbar ticks
    ctx.fillStyle = '#4b5a7a';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    for (const [frac, label] of [[0, '1.0'], [0.5, '0.5'], [1, '0.0']]) {
      ctx.fillText(label, cbX + cbW + 3, originY + cbH * frac);
    }
  }, [matrix, tokens, selectedToken]);

  /* ── Click handler ──────────────────────────────────────────────────────── */
  const handleClick = useCallback((e) => {
    if (!matrix || !tokens) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const S = tokens.length;
    const LABEL_W = 88;
    const PAD_T   = 12;
    const availW  = canvas.width  - LABEL_W - 24;
    const availH  = canvas.height - 80      - PAD_T;
    const cell    = Math.max(4, Math.min(Math.floor(availW / S), Math.floor(availH / S)));
    const scaleX  = canvas.width  / rect.width;
    const scaleY  = canvas.height / rect.height;
    const cx      = (e.clientX - rect.left) * scaleX;
    const cy      = (e.clientY - rect.top)  * scaleY;
    const col     = Math.floor((cx - LABEL_W) / cell);
    const row     = Math.floor((cy - PAD_T)   / cell);
    if (row >= 0 && row < S && col >= 0 && col < S) {
      onSelectToken(selectedToken === row ? null : row);
    }
  }, [matrix, tokens, selectedToken, onSelectToken]);

  /* ── Hover handler — show tooltip ───────────────────────────────────────── */
  const tooltipRef = useRef(null);
  const handleMouseMove = useCallback((e) => {
    if (!matrix || !tokens) return;
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    const rect = canvas.getBoundingClientRect();
    const S = tokens.length;
    const LABEL_W = 88;
    const PAD_T   = 12;
    const availW  = canvas.width  - LABEL_W - 24;
    const availH  = canvas.height - 80      - PAD_T;
    const cell    = Math.max(4, Math.min(Math.floor(availW / S), Math.floor(availH / S)));
    const scaleX  = canvas.width  / rect.width;
    const scaleY  = canvas.height / rect.height;
    const cx      = (e.clientX - rect.left) * scaleX;
    const cy      = (e.clientY - rect.top)  * scaleY;
    const col     = Math.floor((cx - LABEL_W) / cell);
    const row     = Math.floor((cy - PAD_T)   / cell);
    if (row >= 0 && row < S && col >= 0 && col < S) {
      const val = matrix[row]?.[col] ?? 0;
      tooltip.style.display  = 'block';
      tooltip.style.left     = `${e.clientX - rect.left + 12}px`;
      tooltip.style.top      = `${e.clientY - rect.top  - 32}px`;
      tooltip.innerHTML =
        `<b>${tokens[row]}</b> → <b>${tokens[col]}</b><br/>` +
        `weight: <span style="color:#f59e0b">${val.toFixed(4)}</span>`;
    } else {
      tooltip.style.display = 'none';
    }
  }, [matrix, tokens]);

  const handleMouseLeave = () => {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none';
  };

  if (!matrix || matrix.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔭</div>
        <h3>No attention data yet</h3>
        <p>Enter a sentence and click Analyze Attention to visualise the weights.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }} className="fade-in">
      <canvas
        ref={canvasRef}
        width={820}
        height={480}
        style={{ width: '100%', height: 'auto', cursor: 'crosshair', borderRadius: 8 }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display:       'none',
          position:      'absolute',
          pointerEvents: 'none',
          background:    '#111827',
          border:        '1px solid #6366f1',
          borderRadius:  6,
          padding:       '6px 10px',
          fontSize:      12,
          fontFamily:    'JetBrains Mono, monospace',
          color:         '#f0f4ff',
          whiteSpace:    'nowrap',
          zIndex:        10,
          boxShadow:     '0 4px 12px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}
