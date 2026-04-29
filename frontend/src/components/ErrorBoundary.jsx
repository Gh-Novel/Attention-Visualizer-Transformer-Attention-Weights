// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message ?? String(err) };
  }

  componentDidCatch(err, info) {
    console.error('ErrorBoundary caught:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-banner" style={{ margin: 16 }}>
          <span>⚠️</span>
          <div>
            <strong>Component error</strong>
            <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'JetBrains Mono' }}>
              {this.state.message}
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{ marginLeft: 'auto', background: 'none', border: 'none',
                     color: '#fca5a5', cursor: 'pointer', fontSize: 18 }}
          >
            ↺
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
