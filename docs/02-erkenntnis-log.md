# Prompto85 — Erkenntnis-Log
**Stand: Juli 2026 · technische Lessons aus der laufenden Produktion**

Jeder Punkt: *Problem → Ursache → Lösung*. Grundlage für die Guardrails im Umbauplan.

---

## 1. Seedance lehnt Sheets als „NSFW“ ab
- **Problem:** 2×2-Storyboard-Sheet wird von Seedance 2.0 als NSFW blockiert, obwohl harmlos.
- **Ursache:** zu viele Gesichter / Close-up-Cluster auf einem Bild triggern den Filter — nicht der Inhalt.
- **Lösung:** weite Ganzkörper-Shots, Gesichter klein, **keine** Close-ups, dicke weiße Panel-Ränder, weniger Panels, **1×N-Streifen statt 2×2-Grid**. Letzter Ausweg: First/Last-Frame-Morph.

## 2. Layout-Regel: 1×N statt Grid
- Ein horizontaler Streifen (1×3, 1×4) ist robuster als ein Grid — gegen NSFW-Filter und für sauberen Schnitt. Dicke Trennränder, Figuren weit/klein.
- *(Präzisiert in §29: Grid ist OK, solange die Panels ECHTE Zielformat-Proportionen behalten — die Falle ist das Vollflächen-Quetschen, nicht das Grid an sich.)*

## 3. 15-Sekunden-Grenze → Sub-Clips mit Anschluss
- **Problem:** Storyboards über 15 s nicht in einem Clip generierbar (Modell-Limit).
- **Lösung:** max. 15 s pro Storyboard, in Sub-Clips ~12 s splitten (1A–1D), je ≤4 Panels.
- **ANSCHLUSS-Regel:** letztes Panel von Clip N = erstes Panel von Clip N+1 → nahtlose Schnitte.
- *(Verschärft in §27: Panel-Anschluss reicht NICHT für Frame-Identität — echten End-Frame als `primary` übergeben.)*

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
- **Ausnahme 2 (§29):** Gemini-basierte Video-Modelle (Omni Flash) LESEN Caption-Boxen außerhalb der Bildflächen als Regie-Anweisung, statt sie zu animieren — Regie-Sheet-Workflow.

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
- **Bestätigt (Babaji-Session, Juli 2026, seedance-2-mini/WaveSpeed):** Muster funktioniert auch auf dem Budget-Tier — 4–6 vertikale Panels als 12s-Sequenz mit sauberen Cuts, zeitcodierte Shot-List `0–3s Panel 1: …`, EINE Aktion + EINE Kamerabewegung pro Shot, Negative-Block am Ende.

## 16. Eine Identitätsfigur pro Charactersheet
- **Problem:** zwei Figuren auf ein Sheet quetschen halbiert Fläche/Pixel pro Figur → schwächere Treue.
- **Lösung:** je ein eigenes Sheet pro Identitätsfigur. Statisten / Props / Automaten dürfen aufs Ensemble- bzw. Roster-Blatt.

## 17. Panel-Orientierung = finale Video-Orientierung (Reframe-Falle)
- **Problem:** quadratische Panels in einem 9:16-Output → Seitencrop, breite Kompositionen verlieren Bildinhalt.
- **Lösung:** Sheets in der Orientierung rendern, die die Shots erhält. Landscape → nativ 16:9. Ist 9:16 das Ziel, Panels gleich hochkant komponieren.
- **Faustregel:** breit-cinematischer Doku-Look → 16:9; reines Short-Vertikal → vertikal anlegen.
- **Ergänzung (Babaji-Session, Juli 2026):** Sheet-Format ≠ Panel-Format; entscheidend ist die Panel-Proportion. *(Geometrie-Regel präzisiert in §29 — die „4–6 Panels nebeneinander in einer Reihe“-Variante war ein Fehler: erzeugt Streifen statt 9:16.)*

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
- **Dritter Modus seit §29: DIRECTOR (Gemini Omni Flash)** — Regie-Sheet mit Caption-Boxen als einzige Quelle der Wahrheit, Minimal-Prompt.

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

## 25. Merkaba Honey / Seedance: Moderation ist PROVIDER-abhängig (erweitert §1)
- **Problem (Babaji-Session, Juli 2026):** seedance-2-mini via **runware** lehnte ein harmloses Multi-Figur-Storyboard-Sheet 4× in ~10 s als „ByteDance content moderation“ ab — Input-seitige Ablehnung. Getestet und ausgeschlossen: Prompt-Begriffe (religiös/ethnisch neutralisiert), Ref-Anzahl (1 vs. 2), nackte Oberkörper (bedeckte Sheet-Variante fiel identisch durch).
- **Befund:** **dasselbe Sheet, derselbe Prompt via `provider: wavespeed` → läuft sauber durch** (12 s, 4 Shots, Audio, ~3,5 min Renderzeit). Die Ablehnung war runware-seitig, nicht ByteDance-modell-seitig und nicht unser Content (bestätigt §1: Gesichter-Cluster/Sheets triggern Filter, nicht Inhalt).
- **Regel:** Seedance-Jobs mit Sheet-/Multi-Figur-Refs über Merkaba Honey **immer mit `provider: "wavespeed"` pinnen**. Diagnose-Signal: Ablehnung in <15 s = Input-Moderation → Provider wechseln, NICHT den Content umbauen. Kosten: wavespeed ~3× runware-Schätzung (2.88$ vs 0.97$ / 12 s 720p mit Refs), aber runware liefert schlicht nicht.
- **Präzisierung (§29):** gilt Seedance-spezifisch — gemini-omni-flash lief via runware sauber durch, inkl. Sheet-Ref.
- **Merksatz:** Erst Provider ausschließen, dann am Content schrauben. Abgelehnte Jobs kosten nichts (cost_actual = null) → Provider-Pin-Tests sind gratis.

## 26. Identity-Ref ist PFLICHT in jedem Video-Run + Panel-Verifikation vor Nutzung
- **Problem (Babaji-Session):** zwei vermeidbare Identitäts-Fails in einer Session. (a) Anchor-Sheet ohne Character-Referenz generiert → falsches Gesicht („nicht Babaji“). (b) Video-Run mit unverifiziertem Sheet + ohne Identity-Ref gefeuert → Hauptfigur driftete zur Jesus-Ikonografie (weißer Schal + langes Haar kippt generisch ins Sakral-Klischee). 2.88$ verbrannt.
- **Regeln:**
  1. **Jedes Sheet mit Identitätsfigur wird MIT deren Character-Sheet als Ref generiert** — nie nur aus Textbeschreibung.
  2. **Identitäts-Panel vor Nutzung visuell verifizieren** (Panel croppen, gegen Referenz prüfen) — bei JEDER Sheet-Version neu, auch nach „kleinen“ Änderungen (Kleidungs-Variante = neue Version = neue Prüfung).
  3. **Character-Sheet als @Image-Identity-Ref in JEDEM Video-Run mitgeben**, der die Figur enthält — auch wenn sie auf dem Anchor-Sheet korrekt aussieht. Bei Diagnose-Tests, die Refs reduzieren: Identity-Ref vor dem Produktiv-Run wieder einsetzen.
  4. Negativ-Merkmale explizit sperren, wenn Drift-Gefahr zu Archetypen besteht („no beard“ bei langhaarigen Weißgewand-Figuren gegen Jesus-Drift).
- **Zusatz-Befund (Clip D):** Video-Modelle driften Identität auch DANN, wenn Sheet + Identity-Ref korrekt mitgegeben wurden — die Frame-Verifikation nach dem Render (§28-Logik auf Clips angewandt) bleibt Pflicht, Identitäts-Urteile konservativ fällen und beim User rückversichern.
- **Merksatz:** Verifizieren ist billiger als Re-Rendern — ein view-Call kostet nichts, ein 12s-Clip 2.88$.

## 27. Frame-Level-Anschluss: End-Frame von Clip N = `primary` von Clip N+1 (verschärft §3)
- **Problem (Babaji-Session, Juli 2026):** Die §3-Anschluss-Regel (gleiches Panel auf beiden Sheets) erzeugt nur *ähnliche* Bilder, keine identischen — die Frames driften von Clip zu Clip (Location-Details, Licht, Figuren-Position), der harte Schnitt springt sichtbar.
- **Ursache:** zwei unabhängige Generierungen desselben Panel-Motivs (Sheet N Panel-letztes vs. Sheet N+1 Panel-erstes) sind zwei verschiedene Samples — Panel-Ähnlichkeit ≠ Frame-Identität.
- **Lösung:** **echten letzten Frame** von Clip N per ffmpeg extrahieren (`ffmpeg -sseof -0.1 -i clipN.mp4 -frames:v 1 last.png`) und als **`primary` (literales Startbild)** von Clip N+1 setzen. Das Sheet bleibt @Image-Anchor für Look und Shot-Folge, aber die Übergabe läuft über den realen Frame. Frame muss sauber/textfrei sein (Start-/End-Frame-Regel).
- **Konsequenz für den Workflow:** Sub-Clips einer Sequenz sind damit **seriell**, nicht parallel zu generieren — Clip N muss fertig sein, bevor N+1 startet (deckt sich mit §23 Keyframe-first: nie an ungerenderte Assets ankern).
- **Anschluss-Panel auf dem Folge-Sheet trotzdem behalten** — es hält die Shot-Zählung der zeitcodierten Liste konsistent und gibt dem Modell die narrative Brücke.
- **Bewährt (Clip D):** End-Frame von Clip C als `primary` → Schnitt C→D springt nicht mehr.

## 28. Sheet-QA-Checkliste vor jedem Video-Run (Gate, kein Vorschlag)
- **Problem (Babaji-Session, Juli 2026):** Ein Sheet passierte die „Prüfung“ (textfrei ✓, Panel-Anzahl ✓) und war trotzdem Storyboard-Schrott: Anker-Panel zeigte nur angeschnittene Hände + Trommel statt des Vorgänger-Panels, Musiker **posierten frontal mit Kamera-Blick** (Band-Portrait statt Spielmoment), Framing sprang regellos zwischen Close/Medium/Ganzkörper. Die QA hatte nur Formalien geprüft, nicht Storyboard-Qualität.
- **Ursache:** Prompt beschrieb Panels nur grob statt das PANEL-Schema (beat/subject/shot/light) durchzudeklinieren — und die Prüfung checkte nicht gegen das Schema.
- **QA-Gate — JEDES Sheet vor JEDEM Video-Run, alle Punkte PFLICHT:**
  1. **Textfrei in den Bildflächen** — keine Glyphe (§13; Caption-Boxen außerhalb der Frames nur im DIRECTOR-Modus §29).
  2. **Panel-Anzahl + GEOMETRIE:** Panel-Proportion messen (Pixel!), nicht nur Orientierung raten (§29).
  3. **Anker-Match:** Panel 1 visuell gegen das Vorgänger-Panel/den End-Frame halten — gleiche Shot-Größe, gleiche Figuren, gleiche Location-Details. „Gleiches Motiv“ reicht nicht.
  4. **Beat-Check pro Panel:** jeder Beat als *Spielmoment* eingefroren („mid-strike“, „mid-breath“), NICHT als Pose/Aufstellung/Gruppenfoto (§18 verschärft: Posieren ist der getarnte Verstoß).
  5. **Kein Kamera-Blick:** niemand schaut in die Linse — im Sheet-Prompt explizit „candid in-scene moment, no eye contact with camera“ setzen, sonst animiert Seedance Kamera-Starrer.
  6. **Konsistente Shot-Grammatik:** Shot-Größe pro Panel bewusst gesetzt (aus dem PANEL-Schema), keine zufälligen Sprünge.
  7. **Identitäts-Panels** gegen Character-Referenz (§26).
- **Regel:** Fällt EIN Punkt durch → Sheet neu generieren (0,15 $), NICHT „wird schon gehen“ (2,88 $ + Re-Roll). Das Gate gilt auch bei Zeitdruck und auch für „kleine“ Sheet-Revisionen.

## 29. Gemini Omni Flash: DIRECTOR-Modus, Grid-Geometrie & Prompt-Regeln (Babaji-Session, Juli 2026)
- **Modell-Steckbrief (Merkaba Honey `gemini-omni-flash`):** [i2v+t2v+ref2v], 720p mit synchronem Audio, 3–10 s, bis 10 Bild-Refs (~3 = Sweet Spot), ~0.13 $/s OHNE Ref-Aufschlag (10 s mit 2 Refs = 1.01 $ real vs. 2.88 $ Seedance-mini 12 s), Renderzeit ~1 min. Läuft via **runware sauber** (§25 ist Seedance-spezifisch). Strikter Google-Filter: **nur positive Verben** (kein Negative-Block — Verneinungen sind Rauschen), keine Waffen-Verben auf Personen, **keine Haut-Close-ups** (Medium/Wide für Figuren mit freiem Oberkörper).
- **Grid-Geometrie (korrigiert die „eine Reihe“-Falle):** Panels müssen die Canvas NICHT füllen. **2 Reihen × 3 echte 9:16-Frames mit Rändern/Gutter auf 16:9-Canvas** — 4–6 Panels in EINER Reihe quetscht sie zu 1:2.8-Streifen, das Modell muss ~35 % Bildbreite erfinden (befeuert Identity-Drift). Lesereihenfolge „left to right, top row first“ funktioniert. 4K-Canvas für Pixel-Dichte pro Panel.
- **DIRECTOR-Modus (dritter Pipeline-Modus neben NATIVE/CUT):** Regie-Sheet mit **Caption-Boxen UNTER jedem Frame** (3 Monospace-Zeilen: `NN · EXT. ORT — TAGESZEIT` / `ACTION: …` / `CAM: …`), Bildflächen selbst textfrei. **Omni Flash liest die Anweisungen multimodal aus dem Sheet** und setzt sie um — Minimal-Prompt genügt („Execute the six captioned shots in reading order, following each ACTION and CAM instruction“), das Sheet ist die einzige Quelle der Wahrheit. Bestätigt: „1a generiert, keine Flags“. Sheet-Motor: nano-banana-pro 4K (Text-Lesbarkeit), wörtlichen Caption-Text im Sheet-Prompt in Anführungszeichen. §13 gilt unverändert für Seedance & Co. — DIRECTOR ist Gemini-exklusiv bis anderweitig getestet.
- **Einsatz-Faustregel:** Omni Flash = Preis-Leistungs-Arbeitspferd für Montage-Sequenzen (viele kurze Beats, ≤10 s) und DIRECTOR-Workflow; Seedance-2-mini/pro für Charakter-Nahaufnahmen, längere Einzelshots und >10 s.
- **Plattform-Notiz:** interne Output-Moderation kann Assets als `rejected` flaggen (Menschenmengen/In-Image-Text als mögliche Trigger), Generierung + Abrechnung laufen trotzdem, Signed-URL bleibt gültig — Flag ggf. im Admin reviewen; Provider-seitig war derselbe Sheet-Input flag-frei.
