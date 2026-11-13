# Atrium

Repo: https://github.com/rishi-3009/atrium (we build here and judges read it).

Hands-on 3D biology for NEET aspirants (NCERT Classes 10-12). A student opens an NCERT diagram as a 3D model, takes it apart with bare hands on a webcam, and an AI tutor explains each part, sets a hands-on task, asks a NEET-style MCQ, and remembers weak parts.

Hackathon: INNOVEX 2026, PS03 Intelligent Education. Submit by **15 Nov 2026, 23:55 IST**: GitHub URL, live demo link, description.

## Every session, first
1. If the user hasn't said who they are, ask: Rishi or Harshavi?
2. Read that person's file only: `docs/RISHI.md` or `docs/HARSHAVI.md`.
3. Edit only folders that person owns. If a change is needed elsewhere, stop and say so; the teammate makes it.

## Stack (change only if both agree)
- Vite, React, TypeScript (strict)
- three.js through @react-three/fiber, drei, postprocessing
- @mediapipe/tasks-vision HandLandmarker (in-browser; no video leaves the device)
- zustand (state), Tailwind CSS, Framer Motion
- `/api` serverless functions for the tutor LLM; API key in env vars only
- Vercel deploy (camera needs HTTPS)

## Folders and owners
| Path | Holds | Owner |
| --- | --- | --- |
| `src/shared/` | types, stores | both (own small PR) |
| `src/hands/` | camera, tracking, gestures, hand visual | Rishi |
| `src/interaction/` | gestures to grab, rotate, explode, select | Rishi |
| `src/tutor/`, `api/` | task engine, learner memory, LLM calls | Rishi |
| `src/models/procedural/` | DNA, sarcomere, neuron | Rishi |
| `src/ui/` | design system, dashboard, tutor panel | Harshavi |
| `src/scene/` | canvas, lighting, post-processing, camera | Harshavi |
| `src/models/glb/`, `public/models/` | heart, cell, flower | Harshavi |
| `src/content/` | notes, tasks, MCQs per model | that model's owner |

## Contracts (source of truth: `src/shared/types.ts`)
- `ModelDefinition`: id, title, chapters, parts[] (id, label, mesh name, note key), tasks[].
- `useHandStore`: per-hand landmarks, pinch 0-1, pinch point, gesture. The mouse fallback writes the same store.
- `useSceneStore`: hovered part, selected part, explode 0-1, rotation.
- UI and scene read stores; they never import from `hands/`.

## Quality bar (non-negotiable)
The 3D, the dashboard and the hand camera must look like a shipped premium product.
- No default three.js look: HDRI lighting, PBR materials, rim light, restrained bloom, depth of field, vignette.
- Every state change is animated with springs or easing. Nothing pops.
- Hands render as a glowing 3D skeleton with trails and a pinch ring, never raw debug dots.
- Hover = rim highlight + label with a leader line. Explode = staggered spring.
- 60 fps render and 30 fps tracking on a mid laptop. Measure it.
- Design tokens only (`src/ui/tokens.ts`); no ad-hoc colours or fonts.
- After a visual change, run the app and look at a screenshot before calling it done.

## Science and content
- Facts come only from notes in `src/content/`, written from NCERT. The LLM rephrases, translates (English, Hindi, Marathi) and asks questions; it adds no facts.
- Write our own NEET-style MCQs. Do not copy past papers or textbook passages.
- GLB models: CC0 or CC-BY only; log source and licence in `CREDITS.md`.

## Git
- `main` is protected and always deployable. Branches: `rishi/<topic>`, `harshavi/<topic>`.
- Small PRs, one feature each. Teammate reviews. Squash merge. Pull `main` before starting work.
- A PR is done when typecheck, lint and build pass, it works with mouse and with hands, and the console is clean.
- Never commit secrets, `node_modules`, or unoptimised models.

## Public repo rules
- No AI attribution anywhere: no `Co-Authored-By` lines, no "Generated with" footers, in any commit, push or PR.
- Commit and PR text: short, plain, imperative, written the way a person writes.
- README and all public text: simple words, short sentences, no hype, no buzzwords, no emoji walls. A first-year student should follow it.

## Keep context small
- Don't read `public/models/`, lockfiles or build output.
- Read only the files the task needs. No long pasted logs.
- No new docs beyond `README.md`, `CREDITS.md` and `LICENSE`. Decisions go in PR descriptions; contracts go in code.
- Keep this file under 80 lines.
