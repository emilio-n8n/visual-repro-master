import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-[#C4A264]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-[#C4A264]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#F0EAE0] mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-[#F0EAE0]/60 mb-6">
              Nous nous excusons pour la gêne. Veuillez réessayer ou revenir plus tard.
            </p>
            {this.state.error && (
              <p className="text-xs text-[#F0EAE0]/40 mb-6 font-mono">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-[#C4A264] text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
                className="border-[#C4A264]/30 text-[#F0EAE0] hover:bg-[#C4A264]/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-[#1a1a1a] rounded-lg border border-red-500/20">
          <p className="text-red-400 text-sm mb-3">
            Erreur: {this.state.error?.message || "Une erreur s'est produite"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleRetry}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}