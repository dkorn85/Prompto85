# Prompto85 — Erkenntnis-Log
**Stand: Juni 2026 · technische Lessons aus der laufenden Produktion**

Jeder Punkt: *Problem → Ursache → Lösung*. Grundlage für die Guardrails im Umbauplan.

---

## 1. Seedance lehnt Sheets als „NSFW“ ab
- **Problem:** 2×2-Storyboard-Sheet wird von Seedance 2.0 als NSFW blockiert, obwohl harmlos.
- **Ursache:** zu viele Gesichter / Close-up-Cluster auf einem Bild triggern den Filter — nicht der Inhalt.
- **Lösung:** weite Ganzkörper-Shots, Gesichter klein, **keine** Close-ups, dicke weiße Panel-Ränder, weniger Panels, **1×N-Streifen statt 2×2-Grid**. Letzter Ausweg: First/Last-Frame-Morph.

## 2. Layout-Regel: 1×N statt Grid
- Ein horizontaler Streifen (1×3, 1×4) ist robuster als ein Grid — gegen NSFW-Filter und für sauberen Schnitt. Dicke Trennränder, Figuren weit/klein.

## 3. 15-Sekunden-Grenze → Sub-Clips mit Anschluss
- **Problem:** Storyboards über 15 s nicht in einem Clip generierbar (Modell-Limit).
- **Lösung:** max. 15 s pro Storyboard, in Sub-Clips ~12 s splitten (1A–1D), je ≤4 Panels.
- **ANSCHLUSS-Regel:** letztes Panel von Clip N = erstes Panel von Clip N+1 → nahtlose Schnitte.

## 4. Modell-bewusster Schnitt (native vs. cut)
- **NATIVE** (Seedance, Kling, Veo, Omni, HappyHorse): ganzes Sheet als @sheet-Referenz, ein Sequenz-Prompt, kein eigener Schnitt.
- **CUT** (GPT Image 2, Nano Banana, first/last): einzelne Frames croppen.
- Schnitt-Logik automatisch aus dem Modell ableiten, nicht den User entscheiden lassen.
- *(Vertieft und benannt in §20.)*

## 5. Übergänge per First/Last-Frame
- Übergang-STARTframe = letztes Panel des Vor-Akts; LASTframe = erstes Panel des Folge-Akts. Kling 3.0 morpht dazwischen.
- Dauer: 4 s, „slow eased move across full 4 seconds“ (3 s wirkte gehetzt).
- Kette: T0 act0→actI, T1 actI→actII … Frames per PIL aus den Sheets croppen.

## 6. Audio-Routing
- ElevenLabs = Stimme + designte SFX. Modell-Audio = nur Ambient. Getrennte Spuren = VO ändern ohne Re-Render.
- ElevenLabs v3: Audio-Tags in `[Klammern]`, **kein** SSML, Pausen über „...“. Tags bleiben Englisch.

## 7. Bild-Downscaling (10 MB Anthropic-Limit)
- `fitImage` → 1568 px lange Kante für die API, ~512–640 px Thumbnail für die UI, Sheets 1024 px JPEG für Tree-Storage.

## 8. „Unexpected token '<' / DOCTYPE“-Fehler
- **Ursache:** `api.php` fehlt/404 → Browser bekommt HTML-Fehlerseite statt JSON.
- **Erster Debug-Schritt:** `chazon.eu/prompto/api.php` öffnen → erwartet `{"error":"POST only"}`. Kommt HTML → Datei neu hochladen.

## 9. Upload-Lektion (siehe OPERATIONS.md)
- `lftp mput` scheitert **still** mit absoluten Pfaden; `curl` mit relativem Pfad ist zuverlässig.
- **Bild-Assets:** per **File Browser** hochladen, NICHT scp (scp setzt nicht-web-lesbare Rechte → 403).

## 10. Sheet-Zuordnung (Mapping)
- Pro Clip festlegen, welche Figuren auf dem Sheet sind. GPT: Figuren-Sheets als gesperrte Referenz. Seedance: generiertes Sheet **ist** die @sheet-Referenz; Figuren-Sheets nur bei Drift nachreichen.

## 11. Charakter-Konsistenz
- Locked-Tokens-Block einmal definieren (STYLE / pro Figur DNA / WORLD), in **jedem** Prompt wiederverwenden. Konsistenz über Figuren → Nano Banana Pro.
- *(Verschärft in §19: expliziter Costume-/State-Lock.)*

## 12. Sicherheits-Leitplanke (inhaltlich)
- **Keine echten, benannten Personen in Gewalt-/Kampf-Szenarien.** (Fight gegen erfundene/mythologische Wesen = ok.)
- Kinder-Content: visuell ansprechend & entwicklungsgerecht, **nicht** trance-/suchterzeugend. Ruhiges Tempo, keine Cliffhanger-Mechanik.

## 13. Text/Zahlen im Sheet werden mitanimiert
- **Problem:** Seedance (und jedes Video-Modell) animiert sichtbaren Text/Zahlen im Storyboard-Sheet als bewegte Bildelemente mit — Panel-Nummern, Captions und In-World-Schilder („Block C“, „AREA SEALED“, „1927“) tauchen im Clip auf und flackern/verformen.
- **Ursache:** das Modell behandelt jede lesbare Glyphe als Bildinhalt, nicht als Metadaten.
- **Lösung:** **NULL Text / Zahlen / Captions / UI / Wasserzeichen in den Panels** (gilt für den NATIVE-Weg). Panel-Reihenfolge lebt nur in der Shot-Liste, nicht im Bild. Jede In-World-Beschriftung (Schilder, Notizen, Poster, Spind-Nummern) abgewandt, unscharf oder leer halten.
- **Verschärft bei GPT Image 2:** ~99–100 % Textgenauigkeit heißt, es schreibt Schilder *zuverlässig* hin, wenn man es nicht hart unterbindet.
- **Ausnahme:** auf dem CUT-Weg (§20) sind Panel-Captions erlaubt — sie werden vor dem Animieren weggecroppt.

## 14. Storyboard-Motor ist look-abhängig — nicht dogmatisch Nano
- **Problem:** Doku-Annahme „Nano Banana Pro = Storyboard-König“ stimmt nicht universell.
- **Befund (direkter A/B, Aurora-Glass-Look):** GPT Image 2 lieferte den kinoreifen Glas-/Refraktions-Look mit gebauter Architektur, nassen Reflexionen und sauberem „eerie-but-gentle“-Ton klar überlegen; Nano Banana Pro kippte ins weiche, milchig-flache Kinderbuch.
- **Bestätigt (2. Projekt, Anima-Machina-Look):** GPT Image 2 trug auch den halb-photorealen Messing-/Mechanik-Look mit Maßstab und Lichtphysik überzeugend.
- **Bestätigt (3. Projekt, chazon-Item-Sheet, textreich):** bei **viel In-Image-Text** (Hebräisch חזון + deutsche Labels) schlug GPT Image 2 Nano Banana Pro erneut klar („genauer“) — Text-Dichte kippt die Wahl Richtung GPT Image 2, selbst im weichen Illustrations-Look.
- **Lehre:** Storyboard-Motor **pro Projekt am Look testen** (ein Sheet A/B). Faustregel: photoreal-nah / refraktiv / dramatisch beleuchtet **oder textreich** → **GPT Image 2**; flach-illustrativ, viele konsistente Figuren, wenig Text → **Nano Banana Pro**.

## 15. Seedance: Storyboard als Sequenz lesen, NICHT das Grid animieren
- **Problem:** Seedance animiert ein Storyboard-Sheet sonst als EIN Bild — schwenkt/zoomt über das Grid, statt die Panels als Cuts zu lesen.
- **Lösung (Prompt-Kern):** explizit „each panel is ONE separate camera shot, read left-to-right top-to-bottom as the shot order“; KEIN Pan/Zoom über das Grid, KEINE Panel-Ränder/Gutter/Split-Screen/zwei Panels gleichzeitig; jeder Moment = ein full-frame Shot.
- **Recherchierte Kniffe (Quellen Feb–Apr 2026):** narrative Logik zwischen den Panels ausschreiben; zeitcodierte Shot-Liste; Standard-Tier statt Fast/Turbo; Omni-Referenzen (bis 9 Bilder, Sheet als Anker + Charactersheets); „text overlay, no captions on screen“ (Text-Bleed); Aspect matchen (§17).

## 16. Eine Identitätsfigur pro Charactersheet
- **Problem:** zwei Figuren auf ein Sheet quetschen halbiert Fläche/Pixel pro Figur → schwächere Treue.
- **Lösung:** je ein eigenes Sheet pro Identitätsfigur. Statisten / Props / Automaten dürfen aufs Ensemble- bzw. Roster-Blatt.

## 17. Panel-Orientierung = finale Video-Orientierung (Reframe-Falle)
- **Problem:** quadratische Panels in einem 9:16-Output → Seitencrop, breite Kompositionen verlieren Bildinhalt.
- **Lösung:** Sheets in der Orientierung rendern, die die Shots erhält. Landscape → nativ 16:9. Ist 9:16 das Ziel, Panels gleich hochkant komponieren.
- **Faustregel:** breit-cinematischer Doku-Look → 16:9; reines Short-Vertikal → vertikal anlegen.

## 18. STILL-IMAGE-Regel (Panel = ein einzelnes Foto)
- **Problem:** Panel-Beschreibungen mit Zeit-/Bewegungsverben lassen sich nicht als Einzelbild rendern — das Modell improvisiert oder verzerrt. Selbst passiert: „Dilo gives a calm nod“, „Tani notices / dawning understanding“, „Brandt glances back“.
- **Regel:** jede Panel-Beschreibung muss als **ein einzelnes Foto** einfangbar sein. Test: „Könnte ein Fotograf das in einem Bild zeigen?“ — wenn nein, umschreiben. Bewegung gehört in den **Video-Prompt**, nicht ins Panel.
- **Gültig (im Standbild sichtbar):** gehen, rennen, kauern, zeigen, halten, schauen, greifen, stehen, sitzen, umarmen, fallen, tragen, klettern, starren.
- **Ungültig (brauchen Zeit/Bewegung):** nicken, Kopf schütteln, zustimmen, entscheiden, realisieren, sich umdrehen, anfangen/beenden, auf etwas reagieren, etwas off-screen bemerken.
- **Übersetzung ins sichtbare Äquivalent:** „sie nickt“ → „leicht gesenktes Kinn, erleichterter Ausdruck“; „er realisiert, die Tür ist zu“ → „beide Hände flach an der Tür, Kopf gesenkt“; „sie reagiert auf das Gas“ → „taumelt zurück, eine Hand an der Maske, Augen weit“; „sie bemerkt die Spur“ → „gebeugt über die Stelle, Finger zeigt darauf“.

## 19. State-/Restate-Lock (Costume + zustandsbehaftete Details)
- **Problem:** Kleidung und zustandsbehaftete Details driften zwischen Panels — das Modell trägt sie nicht zuverlässig weiter.
- **Costume-Lock:** pro Figur einen Kopf-bis-Fuß-Lock-Absatz definieren + Satz „every character's costume and appearance must remain exactly identical across all panels“. Geplante Wechsel explizit: `STATE CHANGE: [Figur] — ab Panel N: [neue Beschreibung]`.
- **Restate-Regel (verallgemeinert aus der Face-Covering-Rule):** jedes **zustandsbehaftete** Detail in **jedem** Panel UND **jedem** Video-Prompt neu ausschreiben — nie Carry-forward annehmen. Beispiele bei uns: Merkaba-Anhänger sichtbar/verdeckt, Werkzeug in der Hand ja/nein, Maske/Helm ON/OFF, bei Hybrid-Figuren welche Körperseite organisch↔geschmiedet.

## 20. Pipeline-Modi: NATIVE vs CUT (benannt, vertieft §4)
- **NATIVE (unser Default):** ganzes Sheet als @sheet-Anker, EIN zeitcodierter Sequenz-Prompt, Kamera-Move pro Shot erlaubt, Modell schneidet selbst. Voraussetzungen: §13 (null Text/Captions im Sheet), §15 (Anti-Grid), 6 Panels (2×3), ≤15 s, §17 (Orientierung). Schnell, hält Anschlüsse, weniger Kontrolle pro Shot.
- **CUT (aus „ai-video-prompt-writer“-Skill):** größeres Grid möglich (z. B. 4×3 / 12 Panels), jedes Panel **einzeln zugeschnitten** → **ein Video-Prompt pro Panel**, danach manuell montiert. Hier gilt:
  - Panel-Captions **erlaubt** (Format „01. EXT. ORT — TAG/NACHT / max-6-Wort-Caption“, Monospace) — werden vor dem Animieren weggecroppt, daher kein §13-Konflikt.
  - Video-Prompts: schlicht im **Präsens**, **kein** Kamera-Jargon, **keine** Panel-Querverweise („meanwhile/suddenly“), optional Dialog als `[Figur] says: "…"`, Endtag **„ambient only, no music, no subtitles“** (statt nur „No Music“ — unsere Audio-Policy §6).
  - Volle Shot-Kontrolle + Captions, kostet aber manuellen Schnitt.
- **Wahl pro Projekt:** NATIVE für schnelle, anschlusssichere Sequenzen; CUT, wenn jeder Shot einzeln kontrolliert werden soll.

## 21. Multi-Identitäts-Bleed in EINEM Frame (GPT Image 2)
- **Problem:** Mehrere menschliche Identitäten in **einem** GPT-Image-2-Frame laufen ineinander — Figuren übernehmen gegenseitig Look/Gesicht. Selbst passiert (T2, „Tanz des Lebens“): erst war **Dilo doppelt** im Bild; nach Korrektur sah der **Gegner aus wie Dilo** und **Lumi (ein Lichtwesen!) wie Tani**.
- **Ursache:** bei 3–4 konkurrierenden Referenzbildern in *einer* Szene trennt das Modell die Identitäten nicht sauber; das stärkste/ähnlichste Referenzgesicht „gewinnt“ und färbt auf die anderen ab. Auch explizite Anti-Resemblance-Prompts (v2/v3) lösten es **nicht** zuverlässig.
- **Lösung, in dieser Reihenfolge:**
  1. **Je eigener Anker pro Figur** + harte Abgrenzung („CLEARLY DIFFERENT from X: no top-knot, no beard …“), klare räumliche Trennung, „no duplicates, no clones, no twins“.
  2. Hilft das nicht → **Solo-Shot**: die Schlüsselfigur **allein** rendern und **nur ihren** Anker referenzieren (keine Fremd-Identität im Bild → *kann* nicht bleeden). Die Gruppe in einen separaten Shot auslagern, der schon sauber sitzt.
  3. Alternativ **Composite**: Figuren einzeln rendern, im Editor montieren.
- **Merksatz:** Nicht gegen den Bleed *anprompten* — **die Referenzen wegnehmen**. Ein Anker = kein Bleed. (Ergänzt §16: dort eine Identität pro *Sheet*, hier eine Identität pro *Szenen-Frame* wo möglich.)

## 22. Wiederkehrende Glied-/Hand-Fehler in dynamischer Action
- **Problem:** Dilo bekam in bewegten Action-Clips einen **dritten Arm** (Seedance, Strahlen-Pose mit Dreizack). Hände/Arme sind der häufigste Anatomie-Fehler.
- **Ursache:** dynamische Posen + Prop/Waffe in der Hand verleiten zu Extra-Gliedmaßen; der Fehler entsteht oft **schon im Keyframe**, nicht erst in der Animation.
- **Lösung:** „**exactly two arms and two hands**, both gripping the single [Prop], no third arm, no extra/duplicated limbs, anatomically correct“ in **Keyframe UND Video-Prompt**. Prop-Interaktion/Handzahl reduzieren wo möglich. Bei Fehler: **erst den Keyframe fixen** (sonst trägt die Animation den Fehler weiter), dann neu animieren.

## 23. Keyframe-first — kein Within-Turn-Chaining
- **Problem:** Ein frisch generierter Frame lässt sich **nicht im selben Schritt** als Startbild/Referenz weiterverwenden („Media input not found“).
- **Ursache:** der Frame muss erst fertig rendern, bevor seine ID als Eingang gültig ist.
- **Lösung:** strikt zweistufig — **(1) Keyframes generieren (billig) → freigeben → (2) animieren (teuer)**. Immer nur an **bereits gerenderte** Frames ankern. Spart Re-Rolls und hält die Freigabe-Schleife sauber.

## 24. Fertige Text-/Titel-Frames nicht animieren (erweitert §13)
- **Problem:** §13 verbietet Text in NATIVE-Sheets. Eigener Fall: ein **fertiges Titel-/Endcard-Standbild** mit eingebranntem Text (Titel, „chazon.eu“) soll als Clip leicht bewegt werden → das Video-Modell verzieht den Text.
- **Lösung:** Bewegung und Text trennen — **Keyframe als Standbild halten** und den Text im Editor als **Overlay** über einen sauberen, text-freien Bewegungs-Plate legen. Im Prompt zwar „keep text perfectly still & legible, only the subject moves“ setzen, dem Ergebnis aber nicht blind vertrauen.
- **Tool-Quirk (Higgsfield/Kling 3.0):** dunkle Prompts triggern die **„IN THE DARK“-Preset-Notice** → mit `declined_preset_id` (24bae836-…) neu feuern, um literal zu generieren. Audio während Drafts **off** (§6); `mode: pro` ≈ 1080p (Default), Seedance-Action 720p als Kostenbremse, 4k meiden.
