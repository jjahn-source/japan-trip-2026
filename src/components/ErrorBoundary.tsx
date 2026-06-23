import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#060e1a]">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">⛩️</div>
            <h1 className="text-xl font-bold text-accent-400 mb-2">Something broke</h1>
            <p className="text-slate-400 text-sm mb-6 font-mono break-all">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-300 hover:bg-accent-500/30 transition-colors text-sm font-semibold"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
