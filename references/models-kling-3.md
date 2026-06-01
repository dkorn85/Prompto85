# Kling 3.0 & Kling 3.0 Omni (Kuaishou, released 5 Feb 2026)

A **scene-aware AI director**, not just a text-to-video generator. The headline feature is **native multi-shot**: a storyboard of up to **6 shots in a single output**, up to **15s total**, with **native audio + lip-sync** and multilingual dialogue. Unified multimodal engine (text/image/video/audio as equal inputs), "Elements 3.0", physics-aware motion.

## Kling 3.0 vs Kling 3.0 Omni
- **Kling 3.0** — focus on video quality, motion, multi-shot, native audio. Great for single connected sequences.
- **Kling 3.0 Omni** — the "everything" model. Adds: character **voice binding**, **video-source character reference**, video-to-video as a primary mode, `@` tagging + Elements, and **multi-clip consistency** (same character looks/sounds identical across separate generations). Choose Omni whenever identity must hold across shots/clips, or when restyling existing footage.

## Prompt format — STRUCTURED SHOT LISTS (not prose)
Prose paragraphs → inconsistent shots. Write a numbered, time-coded shot list:
```
Shot 1 (3s): [shot size + subject + ONE action + camera + light]
Shot 2 (3s): [continuation — explicit motion, who does what]
Shot 3 (4s): [...]
Shot 4 (5s): [... + dialogue line if any]  Native audio: English voice, natural lip-sync.
```
- Custom Multi-shot mode lets you define shot count, per-shot duration, framing, and action. The clearer the shot labels, the tighter the adherence.
- Handles **shot-reverse-shot** and maintains character appearance across angles. For multi-character dialogue, specify **who speaks when**.

## User's locked Kling 3.0 Omni conventions (honour these)
- 12–15s; **max 4 characters**; **explicit layout, no wide shots**; **IMAX handheld realism**; **time-coded segments**; **realistic physics**.
- Scene-prompt skeleton per shot: **Firstframe – Transition – Lastframe**.

## Omni editing & continuity tools (OmniEdit + modes)
- **Video-to-video:** upload rough footage (even an iPhone clip); Kling reimagines it with cinematic value while preserving core action/composition.
- **OmniEdit:** generative fill, relight, object swap, reframe, cleanup — while preserving original motion. Use it to fix lip-sync/morphing instead of re-rolling.
- **Sequential shots / scene extension:** generate the next/previous shot from existing footage for seamless continuity.
- **AI transitions:** feed last frame of clip A + first frame of clip B → smooth transition.
- **Video restyle:** change the look while keeping camera motion intact.
- **Motion transfer:** apply the camera move/action from one clip to a new generation.
- **Shot switching:** change angle (CU ↔ WS) on the same subject.
- **Elements / @ tags:** lock backgrounds + character identity via multi-angle references; reference them by tag in the shot list.

## Physics realism (the anti-moonwalk trick)
Describe mechanics explicitly: "each step lands heel-first, then rolls forward with visible weight transfer." Forcing the model to calculate ground contact prevents floating/sliding feet. Same logic for impacts, throws, cloth, and hair.

## Pitfalls → fixes
- Prose instead of shot lists → rewrite as a numbered list.
- Native audio left ON during drafts → it costs significantly; **iterate silent, add audio on the final take.**
- Lip-sync drift in long dialogue → shorten lines or fix with OmniEdit.
- Wide shots when continuity matters → user convention forbids them; stay in medium/close coverage.
- **Prompt in English** for best cinematic-term adherence even if display text is German.
