# Nano Banana Pro (Gemini 3 Pro Image, Google)

Google DeepMind's most capable image model, built on the Gemini 3 family (released late 2025). Codename "Nano Banana" began as a Gemini 2.5 Flash Image leak/meme; "Pro" = the Gemini 3 Pro Image tier (via Gemini Advanced or platforms like Higgsfield).

## What it is best at
- **Reasoning before drawing ("Thinking mode"):** it reasons through the prompt first, fixing logic errors and nailing complex multi-element compositions. Adds latency — worth it for precision work.
- **Perfect text rendering:** long sentences, complex logos, multi-language/scripts.
- **Search grounding:** can pull factual data for accurate diagrams/infographics.
- **Few-shot consistency:** accepts **up to ~14 reference images** for strict brand/character consistency — the strongest reference budget of any image model here.
- Photoreal + native editing (subject swap, angle/pose change, environment transform) in one unified model.
- Output **1K / 2K / 4K**, flexible aspect ratios. Every image carries an invisible **SynthID** watermark.

## How to prompt it (natural language, NOT keyword spam)
Nano Banana Pro understands flowing prose. **Stop using 2023-era spam** ("4k, masterpiece, trending on artstation"). Structure:
```
[Subject + adjectives] doing [action] in [location/context]. [Composition / camera angle]. [Lighting / atmosphere]. [Style / medium]. [Specific constraint / text].
```
- Describe positively ("sharp focus", not "no blur").
- **Text:** wrap exactly what should appear in quotes and describe it: `the sign reads "OPEN ALL NIGHT" in bold red serif`. Specify language for non-Latin scripts.
- Be descriptive, not repetitive. One clear focal idea.

## Reference-image strategy (up to ~14 slots)
1. First reference → main style / aesthetic direction.
2. Second → character / key subject (the locked DNA).
3. Third → composition / layout inspiration.
4. Remaining → color palettes, mood, subtle style refinement.
> Use the first 2–3 slots for critical elements; reserve the rest for nuance.

## Role in the pipeline
Top-tier alternative to GPT Image 2.0 for character sheets + storyboard stills, especially when you need **many consistent references** or **flawless in-image text/logos**. Output doubles as first/last frames for video models. Choose GPT Image 2 when you want its reasoning + 8-image set in OpenAI's ecosystem; choose Nano Banana Pro for the bigger reference budget, 4K, search-grounded diagrams, and Google/Gemini-native flows (and downstream Veo / Gemini Omni handoff).
