# Seedance 2.0 (ByteDance / Dreamina)

The first video model with **four-modal input: image + video + audio + text**. Generates up to **2K, ≤15s, with native audio**, typically in under a minute. Modes: T2V, I2V, R2V (reference-to-video), V2V. Also generates legible text overlays.

## The standard prompt structure
**Subject → Action → Camera → Style.** Keep it clear, not clever.

1. **Subject** — WHO/WHAT is the focus. State it plainly.
2. **Action** — ONE clear movement, present-tense verb, **a single beat per shot**.
3. **Camera** — shot size + angle + **one** camera move (see vocab below).
4. **Style** — environment, lighting, palette, format/film look (your locked style token block).

> Add audio/SFX/ambient and on-screen text last if needed.

## The `@asset` multimodal system (the superpower)
Reference uploaded assets by label inside the prompt. Typical roles:
- `@Image1` → first-frame / main visual + composition reference.
- `@Video1` → **camera movement / motion / blocking** reference (transfers moves better than words).
- `@Audio1` → music / rhythm / mood that the cut can sync to.

Patterns that work:
- "Use the composition from `@Image1`." / "Follow the camera move and pacing from `@Video1`." / "Sync action to `@Audio1`."
- Separate the jobs: `@Video1` drives camera + pacing; text or `@Image1` drives the *new* subject/scene. **Don't jam both ideas into one sentence.**
- **Single-frame mode:** upload first + last frame to lock visual consistency across the clip.

## Camera vocabulary (use ONE per shot)
push-in / pull-out · pan left|right · tilt up|down · orbit (arc) around subject · tracking / dolly follow · crane up|down · static lock-off · handheld.
- ✅ "camera slow push-in"
- ❌ "push-in, then pan left, zoom out, orbit" → conflicting moves = jitter/incoherence.

## Multi-shot / concatenation
Supports up to **3 video inputs**, total duration **≤15s**. Structure:
```
[Video1] + [transition description] + connect to [Video2] + [transition] + connect to [Video3]
```
For an original multi-beat sequence, prefer the CUT workflow: one clean beat per clip, then stitch.

## Physics & realism
Seedance handles authentic dynamics (cloth drape, liquid flow, body mechanics) **without** heavy instruction — but for action, still describe ground contact / weight transfer to prevent floating. Trust it on continuous natural motion ("hanging laundry, shaking it out firmly").

## Iteration discipline
- Baseline: generate 2–3 with a standard prompt.
- **Change ONE variable at a time** (camera, OR lighting, OR subject) — never several at once.
- Keep a project template library of verified prompts by scenario.

## Negative prompts
Supported. Common: `no morphing, no warping, no jitter, no extra limbs, no flicker, no text artifacts, no identity drift`.
