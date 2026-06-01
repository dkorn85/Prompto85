# Prompto85

A state-of-the-art **prompt engine** for cinema-grade AI image & video generation. Write one Hollywood-level **master storyboard**, then **CUT** it into the exact prompt format each model can obey.

## Supported models (verified 2026)
**Image:** GPT Image 2 · Nano Banana Pro (Gemini 3 Pro Image)
**Video:** Seedance 2.0 · Kling 3.0 / Omni · HappyHorse 1.0 · Veo 3.1 · Gemini Omni
**Audio:** ElevenLabs v3 (voice + hard SFX) — native model audio for ambient only.

## What's here
- **`SKILL.md` + `references/`** — an Agent Skill (open standard). Zip the `SKILL.md` + `references/` folder and upload under *Claude → Customize → Skills* to give Claude the full knowledge base: per-model rules, the cinematography reference, the storyboard CUT engine, the style library (incl. a Records-of-Ragnarök-style profile), advertising & action specialists, and copy-paste templates.
- **`Prompto85.jsx`** — the generator UI (React). Model selector, style picker, master-storyboard builder, automatic per-model CUT, copy buttons, and optional Claude-powered enhancement (runs inside the Claude.ai artifact runtime).

## Core idea — the CUT
| Target | Reads a storyboard? | CUT does |
|---|---|---|
| Kling 3.0 / Omni | yes (≤6 shots/15s) | trim to time-coded shot list |
| Seedance 2.0 | partial (≤3 clips/15s) | one beat per clip, map `@assets` |
| HappyHorse / Veo / Omni | single clip | one beat + one move, ambient audio only |
| GPT Image 2 / Nano Banana Pro | no | freeze each panel to a still brief |

## Conventions
Prompts in English (compatibility); spoken/displayed text may be German. Aspect default **9:16**; 16:9/21:9 for special clips. One action + one camera move per shot. Locked style token block + character DNA reused byte-identical across a sequence.

> Model capabilities move fast — re-verify specs before production.
