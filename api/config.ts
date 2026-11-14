/** The one place that names the tutor model and provider. Change it here only. */
export const TUTOR_MODEL = 'gemini-3.5-flash-lite'

/** Gemini REST endpoint. The key goes in a header, never in the URL. */
export const TUTOR_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TUTOR_MODEL}:streamGenerateContent?alt=sse`

/**
 * Reply length cap. The reply is about 90 words, but Hindi and Marathi use
 * many more tokens per word, and some models spend tokens on thinking first.
 */
export const MAX_REPLY_TOKENS = 1200

/** Limits on what a request may carry. Stops oversized or abusive bodies. */
export const LIMITS = {
  note: 4000,
  label: 120,
  history: 6,
  historyItem: 1500,
} as const

/**
 * Per-visitor cap, so one person cannot use up the free quota for everyone.
 * The free tier for this model is 15 requests a minute and 500 a day, shared
 * by all visitors (checked in AI Studio, Nov 2026).
 */
export const RATE = { perMinute: 5, perDay: 40 } as const

/** The photo reader. Same provider as the tutor; change the name here only. */
export const IDENTIFY_MODEL = 'gemini-3.5-flash-lite'
export const IDENTIFY_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IDENTIFY_MODEL}:generateContent`

/** Photo limits. The client shrinks photos first; Vercel rejects bodies over 4.5 MB. */
export const IDENTIFY_LIMITS = { imageChars: 3_000_000, reply: 600 } as const
export const IDENTIFY_RATE = { perMinute: 3, perDay: 20 } as const

/** Models we have in 3D. Keep in step with `src/content`. */
export const MODEL_IDS = ['heart', 'cell', 'flower', 'dna', 'sarcomere', 'neuron'] as const
