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
2. **Style** → Dropdown + visueller Picker + Custom; Default = zuletzt genutzter Style.
3. **Cast/Charaktere** → DNA sperren, Sheets als Referenz (Nano Banana Pro).
4. **Story-Baum** → Beats verzweigen, pro Beat optional Sheet.
5. **Regie & Cut** → Auto-Routing pro Clip, Schnitt-Logik abgeleitet, >15 s Auto-Split, ANSCHLUSS-Frames.
6. **Export** → ZIPs (gelabelte PNGs + prompt_*.txt + adcopy).

Tree serverseitig persistent → jederzeit zurückspringen ohne Datenverlust.

---

## 3. Auto-Routing (aus 01-modell-uebersicht abgeleitet)
- Text/Titel im Bild → **GPT Image 2**
- Mehrere konsistente Figuren / Storyboard → **Nano Banana Pro**
- Deutscher Voice im Clip → **HappyHorse 1.0**
- Viele Referenzen → **Seedance 2.0**
- Jeden Cut selbst setzen → **Kling 3.0 Omni**
- Übergang zwischen zwei Sheets → **Kling 3.0** (First/Last-Frame)
- Länger als 15 s → **Veo 3.1** (Scene Extension)
- Iterieren/Moodboard → **Gemini Omni Flash**

Je Vorschlag ein „Warum?“-Tooltip.

---

## 4. Guardrails (Fallstricke automatisch abfangen)
| Fallstrick | Prompto fängt es ab durch … |
|---|---|
| Seedance NSFW (viele Gesichter) | Preflight-Hinweis: 1×N-Layout, weite Shots, dicke Ränder |
| Clip > 15 s | Auto-Split in ~12-s-Sub-Clips + ANSCHLUSS-Frames |
| Schnitt falsch fürs Modell | native vs. cut automatisch |
| Bild > 10 MB | fitImage-Downscale (1568 px) |
| api.php 404 → „Unexpected token <“ | Health-Check beim Laden + Upload-Anleitung |
| Übergänge gehetzt | Default 4 s eased, First/Last aus Nachbar-Sheets |
| Audio chaotisch | ElevenLabs = Stimme/SFX, Modell = nur Ambient |
| Charakter-Drift | Locked-Tokens in jeden Prompt injiziert |
| Style-Bruch | letzter Style bleibt Default |

Guardrails sind **Hinweise, keine Sperren** („Trotzdem so“).

---

## 5. Roadmap-Stand
### P0 — ERLEDIGT
- api.php Health-Check + Frontend-Banner ✓
- Auto-Routing-Legende + „Warum?“-Tooltips (routingBox/BESTAT) ✓
- Seedance-Preflight-Hinweis ✓
- Styleliste 15→38 + visueller Style-Picker ✓

### P1
- Assistiert/Profi-Toggle überall.
- HappyHorse + Veo 3.1 + Gemini Omni voll durchverdrahten.
- Agent triggert Plan auf Bestätigung.
- **Cast Room** ✓ (siehe OPERATIONS.md §5).

### P2
- Auto-Multi-Charakter-Konsistenz über Clips.
- Freihand-/Marker-Crop für Frames.
- Nano-Banana-/Gemini-Bildgen direkt in api.php.
- Übergangs-Generator als eigener Tab.

---

## 6. Erfolgskriterium
Neuling kommt ohne Vorwissen mit Default-Klicks zu einem brauchbaren Clip; Profi kann jeden Schritt überschreiben. Balance: sicher an die Hand genommen, volle Kontrolle.
