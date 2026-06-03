# Prompto85 — Umbauplan & UX-Konzept
**Stand: Juni 2026 · Leitziel: den Nutzer sicher zum Endprodukt führen — bei maximaler Kontrolle.**

> Ehrlicher Rahmen: strukturierte Empfehlung, kein Teamprotokoll. Drei Perspektiven (Kreativ/Frontend/Backend) in einem Plan gebündelt.

---

## 1. Leitprinzip: „Geführt, aber nie eingesperrt“
- **Assistierter Modus (Default):** Prompto schlägt bei jedem Schritt das Beste vor; ein Klick übernimmt.
- **Profi-Modus:** alle Vorschläge sichtbar, jedes Feld frei editierbar.
- **Goldene Regel:** jeder Vorschlag hat **[Übernehmen] · [Selbst anpassen] · [Überspringen]**.

---

## 2. Geführter Fluss (Wizard mit Notausgängen)
1. **Idee/Handlung** → Freitext, max. 1–2 Rückfragen.
2. **Style** → Dropdown + visueller Picker + Custom; Default = zuletzt genutzter Style. **Achtung:** bei explizitem „neuer Stil“-Wunsch den letzten Look NICHT übertragen (Lektion Projekt 2).
3. **Cast/Charaktere** → DNA sperren; **ein Sheet pro Identitätsfigur** (§16), Statisten/Props aufs Roster; **Costume-/State-Lock** pro Figur (Kopf-bis-Fuß) definieren (§19). Sheets als Referenz.
4. **Story-Baum** → Beats verzweigen; **Szenentyp-Template wählen** (§5); pro Panel **Still-Image-Check** — Bewegungs-/Zeitverben automatisch ins sichtbare Äquivalent übersetzen (§18); pro Beat optional Sheet.
5. **Regie & Cut** → **Pipeline-Modus NATIVE vs CUT wählen** (§20); Auto-Routing pro Clip, Schnitt-Logik abgeleitet, >15 s Auto-Split, ANSCHLUSS-Frames, Orientierungs-Check (§17).
6. **Export** → ZIPs (gelabelte PNGs + prompt_*.txt + adcopy).

Tree serverseitig persistent → jederzeit zurückspringen ohne Datenverlust.

---

## 3. Auto-Routing (aus 01-modell-uebersicht abgeleitet)
- Text/Titel im Bild → **GPT Image 2** (auch: photoreal-nah / refraktiv / dramatisch belichtete Sheets, §14)
- Mehrere konsistente Figuren / flach-illustrativ → **Nano Banana Pro**
- Deutscher Voice im Clip → **HappyHorse 1.0**
- Viele Referenzen / Sequenz aus Sheet → **Seedance 2.0** (Omni, bis 9 Refs, §15)
- Jeden Cut selbst setzen → **Kling 3.0 Omni**
- Übergang zwischen zwei Sheets → **Kling 3.0** (First/Last-Frame)
- Länger als 15 s / große Maßstabs-Fahrten → **Veo 3.1** (Scene Extension)
- Iterieren/Moodboard → **Gemini Omni Flash**

**Pipeline-Modus bestimmt Schnitt + Captions (§20):** NATIVE (ganzes Sheet → eine Sequenz, Default) · CUT (Panel-für-Panel einzeln animieren). Je Vorschlag ein „Warum?“-Tooltip.

---

## 4. Guardrails (Fallstricke automatisch abfangen)
| Fallstrick | Prompto fängt es ab durch … |
|---|---|
| Seedance NSFW (viele Gesichter) | Preflight-Hinweis: 1×N-Layout, weite Shots, dicke Ränder |
| Clip > 15 s | Auto-Split in ~12-s-Sub-Clips + ANSCHLUSS-Frames |
| Schnitt falsch fürs Modell | NATIVE vs. CUT automatisch/wählbar (§20) |
| Grid wird als ein Bild animiert | Anti-Grid-Klausel: „jedes Panel = ein Shot“, zeitcodierte Shot-Liste (§15) |
| Text im Sheet wird mitanimiert | No-Text-Erzwingung im NATIVE-Modus; Captions nur im CUT-Modus (§13/§20) |
| Panel nicht als Standbild renderbar | Still-Image-Linter: Bewegungsverben markieren + ins sichtbare Äquivalent übersetzen (§18) |
| Detail driftet zwischen Panels (Kleidung/Anhänger/Maske/Naht-Seite) | State-Lock injiziert + Restate pro Panel UND pro Video-Prompt (§19) |
| Panel-Orientierung ≠ Zielformat | Orientierungs-Check: Panels in finaler Video-Orientierung rendern (§17) |
| Bild > 10 MB | fitImage-Downscale (1568 px) |
| api.php 404 → „Unexpected token <“ | Health-Check beim Laden + Upload-Anleitung |
| Übergänge gehetzt | Default 4 s eased, First/Last aus Nachbar-Sheets |
| Audio chaotisch | ElevenLabs = Stimme/SFX, Modell = nur Ambient; Clip-Endtag „ambient only, no music, no subtitles“ |
| Charakter-Drift | Locked-Tokens + Costume-/State-Lock in jeden Prompt injiziert |
| Style-Bruch | letzter Style bleibt Default (außer „neuer Stil“) |

Guardrails sind **Hinweise, keine Sperren** („Trotzdem so“).

---

## 5. Szenentyp-Panel-Templates
Wiederverwendbare Beat-Gerüste fürs Storyboard (aus „ai-video-prompt-writer“-Skill + eigene). Template auf die Sheet-Kapazität mappen: NATIVE = 6 Panels (2×3) pro Sheet, CUT = bis 12 (4×3).
- **Action / Konfrontation:** Wide Establishing → Auftritte → Reaktions-Close-ups → Aufbau → Kollision → Kampf → Schaden-Insert → finaler Schlag → Niederlage → Hero-Ende.
- **Emotional / Drama:** Establishing → Auftritt → Vorbereitung → Beginn → Eskalation → psychologischer Moment → Wide → surrealer Beat → introspektiver Close → Bruch → Konfrontation → ruhige Auflösung.
- **Day-in-Life / Commercial:** Aufwachen → Routine → Produkt-Close → Nutzung → Aufbruch → Aktivität → sozialer Moment → Mittags-Energie → Spaziergang → Heimkehr → Abendroutine → Schlussbild mit Produkt.
- **Fashion / Red Carpet:** Getting-Ready → Spiegel → Outfit-Detail → Reveal → Aufbruch → Ankunft → Entrance-Walk → Event-Wide → Interaktion → Fotografen-Moment → Porträt → Brand-Shot.
- **Mystery (Drei ??? / TKKG-Niveau)** *(eigen):* Fall/Haken → Spur → Verdächtiger/falsche Fährte → Twist → rationale Auflösung → offene Mitmach-Frage. *(Projekt „Stay Curious“.)*
- **Doku-Walkthrough (ARTE/CERN)** *(eigen):* Cold-Open-Detail → Maßstab-Reveal → Akteure → Funktion/Kreislauf → Hallen in Bewegung → großer Pull-Back = das lebendige Ganze. *(Projekt „Anima Machina“.)*

---

## 6. Roadmap-Stand
### P0 — ERLEDIGT
- api.php Health-Check + Frontend-Banner ✓
- Auto-Routing-Legende + „Warum?“-Tooltips (routingBox/BESTAT) ✓
- Seedance-Preflight-Hinweis ✓
- Styleliste 15→**40** + visueller Style-Picker ✓ (zuletzt +Aurora Glass, +Anima Machina)

### P1
- Assistiert/Profi-Toggle überall.
- HappyHorse + Veo 3.1 + Gemini Omni voll durchverdrahten.
- Agent triggert Plan auf Bestätigung.
- **Cast Room** ✓ (siehe OPERATIONS.md §5).
- **NEU:** Pipeline-Modus-Toggle (NATIVE/CUT) im Regie-Schritt (§20).
- **NEU:** Still-Image-Linter — markiert Zeit-/Bewegungsverben in Panels + schlägt sichtbares Äquivalent vor (§18).
- **NEU:** Costume-/State-Lock-Injektor — Lock-Absatz pro Figur, Restate in jedes Panel + jeden Video-Prompt (§19).
- **NEU:** Szenentyp-Template-Picker (§5).

### P2
- Auto-Multi-Charakter-Konsistenz über Clips.
- Freihand-/Marker-Crop für Frames (auch: Caption-Strip im CUT-Modus automatisch wegcroppen, §20).
- Nano-Banana-/Gemini-Bildgen direkt in api.php.
- Übergangs-Generator als eigener Tab.

---

## 7. Erfolgskriterium
Neuling kommt ohne Vorwissen mit Default-Klicks zu einem brauchbaren Clip; Profi kann jeden Schritt überschreiben. Balance: sicher an die Hand genommen, volle Kontrolle.
