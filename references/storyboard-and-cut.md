# Storyboard & CUT Engine (CORE)

This is the heart of the system. Write ONE Hollywood-level **master storyboard** that is model-agnostic, then **CUT** it into the exact format each target model can obey — including models (GPT Image 2.0) that can't read a storyboard at all and need it split into discrete frames.

## A. The canonical PANEL schema
Every storyboard is an ordered list of panels. Each panel holds:

```
PANEL n
  beat:        one sentence — the single dramatic/visual beat (ONE action)
  subject:     identity-locked DNA string(s) of who/what is in frame
  shot:        size + angle            (e.g. "MCU, low angle")
  lens:        focal length + format   (e.g. "85mm, anamorphic")
  camera:      ONE move                (e.g. "slow push-in")
  light:       key/quality/direction   (e.g. "single hard key in darkness, rim from left")
  palette:     from the locked style token block
  duration:    seconds (video only)
  audio:       dialogue / SFX / music cue (video only)
  fx:          optional — particles, haze, flares, text overlay
  transition:  how it cuts to the next panel
```

Hollywood standard = every panel is independently shootable: you could hand any single panel to a DP and they'd know exactly what to capture. Keep `beat` to ONE action — multi-action beats are split into two panels.

## B. The MASTER STORYBOARD format (what to write first)
A short header + the panel list:
```
TITLE / scene · STYLE TOKEN BLOCK (locked) · CHARACTER DNA (locked) · ASPECT · TOTAL DURATION
PANEL 1 … PANEL 2 … PANEL n
```
The **style token block** and **character DNA** are written once and copied verbatim into every cut. This is what guarantees continuity.

## C. The CUT — decomposition rules per model

### CUT → Kling 3.0 / Omni  (storyboard-native)
Almost 1:1. Render the panels as a numbered, time-coded shot list, **max 6 panels, total ≤15s**.
- Merge/trim to ≤6 shots; assign per-shot durations summing ≤15s.
- Each line = `Shot n (Xs): [shot] [subject] [ONE action] [camera] [light]`.
- Add dialogue/audio only on the final take; mark `Native audio: <lang> voice, natural lip-sync`.
- Use `Firstframe – Transition – Lastframe` micro-structure inside a shot when precise (user convention).
- Omni: bind character/voice via Elements/`@` tags; for >4 characters or cross-clip identity, split into multiple Omni generations sharing the same Element.

### CUT → Seedance 2.0  (one beat per clip)
Storyboards aren't read as a whole — decompose to **single-beat clips**, then concatenate (≤3 inputs / ≤15s).
- One panel → one clip. Format each clip as **Subject → Action → Camera → Style**, ONE camera move only.
- Map references: panel `subject` ref → `@Image1`; a motion/camera you want copied → `@Video1`; music → `@Audio1`.
- Keep beats independent; stitch with `[clip1] + [transition] + connect to [clip2]…`.
- Drop the panel's transition prose into the join, not inside the clip.

### CUT → GPT Image 2.0  (storyboard → discrete stills)
The model has no timeline. Convert each panel to a **still key-frame**:
- **Drop** `duration`, `audio`, `transition`.
- **Convert** `camera: <move>` → a static framing at the *decisive moment* of that move (e.g. "slow push-in" → "tight framing mid-push, subject filling 60% of frame").
- Convert `beat` (an action) → a **frozen decisive instant** of that action.
- Rebuild as a production brief: `job: storyboard panel n/N → subject → composition → style token block → constraints → aspect`.
- For a sequence, generate as an **8-image consistent set** in one prompt, or pass the locked character sheet as a reference to every panel. Keep the style token block byte-identical.
- Output is your storyboard *and* doubles as first/last-frame inputs for the video models.

## D. CUT decision table
| Target | Reads storyboard? | What CUT does | Continuity tool |
|---|---|---|---|
| Kling 3.0/Omni | Yes (≤6 shots/15s) | Trim to time-coded shot list | Elements/@ tags, locked DNA |
| Seedance 2.0 | Partially (concat ≤3/15s) | Split to one-beat clips, map @assets | first/last frame, @Image ref |
| HappyHorse 1.0 | No (single clip) | One hero beat/clip, name ambient bed (audio always on) | first frame (I2V) + locked DNA |
| Veo 3.1 | No (single clip ~6–8s) | One beat + one move, `Audio:` clause = ambient only | image anchor (Nano Banana) + DNA |
| Gemini Omni | No (single ~10s, then chat-edit) | One beat as turn 1, refine conversationally | establish in turn 1, edit in same chat |
| GPT Image 2.0 / Nano Banana Pro | No | Freeze each panel to a still brief | 8-image set / up-to-14 reference sheet |

> For all video CUTs: request only the **ambient** sound layer; route voice + hard SFX to ElevenLabs (see `audio-elevenlabs.md`). Default aspect **9:16** unless it's a special 16:9/21:9 clip.

## E. Pipeline pattern (how they chain)
1. **GPT Image 2.0** → master character sheet + storyboard stills (also = first/last frames).
2. **Seedance 2.0 / Kling 3.0** → animate stills into clips/shots (feed the GPT stills as `@Image`/first-frame).
3. **Kling Omni OmniEdit / AI transitions** → stitch, relight, fix, restyle, transition.
This mirrors the user's existing GPT Image → Seedance/Kling pipeline.
