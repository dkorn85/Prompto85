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

## 12. Sicherheits-Leitplanke (inhaltlich)
- **Keine echten, benannten Personen in Gewalt-/Kampf-Szenarien.** (Fight gegen erfundene/mythologische Wesen = ok.)
- Kinder-Content: visuell ansprechend & entwicklungsgerecht, **nicht** trance-/suchterzeugend. Ruhiges Tempo, keine Cliffhanger-Mechanik.

## 13. Text/Zahlen im Sheet werden mitanimiert
- **Problem:** Seedance (und jedes Video-Modell) animiert sichtbaren Text/Zahlen im Storyboard-Sheet als bewegte Bildelemente mit — Panel-Nummern, Captions und In-World-Schilder („Block C“, „AREA SEALED“, „1927“) tauchen im Clip auf und flackern/verformen.
- **Ursache:** das Modell behandelt jede lesbare Glyphe als Bildinhalt, nicht als Metadaten.
- **Lösung:** **NULL Text / Zahlen / Captions / UI / Wasserzeichen in den Panels.** Panel-Reihenfolge lebt nur in der Shot-Liste, nicht im Bild. Jede In-World-Beschriftung (Schilder, Notizen, Poster, Spind-Nummern) abgewandt, unscharf oder leer halten — keine lesbaren Buchstaben/Ziffern.
- **Verschärft bei GPT Image 2:** ~99–100 % Textgenauigkeit heißt, es schreibt Schilder *zuverlässig* hin, wenn man es nicht hart unterbindet. No-Text-Regel im Prompt explizit und prominent setzen.

## 14. Storyboard-Motor ist look-abhängig — nicht dogmatisch Nano
- **Problem:** Doku-Annahme „Nano Banana Pro = Storyboard-König“ stimmt nicht universell.
- **Befund (direkter A/B, Aurora-Glass-Look):** GPT Image 2 lieferte den kinoreifen Glas-/Refraktions-Look mit gebauter Architektur, nassen Reflexionen und sauberem „eerie-but-gentle“-Ton klar überlegen; Nano Banana Pro kippte ins weiche, milchig-flache Kinderbuch und verschenkte die Refraktion.
- **Bestätigt (2. Projekt, Anima-Machina-Look):** GPT Image 2 trug auch den halb-photorealen Messing-/Mechanik-Look mit Maßstab und Lichtphysik überzeugend — verstärkt §14.
- **Lehre:** Storyboard-Motor **pro Projekt am Look testen** (ein Sheet A/B), nicht per Default festlegen. Faustregel: photoreal-nah / refraktiv / dramatisch beleuchtet → **GPT Image 2**; flach-illustrativ mit vielen konsistenten Figuren → **Nano Banana Pro**.

## 15. Seedance: Storyboard als Sequenz lesen, NICHT das Grid animieren
- **Problem:** Seedance animiert ein Storyboard-Sheet sonst als EIN Bild — schwenkt/zoomt über das Grid, statt die Panels als Cuts zu lesen.
- **Lösung (Prompt-Kern):** explizit „each panel is ONE separate camera shot, read left-to-right top-to-bottom as the shot order“; KEIN Pan/Zoom über das Grid, KEINE Panel-Ränder/Gutter/Split-Screen/zwei Panels gleichzeitig; jeder Moment = ein full-frame Shot, der das Videoformat füllt.
- **Recherchierte Kniffe (Quellen Feb–Apr 2026):**
  - **Narrative Logik zwischen den Panels ausschreiben** — das Modell braucht die Story-Progression, nicht nur die Bildfolge.
  - **Zeitcodierte Shot-Liste** (0–2,5s Panel 1 …), je Shot Subject → Action → Camera (EIN Move).
  - **Standard-Tier, nicht Fast/Turbo** für Publish-Qualität.
  - **Omni-Referenzen:** bis zu 9 Bilder — Sheet als Anker + die Charactersheets als Identitäts-Refs mitgeben.
  - **Text-Bleed verhindern:** zusätzlich zu §13 „text overlay, no captions on screen“ in den Prompt.
  - **Aspect matchen:** Output-Orientierung = Panel-Orientierung (siehe §17).

## 16. Eine Identitätsfigur pro Charactersheet
- **Problem:** zwei Figuren auf ein Sheet quetschen halbiert Fläche/Pixel pro Figur → schwächere Gesichts-/Detailtreue, genau das, wofür Sheets da sind.
- **Lösung:** je ein eigenes Sheet pro Identitätsfigur (max Pixel = max Treue). Statisten / Props / Automaten dürfen aufs Ensemble- bzw. Roster-Blatt — da zählt Überblick mehr als Pixeldichte.

## 17. Panel-Orientierung = finale Video-Orientierung (Reframe-Falle)
- **Problem:** quadratische Panels in einem 9:16-Output → Seedance croppt die Seiten weg, breite/cinematische Kompositionen verlieren Bildinhalt.
- **Lösung:** Sheets in der Orientierung rendern, die die Shots erhält. Landscape-Panels → nativ 16:9, kein Crop. Ist 9:16 das einzige Ziel, Panels gleich hochkant komponieren (Subjekt mittig/safe), nicht erst im Video reframen lassen.
- **Faustregel:** breit-cinematischer Doku-Look → 16:9 rendern, ggf. in Post auf 9:16 beschneiden; reines Short-Vertikal → Panels direkt vertikal anlegen.
