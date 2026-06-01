# Prompt Templates

Copy-paste skeletons. Fill the `[brackets]`. Always paste the locked **style token block** + **character DNA** unchanged across a sequence.

---

## GPT Image 2.0 — production brief
```
Job: [character sheet / storyboard panel n of N / hero key art].
Subject: [identity-locked DNA string].
Composition: [shot size], [angle], subject at [placement], [depth layers], [negative space].
On-image text: "[EXACT TEXT]" — [font/weight/color], [placement]; render verbatim, no extra words, no duplicate text.   <-- omit if none
Style: [STYLE TOKEN BLOCK].
Constraints: [exclude X], single clear focal point, [no watermark].
Aspect ratio: [9:16 / 16:9 / 1:1].
```
Edit mode:
```
Change: [only this]. Preserve: [face, identity, pose, lighting, framing, background, text]. Constraints: [no redesign, no logo drift, no extra objects].
```

---

## Seedance 2.0 — one beat per clip
```
Subject: [DNA]. Action: [ONE present-tense beat]. Camera: [shot size] + [ONE move]. Style: [STYLE TOKEN BLOCK].
Refs: use composition from @Image1; follow camera/pacing from @Video1; sync to @Audio1.   <-- include only those you have
Audio: [SFX / music].  Negatives: no morphing, no jitter, no extra limbs, no identity drift.
```
Concatenate: `[clip1] + [transition] + connect to [clip2] + [transition] + connect to [clip3]   (total ≤15s)`

---

## Kling 3.0 / Omni — time-coded shot list
```
STYLE: [STYLE TOKEN BLOCK].  CHARACTERS: [DNA1], [DNA2]  (max 4).  ASPECT: [9:16/16:9].  IMAX handheld realism, realistic physics, no wide shots.
Shot 1 (Xs): [shot size] [subject] [ONE action] [camera] [light].  Firstframe–Transition–Lastframe.
Shot 2 (Xs): [...]
Shot 3 (Xs): [...]
Shot 4 (Xs): [...]   (≤6 shots, total ≤15s)
Native audio: [language] voice, natural lip-sync.   <-- final take only; keep OFF while iterating
Omni: bind identity via Element @[name]; reference @[name] in each shot.
```

---

## Worked example — Chazon, "Precision Object" (one master storyboard, three cuts)

**MASTER**
```
TITLE: Energies — the Seed · STYLE: single-source hard key in pure black, near-monochromatic, macro precision, clean large-format digital, deep crushed blacks, volumetric haze, centered symmetry, hyperreal surface detail · ASPECT 9:16 · 12s
PANEL 1  beat: a metallic seed rests, dust settles · shot: macro CU, eye-level · camera: static · light: single hard key top-left · audio: low sub-hum · transition: hard cut
PANEL 2  beat: the seed splits, light spills from the seam · shot: macro ECU · camera: slow push-in · light: same + inner glow · audio: rising tone · transition: match cut
PANEL 3  beat: a sacred-geometry form unfolds and holds · shot: CU, slight low angle · camera: slow orbit · light: volumetric god-rays · audio: bloom + Purple Shiva line · transition: fade
```

**CUT → GPT Image 2.0** (3 stills, 8-image-consistent set)
```
Job: storyboard panel 1 of 3. Subject: a single metallic seed, fine machined surface, faint dust. Composition: macro close-up, eye-level, centered, black void, dust motes in haze. Style: <STYLE TOKEN BLOCK>. Constraints: one object, single light source, no clutter. Aspect 9:16.
(…panel 2: ECU at the decisive instant the seam glows … panel 3: the geometry form fully unfolded, slight low angle …)
```

**CUT → Seedance 2.0** (3 clips, concat ≤12s)
```
Clip1 — Subject: metallic seed. Action: dust settles around it. Camera: macro CU, static. Style: <TOKEN BLOCK>. Audio: low sub-hum.
Clip2 — Subject: the seed. Action: it splits, light spills from the seam. Camera: macro, slow push-in. Style: <TOKEN BLOCK>. Audio: rising tone.
Clip3 — Subject: a sacred-geometry form. Action: it unfolds and holds. Camera: CU, slow orbit. Style: <TOKEN BLOCK>. Audio: bloom.
Stitch: [Clip1] + hard cut + connect to [Clip2] + match cut + connect to [Clip3]
```

**CUT → Kling 3.0 Omni** (shot list, 12s)
```
STYLE: <TOKEN BLOCK>. ASPECT 9:16. IMAX handheld realism, realistic physics, no wide shots.
Shot 1 (4s): macro CU, metallic seed at rest, dust settling, static lock-off, single hard key top-left.
Shot 2 (4s): macro ECU, the seed splits and light spills from the seam, slow push-in, inner glow. Firstframe seam closed – Transition crack – Lastframe seam bright.
Shot 3 (4s): CU slight low angle, a sacred-geometry form unfolds and holds, slow orbit, volumetric god-rays.
Native audio: German voice, Purple Shiva register, natural lip-sync.   (final take only)
```
