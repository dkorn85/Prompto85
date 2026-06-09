# GPT Image 2.0 (`gpt-image-2`)

OpenAI's most capable image generation + editing model, released 21 Apr 2026 (product surface: "ChatGPT Images 2.0"). Quality-first architecture integrated into GPT-4o, with **integrated reasoning** ("Thinking"). Knowledge cutoff Dec 2025 — it understands recent brands/styles without you describing them from scratch. As of Jun 2026 it sits **top of the LMArena image leaderboard**.

## What it is best at
- **Character sheets & storyboard frames:** up to **8 consistent images from one prompt** (multi-image consistency). This is the workhorse for "cut" sequences (see storyboard-and-cut.md).
- **In-image text:** ~99% accuracy across Latin / CJK / Hindi / Bengali (verified again on our chazon item-sheet: Hebrew חזון + German labels rendered cleanly — see Erkenntnis-Log §14).
- **Photoreal key art**, product hero stills, UI/infographics, editorial.
- **Editing:** strong identity/detail preservation on image-to-image and multi-reference edits.

## Technical envelope
- Resolution: **2K native** (web sources cite ~2048 px/side as the native ceiling). The doc's earlier "4K beta / max edge 3840" is **unverified** — treat 2K as the reliable working resolution; in Higgsfield use `resolution: 2k`, `quality: high`.
- Size constraints (literal sizes): multiples of **16 px**, aspect cap **3:1**, total pixels **655k–8.3M**.
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

## Multi-identity scenes — the bleed trap (Erkenntnis-Log §21)
- Putting **several human identities in ONE frame** makes them bleed into each other (the strongest reference face overwrites the others). Anti-resemblance prompting alone does **not** fix it reliably.
- Fix order: (1) one own anchor per character + hard "clearly different / no duplicates" wording; (2) if it still bleeds → **solo shot**, reference only that one character (no foreign identity in frame = no bleed) and put the group in a separate shot; (3) else composite single renders in the editor.
- Non-human characters (e.g. a glowing light-spirit) bleed into humans too — give them their own anchor and state explicitly "NOT a person".

## Common failures → fixes
- Drifting faces across panels → use the multi-image set or always pass the locked sheet as reference.
- **Multiple identities in one frame bleeding / a character duplicated → see the bleed trap above (§21): own anchor each, else solo-shot, else composite.**
- **Extra limbs in dynamic/prop poses (third arm) → "exactly two arms and two hands, no extra limbs" in keyframe AND video prompt; fix the keyframe first (§22).**
- Garbled text → quote it, cap it, constrain it, shorten it; for long copy use a poster layout.
- Over-busy frames → cap object count, name the focal subject, add "single clear focal point".
