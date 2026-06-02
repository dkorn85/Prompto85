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
