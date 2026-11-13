import { useEffect, useState } from 'react'
import { explain, type ExplainRequest, type ExplainSource } from './client'

interface Run {
  key: string
  text: string
  done: boolean
  source: ExplainSource | null
}

export interface Explanation {
  text: string
  streaming: boolean
  source: ExplainSource | null
}

/** Streams an explanation and restarts whenever the request key changes. */
export function useExplanation(req: ExplainRequest, key: string): Explanation {
  const [run, setRun] = useState<Run>({ key: '', text: '', done: false, source: null })

  useEffect(() => {
    const ctrl = new AbortController()
    explain(
      req,
      (chunk) =>
        setRun((r) => (r.key === key ? { ...r, text: r.text + chunk } : { key, text: chunk, done: false, source: null })),
      ctrl.signal,
    ).then((source) => {
      if (ctrl.signal.aborted) return
      setRun((r) => ({ key, text: r.key === key ? r.text : '', done: true, source }))
    })
    return () => ctrl.abort()
    // `req` is rebuilt every render; `key` says when it really changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = run.key === key
  return { text: current ? run.text : '', streaming: !(current && run.done), source: current ? run.source : null }
}
