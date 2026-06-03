---
name: chazon-prompt-engine
description: Use when writing, refining, storyboarding, or restyling AI image/video prompts for Seedance 2.0, Kling 3.0, Kling 3.0 Omni, or GPT Image 2.0. Covers Hollywood-level storyboards, per-model prompt formatting, the storyboard NATIVE-vs-CUT decision (feed a whole sheet as a sequence vs. split it into per-shot/per-frame prompts), professional cinematography (camera, lenses, shots, movement, lighting, color), advertising and action-sequence specialists, and a structured style database with project-specific (Chazon/Merkaba/Shalem) style DNA. Trigger for any prompt-generation, storyboard, restyle, or style-consultation request for these models.
---

# CHAZON Prompt Engine

A state-of-the-art prompt-generation system for the model roster below. The job is to turn a creative brief into **model-correct, cinema-grade prompts** — and to do the production-thinking (style, camera, shot grammar, pacing) *for* the user, not just transcribe their words.

> Production rules below are battle-tested. The §-tags point to `docs/02-erkenntnis-log.md` in the repo, the running log of hard-won lessons. Read that log + `docs/04-umbauplan-prompto.md` for the full reasoning.

## The model roster (one-line identity)

**Image / key art**
| Model | Core mechanic | File |
|---|---|---|
| **GPT Image 2.0** (`gpt-image-2`) | Up to 8 consistent images/prompt, ~99% text, reasoning. Sheets, storyboard frames, key art. | `models-gpt-image-2.md` |
| **Nano Banana Pro** (Gemini 3 Pro Image) | Thinking mode, up to ~14 refs, 4K, search-grounded diagrams, flawless text/logos. | `models-nano-banana-pro.md` |

**Video**
| Model | Core mechanic | File |
|---|---|---|
| **Seedance 2.0** | 4-modal refs via `@asset` (up to 9 img+3 vid+3 audio). ONE action + ONE move/clip. 2K, ≤15s, native audio. Reads a whole sheet as a sequence. | `models-seedance-2.md` |
| **Kling 3.0 / Omni** | Native storyboard, up to **6 shots / 15s**, structured shot list, native audio + lip-sync. Omni adds voice binding, V2V, Elements. | `models-kling-3.md` |
| **HappyHorse 1.0** | 15B unified transformer, joint video+audio one pass, best single-clip polish + physics (fluids/reflections). Audio always on. German lip-sync king. | `models-happyhorse-1.md` |
| **Veo 3.1** (no "3.5") | Photoreal humans + native dialogue/SFX/ambient in one pass, object insertion, Scene Extension for >15s / big scale moves. | `models-veo-3.1.md` |
| **Gemini Omni** (Flash) | Any-input→video, cross-modal reasoning, conversational editing, character+voice consistency in one chat. ~10s. | `models-gemini-omni.md` |

**Audio** → `audio-elevenlabs.md` (ElevenLabs v3 voice + hard SFX; native model audio for ambient).

### Pick-a-model quick logic
- Character sheet / storyboard stills / logos+text → **GPT Image 2** or **Nano Banana Pro**.
- **Look-test the storyboard engine (§14):** for built/photoreal/refractive/dramatically-lit looks **GPT Image 2** has beaten Nano in direct A/B; for flat-illustrative multi-figure consistency **Nano Banana Pro** wins. Don't pick by default — test one sheet per look.
- Reference-driven, disciplined camera, multi-clip stitch → **Seedance 2.0**.
- True multi-shot storyboard in one render, dialogue → **Kling 3.0 / Omni**.
- Most impressive single clip + immersive audio/physics, German lip-sync → **HappyHorse 1.0**.
- Photoreal human performance, native audio, long/scale moves → **Veo 3.1**.
- Messy mixed inputs → coherent clip with chat editing → **Gemini Omni**.

## Standard workflow (follow this order)

1. **Clarify the brief** (only if genuinely ambiguous): target model(s), aspect ratio, duration, project/universe, and the *feeling*. If the user names a Chazon/Merkaba character or look, pull its locked DNA from `references/style-database.md` — do not re-invent it. If the user asks for a NEW style, do NOT carry the last look over.
2. **Pick / state the style** → read `references/style-database.md`. Lock palette + lighting + lens/format + grain into a reusable **style token block**. Reuse it verbatim across every shot.
3. **Write the MASTER STORYBOARD** (model-agnostic) → canonical panel schema in `references/storyboard-and-cut.md`. Every panel carries subject, action (one beat), camera, light, audio — **but each panel must be a STILL** (§18): describe only what one photo can capture. Translate time-verbs (nods, realizes, turns, reacts, notices, decides) into a visible pose. Motion goes in the video prompt, not the panel. **One identity figure per character sheet** (§16); **panel orientation = final video orientation** (§17).
4. **Choose NATIVE or CUT (§20), then transform** per `references/storyboard-and-cut.md`:
   - **NATIVE** (Seedance / Kling / Veo / Omni read a whole sheet): feed the sheet as the `@anchor`, write ONE time-coded shot list, each panel = one shot read left→right/top→bottom (§15). **No text/captions/numbers anywhere on the sheet** — they get animated (§13). Never pan/zoom the grid or show gutters/borders/split-screen.
   - **CUT** (GPT Image stills, or any non-sheet-reader): crop each panel → one prompt per panel → stitch in edit. Panel captions ARE allowed here (cropped off before animating). Per-panel video prompts: plain present tense, no camera jargon, no cross-panel words, end with `ambient only, no music, no subtitles`.
5. **Add negatives + an iteration plan.** Change ONE variable at a time when debugging.

## Hard rules (the things that break outputs)

- **Aspect ratio: 9:16 is standard; 16:9/21:9 for cinematic.** Render panels in the FINAL orientation to avoid side-crop (§17). State the ratio in every prompt.
- **Prompts in English.** Spoken/displayed text and direction notes may be German; the prompt sent to the model stays English. Audio tags `[in brackets]`, English, no SSML, pauses via `...`.
- **NATIVE vs CUT is the first storyboard decision (§20).** NATIVE = whole sheet → one sequence; CUT = panel-by-panel. It determines the cut, whether captions are allowed, and the prompt shape.
- **No text inside panels on the NATIVE path (§13).** Any visible text/number/caption/in-world sign gets animated by the video model and flickers/warps. Keep all lettering blank or illegible; panel order lives only in the shot list. Add `text overlay, no captions on screen`. Captions allowed ONLY on the CUT path.
- **Grid is a sequence, not one image (§15).** Tell the model each panel is ONE shot, read in order; never pan/zoom across the grid, never show borders/gutters/split-screen.
- **Still-image rule (§18).** Every storyboard panel must be capturable in one frozen photo. Forbidden time-verbs → visible equivalents.
- **State-/Restate-Lock (§19).** Define a head-to-toe costume lock per character; restate every STATEFUL detail (pendant visible/hidden, mask on/off, tool in hand, hybrid organic/forged side) in EVERY panel AND every video prompt — never assume carry-forward. Mark planned changes explicitly.
- **One identity figure per sheet (§16).** Extras/props/automata share a roster sheet.
- **Seedance NSFW filter (§1):** many faces / close-up clusters trigger it. Use wide shots, small faces, thick panel borders, ≤6 panels for NATIVE.
- **15s / 6-shot limit (§3):** split longer sequences into ~12s sub-clips; the LAST panel of clip N = the FIRST panel of clip N+1 (continuity anchor).
- **Seedance specifics (§15):** Standard tier (not Fast/Turbo) for publish; Omni up to 9 image refs (sheet as anchor + the character sheets); describe narrative logic between panels.
- **Never stack camera moves in one shot** (Seedance/Kling/HappyHorse/Veo) → jitter/morphing. One move per shot.
- **Kling: shot LISTS, never prose paragraphs.** Turn native audio OFF during draft iterations; on for the locked take. (HappyHorse can't disable audio — name only the ambient bed.)
- **GPT Image 2 / Nano Banana Pro: exact on-image text in quotes**, specify font/weight/color/placement, add `verbatim — no extra characters, no duplicate text`. Don't keyword-spam Nano — it reads natural prose.
- **Physics realism for video:** describe ground contact / weight transfer / cloth behaviour explicitly to stop floating and moonwalking.
- **Audio routing (§6):** ElevenLabs for premium VOICE + hard/designed SFX; native model audio for ambient only. When prompting video, request only the ambient bed and leave room for the ElevenLabs layer.
- **Continuity:** the locked style token block + the same character DNA strings appear in every shot of a sequence.
- **Child-safety / content (§12):** no real named people in violence; kids/teen content age-appropriate, no addiction/cliffhanger mechanics, calm pacing.

## Reference files (load as needed)

- `references/models-gpt-image-2.md` · `references/models-nano-banana-pro.md` — image models.
- `references/models-seedance-2.md` · `references/models-kling-3.md` · `references/models-happyhorse-1.md` · `references/models-veo-3.1.md` · `references/models-gemini-omni.md` — video models.
- `references/audio-elevenlabs.md` — ElevenLabs v3 voice + SFX + the audio routing policy.
- `references/cinematography.md` — focal lengths, lens families, shot sizes, angles, movement, lighting, color, composition.
- `references/storyboard-and-cut.md` — master panel schema + NATIVE/CUT decomposition + still-image rule + state-lock. **Core engine.**
- `references/style-database.md` — project house DNA (Chazon/Merkaba/Shalem, fixed character rules) — includes **Aurora Glass** and **Anima Machina**.
- `references/style-library.md` — extended general style DB with paste-ready token blocks.
- `references/specialists.md` — advertising/commercial structure + action-sequence craft.
- `references/prompt-templates.md` — copy-paste master templates per model + a worked Chazon example.

> Tooling: the **Prompto85** generator (in the repo root) operationalises this skill — model selector, style picker, master-storyboard builder, and the per-model NATIVE/CUT, with optional Claude-powered enhancement. Live: chazon.eu/prompto/. Full lesson log: `docs/02-erkenntnis-log.md`.
