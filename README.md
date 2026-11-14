# Atrium

Take an NCERT biology diagram apart in 3D with your bare hands. An AI tutor explains each part, sets a small task, and asks a NEET-style question.

**Live demo:** DEMO_URL_HERE

Made for INNOVEX 2026, problem statement PS03 (Intelligent Education).

## The problem

NEET students learn biology from flat diagrams in a book. A heart or a DNA helix is a 3D object, and a flat picture hides how the parts fit together. Most students also have no one to ask when a part is unclear, and nothing tells them which parts they keep getting wrong.

Atrium is for students in Classes 10 to 12 who are preparing for NEET.

## How it works

1. **Pick a diagram.** Choose a model from the library, or take a photo of a diagram in your book and we open the matching one.
2. **Take it apart.** Use your webcam and your bare hands. Pinch to grab and turn a model. Spread your two hands to pull it apart. Pinch a part to pull it out. If you have no camera, the mouse does the same things.
3. **Learn and check.** The tutor explains the part you pick, gives you a hands-on task, then asks a question. It remembers which parts you got wrong and brings them back later in a short daily round.

## What makes it different

- It answers PS03 by making the student do the learning. You touch the part, then you are asked about it.
- The tutor only uses notes we wrote from the NCERT books. The AI rephrases them and translates them into English, Hindi and Marathi. It does not add facts of its own.
- Questions are our own. We did not copy past papers or textbook passages.
- Hand tracking runs in your browser. No video leaves your device.

## Models

Six models: human heart, animal cell, flower, DNA double helix, sarcomere, and neuron with a reflex arc. Each has notes, tasks and questions.

## Tech used

- Vite, React and TypeScript: the app.
- three.js with React Three Fiber and drei: the 3D scene.
- MediaPipe HandLandmarker: finds your hands in the browser.
- zustand: shared state, so the mouse and the hands drive the same controls.
- Tailwind CSS and Framer Motion: the interface and its motion.
- Vercel serverless functions: the tutor and the photo reader call the Gemini API from the server, so the key is never in the browser.

## Run it locally

```
git clone https://github.com/rishi-3009/atrium
cd atrium
npm install && npm run dev
```

The camera is optional. Without it, the mouse works: move to point, hold the button to pinch.

The tutor and photo reading need a key. Copy `.env.example` to `.env` and set `LLM_API_KEY`. Without a key, the app still works and shows the stored notes.

## What is next

- Spoken explanations.
- More models and more chapters.
- Measuring frame rate and tracking speed on low-end laptops.

## Team

Rishi: hand tracking, interaction, tutor and procedural models.
Harshavi: design, 3D scene and the heart, cell and flower models.

## Credits and licence

See `CREDITS.md`. Code is MIT, see `LICENSE`.
