# GPT Image 2.0 (`gpt-image-2`)

OpenAI's most capable image generation + editing model, released 21 Apr 2026 (product surface: "ChatGPT Images 2.0"). Quality-first architecture integrated into GPT-4o, with **integrated reasoning** ("Thinking"). Knowledge cutoff Dec 2025 — it understands recent brands/styles without you describing them from scratch.

## What it is best at
- **Character sheets & storyboard frames:** up to **8 consistent images from one prompt** (multi-image consistency). This is the workhorse for "cut" sequences (see storyboard-and-cut.md).
- **In-image text:** ~99% accuracy across Latin / CJK / Hindi / Bengali.
- **Photoreal key art**, product hero stills, UI/infographics, editorial.
- **Editing:** strong identity/detail preservation on image-to-image and multi-reference edits.

## Technical envelope
- Resolution: up to 2K (4K in beta).
- Size constraints (literal sizes): multiples of **16 px**, max edge **3840**, aspect cap **3:1**, total pixels **655k–8.3M**.
- Quality: `low` (latency-sensitive), `medium` / `high` (max fidelity).
- API: `POST /v1/images/edits` (multipart). Params: `image`, `mask`, `prompt`, `size`, `quality`, `background`, `output_format`, `n`. Multiple reference inputs supported for multi-reference edits. Note: some legacy gpt-image-1/1.5 params are rejected by gpt-image-2.
- `background: transparent` for cutout-style assets (final cleanliness still depends on prompt — ask for crisp edges, no halos/fringing).

## Prompt as a PRODUCTION BRIEF (not a keyword list)
Order the brief: **job → subject → exact text → composition → style → constraints → aspect ratio**.

- **Job:** what the image is for ("character reference sheet", "storyboard panel 3 of 6", "hero key art").
- **Subject:** identity-locked description (reuse the same DNA string every time for a recurring character).
- **Exact text:** in quotes, ALL CAPS or quoted; specify font family/weight/color/placement ("bold sans-serif, white, centered lower third"); add `render verbatim — no extra words, no duplicate text`. Spell tricky names letter-by-letter.
- **Composition:** shot size, angle, subject placement, depth layers, negative space.
- **Style:** the locked style token block from style-database.md (palette + lighting + lens/format + grain).
- **Constraints:** what to exclude / preserve.
- **Aspect ratio:** state it explicitly.

## Edit pattern (image-to-image)
```
Change: [exactly what should change]
Preserve: [face, identity, pose, lighting, framing, background, geometry, text, layout]
Constraints: [no extra objects, no redesign, no logo drift, no watermark]
```
Label each input image by role and reference the labels in the instruction (e.g. "Use IMG1 as the character, IMG2 as the style reference, IMG3 as the background").

## Continuity tactics for storyboard sequences
- Generate a **master character sheet first** (front / 3-4 / profile / expression set). Lock the DNA string from it.
- Then generate each panel as part of an **8-image consistent set** in one call when possible, or feed the sheet as a reference per panel.
- Keep the style token block byte-identical across panels; vary only composition + action.

## Common failures → fixes
- Drifting faces across panels → use the multi-image set or always pass the locked sheet as reference.
- Garbled text → quote it, cap it, constrain it, shorten it; for long copy use a poster layout.
- Over-busy frames → cap object count, name the focal subject, add "single clear focal point".
