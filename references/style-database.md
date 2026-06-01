# Style Database

Reusable **style profiles**. Each profile = a named look that locks into a copy-paste **token block** you reuse across every shot of a sequence for continuity. Format of every profile:

```
NAME — one-line intent
  palette · lighting · lens/format · grain/texture · composition · mood
  TOKEN BLOCK: "<the exact string to paste into prompts>"
  do / don't
```

---

## PART 1 — General cinematic profiles

**Sacred Precision ("Apple meets Superbowl")** — physical precision object, reverent.
- Near-monochromatic palette · single hard source in black void · normal/macro, clean digital · micro-texture, SEM/CERN reference · centered symmetry · awe, control.
- TOKEN BLOCK: `single-source hard key light in pure black, near-monochromatic palette, macro precision, clean large-format digital, deep crushed blacks, volumetric haze, centered symmetry, hyperreal surface detail`
- do: one object, one light. don't: clutter, busy color, wide vistas.

**Epic Blockbuster** — scale and spectacle.
- Teal-orange · motivated hard backlight + haze · 65mm/anamorphic · fine grain · low-angle · heroic.
- TOKEN BLOCK: `65mm large-format, anamorphic horizontal flare, oval bokeh, teal-orange grade, low-angle, volumetric haze, deep focus, cinematic contrast`

**Neo-Noir Neon** — tension, night, wet city.
- Magenta/cyan neon + crushed black · low-key split light · 35–100mm · halation · reflections · dread.
- TOKEN BLOCK: `low-key neon practicals, magenta and cyan, wet reflective streets, halation, desaturated mids, crushed blacks, shallow depth of field`

**Golden Intimacy** — warm emotional portraiture.
- Warm amber · soft key + rim · 85mm · gentle grain · shallow · tender.
- TOKEN BLOCK: `85mm portrait, soft key with warm rim light, golden-hour palette, shallow depth of field creamy bokeh, fine film grain, gentle contrast`

**Hyperreal Commercial** — glossy product/beauty.
- Clean bright · soft high-key + specular · 50–85mm · pristine · negative space for logo · aspirational.
- TOKEN BLOCK: `soft high-key studio light, glossy specular highlights, clean digital, 50mm, shallow depth of field, pristine surfaces, generous negative space`

**Documentary Real** — grounded, honest.
- Natural · available light · 28–35mm handheld · natural grain · candid.
- TOKEN BLOCK: `available natural light, 35mm handheld, naturalistic palette, slight grain, candid framing, realistic motion and weight`

---

## PART 2 — Chazon / Merkaba / Shalem project DNA (locked house looks)

> Pull these verbatim when the user references the project. Do not re-invent established DNA.

**Chazon "Dirty Sacred / minimal dark"** — website/background loop signature.
- TOKEN BLOCK: `minimal dark sacred aesthetic, near-monochrome, single-source light in darkness, fine particulate haze, sacred geometry motifs, restrained palette, hyperreal precision, slow contemplative motion`

**Chazon Elements/Energies "precision object"** — SEM/CERN reference, single-source light.
- TOKEN BLOCK: `physical precision object under single-source light, SEM/CERN reference aesthetic, near-monochromatic, clean large-format, extreme surface detail, black void background, volumetric light`
- Voice for narration (chazon.eu/elements TTS/ConvAgent): ElevenLabs voice ID `zKHQdbB8oaQ7roNTiDTK`.

**Character image house style** — for character sheets/key art.
- TOKEN BLOCK: `9:16 hyperrealistic comic style, maximum detail, greenscreen background, no green tones on the character`

**DetektivEins (Dennis persona)** — grey top-knot, silver beard, knit suit.
- DNA: `Dennis — grey top-knot, silver beard, textured knit suit; calm, grounded presence`

**DetektivZwei (Lana persona)** — chestnut curls, sage-green Art Nouveau coat.
- DNA: `Lana — chestnut curls, sage-green Art Nouveau coat; warm, perceptive`

**Dungeon armor DNA** (Three.js / MerkabaSouls)
- Dennis: `teal-bronze knitted power armor, trident, dual-tone bronze with Celtic knotwork, honey-amber gems, teal cloth wraps`
- Lana: `sage-green botanical coat, singing bowl, honey-amber accents`

**Voiceover registers** (for native-audio video or ElevenLabs):
- Purple Shiva — declarative, no hedging, science+spirit in one register, "Time for Truth", ~15s/slide (Chazon x World).
- Catwoman-style — confident, ~15s/slide (Shalem x World).
- Jesus-style — direct/unambiguous, ~15s/slide (Merkaba x Germany).
- Elven female — ~14s/slide (Shalem x Germany).
- Business — max ~14s/slide.

**Fixed character rules** (never violate): Kaelion Solari = orange shirt, turquoise pants, no weapons, always a table-tennis paddle. Appa = always six legs. Troll priest = rigid jade mask never moves, only tusks/jaw animate subtly, tusks always visible.

---

## How to use a profile
1. Pick the profile (or blend two: "Sacred Precision × Hyperreal Commercial").
2. Paste its TOKEN BLOCK into the master storyboard header as the locked style.
3. Append character DNA strings.
4. Reuse both byte-identical in every panel/shot/clip of the sequence.
