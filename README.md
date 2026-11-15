# Atrium

Take an NCERT biology diagram apart in 3D with your bare hands. An AI tutor explains each part, sets a small task, and asks a NEET-style question.

**Watch the demo (3 min 38 s):** [YOUTUBE HERE](https://youtu.be/AOYcQKDiNA8)

**Try it live:** https://atrium-rouge-theta.vercel.app

Made for INNOVEX 2026, problem statement PS03 (Intelligent Education).

## Why it matters

- **Original.** Students do not watch a 3D model. They hold it. A webcam and two bare hands are all it takes to turn a heart, pull it apart and lift out one chamber. No headset, no controller, no app to install.
- **Innovative.** The student touches a part first, and only then is asked about it. Hands, tutor and quiz are one loop, and every wrong answer comes back later in a short daily round.
- **Built, not mocked.** Six full 3D models made in code, live hand tracking in the browser, a tutor in three languages, a photo reader for book diagrams, tasks, quizzes and a progress page. All of it runs in the live demo.
- **Real-world impact.** Lakhs of students sit NEET every year, and most learn biology from flat pictures with no one to ask. Atrium runs on an ordinary laptop in a browser, works with a mouse when there is no camera, and explains in English, Hindi and Marathi.

## The problem

NEET students learn biology from flat diagrams in a book. A heart or a DNA helix is a 3D object, and a flat picture hides how the parts fit together. Most students also have no one to ask when a part is unclear, and nothing tells them which parts they keep getting wrong.

Atrium is for students in Classes 10 to 12 who are preparing for NEET.

## How it works

1. **Pick a diagram.** Choose a model from the library, or take a photo of a diagram in your book and we open the matching one.
2. **Take it apart.** Use your webcam and your bare hands. Pinch to grab and turn a model. Spread your two hands to pull it apart. Pinch a part to pull it out. If you have no camera, the mouse does the same things.
3. **Learn and check.** The tutor explains the part you pick, gives you a hands-on task, then asks a question. It remembers which parts you got wrong and brings them back later in a short daily round.

## What we built

- **Six 3D models, 56 parts.** Human heart, animal cell, flower, DNA double helix, sarcomere, and neuron with a reflex arc. Every model is generated in code, so there are no downloaded 3D files.
- **Hand control.** Point to name a part, hold still to select it, pinch to turn, pinch a part to pull it out, spread two hands to explode, show a palm to reset.
- **A tutor that stays honest.** It only uses notes we wrote from the NCERT books. The AI rephrases them and translates them into English, Hindi and Marathi. It does not add facts of its own.
- **39 tasks and 55 questions, all our own.** We did not copy past papers or textbook passages. A 50-50 hint is there when a student is stuck.
- **Scan a diagram.** Take a photo of a diagram in your book and the matching model opens.
- **Progress that guides revision.** The app tracks each part, lists the weak ones and builds a five-minute daily round from them.
- **Private by design.** Hand tracking runs in your browser. No video leaves your device.

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

## About the demo video

Every shot is the real app. The clicks and the 3D tour are scripted so the capture is smooth. Tutor replies and photo reading are real. The hands chapter is a live screen recording.

## What is next

- Spoken explanations.
- More models and more chapters.
- Measuring frame rate and tracking speed on low-end laptops.

## Team

Rishi: hand tracking, interaction, tutor and procedural models.
Harshavi: design, 3D scene and the heart, cell and flower models.

## Credits and licence

See `CREDITS.md`. Code is MIT, see `LICENSE`.
