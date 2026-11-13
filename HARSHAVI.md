# Harshavi: visual experience

You own `src/ui/`, `src/scene/`, `src/models/glb/`, `public/models/`, and content for your three models. `src/shared/` changes go in their own PR for Rishi to review.

Start from Rishi's scaffold PR. Until it merges, draft the design tokens and shortlist the GLB models.

## Build order
1. **Design system.** `src/ui/tokens.ts`: colour, type scale, spacing, radius, glow, motion timings. Dark, cinematic, one accent. Core components: button, card, glass panel, chip, progress ring, toast.
2. **Scene rig.** R3F canvas, HDRI environment, key and rim lights, post-processing (bloom, depth of field, vignette, light film grain), adaptive resolution. Camera moves between overview and part close-up.
3. **Part visuals.** Rim highlight on hover, labels with leader lines, explode animation with staggered springs driven by `explode` in the scene store, selected part in focus with the rest dimmed.
4. **GLB models.** Heart, cell, flower. Each needs a separate, named mesh per part; if a model is one lump, split it in Blender or pick another. Custom materials (soft tissue, translucent membrane, petals). Compress with Draco or meshopt; aim under 5 MB each. Write the `ModelDefinition`, notes, tasks and MCQs.
5. **App shell and dashboard.** Landing with a live 3D hero; chapter browser by class and unit; model stage layout (3D centre, tutor panel right, task bar bottom, camera tile in a corner); progress view showing weak parts; daily revision card.
6. **Tutor panel.** Streaming text, language switch, MCQ cards, hints, right and wrong animations.
7. **Polish.** Loading screens, no-camera and permission-denied states, laptop widths down to 1366 px, a scripted demo path for the video.

## Acceptance for visuals
- A screenshot of any screen could pass as a product page.
- No default fonts, greys or unstyled controls anywhere.
- 60 fps with post-processing on a mid laptop; drop effects before dropping frames.
- Every model reads clearly when exploded; labels never overlap.

## Handoffs
- You need from Rishi: stores, types and the fake hand (his first PR), then gesture events.
- You give Rishi: `highlight(partId)`, the explode-driven animation, part meshes by name, the scene camera.
