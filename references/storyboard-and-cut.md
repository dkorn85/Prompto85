# Storyboard & CUT Engine (CORE)

Write ONE Hollywood-level **master storyboard** that is model-agnostic, then deliver it via one of two pipeline modes — **NATIVE** (feed the whole sheet as a sequence) or **CUT** (split into per-shot/per-frame prompts) — in the exact format each target model can obey.

> §-tags reference `docs/02-erkenntnis-log.md`. Read it for the reasoning behind each rule.

## A0. NATIVE vs CUT — decide this FIRST (§20)
The storyboard is the same; how you hand it to the model is not.

- **NATIVE** — the model reads the *whole sheet* and produces a multi-shot sequence itself. Use for **Seedance 2.0, Kling 3.0/Omni, Veo 3.1, Gemini Omni** (sheet-readers).
  - One sheet → ONE time-coded shot list. Each panel = one separate camera shot, read left→right, top→bottom (§15).
  - **NO text / numbers / captions / UI / watermark anywhere on the sheet** — every readable glyph gets animated and flickers/warps (§13). Panel order lives only in the shot list.
  - Never let the model pan/zoom across the grid; never show panel borders, gutters, split-screen, or two panels at once. Add `text overlay, no captions on screen`.
  - Keep it ≤6 panels (2×3) / ≤15s; render panels in the FINAL video orientation (§17).
- **CUT** — the model can't read a sheet, so you split it. Use for **GPT Image 2.0 / Nano Banana Pro** (stills), or any time you want per-shot control.
  - Crop each panel → one prompt per panel → stitch in edit.
  - Panel **captions ARE allowed** here (they're cropped off before animating, so no §13 conflict).
  - Per-panel video prompts: plain present tense, **no camera jargon**, **no cross-panel words** ("meanwhile/suddenly"), optional dialogue `[Character] says: "…"`, end every prompt with `ambient only, no music, no subtitles`.

Both modes obey the panel schema (A) and the locked tokens (B). NATIVE = faster, keeps continuity automatically, less per-shot control. CUT = full control + captions, costs manual editing.

## A. The canonical PANEL schema
Every storyboard is an ordered list of panels. Each panel holds:

```
PANEL n
  beat:        one sentence — the single dramatic/visual beat (ONE action), STILL-capturable
  subject:     identity-locked DNA string(s) + every STATEFUL detail restated
  shot:        size + angle            (e.g. "MCU, low angle")
  lens:        focal length + format   (e.g. "85mm, anamorphic")
  camera:      ONE move                (e.g. "slow push-in")  — NATIVE only; CUT freezes it
  light:       key/quality/direction
  palette:     from the locked style token block
  duration:    seconds (video only)
  audio:       dialogue / SFX / music cue (video only)
  fx:          optional — particles, haze, flares
  transition:  how it cuts to the next panel
```

- **STILL-IMAGE rule (§18):** every panel must be capturable in ONE frozen photo. Test: "could a photographer shoot this in a single frame?" Forbidden time-verbs — *nods, shakes head, agrees, decides, realizes, turns around, starts/finishes, reacts to, notices off-screen* — must be translated to a visible pose ("nods" → "chin lowered, relieved expression"; "realizes the door is shut" → "both palms flat on the door, head bowed"). Motion lives in the video prompt, not the panel.
- **ONE action per `beat`** — multi-action beats split into two panels.
- **ONE identity figure per character sheet (§16):** max pixels = max fidelity. Extras / props / automata go on a shared roster sheet.

## B. The MASTER STORYBOARD format (what to write first)
```
TITLE / scene · STYLE TOKEN BLOCK (locked) · CHARACTER DNA (locked) · COSTUME/STATE LOCK · ASPECT (= final orientation, §17) · TOTAL DURATION · MODE: NATIVE | CUT
PANEL 1 … PANEL 2 … PANEL n
```
- The **style token block** and **character DNA** are written once and copied verbatim into every cut — this guarantees continuity.
- **State-/Restate-Lock (§19):** add a head-to-toe **costume lock** per character + the line "every character's costume and appearance remains exactly identical across all panels". Restate every STATEFUL detail (pendant visible/hidden, mask on/off, tool in hand, hybrid organic↔forged side) in EVERY panel AND every video prompt — never assume carry-forward. Planned changes: `STATE CHANGE: [character] — from panel N: …`.

## C. Delivery per model

### NATIVE → Seedance 2.0  (reads the whole sheet as a sequence, §15)
- Feed the full sheet as the `@anchor` reference + the character sheets as identity refs (Omni: up to 9 images).
- Write ONE time-coded shot list: `0–2.5s Panel 1: [subject] [ONE action] [ONE camera move]; 2.5–5s Panel 2: …`. Spell out the narrative logic between panels.
- State: "each panel is ONE separate camera shot, read left-to-right top-to-bottom; no pan/zoom across the grid; no borders, gutters, or split-screen; one full-frame shot per moment."
- **Standard tier**, not Fast/Turbo, for publish quality. Add `text overlay, no captions on screen`.
- >15s or >6 beats → split into ~12s sub-clips; LAST panel of clip N = FIRST panel of clip N+1 (continuity anchor, §3).

### NATIVE → Kling 3.0 / Omni  (storyboard-native)
Numbered, time-coded shot list, **max 6 panels / ≤15s**.
- Each line = `Shot n (Xs): [shot] [subject] [ONE action] [camera] [light]`.
- Add dialogue/audio only on the final take; mark `Native audio: <lang> voice, natural lip-sync`. Turn audio OFF during draft iterations.
- `Firstframe – Transition – Lastframe` micro-structure inside a shot when precise.
- Omni: bind character/voice via Elements/`@` tags; >4 characters or cross-clip identity → multiple generations sharing one Element.

### NATIVE → Veo 3.1 / Gemini Omni
- Veo: one beat + one move per clip, `Audio:` clause = ambient only; image anchor (Nano/GPT still) + DNA; Scene Extension for >15s / large scale moves.
- Gemini Omni: one beat as turn 1, then refine conversationally in the same chat; establish identity in turn 1.

### CUT → GPT Image 2.0 / Nano Banana Pro  (storyboard → discrete stills)
No timeline. Convert each panel to a **still key-frame**:
- **Drop** `duration`, `audio`, `transition`; **freeze** `camera: <move>` → static framing at the decisive moment ("slow push-in" → "tight framing mid-push, subject filling 60% of frame").
- Rebuild as a production brief: `job: storyboard panel n/N → subject → composition → style token block → constraints → aspect`.
- Sequence → generate as an **8-image consistent set** (GPT) or pass the locked character sheet as a reference to every panel (Nano, up to ~14 refs). Style token block byte-identical.
- **Look-test the engine (§14):** built / photoreal / refractive / dramatically-lit → GPT Image 2 has won A/B; flat-illustrative multi-figure consistency → Nano Banana Pro.
- Captions allowed on these crops (removed before any animation). Output doubles as first/last-frame inputs for the video models.

### CUT → HappyHorse 1.0
One hero beat per clip, name only the ambient bed (audio always on), first-frame (I2V) + locked DNA. Best German lip-sync + physics polish.

## D. Mode + CUT decision table
| Target | Mode | What you hand it | Continuity tool |
|---|---|---|---|
| Seedance 2.0 | NATIVE | Whole sheet `@anchor` + 1 time-coded shot list (anti-grid) | sheet anchor + character-sheet @refs, locked DNA |
| Kling 3.0/Omni | NATIVE | Time-coded shot list ≤6/15s | Elements/@ tags, locked DNA |
| Veo 3.1 | NATIVE | One beat + one move, ambient-only audio | image anchor + DNA, Scene Extension |
| Gemini Omni | NATIVE | One beat turn 1, then chat-edit | establish turn 1, edit same chat |
| GPT Image 2.0 | CUT | Freeze each panel to a still brief, 8-image set | 8-image consistency set, byte-identical tokens |
| Nano Banana Pro | CUT | Still brief per panel | up-to-14 reference sheet |
| HappyHorse 1.0 | CUT | One hero beat/clip, ambient bed only | first frame (I2V) + locked DNA |

> For all video output: request only the **ambient** sound layer; route voice + hard SFX to ElevenLabs (`audio-elevenlabs.md`). Default aspect **9:16**; render panels in the final orientation (§17).

## E. Pipeline pattern (how they chain)
1. **GPT Image 2.0 / Nano Banana Pro** → master character sheet(s) (one figure each, §16) + storyboard sheet (no text on it for the NATIVE path).
2. **Seedance 2.0 / Kling 3.0** → NATIVE: feed the whole sheet as a sequence; or CUT: animate individual stills.
3. **Kling Omni OmniEdit / AI transitions** → stitch, relight, fix, restyle, transition.
