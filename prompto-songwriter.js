/* Prompto85 — Therapeutisches Songwriting (Add-on)
 * Eigenstaendiges Modul wie prompto-guided.js: neuer Tab, spricht die App nur ueber das DOM/globale Funktionen an,
 * veraendert die bestehende Logik nicht. Eigenes IIFE -> ein Fehler hier kann index.html nicht brechen.
 * Flow: Begruessung+Richtung -> Material (Upload ODER begleitetes Gespraech) + MATERIALBEWERTUNG (Fuellstand %) ->
 *       Themen -> Gestaltung -> Co-Writing Songtext (Lektor + Wortlaut-Treue + Freigabe-Gate) -> Suno-Prompts.
 * Einbau: <script src="prompto-songwriter.js"></script> direkt vor </body> in index.html.
 * Haltung: kreativer Begleiter, KEIN Therapieersatz. Bei Krise behutsam zu echter Hilfe leiten.
 * v5: Begleitetes Gespraech (SW_TALK = einfuehlsamer Gespraechsbegleiter, der Gefuehle greifbar macht:
 *     Gefuehl -> Bild/Szene -> Klang/Stimmung -> Worte; SW_HARVEST erntet das Gespraech als Material).
 *     Krisen-Waechter: bei Suizid/Krise verlaesst der Begleiter den Sammelmodus und leitet zu echter Hilfe.
 * v5.1: Gespraechs-Einstieg sichtbar in Schritt 1 (Knopf "Lieber reden?"), Step-2-Karten hervorgehoben.
 */
(function(){
"use strict";
if(window.__promptoSong)return; window.__promptoSong=true;

/* ===== Helfer ===== */
function api(body){return fetch("./api.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});});}
function claude(messages,system,max){var eng=(window.S&&window.S.engine)||"claude-sonnet-4-6";return api({model:eng,max_tokens:max||3000,system:system,messages:messages}).then(function(res){var d=res.d;if(d&&d.error)throw new Error((d.error&&(d.error.message||d.error))||"API");if(!res.ok)throw new Error("HTTP");return ((d&&d.content)||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("\n");});}
function parseJSON(t){t=(t||"").replace(/```json|```/g,"").trim();var a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0)t=t.slice(a,b+1);return JSON.parse(t);}
function imgBlock(dataUrl){var m=(dataUrl||"").match(/^data:(image\/\w+);base64,(.+)$/);return m?{type:"image",source:{type:"base64",media_type:m[1],data:m[2]}}:null;}
function fitImage(dataUrl,maxEdge){return new Promise(function(res){var im=new Image();im.onload=function(){var w=im.width,h=im.height,s=Math.min(1,(maxEdge||1568)/Math.max(w,h));var cv=document.createElement("canvas");cv.width=Math.round(w*s);cv.height=Math.round(h*s);cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL("image/jpeg",0.85));};im.onerror=function(){res(dataUrl);};im.src=dataUrl;});}
function readDataURL(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result);};r.onerror=rej;r.readAsDataURL(file);});}
function readText(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result);};r.onerror=rej;r.readAsText(file);});}
function esc(s){return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function $id(id){return document.getElementById(id);}
function isTextFile(f){return (f.type&&f.type.indexOf("text/")===0)||/\.(txt|md|markdown|csv|json|srt|rtf|log|lrc)$/i.test(f.name||"");}
/* Auto-Resize: Textfeld waechst mit dem Inhalt, nichts wird abgeschnitten */
function autoGrow(ta){if(!ta)return;ta.style.height="auto";ta.style.height=(ta.scrollHeight+4)+"px";}
function wireGrow(scope){(scope||document).querySelectorAll(".sw-grow").forEach(function(ta){autoGrow(ta);ta.addEventListener("input",function(){autoGrow(ta);});});}

/* ===== Persona + System-Prompts ===== */
var P="You are the PROMPTO85 Songwriting Companion \u2014 a warm, gentle, emotionally intelligent co-writer for therapeutic songwriting. You help the user turn what moves them into a song. Be supportive and validating WITHOUT amplifying distress. You are NOT a therapist and do not diagnose; this is creative self-expression, not treatment. If the user expresses crisis, self-harm or suicidal thoughts, respond with genuine warmth, gently encourage them to reach out to someone they trust or professional support, and do NOT produce content that details or glorifies self-harm. Reply in GERMAN unless the user's material is clearly in another language. Keep a calm, caring, encouraging tone.";

/* Begleitetes Gespraech: einfuehlsamer Begleiter, der Gefuehle greifbar macht und in Worte/Bilder/Klang uebersetzt */
var SW_TALK=P+" You are now leading a GENTLE, GUIDED CONVERSATION to help a user who may NOT yet have the words for what moves them. You are a warm, trained-feeling companion (NOT a therapist, NOT a diagnosis) skilled at making a person's emotional world tangible and translating a feeling or sensation into images, sound and finally words that could become a song. METHOD, move forward step by step, ONE gentle question at a time: (1) help them name or circle the FEELING/sensation (where do they feel it, what is it like); (2) turn it into a concrete IMAGE, memory or scene (a place, a person, an object, a moment); (3) sense its SOUND/atmosphere (loud/quiet, fast/slow, which instrument or weather it feels like); (4) gather the user's OWN WORDS \u2014 short phrases they actually say, which can become lyric lines. Mirror back what you hear in their own words so they feel understood. Keep each reply short (2-5 sentences), one question at a time, never interrogate. Never rush to a song. SAFETY: if the user expresses crisis, self-harm or suicidal thoughts, STOP gathering material, respond with genuine warmth and gently guide them toward a trusted person or professional/crisis support; do not produce self-harm content. When you sense there is enough to work with, you may gently say so. Reply in GERMAN unless the user clearly uses another language. Output PLAIN conversational text only (no JSON, no lists unless natural).";

/* Ernte: macht aus dem Gespraech verwertbares Material im Wortlaut des Nutzers */
var SW_HARVEST=P+" Read the CONVERSATION between the companion and the user. Distil it into raw SONG MATERIAL that stays faithful to the USER'S OWN WORDS. Capture the feelings, the concrete images/scenes, the atmosphere/sound, and especially short phrases the user actually said that could become lyric lines (quote them verbatim). Do NOT invent new facts; only organise what is really there. Return ONLY JSON: {\"summary_de\":\"2-4 Saetze warme Zusammenfassung dessen, was im Gespraech lebendig wurde, nah am Wortlaut\",\"user_phrases\":[\"woertliches Zitat 1\",\"woertliches Zitat 2\"],\"images_de\":[\"konkretes Bild/Szene 1\",\"...\"],\"feelings_de\":[\"Gefuehl 1\",\"...\"],\"themes\":[{\"title_de\":\"Themen-Titel\",\"note_de\":\"1 Satz\"}]}";

/* Strenge Lyrik-Qualitaetsregeln */
var QUAL="STRICT LYRIC QUALITY RULES (the text must obey ALL of these): "+
"1) NO clumsy word repetition: never repeat the same distinctive word within ~2 lines (e.g. avoid using \"Leere\" twice, \"ganzer\u2014ganzer\u2014ganz\", \"das wei\u00df ich, das wei\u00df ich\", \"bricht durch\u2026bricht durch\"). Deliberate refrain repetition and a chosen hook are allowed; lazy echoing is not. "+
"2) NO forced or filler rhymes: never bend grammar or meaning just to make a rhyme; a slightly imperfect rhyme is better than a nonsensical line. Avoid pretentious filler words used only for rhyme (e.g. \"Aplomb\"). "+
"3) Every line must make literal and emotional SENSE; no broken images, no mixed metaphors that collapse, no lines that only sound deep but mean nothing. "+
"4) AVOID clich\u00e9s and empty phrases (\"mitten im Licht\", \"bricht durch jeden Schatten\") unless given concrete, fresh, personal grounding. "+
"5) SINGABLE: natural German stress, consistent line length per section, easy to sing, no tongue-twister consonant clusters. "+
"6) Keep imagery concrete and personal over abstract sloganeering. Prefer plain honest language to grandiosity.";

/* Wortlaut-Treue: jeder Vers soll das vorgegebene Material im genauen Wortlaut repraesentieren */
var FIDELITY="MATERIAL FIDELITY (very important): The user's own MATERIAL (direction text, uploaded texts, conversation phrases, the theme notes) is the heart of the song. Build the lyrics DIRECTLY from the user's own words and images. Where the user gave concrete wording, KEEP that wording verbatim inside the lines wherever it sings well, rather than paraphrasing it away. Each verse should map onto real material the user provided. Invent as little as possible \u2014 only add connective tissue where unavoidable, and keep any pure invention minimal and clearly in the user's spirit.";

var SW_THEMES=P+" From the user's DIRECTION and any ASSETS (texts/images), sensitively surface the emotional THEMES that could become a song. Return ONLY JSON: {\"reflection_de\":\"1-2 warme deutsche Saetze, was du heraushoerst\",\"themes\":[{\"title_de\":\"kurzer Themen-Titel\",\"note_de\":\"1 Satz worum es geht\"}]}";
var SW_SORT=P+" Given the THEMES with the user's own importance ratings, merge duplicates and sort by importance to the user (most important first). Keep the user's ratings. Return ONLY JSON: {\"themes\":[{\"title_de\":\"...\",\"note_de\":\"...\",\"importance\":\"hoch|mittel|niedrig\"}]}";

/* Materialbewertung: wieviel echtes Material ist da vs. wieviel muesste die KI erfinden? */
var SW_MATERIAL=P+" Assess how much REAL, usable raw material the user has provided (their DIRECTION text, uploaded ASSETS, conversation harvest, and THEMES) versus how much you would have to INVENT to write an honest, personal song that genuinely represents them. Think in terms of: concrete details, names, images, events, feelings in the user's own words. A song needs enough specific material so that each verse can be grounded in something real. Return ONLY JSON: {\"fill_percent\":N (0-100, share of the song that can be grounded in the user's OWN material; 100 = plenty, nothing needs inventing),\"verdict\":\"ausreichend|knapp|zu_wenig\",\"assessment_de\":\"2-3 warme deutsche Saetze: was schon trägt und was fehlt\",\"suggestions\":[{\"q_de\":\"konkrete Frage oder Anregung, die fehlendes Material liefern wuerde\",\"hint_de\":\"1 kurzer Beispiel-Hinweis\"}]}";

var SW_LYRICS=P+" Write a complete, singable SONG TEXT in the user's language from the prioritised THEMES and the DESIGN choices (genre, mood, key, time signature, tempo/feel, instruments, structure schema). Honor the structure schema with clear section headings (Intro/Strophe/Pre-Refrain/Refrain/Bridge/Outro ...). Make the chorus memorable and the verses concrete and personal; authentic, hopeful where it fits, never clinical. "+FIDELITY+" "+QUAL+" Return ONLY JSON: {\"title_de\":\"Songtitel\",\"lyrics_de\":\"vollstaendiger Songtext mit Abschnitts-Ueberschriften\",\"note_de\":\"1 warmer Satz\"}";
var SW_REFINE=P+" Revise the SONG TEXT according to the user's WISH. Keep what already works; change only what the wish asks for. "+FIDELITY+" "+QUAL+" Return ONLY JSON: {\"lyrics_de\":\"vollstaendiger ueberarbeiteter Songtext\"}";

var SW_EVAL=P+" You now act as a STRICT, honest LYRICS EDITOR (Lektor). Evaluate the SONG TEXT against the quality rules AND material fidelity, then PRODUCE A CORRECTED VERSION that fixes every defect while preserving the song's meaning, structure (keep the same section headings) and the user's intent. "+FIDELITY+" "+QUAL+" Be tough: a real defect list, not flattery. Score 1-10 where 10 = flawless, singable, no repetition or forced rhymes, every line meaningful and grounded in the user's material. Return ONLY JSON: {\"score\":N,\"issues_de\":[\"konkreter Mangel 1\",\"konkreter Mangel 2\"],\"summary_de\":\"1 Satz Gesamturteil\",\"lyrics_de\":\"vollstaendige KORRIGIERTE Fassung mit denselben Abschnitts-Ueberschriften\"}";

var SW_SECTION=P+" You are co-writing ONE SECTION of a song with the user. Given the FULL SONG (for context), the SECTION HEADING and its current TEXT, and an ACTION, rewrite ONLY that section. Keep it consistent with the rest of the song, the heading stays the same. ACTIONS: \"rewrite\"=fresh take, same meaning; \"imagery\"=more concrete vivid imagery, less abstraction; \"lessrhyme\"=loosen rhyme, prioritise meaning and natural speech; \"condense\"=tighten, remove filler, fewer/stronger lines; \"wish\"=follow the user's explicit wish text. "+FIDELITY+" "+QUAL+" Return ONLY JSON: {\"section_de\":\"nur der neue Abschnittstext OHNE Ueberschrift\"}";

var SW_SUNO=P+" Convert the final SONG TEXT into Suno format and write a Suno STYLE prompt. (1) suno_lyrics: take the user's lyrics and re-label every section with Suno meta tags in square brackets ([Intro],[Verse],[Pre-Chorus],[Chorus],[Bridge],[Outro],[Instrumental]) \u2014 keep the actual lyric lines, no commentary, no extra text. (2) suno_style: ONE concise comma-separated ENGLISH line for Suno's Style field, combining genre/sub-genre, mood, lead + backing instruments, tempo in BPM, time signature, key and vocal delivery. This is a VOCAL song \u2014 do NOT add 'no vocals'. Return ONLY JSON: {\"suno_lyrics\":\"...\",\"suno_style\":\"...\"}";

/* ===== Optionslisten (maximale Gestaltung) ===== */
var GENRES=["Singer-Songwriter","Pop-Ballade","Akustik / Folk","Indie-Pop","Soft Rock","Piano-Ballade","R&B / Soul","Gospel / Worship","Cinematic / Orchestral","Neo-Klassik","Lo-fi","Ambient","Electronic / Synth-Pop","Chanson","Schlager","Hip-Hop","Country","Rock"];
var KEYS=["egal","C-Dur","G-Dur","D-Dur","A-Dur","E-Dur","F-Dur","B-Dur","Es-Dur","As-Dur","a-Moll","e-Moll","h-Moll","d-Moll","g-Moll","c-Moll","f-Moll"];
var TIMESIGS=["4/4","3/4","6/8","2/4","12/8","5/4","7/8"];
var FEELS=["straight","swing","shuffle","half-time","treibend","rubato / frei"];
var MOODS=["hoffnungsvoll","melancholisch","tr\u00f6stend","kraftvoll","ruhig","sehns\u00fcchtig","befreiend","nachdenklich","dankbar","trauernd","mutig","zart"];
var INSTRUMENTS=["Akustikgitarre","E-Gitarre","Klavier","Streicher","Synth-Pad","Bass","Schlagzeug","Cajon","Cello","Geige","Ch\u00f6re","Harfe","Orgel","Bl\u00e4ser","Glockenspiel"];
var SCHEMAS=[
 {l:"Pop-Standard",v:"Intro \u00b7 Strophe \u00b7 Refrain \u00b7 Strophe \u00b7 Refrain \u00b7 Bridge \u00b7 Refrain \u00b7 Outro"},
 {l:"Ballade",v:"Intro \u00b7 Strophe \u00b7 Strophe \u00b7 Refrain \u00b7 Strophe \u00b7 Refrain \u00b7 Outro"},
 {l:"Build-Up",v:"Intro \u00b7 Strophe \u00b7 Pre-Refrain \u00b7 Refrain \u00b7 Strophe \u00b7 Pre-Refrain \u00b7 Refrain \u00b7 Bridge \u00b7 Doppel-Refrain"},
 {l:"Strophenlied",v:"Strophe \u00b7 Strophe \u00b7 Strophe (mit wiederkehrendem Kehrvers)"},
 {l:"Frei / eigenes",v:""}
];

/* ===== Zustand ===== */
function freshState(){return {step:1,direction:"",assets:[],themes:[],material:null,_reflection:"",
 talk:[],talkActive:false,
 design:{genre:GENRES[0],mood:[],key:"egal",timesig:"4/4",bpm:84,feel:"straight",instruments:[],schema:SCHEMAS[0].v,schemaCustom:"",instrCustom:""},
 title:"",lyrics:"",sections:[],eval:null,approved:false,suno_lyrics:"",suno_style:"",auto:false};}
var SW=freshState();
try{var s=localStorage.getItem("sw_step");if(s)SW.step=Math.min(6,Math.max(1,parseInt(s,10)||1));}catch(e){}

/* ===== Styles ===== */
function injectCSS(){
 if($id("swStyle"))return;var st=document.createElement("style");st.id="swStyle";
 st.textContent=[
 "#swLaunch{flex:0 0 auto;white-space:nowrap;border:none;background:linear-gradient(135deg,#7b61ff,#d65db1);color:#fff;font-weight:700;font-size:13px;padding:9px 14px;border-radius:9px;cursor:pointer;font-family:var(--body)}",
 ".sw-ov{position:fixed;inset:0;background:rgba(20,16,40,.55);z-index:10000;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:20px;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}",
 ".sw-ov.open{display:flex}",
 ".sw-box{background:#fff;max-width:860px;width:100%;border-radius:20px;padding:20px 22px 26px;box-shadow:0 24px 70px rgba(0,0,0,.3)}",
 "@media(max-width:680px){.sw-box{padding:16px 14px 22px;border-radius:16px}}",
 ".sw-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:4px}",
 ".sw-top-r{display:flex;align-items:center;gap:8px}",
 ".sw-reset{border:1px solid var(--line);background:#fff;border-radius:9px;height:38px;padding:0 12px;cursor:pointer;font-size:12.5px;font-family:var(--body);color:var(--sub);font-weight:600}",
 ".sw-reset:hover{background:#fdecec;border-color:#f3b4b4;color:#a11}",
 ".sw-x{border:none;background:#eee;border-radius:9px;width:38px;height:38px;cursor:pointer;font-size:17px}",
 ".sw-rail{display:flex;gap:5px;margin:10px 0 16px}",
 ".sw-seg{flex:1;height:6px;border-radius:99px;background:#e5e5ea}.sw-seg.done{background:#34c759}.sw-seg.cur{background:#7b61ff}",
 ".sw-help{background:#f4f1ff;border-radius:13px;padding:13px 15px;font-size:14px;line-height:1.6;margin-bottom:16px;color:#1d1d1f}",
 ".sw-h{font-size:18px;font-weight:800;margin:0 0 6px;letter-spacing:-.01em}",
 ".sw-foot{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}.sw-foot .btn{flex:1;min-height:48px;min-width:140px}",
 ".sw-field{display:block;margin-top:14px}.sw-field .tag{display:block;margin-bottom:7px}",
 ".sw-sel,.sw-ta,.sw-in{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 13px;font-family:var(--body);font-size:15px;background:#fff;color:var(--ink)}",
 ".sw-sel:focus,.sw-ta:focus,.sw-in:focus,.sw-sec-ta:focus{outline:none;border-color:#7b61ff;box-shadow:0 0 0 3px rgba(123,97,255,.16)}",
 ".sw-ta{min-height:80px;resize:vertical;line-height:1.55}",
 ".sw-lyrics{background:var(--soft);border-radius:12px;padding:14px;font-size:15px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:10px}",
 ".sw-theme{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid var(--line2);border-radius:13px;padding:13px;margin-top:10px}",
 ".sw-imp{display:flex;gap:6px}.sw-imp .chip{padding:8px 12px;font-size:12.5px;min-height:38px}",
 ".sw-asset{display:inline-flex;align-items:center;gap:7px;background:var(--soft);border-radius:10px;padding:9px 12px;font-size:13px;margin:7px 7px 0 0}",
 /* --- Schritt 1: Wahl reden/schreiben --- */
 ".sw-or{display:flex;align-items:center;gap:12px;margin:16px 0 4px;color:var(--sub);font-size:12.5px;font-weight:700;letter-spacing:.04em}",
 ".sw-or:before,.sw-or:after{content:'';flex:1;height:1px;background:var(--line2)}",
 ".sw-talk-cta{display:flex;gap:13px;align-items:center;width:100%;text-align:left;border:1.5px solid #d8ccff;background:linear-gradient(135deg,#faf7ff,#fff);border-radius:15px;padding:15px 16px;margin-top:6px;cursor:pointer;font-family:var(--body)}",
 ".sw-talk-cta:hover{border-color:#7b61ff;box-shadow:0 0 0 3px rgba(123,97,255,.12)}",
 ".sw-talk-cta .ic{font-size:24px;line-height:1}",
 ".sw-talk-cta b{display:block;font-size:15px;font-weight:800;color:#3a2a6b;margin-bottom:2px}",
 ".sw-talk-cta span.d{font-size:12.5px;color:var(--sub);line-height:1.45}",
 /* --- zwei Wege Karten in Schritt 2 --- */
 ".sw-ways{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}",
 "@media(max-width:560px){.sw-ways{grid-template-columns:1fr}}",
 ".sw-way{border:1px solid var(--line2);border-radius:14px;padding:15px;background:#fff}",
 ".sw-way.accent{border:1.5px solid #d8ccff;background:linear-gradient(135deg,#faf7ff,#fff)}",
 ".sw-way h4{margin:0 0 5px;font-size:14.5px;font-weight:800}",
 ".sw-way p{margin:0 0 11px;font-size:12.5px;color:var(--sub);line-height:1.5}",
 /* --- Gespraech (Chat) --- */
 ".sw-chat{display:flex;flex-direction:column;gap:10px;max-height:46vh;overflow:auto;padding:4px;margin-top:6px}",
 ".sw-msg{padding:11px 14px;border-radius:15px;font-size:14.5px;max-width:88%;white-space:pre-wrap;line-height:1.55}",
 ".sw-msg.a{align-self:flex-start;background:#f4f1ff;color:#1d1d1f;border-bottom-left-radius:5px}",
 ".sw-msg.u{align-self:flex-end;background:#7b61ff;color:#fff;border-bottom-right-radius:5px}",
 ".sw-chatbar{display:flex;gap:8px;margin-top:12px;align-items:stretch}",
 ".sw-chatbar textarea{flex:1;min-height:46px;max-height:140px}",
 ".sw-crisis{background:#fdecec;border:1px solid #f3b4b4;color:#7a1f1f;border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.6;margin-top:10px}",
 /* --- Materialbewertung / Fuellstand --- */
 ".sw-fill{border-radius:14px;padding:15px 16px;margin-top:14px;border:1px solid var(--line2)}",
 ".sw-fill.good{background:#eafaef;border-color:#b7e4c5}",
 ".sw-fill.mid{background:#fff6e6;border-color:#f0d9a8}",
 ".sw-fill.bad{background:#fdecec;border-color:#f3b4b4}",
 ".sw-fill-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}",
 ".sw-fill-pct{font-size:26px;font-weight:800;letter-spacing:-.02em}",
 ".sw-fill-lbl{font-size:13px;font-weight:700}",
 ".sw-bar{height:14px;border-radius:99px;background:rgba(0,0,0,.07);overflow:hidden}",
 ".sw-bar-fill{height:100%;border-radius:99px;transition:width .5s ease}",
 ".sw-fill.good .sw-bar-fill{background:linear-gradient(90deg,#34c759,#28a74a)}",
 ".sw-fill.mid .sw-bar-fill{background:linear-gradient(90deg,#f0b400,#e08e3c)}",
 ".sw-fill.bad .sw-bar-fill{background:linear-gradient(90deg,#ff8d70,#d70015)}",
 ".sw-fill-txt{font-size:13.5px;line-height:1.6;margin-top:10px}",
 ".sw-sugg{border:1px solid var(--line2);border-radius:12px;padding:12px 13px;margin-top:9px;background:#fff;cursor:pointer;display:flex;gap:10px;align-items:flex-start}",
 ".sw-sugg:hover{border-color:#7b61ff;box-shadow:0 0 0 3px rgba(123,97,255,.10)}",
 ".sw-sugg .plus{font-size:18px;color:#7b61ff;font-weight:800;line-height:1.3}",
 ".sw-sugg b{font-size:13.5px}.sw-sugg .hint{font-size:12px;color:var(--sub);margin-top:2px;line-height:1.45}",
 ".sw-addbox{margin-top:10px;display:flex;gap:8px;align-items:stretch}",
 /* --- Co-Writing Abschnittskarten --- */
 ".sw-secwrap{margin-top:6px}",
 ".sw-sec{position:relative;border:1px solid var(--line2);border-radius:14px;padding:14px 15px 13px;margin-top:14px;background:#fff;border-left:5px solid #c9c9d4}",
 ".sw-sec.is-chorus{background:#faf7ff;border-left-color:#7b61ff}",
 ".sw-sec.is-bridge{background:#fff9f3;border-left-color:#e08e3c}",
 ".sw-sec.is-intro,.sw-sec.is-outro{background:#f6f9fb;border-left-color:#5a9bd4}",
 ".sw-sec-h{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}",
 ".sw-sec-h b{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#3a2a6b}",
 ".sw-sec.is-bridge .sw-sec-h b{color:#9a5616}.sw-sec.is-intro .sw-sec-h b,.sw-sec.is-outro .sw-sec-h b{color:#2f6da3}.sw-sec:not(.is-chorus):not(.is-bridge):not(.is-intro):not(.is-outro) .sw-sec-h b{color:#444}",
 ".sw-sec-badge{font-size:10.5px;font-weight:700;color:#86868b;background:rgba(0,0,0,.04);border-radius:6px;padding:3px 7px;white-space:nowrap}",
 ".sw-sec-ta{width:100%;border:1px solid var(--line);border-radius:11px;padding:12px 13px;font-family:var(--body);font-size:15px;line-height:1.7;background:#fff;resize:none;overflow:hidden;display:block}",
 ".sw-acts{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}",
 ".sw-acts .chip{padding:9px 13px;font-size:12.5px;min-height:40px;display:inline-flex;align-items:center}",
 ".sw-toolbar{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.sw-toolbar .btn{flex:1;min-height:46px;min-width:150px}",
 ".sw-eval{border-radius:13px;padding:14px 16px;margin-top:14px;font-size:14px;line-height:1.6}",
 ".sw-eval.good{background:#eafaef;border:1px solid #b7e4c5}",
 ".sw-eval.mid{background:#fff6e6;border:1px solid #f0d9a8}",
 ".sw-eval.bad{background:#fdecec;border:1px solid #f3b4b4}",
 ".sw-score{font-weight:800;font-size:16px}",
 ".sw-eval ul{margin:9px 0 0;padding-left:20px}.sw-eval li{margin-bottom:4px}",
 ".sw-gate{display:flex;align-items:center;gap:9px;border-radius:12px;padding:12px 14px;margin-top:16px;font-size:13.5px;line-height:1.5;font-weight:600}",
 ".sw-gate.locked{background:#fff6e6;color:#8a5a12;border:1px solid #f0d9a8}",
 ".sw-gate.open{background:#eafaef;color:#1a7f37;border:1px solid #b7e4c5}",
 ".sw-hint{font-size:12.5px;color:var(--sub);margin-top:7px;line-height:1.5}",
 ".sw-auto{background:linear-gradient(135deg,#7b61ff,#d65db1)!important;color:#fff!important}",
 ".sw-stepmsg{display:flex;align-items:center;gap:9px;background:#f4f1ff;border-radius:11px;padding:12px 14px;font-size:13.5px;color:#3a2a6b;margin-top:12px}"
 ].join("\n");
 document.head.appendChild(st);
}

/* ===== Overlay ===== */
function ensureOverlay(){
 if($id("swOv"))return;
 var ov=document.createElement("div");ov.id="swOv";ov.className="sw-ov";
 ov.innerHTML='<div class="sw-box"><div class="sw-top"><b style="font-size:17px">\ud83c\udfb5 Therapeutisches Songwriting</b><div class="sw-top-r"><button class="sw-reset" id="swReset" title="Session zur\u00fccksetzen">\u21bb Neu</button><button class="sw-x" id="swX" aria-label="schlie\u00dfen">\u2715</button></div></div><div class="sw-rail" id="swRail"></div><div id="swBody"></div></div>';
 document.body.appendChild(ov);
 ov.addEventListener("click",function(e){if(e.target===ov)close();});
 $id("swX").onclick=close;
 $id("swReset").onclick=resetSession;
}
function resetSession(){if(!confirm("Ganze Songwriting-Session zur\u00fccksetzen und bei 0 beginnen?"))return;SW=freshState();try{localStorage.setItem("sw_step","1");}catch(e){}renderStep();}
function rail(){var r=$id("swRail");if(!r)return;var h="";for(var i=1;i<=6;i++){h+='<div class="sw-seg'+(i<SW.step?" done":"")+(i===SW.step?" cur":"")+'"></div>';}r.innerHTML=h;}
function open(step){injectCSS();ensureOverlay();if(step)SW.step=step;$id("swOv").classList.add("open");renderStep();}
function close(){var o=$id("swOv");if(o)o.classList.remove("open");}
function go(step){SW.step=Math.min(6,Math.max(1,step));try{localStorage.setItem("sw_step",String(SW.step));}catch(e){}renderStep();}
function busy(btn,on,label){if(!btn)return;if(on){btn.disabled=true;btn._o=btn.innerHTML;btn.innerHTML='<span class="spin"></span> '+(label||"\u2026");}else{btn.disabled=false;if(btn._o)btn.innerHTML=btn._o;}}
function copyWire(scope){(scope||document).querySelectorAll("[data-cp]").forEach(function(b){b.onclick=function(){var el=document.getElementById(b.getAttribute("data-cp"));if(el&&navigator.clipboard)navigator.clipboard.writeText(el.textContent);var o=b.textContent;b.textContent="kopiert \u2713";setTimeout(function(){b.textContent=o;},1100);};});}
function foot(b,backStep,nextLabel,nextFn,extra){var f=document.createElement("div");f.className="sw-foot";
 if(backStep){var bk=document.createElement("button");bk.className="btn sec";bk.textContent="\u2190 Zur\u00fcck";bk.onclick=function(){go(backStep);};f.appendChild(bk);}
 if(extra){f.appendChild(extra);}
 var nx=document.createElement("button");nx.className="btn";nx.textContent=nextLabel;nx.onclick=nextFn;f.appendChild(nx);b.appendChild(f);}
function chips(arr,sel,multi){return arr.map(function(v){var on=multi?(sel.indexOf(v)>=0):(sel===v);return '<button type="button" class="chip'+(on?" on":"")+'" data-v="'+esc(v)+'">'+esc(v)+'</button>';}).join("");}

/* ===== Lyrics <-> Sections ===== */
function lyricsToSections(txt){var lines=(txt||"").split(/\r?\n/);var secs=[],cur=null;
 lines.forEach(function(ln){var m=ln.match(/^\s*[\[\(]?\s*(Intro|Strophe|Verse|Pre-?Refrain|Pre-?Chorus|Refrain|Chorus|Bridge|Br\u00fccke|Outro|Hook|Kehrvers|Interlude|Solo)\b[^\]\)]*[\]\)]?\s*$/i);
  if(m){cur={head:ln.trim(),body:[]};secs.push(cur);}
  else{if(!cur){cur={head:"",body:[]};secs.push(cur);}cur.body.push(ln);}});
 return secs.map(function(s){return {head:s.head,body:s.body.join("\n").replace(/^\n+|\n+$/g,"")};}).filter(function(s){return s.head||s.body.trim();});}
function sectionsToLyrics(secs){return secs.map(function(s){return (s.head?s.head+"\n":"")+s.body;}).join("\n\n").replace(/\n{3,}/g,"\n\n").trim();}
function syncSectionsFromLyrics(){SW.sections=lyricsToSections(SW.lyrics);}
function syncLyricsFromSections(){SW.lyrics=sectionsToLyrics(SW.sections);}
function secType(head){var h=(head||"").toLowerCase();
 if(/refrain|chorus|hook|kehrvers/.test(h))return "chorus";
 if(/bridge|br\u00fccke/.test(h))return "bridge";
 if(/intro/.test(h))return "intro";
 if(/outro/.test(h))return "outro";
 if(/pre-?refrain|pre-?chorus/.test(h))return "pre";
 if(/strophe|verse/.test(h))return "verse";
 return "other";}
function secLabel(head,i){var clean=(head||"").replace(/^[\[\(]|[\]\)]$/g,"").trim();return clean||("Abschnitt "+(i+1));}
function secBadge(t){return {chorus:"Refrain \u00b7 wiederkehrender Kern",bridge:"Bridge \u00b7 Wendepunkt",intro:"Intro",outro:"Outro \u00b7 Ausklang",pre:"Pre-Refrain \u00b7 Anlauf",verse:"Strophe \u00b7 erz\u00e4hlt",other:""}[t]||"";}
function lineCount(s){return (s.body||"").split(/\n/).filter(function(x){return x.trim();}).length;}

/* ===== Schritt-Renderer ===== */
function renderStep(){rail();var b=$id("swBody");if(!b)return;[step1,step2,step3,step4,step5,step6][SW.step-1](b);}

/* Schritt 1 — Begruessung + Richtung (mit sichtbarem Gespraechs-Einstieg) */
function step1(b){
 b.innerHTML='<div class="sw-h">Willkommen \u2728</div>'+
 '<div class="sw-help">Hier verwandeln wir gemeinsam das, was dich bewegt, in einen Song. Es geht nicht um perfekte Reime, sondern um <b>deinen Ausdruck</b>. Das hier ist ein kreativer Begleiter \u2013 kein Ersatz f\u00fcr professionelle Unterst\u00fctzung. Wenn dir etwas schwer auf dem Herzen liegt, ist es v\u00f6llig okay, dir auch echte Menschen an die Seite zu holen.<br><br>In welche Richtung soll es gehen? Worum oder um wen geht es? Welches Gef\u00fchl soll der Song tragen?</div>'+
 '<label class="sw-field"><span class="tag">Deine Richtung</span><textarea class="sw-ta sw-grow" id="swDir" placeholder="z.B. Ein Lied f\u00fcr meine Schwester, \u00fcber Loslassen und Dankbarkeit \u2026">'+esc(SW.direction)+'</textarea></label>'+
 '<div class="sw-or">oder</div>'+
 '<button type="button" class="sw-talk-cta" id="swTalkCta"><span class="ic">\ud83d\udde3\ufe0f</span><span><b>Lieber reden? Gespr\u00e4ch beginnen</b><span class="d">Du sp\u00fcrst etwas, findest aber noch nicht die Worte? Ein einf\u00fchlsamer Begleiter hilft dir Schritt f\u00fcr Schritt \u2013 vom Gef\u00fchl zu Bild, Klang und deinen eigenen Worten.</span></span></button>';
 $id("swDir").oninput=function(e){SW.direction=e.target.value;};
 $id("swTalkCta").onclick=function(){SW.talkActive=true;go(2);};
 wireGrow(b);
 foot(b,null,"Weiter \u2192 Material",function(){go(2);});
}

/* ===== Schritt 2 — Material: Upload ODER begleitetes Gespraech ===== */
function step2(b){
 if(SW.talkActive){return renderTalk(b);}
 b.innerHTML='<div class="sw-h">Schritt 2 \u00b7 Material sammeln</div>'+
 '<div class="sw-help">Je mehr von <b>dir</b> einflie\u00dft, desto mehr wird der Song wirklich deiner \u2013 jeder Vers soll dein Material widerspiegeln. Du hast zwei Wege (auch kombinierbar): eigenes Material hochladen, oder ein <b>begleitetes Gespr\u00e4ch</b> f\u00fchren, wenn du noch nicht die richtigen Worte hast.</div>'+
 '<div class="sw-ways">'+
   '<div class="sw-way"><h4>\ud83d\udcce Material hochladen</h4><p>Bilder, Notizen, Tagebuch- oder Textdateien \u2013 alles, was die KI lesen kann.</p>'+
     '<div class="drop" id="swDrop">ablegen oder tippen</div><input type="file" id="swFile" accept="image/*,text/*,.txt,.md,.csv,.json,.srt,.rtf,.log,.lrc" multiple hidden/>'+
     '<div id="swAssets" style="margin-top:8px">'+assetList()+'</div></div>'+
   '<div class="sw-way accent"><h4>\ud83d\udde3\ufe0f Begleitetes Gespr\u00e4ch</h4><p>Du sp\u00fcrst etwas, aber findest die Worte noch nicht? Ein einf\u00fchlsamer Begleiter hilft dir, das Gef\u00fchl greifbar zu machen \u2013 und macht daraus Material.</p>'+
     '<button class="btn" id="swTalkStart" style="min-height:48px;width:100%">Gespr\u00e4ch beginnen</button>'+
     (SW.talk.length?'<div class="sw-hint">\u2713 Gespr\u00e4ch vorhanden \u2013 wurde als Material \u00fcbernommen. Du kannst es fortsetzen.</div>':'')+'</div>'+
 '</div>'+
 '<button class="btn" id="swExtract" style="margin-top:16px;min-height:50px">\u2728 Themen heraush\u00f6ren &amp; Material pr\u00fcfen</button>'+
 '<div class="sw-hint">L\u00e4uft in einem Zug: Themen + Materialbewertung. Du kannst danach erg\u00e4nzen.</div>'+
 '<div id="swThemesOut" class="x-err"></div>';
 var z=$id("swDrop"),f=$id("swFile");
 z.onclick=function(){f.click();};
 ["dragover","dragenter"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.add("hot");});});
 ["dragleave","drop"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.remove("hot");});});
 z.addEventListener("drop",function(e){addAssets([].slice.call(e.dataTransfer.files));});
 f.onchange=function(e){addAssets([].slice.call(e.target.files));};
 $id("swTalkStart").onclick=startTalk;
 $id("swExtract").onclick=function(){extractThemes(true);};
 foot(b,1,"Weiter \u2192 Themen",function(){go(3);});
}
function assetList(){if(!SW.assets.length)return"";return SW.assets.map(function(a,i){var ic=a.kind==="image"?"\ud83d\uddbc":(a.kind==="talk"?"\ud83d\udde3\ufe0f":"\ud83d\udcc4");return '<span class="sw-asset">'+ic+' '+esc(a.name)+' <button class="cp" data-del="'+i+'" style="color:#a11">\u2715</button></span>';}).join("");}
function refreshAssets(){var el=$id("swAssets");if(el){el.innerHTML=assetList();el.querySelectorAll("[data-del]").forEach(function(btn){btn.onclick=function(){SW.assets.splice(+btn.getAttribute("data-del"),1);refreshAssets();};});}}
function addAssets(files){var ps=files.map(function(f){
  if(f.type&&f.type.indexOf("image/")===0){return readDataURL(f).then(function(d){return fitImage(d,1568);}).then(function(u){SW.assets.push({kind:"image",name:f.name||"Bild",data:u});});}
  if(isTextFile(f)){return readText(f).then(function(t){SW.assets.push({kind:"text",name:f.name||"Text",text:(t||"").slice(0,8000)});});}
  SW.assets.push({kind:"skip",name:(f.name||"Datei")+" (Format nicht lesbar)"});return Promise.resolve();
 });
 Promise.all(ps).then(refreshAssets);
}
function assetBlocks(){var out=[];SW.assets.forEach(function(a){if(a.kind==="image"){var ib=imgBlock(a.data);if(ib)out.push(ib);}else if(a.kind==="text"||a.kind==="talk"){out.push({type:"text",text:"DATEI \u201e"+a.name+"\u201c:\n"+a.text});}});return out;}
/* materialText: alles in Worten des Nutzers fuer Bewertung & Wortlaut-Treue */
function materialText(){var parts=[];if(SW.direction)parts.push("RICHTUNG (Wortlaut des Nutzers):\n"+SW.direction);
 SW.assets.forEach(function(a){if(a.kind==="text"||a.kind==="talk")parts.push((a.kind==="talk"?"AUS DEM GESPR\u00c4CH":"TEXT")+" \u201e"+a.name+"\u201c (Wortlaut):\n"+a.text);else if(a.kind==="image")parts.push("BILD: "+a.name);});
 if(SW.themes.length)parts.push("THEMEN:\n"+SW.themes.map(function(t){return "- ["+t.importance+"] "+t.title+(t.note?": "+t.note:"");}).join("\n"));
 return parts.join("\n\n");}

/* ===== Begleitetes Gespraech ===== */
function startTalk(){SW.talkActive=true;if(!SW.talk.length){
  var opener="Sch\u00f6n, dass du da bist. Wir m\u00fcssen die passenden Worte gar nicht sofort finden \u2013 wir tasten uns gemeinsam heran. Was bewegt dich gerade, wenn du an diesen Song denkst? Es darf auch nur ein Gef\u00fchl, ein Bild oder eine einzelne Erinnerung sein.";
  SW.talk.push({role:"assistant",content:opener});
 }renderStep();}
function renderTalk(b){
 var chat=SW.talk.map(function(m){return '<div class="sw-msg '+(m.role==="user"?"u":"a")+'">'+esc(m.content)+'</div>';}).join("");
 b.innerHTML='<div class="sw-h">\ud83d\udde3\ufe0f Begleitetes Gespr\u00e4ch</div>'+
  '<div class="sw-help">Nimm dir Zeit. Der Begleiter h\u00f6rt zu und hilft dir, vom Gef\u00fchl \u00fcber ein Bild und einen Klang zu deinen eigenen Worten zu kommen. Das ist <b>kein Therapieersatz</b> \u2013 wenn dich etwas \u00fcberw\u00e4ltigt, hol dir bitte auch echte Menschen dazu. Wenn genug zusammengekommen ist, tippe auf \u201eGespr\u00e4ch auswerten\u201c.</div>'+
  '<div class="sw-chat" id="swChat">'+chat+'</div>'+
  '<div id="swCrisis"></div>'+
  '<div class="sw-chatbar"><textarea class="sw-ta sw-grow" id="swTalkIn" rows="1" placeholder="Schreib einfach, wie es sich anf\u00fchlt \u2026"></textarea><button class="btn" id="swTalkSend" style="width:auto;padding:0 18px;min-height:46px">Senden</button></div>'+
  '<div class="sw-toolbar"><button class="btn sec" id="swTalkBack">\u2190 Zur\u00fcck zum Material</button><button class="btn" id="swTalkHarvest">\u2728 Gespr\u00e4ch auswerten \u2192 Material</button></div>'+
  '<div id="swTalkErr" class="x-err"></div>';
 var ch=$id("swChat");if(ch)ch.scrollTop=ch.scrollHeight;
 var inp=$id("swTalkIn");
 $id("swTalkSend").onclick=sendTalk;
 inp.addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendTalk();}});
 $id("swTalkBack").onclick=function(){SW.talkActive=false;renderStep();};
 $id("swTalkHarvest").onclick=harvestTalk;
 wireGrow(b);
}
function sendTalk(){var inp=$id("swTalkIn");var q=(inp.value||"").trim();if(!q)return;inp.value="";autoGrow(inp);
 SW.talk.push({role:"user",content:q});renderStep();
 var btn=$id("swTalkSend");busy(btn,true,"");
 var hist=SW.talk.map(function(m){return {role:m.role,content:m.content};});
 claude(hist,SW_TALK,1100).then(function(txt){SW.talk.push({role:"assistant",content:(txt||"").trim()});renderStep();})
 .catch(function(e){var ce=$id("swTalkErr");if(ce)ce.textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";busy(btn,false);});
}
function harvestTalk(){if(SW.talk.filter(function(m){return m.role==="user";}).length<1){var ce=$id("swTalkErr");if(ce)ce.textContent="Schreib zuerst ein, zwei S\u00e4tze \u2013 dann kann ich daraus Material machen.";return;}
 var btn=$id("swTalkHarvest");busy(btn,true,"wertet aus");
 var convo=SW.talk.map(function(m){return (m.role==="user"?"NUTZER":"BEGLEITER")+": "+m.content;}).join("\n");
 claude([{role:"user",content:"CONVERSATION:\n"+convo}],SW_HARVEST,1800).then(function(txt){var j=parseJSON(txt);
  // Material-Block aus dem Gespraech bauen (Wortlaut bewahren)
  var lines=[];if(j.summary_de)lines.push(j.summary_de);
  if(j.user_phrases&&j.user_phrases.length)lines.push("\nEigene Worte:\n- "+j.user_phrases.join("\n- "));
  if(j.images_de&&j.images_de.length)lines.push("\nBilder/Szenen:\n- "+j.images_de.join("\n- "));
  if(j.feelings_de&&j.feelings_de.length)lines.push("\nGef\u00fchle: "+j.feelings_de.join(", "));
  var blockText=lines.join("\n");
  // vorhandenes Gespraechs-Asset ersetzen statt doppeln
  SW.assets=SW.assets.filter(function(a){return a.kind!=="talk";});
  SW.assets.push({kind:"talk",name:"Gespr\u00e4ch",text:blockText});
  (j.themes||[]).forEach(function(t){if(t&&t.title_de)SW.themes.push({title:t.title_de,note:t.note_de||"aus dem Gespr\u00e4ch",importance:"hoch"});});
  SW.talkActive=false;
  // direkt neu bewerten, damit der Fuellstand steigt
  return assessMaterial();
 }).then(function(){go(3);}).catch(function(e){var ce=$id("swTalkErr");if(ce)ce.textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";busy(btn,false);});
}

/* Themen heraushoeren -> dann (verkettet) Materialbewertung, dann nach Schritt 3 */
function extractThemes(chain){var btn=$id("swExtract");busy(btn,true,"h\u00f6rt zu");if($id("swThemesOut"))$id("swThemesOut").textContent="";
 var content=assetBlocks();content.push({type:"text",text:"RICHTUNG DES NUTZERS: "+(SW.direction||"(frei)")+"\n\nH\u00f6re die Themen heraus."});
 return claude([{role:"user",content:content}],SW_THEMES,1600).then(function(txt){var j=parseJSON(txt);
  SW.themes=[];(j.themes||[]).forEach(function(t){SW.themes.push({title:t.title_de||"",note:t.note_de||"",importance:"mittel"});});
  SW._reflection=j.reflection_de||"";
  return assessMaterial();
 }).then(function(){go(3);}).catch(function(e){if($id("swThemesOut"))$id("swThemesOut").textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php). Du kannst Themen auch im n\u00e4chsten Schritt selbst eintragen.";busy(btn,false);});
}
/* reine Materialbewertung (auch nachtraeglich aufrufbar) */
function assessMaterial(){return claude([{role:"user",content:"MATERIAL DES NUTZERS:\n"+materialText()}],SW_MATERIAL,1500).then(function(txt){var j=parseJSON(txt);
  var pct=Math.max(0,Math.min(100,parseInt(j.fill_percent,10)||0));
  SW.material={pct:pct,verdict:j.verdict||(pct>=70?"ausreichend":pct>=45?"knapp":"zu_wenig"),assessment:j.assessment_de||"",suggestions:(j.suggestions||[]).slice(0,5)};
 }).catch(function(e){SW.material={pct:0,verdict:"zu_wenig",assessment:"Materialpr\u00fcfung nicht m\u00f6glich ("+e.message+").",suggestions:[]};});}

/* ===== Schritt 3 — Themen + Materialbewertung ===== */
function fillClass(){var v=SW.material?SW.material.verdict:"";return v==="ausreichend"?"good":(v==="knapp"?"mid":"bad");}
function fillLabel(){var v=SW.material?SW.material.verdict:"";return v==="ausreichend"?"\u2705 Material reicht f\u00fcr einen authentischen Text":(v==="knapp"?"\u26a0 Knapp \u2013 etwas m\u00fcsste die KI erg\u00e4nzen":"\u26d4 Zu wenig \u2013 die KI m\u00fcsste viel erfinden");}
function materialHTML(){if(!SW.material)return"";var m=SW.material,c=fillClass();
 var sug=(m.suggestions||[]).map(function(s,i){return '<div class="sw-sugg" data-sug="'+i+'"><div class="plus">+</div><div><b>'+esc(s.q_de||"")+'</b>'+(s.hint_de?'<div class="hint">'+esc(s.hint_de)+'</div>':'')+'</div></div>';}).join("");
 var talkBtn=(m.verdict!=="ausreichend")?'<button class="btn sec" id="swToTalk" style="margin-top:10px;min-height:46px">\ud83d\udde3\ufe0f Im Gespr\u00e4ch mehr herausfinden</button>':"";
 var sugBlock=(m.verdict!=="ausreichend"&&(sug||true))?'<div style="margin-top:12px"><div class="tag">So machst du den Song noch mehr zu deinem \u2013 tippe zum \u00dcbernehmen:</div>'+sug+
   '<div class="sw-addbox"><input class="sw-in" id="swAddMat" placeholder="\u2026oder eigenes Material/Detail hier eintippen"/><button class="btn sec" id="swAddMatBtn" style="width:auto;padding:12px 16px;min-height:48px">+ erg\u00e4nzen</button></div>'+
   talkBtn+
   '<button class="btn sec" id="swRecheckMat" style="margin-top:10px;min-height:46px">\u21bb Material neu bewerten</button></div>':"";
 return '<div class="sw-fill '+c+'"><div class="sw-fill-top"><span class="sw-fill-pct">'+m.pct+'%</span><span class="sw-fill-lbl">'+fillLabel()+'</span></div>'+
  '<div class="sw-bar"><div class="sw-bar-fill" style="width:'+m.pct+'%"></div></div>'+
  (m.assessment?'<div class="sw-fill-txt">'+esc(m.assessment)+'</div>':"")+sugBlock+'</div>';
}
function step3(b){
 var refl=SW._reflection?'<div class="expl">'+esc(SW._reflection)+'</div>':"";
 var list=SW.themes.length?SW.themes.map(function(t,i){return '<div class="sw-theme"><div><b>'+esc(t.title||("Thema "+(i+1)))+'</b><div class="small">'+esc(t.note||"")+'</div></div><div class="sw-imp" data-i="'+i+'">'+
   ["hoch","mittel","niedrig"].map(function(v){return '<button type="button" class="chip'+(t.importance===v?" on":"")+'" data-imp="'+v+'">'+v+'</button>';}).join("")+'</div></div>';}).join(""):'<div class="small">Noch keine Themen \u2013 trag unten dein erstes ein.</div>';
 b.innerHTML='<div class="sw-h">Schritt 3 \u00b7 Themen &amp; Material-F\u00fcllstand</div>'+
 '<div class="sw-help">Der <b>F\u00fcllstand</b> zeigt, wie viel vom Song aus <b>deinem eigenen Material</b> getragen werden kann. Ist er hoch, kann es direkt losgehen. Ist er niedrig, m\u00fcsste die KI viel erfinden \u2013 dann erg\u00e4nze unten gern noch etwas oder geh ins Gespr\u00e4ch. Markiere bei jedem Thema, wie wichtig es dir ist.</div>'+
 materialHTML()+
 '<div class="sw-field"><span class="tag" style="margin-top:6px">Deine Themen</span><div id="swThemeList">'+list+'</div></div>'+
 '<div class="sw-field" style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1"><span class="tag">Eigenes Thema</span><input class="sw-in" id="swNewTheme" placeholder="Was geh\u00f6rt noch rein?"/></div><button class="btn sec" id="swAddTheme" style="width:auto;padding:12px 16px;min-height:48px">+ Hinzuf\u00fcgen</button></div>'+
 '<button class="btn sec" id="swSort" style="margin-top:14px;min-height:46px">\u2728 Themen nach Wichtigkeit sortieren</button><div id="swSortErr" class="x-err"></div>';
 wireThemes();
 b.querySelectorAll("[data-sug]").forEach(function(card){card.onclick=function(){var s=SW.material.suggestions[+card.getAttribute("data-sug")];if(!s)return;var ans=prompt(s.q_de||"Dein Detail:",""); if(ans&&ans.trim()){adoptMaterial((s.q_de?s.q_de+" \u2014 ":"")+ans.trim());}};});
 if($id("swAddMatBtn"))$id("swAddMatBtn").onclick=function(){var v=$id("swAddMat").value.trim();if(v)adoptMaterial(v);};
 if($id("swToTalk"))$id("swToTalk").onclick=function(){SW.talkActive=true;go(2);};
 if($id("swRecheckMat"))$id("swRecheckMat").onclick=function(){var bb=$id("swRecheckMat");busy(bb,true,"bewertet");assessMaterial().then(renderStep);};
 $id("swAddTheme").onclick=function(){var v=$id("swNewTheme").value.trim();if(v){SW.themes.push({title:v,note:"",importance:"hoch"});renderStep();}};
 $id("swSort").onclick=sortThemes;
 var nextLabel=(SW.material&&SW.material.verdict==="zu_wenig")?"Trotzdem weiter \u2192 Gestaltung":"Weiter \u2192 Gestaltung";
 foot(b,2,nextLabel,function(){go(4);});
}
function adoptMaterial(text){SW.assets.push({kind:"text",name:"Eigene Erg\u00e4nzung",text:text});
 SW.themes.push({title:text.length>42?text.slice(0,42)+"\u2026":text,note:"von dir erg\u00e4nzt",importance:"hoch"});
 var bb=$id("swRecheckMat");if(bb)busy(bb,true,"bewertet");
 assessMaterial().then(renderStep);
}
function wireThemes(){document.querySelectorAll("#swThemeList .sw-imp").forEach(function(row){var i=+row.getAttribute("data-i");row.querySelectorAll("[data-imp]").forEach(function(btn){btn.onclick=function(){SW.themes[i].importance=btn.getAttribute("data-imp");renderStep();};});});}
function sortThemes(){var btn=$id("swSort");busy(btn,true,"sortiert");$id("swSortErr").textContent="";
 var payload="THEMES (mit Nutzer-Wichtigkeit):\n"+SW.themes.map(function(t){return "- ["+t.importance+"] "+t.title+(t.note?": "+t.note:"");}).join("\n");
 claude([{role:"user",content:payload}],SW_SORT,1500).then(function(txt){var j=parseJSON(txt);if(j.themes&&j.themes.length){SW.themes=j.themes.map(function(t){return {title:t.title_de||t.title||"",note:t.note_de||t.note||"",importance:t.importance||"mittel"};});}renderStep();}).catch(function(e){$id("swSortErr").textContent="\u26a0 "+e.message;busy(btn,false);});
}

/* Schritt 4 — Gestaltung */
function step4(b){
 var d=SW.design;
 b.innerHTML='<div class="sw-h">Schritt 4 \u00b7 Gestaltung \u2013 dein Sound</div>'+
 '<div class="sw-help">Hier hast du volle Kontrolle: Genre, Stimmung, Tonart, Takt, Tempo, Instrumente und das Songschema. Alles flie\u00dft in Text + Suno-Prompt ein. Nichts ist Pflicht \u2013 was du offen l\u00e4sst, gestaltet die KI passend.</div>'+
 '<label class="sw-field"><span class="tag">Genre</span><select class="sw-sel" id="swGenre">'+GENRES.map(function(g){return '<option'+(d.genre===g?" selected":"")+'>'+esc(g)+'</option>';}).join("")+'</select></label>'+
 '<div class="sw-field"><span class="tag">Stimmung (mehrere m\u00f6glich)</span><div class="chips" id="swMood">'+chips(MOODS,d.mood,true)+'</div></div>'+
 '<div style="display:flex;gap:10px"><label class="sw-field" style="flex:1"><span class="tag">Tonart</span><select class="sw-sel" id="swKey">'+KEYS.map(function(k){return '<option'+(d.key===k?" selected":"")+'>'+esc(k)+'</option>';}).join("")+'</select></label>'+
 '<label class="sw-field" style="flex:1"><span class="tag">Takt</span><select class="sw-sel" id="swTime">'+TIMESIGS.map(function(t){return '<option'+(d.timesig===t?" selected":"")+'>'+esc(t)+'</option>';}).join("")+'</select></label></div>'+
 '<label class="sw-field"><span class="tag">Tempo: <b id="swBpmL">'+d.bpm+'</b> BPM</span><input type="range" class="sw-in" id="swBpm" min="50" max="180" step="1" value="'+d.bpm+'" style="padding:0"/></label>'+
 '<div class="sw-field"><span class="tag">Rhythmus-Gef\u00fchl</span><div class="chips" id="swFeel">'+chips(FEELS,d.feel,false)+'</div></div>'+
 '<div class="sw-field"><span class="tag">Instrumente (mehrere m\u00f6glich)</span><div class="chips" id="swInstr">'+chips(INSTRUMENTS,d.instruments,true)+'</div><input class="sw-in" id="swInstrCustom" style="margin-top:8px" placeholder="weitere Instrumente, kommagetrennt \u2026" value="'+esc(d.instrCustom||"")+'"/></div>'+
 '<label class="sw-field"><span class="tag">Songschema</span><select class="sw-sel" id="swSchema">'+SCHEMAS.map(function(s){return '<option value="'+esc(s.v)+'"'+(d.schema===s.v?" selected":"")+'>'+esc(s.l)+(s.v?" \u2014 "+esc(s.v):"")+'</option>';}).join("")+'</select></label>'+
 '<input class="sw-in" id="swSchemaCustom" style="margin-top:8px" placeholder="eigenes Schema (falls \u201efrei\u201c gew\u00e4hlt) \u2026" value="'+esc(d.schemaCustom)+'"/>';
 $id("swGenre").onchange=function(e){d.genre=e.target.value;};
 $id("swKey").onchange=function(e){d.key=e.target.value;};
 $id("swTime").onchange=function(e){d.timesig=e.target.value;};
 $id("swBpm").oninput=function(e){d.bpm=+e.target.value;$id("swBpmL").textContent=d.bpm;};
 $id("swSchema").onchange=function(e){d.schema=e.target.value;};
 $id("swSchemaCustom").oninput=function(e){d.schemaCustom=e.target.value;};
 $id("swInstrCustom").oninput=function(e){d.instrCustom=e.target.value;};
 $id("swMood").querySelectorAll("[data-v]").forEach(function(c){c.onclick=function(){var v=c.getAttribute("data-v"),k=d.mood.indexOf(v);if(k>=0)d.mood.splice(k,1);else d.mood.push(v);c.classList.toggle("on");};});
 $id("swInstr").querySelectorAll("[data-v]").forEach(function(c){c.onclick=function(){var v=c.getAttribute("data-v"),k=d.instruments.indexOf(v);if(k>=0)d.instruments.splice(k,1);else d.instruments.push(v);c.classList.toggle("on");};});
 $id("swFeel").querySelectorAll("[data-v]").forEach(function(c){c.onclick=function(){d.feel=c.getAttribute("data-v");$id("swFeel").querySelectorAll("[data-v]").forEach(function(x){x.classList.toggle("on",x===c);});};});
 var auto=document.createElement("button");auto.className="btn sw-auto";auto.id="swAutoBtn";auto.textContent="\u2728 Automatisch bis zum Songtext";auto.onclick=function(){SW.auto=true;go(5);startAuto();};
 foot(b,3,"Weiter \u2192 Songtext",function(){SW.auto=false;go(5);},auto);
}
function designSummary(){var d=SW.design;var instr=d.instruments.concat((d.instrCustom||"").split(",").map(function(x){return x.trim();}).filter(Boolean));
 return "Genre: "+d.genre+"\nStimmung: "+(d.mood.join(", ")||"offen")+"\nTonart: "+d.key+"\nTakt: "+d.timesig+"\nTempo: "+d.bpm+" BPM ("+d.feel+")\nInstrumente: "+(instr.join(", ")||"offen")+"\nSongschema: "+((d.schema==="" ? (d.schemaCustom||"frei") : d.schema));}

/* ===== Schritt 5 — Co-Writing Songtext ===== */
function evalClass(){if(!SW.eval)return"";var s=SW.eval.score||0;return s>=8?"good":(s>=6?"mid":"bad");}
function evalHTML(){if(!SW.eval)return"";var c=evalClass();var iss=(SW.eval.issues_de||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join("");
 return '<div class="sw-eval '+c+'"><div><span class="sw-score">Lektor: '+esc(String(SW.eval.score||"?"))+'/10</span> \u00b7 '+esc(SW.eval.summary_de||"")+'</div>'+(iss?'<ul>'+iss+'</ul>':"")+'<div class="sw-hint" style="margin-top:8px">Die angezeigte Fassung ist bereits die vom Lektor korrigierte Version \u2013 nah an deinem Material.</div></div>';}
function step5(b){
 var has=!!(SW.lyrics&&SW.sections.length);
 var html='<div class="sw-h">Schritt 5 \u00b7 Co-Writing \u2013 euer Songtext</div>'+
  '<div class="sw-help">Die KI baut den Text aus <b>deinem Material</b>, ein strenger <b>Lektor</b> pr\u00fcft automatisch (Wortwiederholungen, Zwangsreime, Sinn, Singbarkeit, N\u00e4he zu deinem Material) und korrigiert. Danach kannst du <b>jeden Abschnitt einzeln</b> bearbeiten. Erst wenn du zufrieden bist, gibst du den Text frei.</div>';
 if(SW.auto){
  html+='<div class="sw-stepmsg"><span class="spin" style="border-top-color:#7b61ff"></span> <span id="swAutoMsg">Automatik l\u00e4uft \u2026</span></div><div id="swLyrErr" class="x-err"></div>';
  b.innerHTML=html;
  return;
 }
 if(!has){
  html+='<button class="btn" id="swWrite" style="min-height:50px">\u2728 Songtext schreiben (mit Lektor-Pr\u00fcfung)</button>'+
        '<div class="sw-hint">Schreiben und Pr\u00fcfen laufen automatisch hintereinander \u2013 ein Klick gen\u00fcgt.</div><div id="swLyrErr" class="x-err"></div>';
  b.innerHTML=html;$id("swWrite").onclick=function(){writeLyrics();};
  foot(b,4,"Weiter \u2192 Suno-Prompts",function(){gateNext();});
  return;
 }
 html+=(SW.title?'<div class="sw-field"><span class="tag">Titel</span><input class="sw-in" id="swTitle" value="'+esc(SW.title)+'"/></div>':"");
 html+=evalHTML();
 html+='<div class="sw-secwrap" id="swSecWrap">';
 SW.sections.forEach(function(s,i){
  var t=secType(s.head);var badge=secBadge(t);var ln=lineCount(s);
  html+='<div class="sw-sec is-'+t+'" data-i="'+i+'"><div class="sw-sec-h"><b>'+esc(secLabel(s.head,i))+'</b>'+(badge?'<span class="sw-sec-badge">'+esc(badge)+(ln?' \u00b7 '+ln+' Z.':'')+'</span>':'')+'</div>'+
   '<textarea class="sw-sec-ta sw-grow" data-body="'+i+'" rows="2">'+esc(s.body)+'</textarea>'+
   '<div class="sw-acts">'+
     '<button class="chip" data-act="rewrite" data-i="'+i+'">\u270e neu schreiben</button>'+
     '<button class="chip" data-act="imagery" data-i="'+i+'">\ud83c\udfa8 mehr Bild</button>'+
     '<button class="chip" data-act="lessrhyme" data-i="'+i+'">\u2702 weniger Reim</button>'+
     '<button class="chip" data-act="condense" data-i="'+i+'">\u29c9 verdichten</button>'+
   '</div></div>';
 });
 html+='</div>';
 html+='<div class="sw-field"><span class="tag">Gesamter \u00c4nderungswunsch (ganzer Song)</span><div style="display:flex;gap:8px;align-items:stretch"><input class="sw-in" id="swWish" style="flex:1" placeholder="z.B. weniger pathetisch, mehr Alltag, Refrain einpr\u00e4gsamer \u2026"/><button class="btn sec" id="swRefine" style="width:auto;padding:12px 16px;min-height:48px">\u00fcberarbeiten</button></div></div>';
 html+='<div class="sw-toolbar"><button class="btn sec" id="swRecheck">\ud83d\udd0d Nochmal pr\u00fcfen</button><button class="btn sec" id="swCopyAll">\u29c9 Text kopieren</button></div>';
 var locked=!SW.approved;
 html+='<div class="sw-gate '+(locked?"locked":"open")+'" id="swGate">'+(locked?'\ud83d\udd12 Suno ist gesperrt, bis du den Text freigibst.':'\u2705 Freigegeben \u2013 du kannst zu Suno weitergehen.')+'</div>';
 var approve=document.createElement("button");approve.className="btn";approve.id="swApprove";approve.style.minHeight="50px";approve.textContent=SW.approved?"\u2713 Freigegeben":"\u2713 Songtext freigeben";
 b.innerHTML=html;

 if($id("swTitle"))$id("swTitle").oninput=function(e){SW.title=e.target.value;};
 b.querySelectorAll("[data-body]").forEach(function(ta){ta.addEventListener("input",function(){var i=+ta.getAttribute("data-body");SW.sections[i].body=ta.value;syncLyricsFromSections();invalidate();});});
 b.querySelectorAll("[data-act]").forEach(function(btn){btn.onclick=function(){sectionAction(+btn.getAttribute("data-i"),btn.getAttribute("data-act"),btn);};});
 $id("swRefine").onclick=refineLyrics;
 $id("swRecheck").onclick=function(){runEval(null,$id("swRecheck"));};
 $id("swCopyAll").onclick=function(){if(navigator.clipboard)navigator.clipboard.writeText((SW.title?SW.title+"\n\n":"")+SW.lyrics);var o=$id("swCopyAll").textContent;$id("swCopyAll").textContent="kopiert \u2713";setTimeout(function(){$id("swCopyAll").textContent=o;},1100);};
 approve.onclick=function(){SW.approved=true;renderStep();};
 foot(b,4,SW.approved?"Weiter \u2192 Suno-Prompts":"Erst freigeben",function(){gateNext();},approve);
 wireGrow(b);
}
function invalidate(){SW.approved=false;var g=$id("swGate");if(g){g.className="sw-gate locked";g.innerHTML='\ud83d\udd12 Text ge\u00e4ndert \u2013 bitte erneut pr\u00fcfen und freigeben.';}var ap=$id("swApprove");if(ap)ap.textContent="\u2713 Songtext freigeben";}
function gateNext(){if(!SW.approved){var g=$id("swGate");if(g){g.className="sw-gate locked";g.innerHTML='\u26a0 Bitte zuerst auf \u201e\u2713 Songtext freigeben\u201c tippen.';}return;}go(6);}

/* Auto-Flow: schreibt -> Lektor, ohne Zwischenklicks; haelt im Co-Writing an */
function startAuto(){var msg=function(t){var m=$id("swAutoMsg");if(m)m.textContent=t;};
 msg("Schreibe Songtext aus deinem Material \u2026");
 var themes=SW.themes.slice().sort(function(a,c){var o={hoch:0,mittel:1,niedrig:2};return (o[a.importance]||1)-(o[c.importance]||1);});
 var payload="MATERIAL (Wortlaut des Nutzers \u2014 nutze es direkt):\n"+materialText()+"\n\nTHEMEN (wichtigste zuerst):\n"+themes.map(function(t){return "- ["+t.importance+"] "+t.title+(t.note?": "+t.note:"");}).join("\n")+"\n\nRICHTUNG: "+(SW.direction||"\u2014")+"\n\nDESIGN:\n"+designSummary();
 claude([{role:"user",content:payload}],SW_LYRICS,2600).then(function(txt){var j=parseJSON(txt);SW.title=j.title_de||SW.title||"";SW.lyrics=j.lyrics_de||"";
  msg("Lektor pr\u00fcft und feilt \u2026");
  var ep="DESIGN:\n"+designSummary()+"\n\nMATERIAL DES NUTZERS (auf N\u00e4he pr\u00fcfen):\n"+materialText()+"\n\nSONG TEXT:\n"+SW.lyrics;
  return claude([{role:"user",content:ep}],SW_EVAL,3000);
 }).then(function(txt){var j=parseJSON(txt);if(j.lyrics_de)SW.lyrics=j.lyrics_de;SW.eval={score:j.score,issues_de:j.issues_de||[],summary_de:j.summary_de||""};SW.approved=false;SW.auto=false;syncSectionsFromLyrics();renderStep();
 }).catch(function(e){SW.auto=false;if(SW.lyrics){syncSectionsFromLyrics();}renderStep();var le=$id("swLyrErr");if(le)le.textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";});
}

/* manueller erster Entwurf -> danach Lektor (verkettet) */
function writeLyrics(){var btn=$id("swWrite");busy(btn,true,"schreibt");if($id("swLyrErr"))$id("swLyrErr").textContent="";
 var themes=SW.themes.slice().sort(function(a,c){var o={hoch:0,mittel:1,niedrig:2};return (o[a.importance]||1)-(o[c.importance]||1);});
 var payload="MATERIAL (Wortlaut des Nutzers \u2014 nutze es direkt):\n"+materialText()+"\n\nTHEMEN (wichtigste zuerst):\n"+themes.map(function(t){return "- ["+t.importance+"] "+t.title+(t.note?": "+t.note:"");}).join("\n")+"\n\nRICHTUNG: "+(SW.direction||"\u2014")+"\n\nDESIGN:\n"+designSummary();
 claude([{role:"user",content:payload}],SW_LYRICS,2600).then(function(txt){var j=parseJSON(txt);SW.title=j.title_de||SW.title||"";SW.lyrics=j.lyrics_de||"";
  return runEval(btn,null);
 }).catch(function(e){if($id("swLyrErr"))$id("swLyrErr").textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";busy(btn,false);});
}

/* Lektor-Pass */
function runEval(spinBtn,recheckBtn){var rb=recheckBtn;if(rb)busy(rb,true,"pr\u00fcft");
 var payload="DESIGN:\n"+designSummary()+"\n\nMATERIAL DES NUTZERS (auf N\u00e4he pr\u00fcfen):\n"+materialText()+"\n\nSONG TEXT:\n"+SW.lyrics;
 return claude([{role:"user",content:payload}],SW_EVAL,3000).then(function(txt){var j=parseJSON(txt);
  if(j.lyrics_de)SW.lyrics=j.lyrics_de;
  SW.eval={score:j.score,issues_de:j.issues_de||[],summary_de:j.summary_de||""};
  SW.approved=false;syncSectionsFromLyrics();renderStep();
 }).catch(function(e){if(rb)busy(rb,false);if(spinBtn)busy(spinBtn,false);alert("\u26a0 Lektor: "+e.message+" \u2014 Backend pr\u00fcfen (api.php).");
  if(SW.lyrics){syncSectionsFromLyrics();renderStep();}
 });
}

/* Gesamt-Wunsch -> Refine -> erneut Lektor */
function refineLyrics(){var wish=$id("swWish").value.trim();if(!wish)return;var btn=$id("swRefine");busy(btn,true,"\u00fcberarbeitet");
 claude([{role:"user",content:"MATERIAL DES NUTZERS:\n"+materialText()+"\n\nSONG TEXT:\n"+SW.lyrics+"\n\nWISH: "+wish}],SW_REFINE,2600).then(function(txt){var j=parseJSON(txt);if(j.lyrics_de)SW.lyrics=j.lyrics_de;return runEval(btn,null);}).catch(function(e){busy(btn,false);alert("\u26a0 "+e.message);});
}

/* Abschnitts-Aktion */
function sectionAction(i,act,btn){var s=SW.sections[i];if(!s)return;busy(btn,true,"\u2026");
 var payload="MATERIAL DES NUTZERS:\n"+materialText()+"\n\nFULL SONG:\n"+SW.lyrics+"\n\nSECTION HEADING: "+(s.head||"(ohne)")+"\nSECTION TEXT:\n"+s.body+"\n\nACTION: "+act;
 claude([{role:"user",content:payload}],SW_SECTION,1200).then(function(txt){var j=parseJSON(txt);if(j.section_de){SW.sections[i].body=j.section_de.replace(/^\n+|\n+$/g,"");syncLyricsFromSections();}SW.approved=false;SW.eval=null;renderStep();}).catch(function(e){busy(btn,false);alert("\u26a0 "+e.message);});
}

/* ===== Schritt 6 — Suno-Output (nur nach Freigabe erreichbar) ===== */
function step6(b){
 if(!SW.approved){
  b.innerHTML='<div class="sw-h">Schritt 6 \u00b7 Suno-Prompts</div><div class="sw-help">\ud83d\udd12 Dieser Schritt ist gesperrt, bis du in Schritt 5 den Songtext freigegeben hast.</div>';
  foot(b,5,"\u2190 Zur\u00fcck zum Songtext",function(){go(5);});
  return;
 }
 b.innerHTML='<div class="sw-h">Schritt 6 \u00b7 Suno-Prompts (kopierbar)</div>'+
 '<div class="sw-help">Zum Schluss bauen wir aus deinem freigegebenen Song zwei fertige Felder f\u00fcr Suno: den <b>Textprompt</b> (Lyrics mit [Abschnitts-Tags]) und den <b>Styleprompt</b> (Genre, Stimmung, Instrumente, Tempo, Tonart, Gesang). Beide direkt kopierbar.</div>'+
 '<button class="btn" id="swSuno" style="min-height:50px">\u2728 Suno-Prompts erzeugen</button><div id="swSunoErr" class="x-err"></div>'+
 (SW.suno_lyrics?'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px"><span class="tag" style="margin:0">Suno \u00b7 Textprompt (Custom Lyrics)</span><button class="cp" data-cp="swSunoLyr">kopieren</button></div><pre class="out" id="swSunoLyr">'+esc(SW.suno_lyrics)+'</pre>':"")+
 (SW.suno_style?'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><span class="tag" style="margin:0">Suno \u00b7 Styleprompt (Style of Music)</span><button class="cp" data-cp="swSunoSty">kopieren</button></div><pre class="out" id="swSunoSty">'+esc(SW.suno_style)+'</pre>':"");
 $id("swSuno").onclick=makeSuno;
 copyWire(b);
 var done=document.createElement("button");done.className="btn sec";done.textContent="Fertig \u2192 schlie\u00dfen";done.onclick=close;
 foot(b,5,"\u21bb Neu beginnen",function(){resetSession();},done);
}
function makeSuno(){var btn=$id("swSuno");if(!SW.lyrics){$id("swSunoErr").textContent="Noch kein Songtext \u2013 zur\u00fcck zu Schritt 5.";return;}busy(btn,true,"formatiert");$id("swSunoErr").textContent="";
 var payload="FINAL SONG TEXT:\n"+SW.lyrics+"\n\nDESIGN:\n"+designSummary()+"\nTITEL: "+(SW.title||"\u2014");
 claude([{role:"user",content:payload}],SW_SUNO,2600).then(function(txt){var j=parseJSON(txt);SW.suno_lyrics=j.suno_lyrics||"";SW.suno_style=j.suno_style||"";renderStep();}).catch(function(e){$id("swSunoErr").textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";busy(btn,false);});
}

/* ===== Launcher + Init ===== */
function mountLauncher(){
 var nav=$id("nav");
 if(nav&&!$id("swLaunch")){var btn=document.createElement("button");btn.id="swLaunch";btn.type="button";btn.textContent="\ud83c\udfb5 Songwriting";btn.onclick=function(){open();};nav.appendChild(btn);}
 if(!nav&&!$id("swLaunchFloat")){var fb=document.createElement("button");fb.id="swLaunchFloat";fb.textContent="\ud83c\udfb5 Songwriting";fb.style.cssText="position:fixed;right:18px;bottom:74px;z-index:9000;border:none;background:#7b61ff;color:#fff;font-weight:700;padding:12px 16px;border-radius:12px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)";fb.onclick=function(){open();};document.body.appendChild(fb);}
}
function init(){injectCSS();mountLauncher();}
function waitReady(tries){if($id("nav")||document.body){init();return;}if((tries||0)<40){setTimeout(function(){waitReady((tries||0)+1);},150);}else{init();}}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){waitReady(0);});}else{waitReady(0);}
})();
