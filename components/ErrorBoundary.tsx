"use client";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (typeof window !== "undefined") {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/20 text-rose-300">
            <AlertTriangle size={22} />
          </div>
          <h2 className="mt-4 text-base font-semibold text-white">Something broke</h2>
          <p className="mt-1 text-sm text-white/60">
            {this.state.error.message || "An unexpected error occurred."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={this.reset} icon={<RefreshCw size={14} />}>
              Try again
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                this.reset();
                if (typeof window !== "undefined") window.location.href = "/";
              }}
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
