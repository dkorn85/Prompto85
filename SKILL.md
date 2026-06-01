---
name: chazon-prompt-engine
description: Use when writing, refining, storyboarding, or restyling AI image/video prompts for Seedance 2.0, Kling 3.0, Kling 3.0 Omni, or GPT Image 2.0. Covers Hollywood-level storyboards, per-model prompt formatting, the storyboard "CUT" decomposition (splitting one master storyboard into per-shot or per-frame prompts for models that cannot read storyboards), professional cinematography (camera, lenses, shots, movement, lighting, color), advertising and action-sequence specialists, and a structured style database with project-specific (Chazon/Merkaba/Shalem) style DNA. Trigger for any prompt-generation, storyboard, restyle, or style-consultation request for these models.
---

# CHAZON Prompt Engine

A state-of-the-art prompt-generation system for four target models. The job is to turn a creative brief into **model-correct, cinema-grade prompts** — and to do the production-thinking (style, camera, shot grammar, pacing) *for* the user, not just transcribe their words.

## The model roster (one-line identity)

**Image / key art**
| Model | Core mechanic | File |
|---|---|---|
| **GPT Image 2.0** (`gpt-image-2`) | Up to 8 consistent images/prompt, ~99% text, reasoning. Sheets, storyboard frames, key art. | `models-gpt-image-2.md` |
| **Nano Banana Pro** (Gemini 3 Pro Image) | Thinking mode, up to ~14 refs, 4K, search-grounded diagrams, flawless text/logos. | `models-nano-banana-pro.md` |

**Video**
| Model | Core mechanic | File |
|---|---|---|
| **Seedance 2.0** | 4-modal refs via `@asset`. ONE action + ONE move/clip. 2K, ≤15s, native audio. Best camera/reference discipline. | `models-seedance-2.md` |
| **Kling 3.0 / Omni** | Native storyboard, up to **6 shots / 15s**, structured shot list, native audio + lip-sync. Omni adds voice binding, V2V, Elements. | `models-kling-3.md` |
| **HappyHorse 1.0** | 15B unified transformer, joint video+audio one pass, best single-clip polish + physics (fluids/reflections). Audio always on. | `models-happyhorse-1.md` |
| **Veo 3.1** (no "3.5") | Photoreal humans + native dialogue/SFX/ambient in one pass, object insertion. ~6–8s. | `models-veo-3.1.md` |
| **Gemini Omni** (Flash) | Any-input→video, cross-modal reasoning, conversational editing, character+voice consistency in one chat. ~10s. | `models-gemini-omni.md` |

**Audio** → `audio-elevenlabs.md` (ElevenLabs v3 voice + hard SFX; native model audio for ambient).

### Pick-a-model quick logic
- Character sheet / storyboard stills / logos+text → **GPT Image 2** or **Nano Banana Pro** (Pro for more refs / 4K / Google flow).
- Reference-driven, disciplined camera, multi-clip stitch → **Seedance 2.0**.
- True multi-shot storyboard in one render, dialogue → **Kling 3.0 / Omni**.
- Most impressive single clip + immersive audio/physics → **HappyHorse 1.0**.
- Photoreal human performance + native audio → **Veo 3.1**.
- Messy mixed inputs → coherent clip with chat editing → **Gemini Omni**.

## Standard workflow (follow this order)

1. **Clarify the brief** (only if genuinely ambiguous): target model(s), aspect ratio, duration, project/universe, and the *feeling*. If the user names a Chazon/Merkaba character or look, pull its locked DNA from `references/style-database.md` — do not re-invent it.
2. **Pick / state the style** → read `references/style-database.md`. Lock a palette + lighting + lens/format + grain into a reusable **style token block**. Reuse it verbatim across every shot for continuity.
3. **Write the MASTER STORYBOARD** (model-agnostic) → use the canonical panel schema in `references/storyboard-and-cut.md`. Hollywood level: every panel carries subject, action (one beat), camera (size/angle/move/lens), light, and audio.
4. **CUT to the target model** → apply the per-model transform in `references/storyboard-and-cut.md`:
   - Kling 3.0 / Omni → keep as a numbered, time-coded shot list (≤6 shots / ≤15s).
   - Seedance 2.0 → one beat per clip, one camera move per clip, map refs to `@Image/@Video/@Audio`, concatenate ≤3 clips / ≤15s.
   - GPT Image 2.0 → collapse each panel to a still: drop motion/audio, convert camera *move* → camera *position at the decisive moment*, use the 8-image consistency set for sequences.
5. **Add negatives + an iteration plan.** Always change ONE variable at a time when debugging.

## Hard rules (the things that break outputs)

- **Aspect ratio defaults: 9:16 is standard.** Use 16:9 or 21:9 only for special / cinematic clips. State the ratio in every prompt.
- **Prompts in English for model compatibility.** Spoken/displayed text and direction notes may be German; the prompt sent to the model stays English.
- **Audio routing:** ElevenLabs for premium VOICE + hard/designed SFX (impacts, explosions, stingers); native model audio for ambient/environmental/incidental sound only. When prompting video, request only the ambient bed and leave room for the ElevenLabs layer. See `audio-elevenlabs.md`.
- **Seedance / Kling / HappyHorse / Veo: never stack camera moves in one shot.** One move per shot or you get jitter/morphing.
- **Kling: shot LISTS, never prose paragraphs.** Prose → inconsistent shots.
- **Kling: turn native audio OFF during draft iterations** (expensive); add on the locked take. (HappyHorse can't disable audio — name only the ambient bed.)
- **GPT Image 2 / Nano Banana Pro: put exact on-image text in quotes**, specify font/weight/color/placement; add `verbatim — no extra characters, no duplicate text`. Don't keyword-spam Nano Banana Pro — it reads natural prose.
- **Physics realism for video:** describe ground contact / weight transfer / cloth behaviour explicitly to stop floating and moonwalking.
- **Continuity:** the locked style token block + the same character DNA strings must appear in every shot of a sequence.

## Reference files (load as needed)

- `references/models-gpt-image-2.md` · `references/models-nano-banana-pro.md` — image models.
- `references/models-seedance-2.md` · `references/models-kling-3.md` · `references/models-happyhorse-1.md` · `references/models-veo-3.1.md` · `references/models-gemini-omni.md` — video models.
- `references/audio-elevenlabs.md` — ElevenLabs v3 voice + SFX + the audio routing policy.
- `references/cinematography.md` — focal lengths, lens families, shot sizes, angles, movement, lighting, color, composition.
- `references/storyboard-and-cut.md` — master panel schema + CUT decomposition rules per model. **Core engine.**
- `references/style-database.md` — project house DNA (Chazon/Merkaba/Shalem, fixed character rules).
- `references/style-library.md` — extended general style DB (anime incl. Records-of-Ragnarök-style, cinematic, photo, illustration, 3D, fine-art) with paste-ready token blocks.
- `references/specialists.md` — advertising/commercial structure + action-sequence craft.
- `references/prompt-templates.md` — copy-paste master templates per model + a worked Chazon example.

> Tooling: the **Prompto85** generator (React app, in the repo root) operationalises this skill — model selector, style picker, master-storyboard builder, and the per-model CUT, with optional Claude-powered enhancement.
