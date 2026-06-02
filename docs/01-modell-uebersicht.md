# Prompto85 — Modell-Übersicht & Routing-Logik
**Stand: Juni 2026 · verifiziert per Web-Recherche · Autor: Claude für Dennis (Chazon/Merkaba)**

Dieses Dokument ist die Faktenbasis für Prompto. Es beantwortet eine Frage: *Welches Modell für welchen Job?* — und wird im Umbauplan zur automatischen Routing-Logik der App.

---

## 1. Schnell-Routing (die eine Tabelle, die zählt)

| Aufgabe | Erstwahl | Begründung |
|---|---|---|
| Storyboard-Sheet (Panels, Titel, Layout) | **Nano Banana Pro** | Beste Kompositions-/Raumlogik + bis zu 5 konsistente Charaktere |
| Sheet mit viel Text / Titelzeilen / Markenlettering | **GPT Image 2** | ~99 % Textgenauigkeit, klare Layouts |
| Charaktersheet / Gesichtskonsistenz über Panels | **Nano Banana Pro** | 14 Referenzbilder, Portrait-/Face-König |
| Marketing-Thumbnail, photoreales Hero-Bild | **GPT Image 2** | photoreale Politur, dichter Text |
| Ein einzelner Top-Clip, max. Kinoqualität | **HappyHorse 1.0** | #1 Leaderboard, scharf, physikkonform, schnell |
| Deutscher Voice/Lipsync direkt im Clip | **HappyHorse 1.0** | natives 7-Sprachen-Lipsync **inkl. Deutsch** |
| Referenzgesteuerter Clip (mehrere Bild/Video/Audio-Refs) | **Seedance 2.0** | bis zu 9 Bild + 3 Video + 3 Audio, @-Rollen-Tagging |
| Beat-Sync / Musikvideo-Schnitt | **Seedance 2.0** | beat-aware native Audio |
| Gerichtete Multi-Shot-Sequenz (du bestimmst jeden Cut) | **Kling 3.0 Omni** | Storyboard-Modus: Dauer/Winkel/Kamera pro Shot |
| Übergang zwischen zwei Sheets (First→Last-Frame-Morph) | **Kling 3.0** | First/Last-Frame stark; genau unsere Übergangs-Logik |
| Cinematischer Photoreal, dramatisches Licht, Crowds | **Veo 3.1** | aktueller Benchmark für Kino-Look |
| Clip länger als 15 s (Szenenverlängerung auf 60 s+) | **Veo 3.1** | Scene Extension; einzige saubere Lang-Option |
| Moodboard→Video, iteratives Chat-Editing | **Gemini Omni Flash** | Konversationelles Bearbeiten, Storyboarding |

---

## 2. Video-Modelle im Detail

### Seedance 2.0 — *der Referenz-Regisseur*
- **Hersteller / Release:** ByteDance, 12. Feb 2026 (API live via fal; in CapCut integriert)
- **Architektur:** unified multimodal — Text + Bild + Audio + Video in **einem** Generierungs-Pass
- **Länge / Auflösung:** 4–15 s · bis 1080p (teils 2K) · Seitenverhältnisse 16:9, 9:16, 4:3, 3:4, 21:9, 1:1
- **Referenzen:** bis **9 Bilder + 3 Videos + 3 Audio** (bis zu 12 Multimodal-Inputs), rollenbasiertes **@asset-Tagging**
- **Audio:** native Audio + Beat-Sync; phonem-genaues Lipsync in 8+ Sprachen
- **Stärke:** referenzgesteuerte Regie-Kontrolle, Audio-Bild-Sync, Multi-Shot aus einem Prompt. #1 image-to-video.
- **Schwäche / Fallstrick:** **lehnt überfüllte Sheets als „NSFW“ ab**, wenn zu viele Gesichter / Close-up-Cluster im Bild sind (bestätigter Lernpunkt). Audio braucht teils externe Datei als Input.
- **In Prompto:** native-cut Modell → ganzes Sheet als @sheet-Referenz, kein eigener Schnitt nötig.

### Kling 3.0 / 3.0 Omni — *der Storyboard-Dirigent*
- **Hersteller / Release:** Kuaishou, 5. Feb 2026
- **Architektur:** MVL (Multimodal Visual Language)
- **Länge / Auflösung:** 3–15 s · natives **4K bis 60 fps**
- **Multi-Shot:** Storyboard mit **bis zu 6 Cuts / max. 15 s gesamt** — pro Shot Dauer, Größe, Winkel, Kamerafahrt einstellbar
- **Audio:** native Audio + Lipsync in 5 Sprachen + Akzenten; Voice-Cloning aus 3–8 s Referenz
- **Referenzen:** Elements 3.0, @-Tagging, Video-to-Video, First/Last-Frame
- **Stärke:** maximale Schnitt-Kontrolle, narrative Konsistenz; **First/Last-Frame = exakt unsere Übergangslogik**
- **Schwäche / Fallstrick:** Übergänge zwischen Shots manchmal ruckelig; höhere Lernkurve
- **In Prompto:** native-cut. Für Übergänge zwischen Akten/Clips das Werkzeug der Wahl.

### HappyHorse 1.0 — *der Qualitäts-Champion (mit Deutsch)*
- **Hersteller / Release:** Alibaba (ATH / Taotian Future Life Lab), API live 27. Apr 2026 via fal
- **Architektur:** 15B-Parameter unified Transformer; Video + Audio in einem Pass (**Audio immer an**)
- **Länge / Auflösung:** 3–15 s · 1080p · 5 Seitenverhältnisse
- **Audio:** **7-Sprachen-Lipsync inkl. DEUTSCH** (+ EN, Mandarin, Kantonesisch, JP, KR, FR)
- **Modi:** T2V, I2V, Reference-to-Video, Video-Edit
- **Stärke:** #1 Leaderboard (T2V & I2V ohne Audio), schärfste/cineastischste Einzelclips, physikkonform, schnell (~38 s/1080p auf H100)
- **Schwäche / Fallstrick:** noch kein Multi-Shot-Storyboard wie Kling; Modell „under development“
- **In Prompto:** Erstwahl für deutschen Voice-Content und für „ein Clip muss perfekt sein“.

### Veo 3.1 — *der Kino-Spezialist & einzige Lang-Option*
- **Hersteller / Release:** Google, 15. Okt 2025 (**kein Veo 4** offiziell, Stand Mai 2026)
- **Länge / Auflösung:** ~8 s nativ + **Scene Extension auf 60 s+** · nativ 1080p → 4K-Upscale (seit Jan 2026) · 16:9 & nativ 9:16
- **Audio:** native Audio, beste Dialog-/Lipsync-Synchronisation
- **Referenzen:** **Ingredients-to-Video** (bis 3 Ref-Bilder, gesichtskonsistent); **First+Last-Frame** mit automatischem Ton
- **Stärke:** dramatisches Licht, komplexe Crowd-Szenen, realistische Bewegung; einzige saubere Option >15 s
- **Schwäche / Fallstrick:** nur 3 Ref-Bilder (vs. Seedance 9); kürzeres natives Limit
- **In Prompto:** Erstwahl für „lang“ und „maximaler Kino-Look“.

### Gemini Omni Flash — *der Iterier-Partner*
- **Hersteller / Release:** Google, 19. Mai 2026 (erstes Modell der Omni-Familie; API „in den kommenden Wochen“)
- **Länge:** **10 s Cap** (Deployment-Entscheidung, kein Modell-Limit)
- **Stärke:** Text+Bild+Audio+Video→Video; **konversationelles Editing**; SynthID
- **Schwäche / Fallstrick:** **kann Sprache/Audio im Clip (noch) nicht editieren**; kurz; API noch nicht breit verfügbar
- **In Prompto:** Storyboard-/Moodboard-Phase und schnelles Iterieren, **nicht** für Finalrender.

---

## 3. Bild-Modelle im Detail

### Nano Banana Pro (= Gemini 3 Pro Image) — *der Charakter-/Storyboard-König*
- **Hersteller / Release:** Google, 20. Nov 2025 (Nano Banana 2 = schnellere Variante, ~4–6 s)
- **Auflösung / Refs:** natives 4K · **14 Referenzbilder** · Search-Grounding · SynthID
- **Stärke:** Portrait, **Gesichts-/Charakterkonsistenz**, **bis zu 5 konsistente Charaktere**, Multi-Person, **Storyboards**, räumliche/kompositorische Logik
- **In Prompto:** Erstwahl für Charaktersheets und Storyboard-Sheets mit mehreren Figuren.

### GPT Image 2 — *der Text-/Marken-Spezialist*
- **Hersteller / Release:** OpenAI, 21. Apr 2026
- **Benchmark:** #1 LMArena (1512 Elo, +242 vor Nano Banana Pro)
- **Text:** **~99–100 % Textgenauigkeit** (EN/JP/KR/ZH/Hindi/Bengali)
- **Auflösung / Tiers:** 3 Qualitätsstufen · custom Pixelmaße bis 3840×2160 (4K) · token-basierte Abrechnung · Multi-Image-Edits
- **Stärke:** Titel/dichter Text, Branding, UI, Infografiken, photoreales Marketing/Thumbnails
- **In Prompto:** Erstwahl wenn Text im Bild korrekt sein muss.

**Merksatz für Prompto:** *Gesichter & Komposition → Nano Banana Pro. Text & Marke → GPT Image 2.*

---

## 4. Audio-Routing-Policy (durchgängig im Projekt)
- **ElevenLabs v3** = Stimme + harte/designte SFX (Audio-Tags in `[eckigen Klammern]`, **kein** SSML; Pausen über „...“)
- **Modell-native Audio** (Seedance/Kling/HappyHorse/Veo) = nur Ambient-Bett
- Grund: getrennte Spuren = volle Kontrolle im Schnitt, kein Re-Render bei VO-Änderung.

---

## 5. Quellen-Hinweis
Alle Spezifikationen per Web-Recherche im Juni 2026 verifiziert. Modelle ändern sich wöchentlich — vor großen Produktionen kurz gegenchecken.
