# Prompto85 — OPERATIONS (Deploy, Server, Cast Room)
**Stand: Juni 2026 · die operativen Lektionen, die sonst nirgends stehen.**

Dieses Dokument schließt die Lücke, die `index.html` allein nicht abdeckt: **wie deployt man, was sind die Server-Eigenheiten, und wie funktioniert das Cast-Room-Feature intern.** Eine frische Session sollte das hier zuerst lesen, bevor sie an Deploy oder Cast geht.

---

## 1. Architektur in einem Satz
Statisches Frontend (`index.html`, reines HTML/CSS/JS, keine Build-Pipeline) + PHP-Proxy (`api.php`), der API-Keys aus `~/.env` **außerhalb des Webroots** liest und an Anthropic (Default) bzw. OpenAI (`action:"image"`) weiterreicht. Persistenz (Story-Baum + Cast) über `api.php` `tree_save`/`tree_load` als serverseitige JSON-Dateien in `prompto/data/` (per `.htaccess` web-gesperrt).

- `index.html` ist die **Single Source of Truth** der App-Logik (Routing, Prompt-System, Cast).
- `api.php` ist bewusst dünn. Keys NIE im Code, immer aus `~/.env`.

---

## 2. Server & Deploy (Hostinger)
- **Host:** Hostinger Shared Hosting. Webroot der App: `~/domains/chazon.eu/public_html/prompto/`.
- **Datei muss `index.html` heißen.** Cache-Bust nach Deploy über `chazon.eu/prompto/?v=N` (N hochzählen).
- **Hochladen NUR über den Hostinger File Browser (Upload-Knopf).** Adresse z. B. `srv1813-files.hstgr.io`.

### ⚠️ DIE wichtigste Deploy-Lektion (teuer gelernt)
**`scp` aus Termux lädt Dateien mit nicht-web-lesbaren Rechten hoch → 403 Forbidden.** Der File-Browser-Upload schreibt korrekte Web-Rechte. **Immer per File Browser hochladen, nie per scp**, sonst sind Bilder/Assets nach dem Upload mit 403 tot.

### SSH
- **Passwort-SSH ist deaktiviert** (`Permission denied (publickey,password)`), auch bei korrektem Passwort. Heißt: **man kann NICHT per SSH `chmod` machen.** Alle Rechte-Korrekturen laufen über den File-Browser-Permissions-Dialog (Schloss-Icon).

### Datei-/Ordnerrechte (Web)
- Ordner brauchen **755** (`drwxr-xr-x`) — „Others“ braucht **Read UND Execute**, sonst darf der Webserver den Ordner nicht betreten → 403.
- Dateien brauchen **644** (`rw-r--r--`) — „Others“ braucht **Read**.
- `data/` ist bewusst **700** (`drwx------`) und zusätzlich per `.htaccess` (`Require all denied`) gesperrt — niemand soll von außen ran, `api.php` liest/schreibt serverseitig.

---

## 3. Debug-Leiter bei 403 / „Bild lädt nicht“ (in dieser Reihenfolge)
1. **Datei wirklich da?** Im File Browser prüfen (Vorschau sichtbar = da).
2. **Rechte?** Ordner 755, Datei 644 (Others-Read, bei Ordnern auch Others-Execute).
3. **Isolierender Test:** `chazon.eu/prompto/api.php?health=1` öffnen → kommt `{"ok":true,"service":"prompto85"}`, dann liefert der Server aus `prompto/` aus und es ist NICHT die ganze Domain/kein `.htaccess`-Problem auf Projektebene.
4. **Eigene `.htaccess` als Störer?** Eine ins Verzeichnis gelegte `.htaccess` mit `Options ...`/`Require ...` kann auf Shared Hosting (eingeschränktes `AllowOverride`) den ganzen Ordner mit 403/500 sperren. Im Zweifel **löschen** — bei korrekten Rechten brauchen Bilder keine `.htaccess`.
5. **Hotlink-Schutz** (hPanel → Website → Erweitert → Hotlink-Schutz): War in unserem Fall **nicht** die Ursache (nichts gesperrt), aber als Verdächtiger abzuhaken. Falls aktiv: Haken „Erlauben Sie direkte Anfragen“ prüfen.
6. **Der eigentliche Fix (siehe §2):** betroffene Dateien **per File Browser neu hochladen** (nicht scp). Ein manuell hochgeladenes Test-Bild lädt sofort → beweist, dass die scp-Rechte das Problem waren.

> **Diagnose-Mantra:** Statt blind Schritte abzufeuern — fragen „**Was ist an diesem Projekt anders als an den funktionierenden?**“. Hier war die Antwort: die Bilder kamen per scp statt per File Browser rein.

---

## 4. Achtung: Identitätswechselmodus
Das hPanel war zeitweise im **„Identitätswechselmodus“ für `kontakt@lanalutz.de`** (Lanas Konto). Vor Einstellungs-Änderungen prüfen, ob man im richtigen Konto ist (Banner oben). chazon.eu kann auf diesem Konto liegen — wenn gewollt, ok; sonst oben „Verlassen“.

---

## 5. Cast Room — Feature-Doku (interne Funktionsweise)
Der „Cast“-Tab (früher „Charaktere“) sammelt Schauspieler und speist sie ins Storyboard.

### Datenmodell (`S.cast`)
```
S.cast = { actors:[], history:[], advice:null }
actor  = { id, name, dna, thumb(512px dataURL), role, selected }
history-Eintrag = { ts, title, present:[Name,...] }   // Szenen-Tracking
advice = { staging_de, continuity_de, enter[], stay[], exit[], cast_prompt_en, present[] }
```

### Persistenz
Über den vorhandenen Mechanismus: `api.php` `tree_save`/`tree_load` mit **ID `cast_<treeId>`** (Default: `cast_default`). Kein Backend-Eingriff nötig — `tree_*` speichert beliebiges JSON unter `data/tree_<id>.json`. Debounced Save (`castSave`, 800 ms), Load beim Init (`castLoad`).

### Ablauf
1. **Multi-Upload** (`addActors`): mehrere Charactersheets gleichzeitig → je Datei ein 512px-Thumb + Vision-Call (`SYS_CHAR`) zieht **Name + DNA** automatisch.
2. **Besetzung:** `selected`-Toggle pro Actor. Nur `selected` = aktive Besetzung → fließt ins Storyboard. Rest bleibt Pool.
3. **Casting-Regie** (`castDirector` + `SYS_CAST`): nimmt aktive Besetzung + Stil/Umgebung + Storyline + `lastPresent()` → liefert Staging, Kontinuität (enter/stay/exit) und einen fertigen `@Name`-getaggten `cast_prompt_en`.
4. **Plan-Einspeisung** (`plan()`): aktive Besetzung wird als `CAST`-Block (`@Name — DNA`, byte-identisch, Seedance/Kling-`@asset`-Syntax) + `PREVIOUS SCENE PRESENT` + `CASTING DIRECTION` in den Regie-Prompt injiziert. SYS_PLAN gibt pro Clip `cast_present:[Name,...]` zurück.
5. **Szenen-Tracking** (`recordScene`): nach jedem Plan wird die Union der `cast_present` über alle Clips als History-Eintrag gespeichert (Cap 40). Jeder Actor zeigt „in Szenen: N“; Szenen-Log unten.

### Helfer
`activeActors()`, `lastPresent()`, `castTag(name)` (=`@`+Name ohne Spaces), `castBlock()` (aktive Actor als `@Name — DNA` Liste).

---

## 6. JS-Validierung vor jedem Deploy
`index.html` hat keinen Build. Vor dem Hochladen: größten `<script>`-Block extrahieren und `node --check` laufen lassen.
```bash
python3 -c "import re;h=open('index.html').read();b=re.findall(r'<script\\b[^>]*>(.*?)</script>',h,re.S);open('/tmp/c.js','w').write(max(b,key=len))"
node --check /tmp/c.js && echo OK
```

---

## 7. Was wo lebt (Wissens-Landkarte)
- **App-Logik** (Routing, Prompt-System, Cast): `index.html`.
- **Modell-Fakten & Routing-Begründung:** `docs/01-modell-uebersicht.md` (Stand Juni 2026 — Modelle ändern sich wöchentlich, vor Produktion gegenchecken).
- **Gelernte technische Lektionen (inhaltlich):** `docs/02-erkenntnis-log.md`.
- **Styleliste:** `docs/03-video-styleliste.md`.
- **UX-/Umbaukonzept & Roadmap:** `docs/04-umbauplan-prompto.md`.
- **Deploy/Server/Cast (operativ):** dieses Dokument.
