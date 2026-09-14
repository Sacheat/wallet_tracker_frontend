import { Component, type ErrorInfo, type ReactNode } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
          <TriangleAlert className="text-destructive size-8" />
          <p className="text-sm font-medium">Une erreur inattendue est survenue.</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {this.state.error.message}
          </p>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Retour au portefeuille
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
