import { Component, type ReactNode } from 'react'
import { Button } from '../components/Button'
import { color, font } from '../tokens'

let supported: boolean | null = null

/** True when the browser can make a WebGL context. Checked once, then remembered. */
export function webglSupported(): boolean {
  if (supported !== null) return supported
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    supported = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    supported = false
  }
  return supported
}

function Problem({ title, text, onRetry }: { title: string; text: string; onRetry?: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center', maxWidth: 380 }}>
        <h2 style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600, margin: 0 }}>{title}</h2>
        <p style={{ color: color.text.secondary, margin: 0, lineHeight: 1.6 }}>{text}</p>
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
      </div>
    </div>
  )
}

interface State {
  failed: boolean
}

/** Catches 3D errors so one bad frame does not blank the whole app. */
export class StageBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[stage]', error)
  }

  render() {
    if (!webglSupported()) {
      return (
        <Problem
          title="3D is not available"
          text="This browser cannot draw 3D graphics. Try the latest Chrome, Edge or Firefox, and check that hardware acceleration is on."
        />
      )
    }
    if (this.state.failed) {
      return (
        <Problem
          title="The 3D view stopped"
          text="Something went wrong while drawing the model."
          onRetry={() => this.setState({ failed: false })}
        />
      )
    }
    return this.props.children
  }
}
