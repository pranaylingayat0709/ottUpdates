"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}
interface State {
  hasError: boolean;
}

// Prevents one bad title (a malformed image URL, an unexpected null field
// from a live API) from blanking the entire page — a render error in the
// wrapped subtree is caught and replaced with a small inline notice instead
// of unmounting everything above and below it.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[OTT Weekly Pulse] Render error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          {this.props.fallbackLabel ?? "This section couldn't be displayed right now."}
        </div>
      );
    }
    return this.props.children;
  }
}
