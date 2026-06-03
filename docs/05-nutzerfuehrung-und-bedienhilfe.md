# Prompto85 — Nutzerführung & Bedienhilfe
**Stand: Juni 2026 · die geführte 7-Schritt-Reise + In-App-Hilfetexte + Build-Spezifikation.**

> Detailliert das Wizard-Prinzip aus `04-umbauplan-prompto.md §2` zu einer konkreten, an die Hand nehmenden Nutzerreise aus. Enthält die echten Hilfe-Microcopy-Texte (1:1 in die App übernehmbar) und die Build-Tickets gegen die reale `index.html`.

---

## 1. Prinzip: „Geführt, aber nie eingesperrt“
- **Geführt-Modus (Default für neue Nutzer):** eine Fortschrittsleiste mit 7 Schritten führt den Nutzer linear durch. Jeder Schritt zeigt oben eine **Hilfe-Karte** („Was jetzt zu tun ist“), darunter genau die nötigen Bedienelemente und **einen** klaren Weiter-Button.
- **Profi-Modus:** die heutigen fünf Tabs bleiben frei navigierbar. Umschalter oben rechts: `Geführt ⇄ Profi`.
- **Goldene Regel je Schritt:** Erklärung → Aktion → ein eindeutiger nächster Schritt. Nie eine nackte UI ohne Kontext.

Die geführte Reise ist eine **Orchestrierungs-Schicht** über den bestehenden Modulen — sie erfindet keine neue Engine, sondern ruft die vorhandenen Funktionen in sinnvoller Reihenfolge auf und erklärt sie.

---

## 2. Heutige Elemente (Bestandsaufnahme, gegen die wir bauen)
- **Sidebar „Projekt“:** `#story` (Handlung), `#style` + `🖼 Visuell wählen` (`openStyleGallery`) + `#styleCustom`, `#dna`, `#models` (chips), `#aspect`, `#brand`, `#engine`.
- **Tab `tree` (Story-Baum):** Beats verzweigen, `suggestNext` (KI-Vorschläge), eigener Zweig, Sheet je Knoten, `openInDir`.
- **Tab `story` (Storyboard):** `genStoryboard` (SYS_SB) → Sheet-Prompt; `renderSheet` (optional GPT-Image-Key); `loadSheet` (fertiges Sheet hochladen).
- **Tab `char` (Cast):** `addActors` (Sheet-Upload → `SYS_CHAR` Auto-Erkennung → DNA), besetzen/löschen, `castDirector` (`SYS_CAST` Casting-Regie), `genSheet` (`SYS_SHEET` Charactersheet-Prompt **aus Text-DNA**).
- **Tab `dir` (Regie & Cut):** `routingBox`, Export Pro-Clip/Ganze-Sequenz, `plan` (`SYS_PLAN`) → Clips/Sequenz + ZIP.
- **Tab `agent`:** beratender Regisseur-Chat (`agentSys`).

**Lücken zur gewünschten Reise:** kein Referenzfoto-Upload; `genSheet` nutzt das Foto nicht; keine Sheet-Qualitätsprüfung mit Tipps; keine Besetzungs-Vollständigkeits-Abfrage; kein Story→Szenen→Prompts-Generator (Storywriter); keine Daumenkino-Vorschau.

---

## 3. Die geführte Reise — 7 Schritte
Jeder Schritt: **Ziel · Nutzeraktion · UI (heute/neu) · Hilfetext (Microcopy, DE) · Weiter-Trigger.** Die Hilfetexte sind so formuliert, dass sie direkt in die Hilfe-Karte gehen.

### Schritt 1 — Referenz hochladen  *(NEU: eigenes Bild)*
- **Ziel:** eine Figur startet mit einem echten Foto.
- **Aktion:** Foto von sich/der Zielperson hochladen.
- **UI:** neue Drop-Zone in `char` → speichert auf einer *Pending-Figur* (`actor.refPhoto`), getrennt von der Sheet-Upload-Zone.
- **Hilfetext:** „**Schritt 1 von 7 · Deine Figur beginnt mit einem Bild.** Lade ein Foto von dir – oder von der Person, die zur Figur werden soll. Daraus baut die KI dein Charactersheet. Am besten: Gesicht klar erkennbar, gutes Licht, frontal, wenig harte Schatten. Du kannst mehrere Figuren nacheinander anlegen. *Kein Foto zur Hand? Dann überspringe diesen Schritt und arbeite nur mit Text-DNA + Stil.*“
- **Weiter:** „Weiter zu Schritt 2: Stil“.

### Schritt 2 — Stil finden
- **Ziel:** ein Look, der über alle Figuren und Szenen gleich bleibt.
- **Aktion:** Stil wählen (Liste / `🖼` Picker / eigener Token-Block) oder mit KI beraten.
- **UI:** Sidebar-Stilfeld + Galerie + neuer Button **„Mit KI beraten“** → öffnet den Agent vorbefüllt („Hilf mir, einen Stil zu finden für …“).
- **Hilfetext:** „**Schritt 2 von 7 · Der Look für alles.** Wähle den visuellen Stil über die Liste, den 🖼 Picker oder gib einen eigenen Token-Block ein. Unsicher? Tippe **Mit KI beraten** und beschreibe Stimmung, Genre und Zielgruppe – der Regisseur schlägt passende Stile vor. Der Stil bleibt über alle Figuren und Szenen gleich; das hält den Look konsistent. *Du willst bewusst einen neuen Look? Sag es ausdrücklich – sonst behalten wir den letzten bei.*“
- **Weiter:** „Stil übernehmen → Schritt 3“.

### Schritt 3 — Charactersheet-Prompt  *(NEU: aus Foto + Stil)*
- **Ziel:** der fertige Bau-Auftrag fürs Charactersheet.
- **Aktion:** Prompt erzeugen lassen, kopieren, auf der eigenen Plattform mit dem Referenzfoto erstellen.
- **UI:** `genSheet` erweitert → übergibt das Referenzfoto als Bild-Block (Vision) + Stil; Ausgabe = Sheet-Prompt **plus** eine „So erstellst du es“-Box.
- **Hilfetext:** „**Schritt 3 von 7 · Der Bau-Auftrag fürs Charactersheet.** Aus deinem Referenzfoto + dem Stil schreibt die KI einen fertigen Prompt für ein 4K-Charactersheet (Vorderansicht, 3/4, Profil, Rückansicht, Ausdrucksreihe). **So erstellst du es:** Öffne deine Bild-Plattform (GPT Image 2.0 oder Nano Banana Pro), lade dort dein Referenzfoto hoch und füge diesen Prompt ein. Greenscreen-Hintergrund und ‚keine Grüntöne an der Figur‘ sind schon drin. *Eine Identitätsfigur pro Sheet = beste Treue.*“
- **Weiter:** „Prompt kopieren“ · „Auf meiner Plattform erstellt → Schritt 4“.

### Schritt 4 — Charactersheet hochladen + Analyse
- **Ziel:** das fertige Sheet zur wiederverwendbaren Figur machen, mit ehrlichem QA.
- **Aktion:** Sheet hochladen; KI liest Name + DNA und gibt Tipps, falls etwas nicht stimmt.
- **UI:** bestehender `addActors`-Flow + **NEU** ein QA-Pass (siehe §4b) → Tipps-Box pro Figur. Name/DNA direkt editierbar (`.aName`/`.aDna`).
- **Hilfetext:** „**Schritt 4 von 7 · Sheet hochladen, KI prüft.** Lade das fertige Charactersheet hoch. Die KI liest die Figur aus, vergibt Name + wiederverwendbare DNA – und sagt dir ehrlich, wenn etwas nicht passt: Gesicht weicht vom Foto ab, Ansichten uneinheitlich, Grüntöne an der Figur, Text im Bild. Name und DNA kannst du direkt nachbessern.“
- **Weiter:** „Figur übernehmen → Schritt 5“.

### Schritt 5 — Alle Figuren da?  *(NEU: Vollständigkeits-Gate)*
- **Ziel:** sicherstellen, dass alle für die Szene nötigen Figuren existieren.
- **Aktion:** Entscheidung – noch eine Figur oder weiter.
- **UI:** Besetzungs-Checkliste (Chips der `actors` mit ✓ besetzt) + zwei Buttons.
- **Hilfetext:** „**Schritt 5 von 7 · Ist die Besetzung komplett?** Das ist deine Besetzung. Fehlt noch eine Figur für deine Szene? → **Weitere Figur anlegen** bringt dich zurück zu Schritt 1. Sind alle da? → **Besetzung komplett, weiter zur Story.**“
- **Weiter:** „Weitere Figur anlegen → Schritt 1“ · „Besetzung komplett → Schritt 6“.

### Schritt 6 — Story entwickeln  *(NEU: Storywriter)*
- **Ziel:** gemeinsam eine Geschichte finden und sie in Szenen + Storyboard-Prompts zerlegen.
- **Aktion:** im Dialog Ideen geben, KI schlägt vor; wenn die Story steht → „zerlegen“.
- **UI:** Story-Entwicklung über Agent/Story-Baum **plus NEU** Modul **Storywriter** (`SYS_STORYWRITER`, §4c): Button „Story in Szenen + Storyboard-Prompts zerlegen“ → Szenenliste, je Szene ein Sheet-Prompt (mit Besetzung, im Stil, regelkonform).
- **Hilfetext:** „**Schritt 6 von 7 · Eure Geschichte.** Jetzt entwickelt ihr die Story gemeinsam: Du gibst Ideen, der Storywriter macht Vorschläge, ihr verfeinert, bis sie steht. Dann zerlegt der Storywriter die Geschichte automatisch in Szenen und schreibt für jede Szene den passenden Storyboard-Prompt – mit deiner Besetzung, im gewählten Stil, ohne Text in den Panels (das würde sonst mitanimiert).“
- **Weiter:** „Szenen erzeugt → Schritt 7“.

### Schritt 7 — Storyboards + Daumenkino  *(NEU: Flipbook-Vorschau)*
- **Ziel:** die Story als Ganzes sehen, bevor animiert wird.
- **Aktion:** je Szene das fertige Storyboard-Sheet erstellen und in Reihenfolge hochladen; Daumenkino ansehen.
- **UI:** **NEU** Daumenkino-Viewer (`S.flip = [sheets in Szenenreihenfolge]`) mit ▶/⏸, ‹ ›, Tempo-Regler; pro Slot der Szenentitel als Beschriftung (außerhalb des Bildes, nicht im Sheet).
- **Hilfetext:** „**Schritt 7 von 7 · Storyboards & Daumenkino.** Erstelle die Storyboard-Sheets (wieder auf deiner Plattform, mit den Szenen-Prompts aus Schritt 6) und lade sie hier in Reihenfolge hoch. Prompto baut ein Daumenkino daraus: alle Sheets laufen nacheinander durch, damit du die ganze Story als Sequenz siehst und Brüche oder Lücken sofort erkennst.“
- **Abschluss:** „Fertig – weiter zu **Regie & Cut**, um die Sheets zu animieren (NATIVE/CUT, §20).“

---

## 4. Neue Features im Detail (Build-Spezifikation)

### 4a. Referenzfoto-Upload (Schritt 1 & 3)
- Datenmodell: `S.cast.pending = {refPhoto, refThumb}` ODER `actor.refPhoto` an der angelegten Figur.
- Zweite Drop-Zone in `viewChar`, klar beschriftet „Referenzfoto (du / eine Person)“ vs. „fertiges Charactersheet“.
- Foto wird per `fitImage(...,1568)` für die Vision-Analyse und `512` als Thumbnail gehalten.

### 4b. Charactersheet-Prompt aus Foto + Sheet-QA
- `genSheet()` erweitern: wenn `refPhoto` vorhanden, als `imgBlock` in den Claude-Call geben; `SYS_SHEET` ergänzen um „preserve the likeness of the supplied reference photo“ + Greenscreen + „no green tones on the character“ + „one identity figure only“.
- **Neuer QA-Pass** beim Sheet-Upload (`addActors`): zusätzliche JSON-Felder, z. B. `SYS_SHEET_QA` → `{match_ok:bool, issues_de:["…"], tips_de:["…"]}`. Prüft: Ähnlichkeit zum Referenzfoto (falls vorhanden), Konsistenz der Ansichten, Greenscreen sauber, keine Grüntöne an der Figur, **kein Text im Sheet** (§13), eine Figur pro Sheet (§16). Ausgabe als Tipps-Box in der Figurenzeile.

### 4c. Storywriter (Schritt 6)  — Kernneuerung
- **Kollaborativ:** nutzt den bestehenden Agent/Story-Baum, um mit dem Nutzer die Story zu finden.
- **Generativ:** neuer Aufruf `SYS_STORYWRITER`. Input: finale Story, Besetzung (`castBlock`), Stil, Format, Marke. Output ONLY JSON:
  `{"story_de":"…","scenes":[{"title_de":"…","beats_de":["…"],"cast_present":["@Name"],"storyboard_prompt_en":"…","notes_de":"…"}]}`
- Jeder `storyboard_prompt_en` folgt den Regeln: 6 Panels (NATIVE-Default), **kein Text/Zahlen/Captions im Sheet** (§13), Still-Image-Beats (§18), Costume-/State-Lock je Figur (§19), Panel-Orientierung = Format (§17), eine Identitätsfigur pro Sheet bei Charactersheets (§16).
- Szenen landen als Knoten im Story-Baum (Wiederverwendung von `addNode`) und/oder als Liste mit Copy-Buttons; jede Szene ist direkt nach `dir` (Regie) übergebbar.

### 4d. Daumenkino / Flipbook (Schritt 7)
- Datenmodell: `S.flip = [{sheet, title, sceneId}]` in Szenenreihenfolge (Upload je Szene oder Sammel-Upload mit Zuordnung).
- Viewer: großes Vorschaubild + Steuerleiste **▶ abspielen / ⏸ / ‹ vor-zurück › / Tempo (0,5–2 s je Sheet)**; optional Loop. Titel als Overlay *außerhalb* des Sheets.
- Zweck laut Nutzer: die Story als Sequenz nachvollziehen, Brüche/Lücken früh sehen. Kein Export nötig – reine Review-Hilfe vor `dir`.

---

## 5. Durchgängige Bedienhilfe (global, jedes Element)
- **Fortschrittsleiste** oben: „Schritt X von 7“, anklickbar (nur abgeschlossene/erreichbare Schritte), mit Häkchen für erledigt.
- **„?“-Hilfe an jedem Bedienelement:** kurzer Tooltip/Popover. Modelle haben heute schon `title`-Tooltips aus `BESTAT` — dieses Muster auf alle Felder ausweiten (Stil, DNA, Format, Marke, Engine).
- **Onboarding-Overlay beim ersten Besuch:** 3 Karten — „Was ist Prompto85?“, „Geführt vs. Profi“, „Los geht’s mit deinem Foto“. Danach ausblendbar (Flag im Server-State, analog `tree_save`).
- **Leerzustände erklären** statt leer zu sein (bestehende `.empty`/`.small`-Hinweise konsequent in jedem Tab).
- **Fehlertexte bleiben konkret** (bestehende `x-err` + `backendHint`), aber mit nächstem Handgriff.
- **Sanfte Regel-Hinweise inline** (aus dem Erkenntnis-Log), z. B. an der Sheet-Upload-Zone: „Kein Text/keine Zahlen im Sheet – wird sonst mitanimiert (§13).“ An der Figur: „Eine Figur pro Sheet (§16).“

---

## 6. Bedienhilfe-Text (Nutzerhandbuch — 1:1 für ein Hilfe-Panel)
> Freundlich, knapp, in Du-Form. Kann als ausklappbares „Hilfe“-Panel oder eigener Tab eingebunden werden.

**Willkommen bei Prompto85.** Prompto verwandelt deine Idee in fertige, modellgerechte Prompts für KI-Bild- und -Videomodelle – und denkt die Regie für dich mit. Du arbeitest in zwei Modi: **Geführt** nimmt dich Schritt für Schritt an die Hand, **Profi** lässt dich frei zwischen allen Werkzeugen springen.

**Der schnellste Weg (Geführt):**
1. **Foto hochladen** – von dir oder der Person, die zur Figur werden soll.
2. **Stil wählen** – aus der Liste, dem Bild-Picker, eigenem Token-Block, oder mit KI-Beratung.
3. **Charactersheet-Prompt holen** – kopieren, auf deiner Bild-Plattform mit dem Foto erstellen.
4. **Sheet hochladen** – die KI erkennt die Figur, vergibt DNA und gibt dir Tipps.
5. **Besetzung prüfen** – fehlt jemand, legst du die nächste Figur an; sonst weiter.
6. **Story entwickeln** – gemeinsam mit dem Storywriter; er zerlegt die fertige Story in Szenen samt Storyboard-Prompts.
7. **Storyboards + Daumenkino** – Sheets erstellen, hochladen, als Sequenz durchlaufen lassen.

**Danach:** in **Regie & Cut** wählst du, wie animiert wird – NATIVE (ganzes Sheet als Sequenz) oder CUT (Panel für Panel) – und lädst die fertigen Pakete als ZIP herunter.

**Gut zu wissen:**
- Der **Stil** bleibt bewusst konstant; willst du einen neuen, sag es ausdrücklich.
- **Kein Text in den Storyboard-Panels** – Buchstaben/Zahlen werden vom Videomodell mitanimiert.
- **Eine Figur pro Charactersheet** bringt die beste Gesichtstreue.
- Jedes Panel soll ein **Standbild** sein; Bewegung kommt erst im Video-Prompt.
- Stimmt das Backend nicht (`api.php`), erscheint oben ein Hinweis mit Soforthilfe.

---

## 7. Build-Tickets (gegen die reale `index.html`)
| # | Ticket | Berührt |
|---|---|---|
| G1 | Geführt/Profi-Umschalter + 7-Schritt-Fortschrittsleiste als Orchestrierungs-Schicht über `render()` | neuer `GUIDE`-State, `nav` |
| G2 | Referenzfoto-Upload (2. Drop-Zone) im Cast | `viewChar`/`wireChar`, `S.cast.pending` |
| G3 | `genSheet` + `SYS_SHEET` nutzen das Referenzfoto (Vision) + „So erstellst du es“-Box | `genSheet`, `SYS_SHEET` |
| G4 | Sheet-QA-Pass mit Tipps (`SYS_SHEET_QA`) beim Upload | `addActors`, `viewChar` |
| G5 | Schritt-5-Gate: Besetzungs-Checkliste + Verzweigung | `viewChar` |
| G6 | Storywriter-Modul (`SYS_STORYWRITER`) → Szenen + Sheet-Prompts, Übergabe an Story-Baum/Regie | neuer View + `addNode` |
| G7 | Daumenkino-Viewer (Play/Scrub/Tempo) | neuer View, `S.flip` |
| G8 | Inline-Hilfe überall: Tooltips, Leerzustände, Onboarding-Overlay, Regel-Hinweise | global |
| G9 | Validierung vor Deploy: `node --check` auf das Inline-Script, dann File-Browser-Upload (OPERATIONS §2/§6) | Deploy |

Reihenfolge-Empfehlung: **G1 → G2/G3/G4 (Cast-Reise) → G5 → G6 → G7 → G8.** Jedes Ticket einzeln bauen, `node`-prüfen, hochladen, testen — kein Big-Bang.

---

## 8. Verbesserung bestehender Elemente (Quick-Wins parallel)
- **Story-Baum:** als visuelle Heimat von Schritt 6 nutzen; „Nächste Beats vorschlagen“ ist schon der Storywriter-Kern.
- **Storyboard-Tab:** Hinweis ergänzen, dass der Sheet-Prompt regelkonform (kein Text, Still-Image) ist; NATIVE/CUT-Vorschau verlinken.
- **Cast:** klare Trennung Referenzfoto ↔ fertiges Sheet; Tipps-Box; „eine Figur pro Sheet“ inline.
- **Regie & Cut:** NATIVE/CUT-Umschalter explizit (steht schon als P1-Ticket im Umbauplan).
- **Agent:** als „Mit KI beraten“-Ziel aus Schritt 2 und als Story-Partner in Schritt 6 doppelt nutzen.
