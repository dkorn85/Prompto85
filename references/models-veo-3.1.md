# Veo 3.1 (Google DeepMind)

> **Note on "Veo 3.5":** there is no public Veo 3.5. The current Veo line is **Veo 3.1** (Oct 2025) + **Veo 3.1 Fast** + **Veo 3.1 Lite** (31 Mar 2026, <50% the cost of Fast, same speed). Google has since moved its generative-video center of gravity into **Gemini Omni** (see `models-gemini-omni.md`). Use Veo 3.1 as the documented, production-stable Google route; treat any "3.5" request as Veo 3.1 unless Google ships it.

## Identity
Google's cinematic realism specialist. Strongest at **photoreal humans** (faces, emotion, natural movement) and **native synchronized audio** — dialogue, sound effects, and ambient soundscapes baked into one generation, no separate audio track. Outputs **720p / 1080p** (4K on some surfaces), ~6–8s clips. Available in the Gemini app, Google AI Studio, Vertex AI, and the **Flow** filmmaking tool.

## Strengths
- Realistic people + natural human motion and expression (its signature edge).
- Native audio: word-accurate dialogue, SFX, ambient — generated with the video.
- Strong image-to-video (pairs with Nano Banana stills).
- **Object Insertion** (leading results in head-to-head tests): insert/replace an object into a scene.
- Improved temporal consistency + prompt adherence vs Veo 3.

## How to prompt (Google's directing formula)
Write like a director, single scene per clip:
```
[Shot type] of [subject] [action] in [setting], [time of day], [style/mood]. [Camera move]. [Lighting]. Audio: [dialogue / SFX / ambient].
```
Example shape: `Sweeping drone shot of a lone hiker crossing a fog-covered ridge at dawn, cinematic realism, shallow depth of field. Audio: wind, footsteps, ambient birdsong.`
- One coherent action + one camera move per clip (same discipline as Seedance/Kling).
- Put audio explicitly in an `Audio:` clause — this is where Veo shines.
- For consistent characters/styles across clips, anchor with an image (Nano Banana) and reuse the locked DNA + style token block.

## When to choose Veo 3.1
- Photoreal human performance, talking-head, emotional close-ups.
- You want dialogue + ambient + SFX in ONE pass with high realism.
- Single hero clips rather than 6-shot storyboards (for native multi-shot, Kling 3.0 is stronger; for any-input→video, Gemini Omni).
