# Gemini Omni (Google, announced I/O 2026 · 19 May 2026)

Google's first **any-to-any multimodal model** — "create anything from any input, starting with video." It moves generative video out of the standalone Veo line into the core Gemini system, combining Gemini's intelligence with Veo, Nano Banana, and Genie (world model). First release: **Gemini Omni Flash**.

## What's live at launch (Gemini Omni Flash)
- Inputs: **text + image + audio + video in a single prompt**; the model *reasons across* them to produce ONE output (it doesn't just stitch them).
- Output: **video** (image/audio output are on the roadmap, not at launch).
- **Clips capped at ~10s** at launch (Gemini app, YouTube Shorts, Flow / Flow Music for Google AI subscribers).
- **Conversational editing:** revise in the next message; the scene keeps prior context across turns.
- **Character consistency:** a character introduced in one shot keeps face, clothing, and **voice** across cuts and across later edits *in the same conversation* — without re-uploading the reference.
- Strong **physics / world reasoning** (gravity, kinetic energy, fluid dynamics) with synchronized audio in one pass.
- Every clip carries **SynthID**. API access announced as "weeks" out from launch.
- Held back at launch (safety): voice-swap in existing footage, person→animal while preserving original voice.

## How to prompt
Treat it like a director talking to a smart assistant, then refine conversationally:
```
Turn 1: [full scene brief: subject + action + setting + camera + lighting + audio intent], 9:16, ~10s.
Turn 2: "Now make the light colder and push in slower."   <- conversational edit, keeps context
```
- Lean on its cross-modal reasoning: you can hand it a reference image + a reference audio mood + text and let it unify them.
- For character continuity, establish the character clearly in the first turn, then keep editing in the same conversation rather than re-prompting from scratch.
- Keep beats to ~10s; for longer/ad/multi-shot work, orchestrate across models (Omni for the hero beat, Kling for multi-shot, ElevenLabs for premium voice).

## When to choose Gemini Omni
- You want one tool to take messy mixed inputs → a coherent video with in-conversation iteration.
- Physics-heavy or world-simulation shots with native audio.
- NOT for: >10s single generations, strict 6-shot storyboards (use Kling 3.0), or final-grade premium voice (route voice to ElevenLabs — see `audio-elevenlabs.md`).
