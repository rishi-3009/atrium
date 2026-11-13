# Rishi: interaction and intelligence

You own `src/hands/`, `src/interaction/`, `src/tutor/`, `api/`, `src/models/procedural/`, and content for your three models. `src/shared/` changes go in their own PR for Harshavi to review.

## Build order
1. **Scaffold (first PR, today).** Vite + strict TS, Tailwind, ESLint, Prettier, CI (typecheck, lint, build), Vercel, protect `main`. Add `src/shared/types.ts` and the stores with a mouse-driven fake hand so Harshavi is unblocked. Include `.gitignore`, `.env.example`, `LICENSE`, `CREDITS.md` and a short first README.
2. **Hand engine.** Camera permission flow, HandLandmarker for two hands, One Euro smoothing, derived signals (pinch strength, pinch point, palm direction, speed). Gesture state machine with hysteresis: point, pinch-grab, two-hand spread, open palm (reset). Move tracking to a Web Worker if render fps drops.
3. **Hand visual.** Glowing 3D skeleton in the scene, fingertip trails, a pinch ring that fills, a framed mirror camera tile, and a 10-second onboarding that teaches the four gestures.
4. **Interaction.** Ray from the pinch point; hover; grab-rotate with inertia; two-hand spread drives explode 0-1; pinch a part to pull it out; release snaps it back; dwell to select.
5. **Procedural models.** DNA (colour-coded base pairs, unzip and copy a strand), sarcomere (filaments slide with hand distance, bands resize), neuron + reflex arc (impulse travels and jumps node to node).
6. **Tutor.** `/api/tutor`: part note + level (10, 11, NEET) + language + history -> streamed explanation. Task engine: teach -> hands-on task -> verify the action -> MCQ -> update memory. Learner memory in localStorage: score per part, spaced revisits, a daily 5-minute round.
7. **Photo to model.** `/api/identify`: photo of an NCERT diagram -> model id, or a 2D explanation when we have no model.
8. **Voice.** Speak explanations; fall back to text when a Hindi or Marathi voice is missing.
9. **README and repo front door (judges read this).** Update the README as features land; final pass before submitting.

## README, in this order
1. Name, one-line description, live demo link, a GIF of hands pulling a model apart.
2. The problem, in three sentences, and who it is for.
3. How it works, in three steps with screenshots.
4. What makes it different. Which problem statement it answers (PS03) and how.
5. Tech used, as a short list with one line each on why.
6. Run it locally in three commands. Note that the camera is optional; the mouse works.
7. What is next. Team. Credits and licences.

Write it as "we", in plain words. No claims we can't show in the demo. Also set the repo description, website link and topics, and draft the Unstop submission text (title, description, technologies) from the README.

## Acceptance for the hand camera
- No flicker between gestures; a held pinch never drops.
- Feels instant; the cursor doesn't jitter at rest.
- Works in normal room light, at 40-80 cm, with either hand.
- Everything still works with a mouse.

## Handoffs
- You give Harshavi: stores, types and the fake hand (step 1), then gesture events.
- You need from Harshavi: `highlight(partId)`, the explode-driven animation, part meshes by name, the scene camera.

Open choice: LLM provider. Keep the model name in one constant in `api/config.ts`.
