import { createRoot, Component } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#060D1F', color: '#CAFF00', fontFamily: 'monospace', padding: '2rem', zIndex: 9999, overflow: 'auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>⚠ Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#FF0090', fontSize: '0.85rem' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#00D4FF', fontSize: '0.75rem', marginTop: '1rem' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
