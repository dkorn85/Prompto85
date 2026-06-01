# Audio — ElevenLabs + Routing Policy

## Audio routing policy (project standard)
- **ElevenLabs → premium VOICE** (all narration, dialogue, character lines, the voice registers) **and HARD/designed SOUND EFFECTS** (impacts, gunshots, explosions, stingers, signature sonic moments).
- **Video model native audio → ambient + ordinary environmental & character sounds** (room tone, footsteps, wind, cloth rustle, crowd murmur, incidental Foley). Models with native audio: Kling 3.0/Omni, Seedance 2.0, Veo 3.1, HappyHorse 1.0 (always on), Gemini Omni.
- Practical implication: when prompting video, request **only the ambient/environmental layer** ("Audio: room tone, distant traffic, soft footsteps") and **leave space** for the ElevenLabs voice + hard SFX laid in post. On HappyHorse (audio can't be disabled), still name only the ambient bed.

## ElevenLabs Eleven v3 (voice)
Most expressive ElevenLabs TTS, **GA since 14 Mar 2026**, 70+ languages. Performance is a first-class input via **Audio Tags**.

### Audio Tags (square brackets, inline)
Direct emotion, delivery, non-verbals, and inline SFX from inside the script:
- Emotion/delivery: `[excited] [whispering] [sarcastic] [shouting] [slowly] [very fast]`
- Non-verbals: `[sighs] [laughs] [breathes] [crying] [clears throat]`
- Inline SFX: `[gunshot] [clapping] [explosion]` (hard SFX can also come from the dedicated SFX tool below)
```
[whispering] Back then... [pause via ellipsis] [louder, urgent] we had no choice.
```

### Rules that matter (v3)
- **No SSML break tags in v3.** Control pauses with **audio tags, ellipses (…), and text structure** instead. (Supersedes older SSML break habits.)
- **SSML phoneme tags ARE supported** for pronunciation (IPA / CMU Arpabet) — use for tricky names.
- **Voice choice is the #1 parameter** — pick a voice already close to the target delivery (a calm voice won't truly shout; a shouting voice won't truly whisper).
- Use **IVCs or library voices** for v3; PVCs aren't fully v3-optimized yet.
- Tags are voice/context dependent — test inside longer prompts (~250+ chars) for reliable behaviour.
- **Multi-speaker:** use **Text to Dialogue** for natural multi-character scenes (interruptions, mood shifts).
- For real-time/agent use, ElevenLabs recommends **v2.5 Turbo / Flash**, not v3.

### Project voice registers (deliver in these)
Purple Shiva (declarative, "Time for Truth", ~15s/slide) · Catwoman-style (confident, ~15s) · Jesus-style (direct, ~15s) · elven female (~14s) · business (≤14s). Prompts/scripts may be German or English; **model prompts themselves stay English for compatibility**, but spoken/displayed text can be German.
- chazon.eu/elements narration voice ID: `zKHQdbB8oaQ7roNTiDTK`.

## ElevenLabs Sound Effects (hard/designed SFX)
Text-to-SFX. Generates **4 variations per request**. **Prompt influence** slider (default 30%) controls how literally it follows the prompt. Export **MP3 44.1kHz / WAV 48kHz**. Can produce musical stems (e.g. "old-school funky brass stabs, stem, 88 bpm in F# minor"). Use for the signature, high-impact sounds the video models don't nail.

## Putting it together (per shot)
1. Video model → ambient bed only.
2. ElevenLabs v3 → voice/dialogue with audio tags (German or English).
3. ElevenLabs SFX → hard impacts/stingers.
4. Mix in post (CapCut Web etc.). Sync hard SFX to the impact frame.
