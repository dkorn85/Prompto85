/* Prompto85 — Therapeutisches Songwriting (Add-on)
 * Eigenstaendiges Modul wie prompto-guided.js: neuer Tab, spricht die App nur ueber das DOM/globale Funktionen an,
 * veraendert die bestehende Logik nicht. Eigenes IIFE -> ein Fehler hier kann index.html nicht brechen.
 * Flow: Begruessung+Richtung -> Assets lesen -> Themen-Mindmap (nach Wichtigkeit sortiert) ->
 *       Gestaltung (Takt/Rhythmus/Tonart/Stimmung/Instrumente/Genre/Songschema) -> gemeinsamer Songtext ->
 *       formatierter Suno-Textprompt + Styleprompt (kopierbar).
 * Einbau: <script src="prompto-songwriter.js"></script> direkt vor </body> in index.html.
 * Haltung: kreativer Begleiter, KEIN Therapieersatz. Bei Krise behutsam zu echter Hilfe leiten.
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

/* ===== Persona + System-Prompts ===== */
var P="You are the PROMPTO85 Songwriting Companion \u2014 a warm, gentle, emotionally intelligent co-writer for therapeutic songwriting. You help the user turn what moves them into a song. Be supportive and validating WITHOUT amplifying distress. You are NOT a therapist and do not diagnose; this is creative self-expression, not treatment. If the user expresses crisis, self-harm or suicidal thoughts, respond with genuine warmth, gently encourage them to reach out to someone they trust or professional support, and do NOT produce content that details or glorifies self-harm. Reply in GERMAN unless the user's material is clearly in another language. Keep a calm, caring, encouraging tone.";
var SW_THEMES=P+" From the user's DIRECTION and any ASSETS (texts/images), sensitively surface the emotional THEMES that could become a song. Return ONLY JSON: {\"reflection_de\":\"1-2 warme deutsche Saetze, was du heraushoerst\",\"themes\":[{\"title_de\":\"kurzer Themen-Titel\",\"note_de\":\"1 Satz worum es geht\"}]}";
var SW_SORT=P+" Given the THEMES with the user's own importance ratings, merge duplicates and sort by importance to the user (most important first). Keep the user's ratings. Return ONLY JSON: {\"themes\":[{\"title_de\":\"...\",\"note_de\":\"...\",\"importance\":\"hoch|mittel|niedrig\"}]}";
var SW_LYRICS=P+" Write a complete, singable SONG TEXT in the user's language from the prioritised THEMES and the DESIGN choices (genre, mood, key, time signature, tempo/feel, instruments, structure schema). Honor the structure schema with clear section headings (Intro/Strophe/Pre-Refrain/Refrain/Bridge/Outro ...). Make the chorus memorable and the verses concrete and personal; authentic, hopeful where it fits, never clinical. Return ONLY JSON: {\"title_de\":\"Songtitel\",\"lyrics_de\":\"vollstaendiger Songtext mit Abschnitts-Ueberschriften\",\"note_de\":\"1 warmer Satz\"}";
var SW_REFINE=P+" Revise the SONG TEXT according to the user's WISH. Keep what already works; change only what the wish asks for. Return ONLY JSON: {\"lyrics_de\":\"vollstaendiger ueberarbeiteter Songtext\"}";
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
var SW={step:1,direction:"",assets:[],themes:[],
 design:{genre:GENRES[0],mood:[],key:"egal",timesig:"4/4",bpm:84,feel:"straight",instruments:[],schema:SCHEMAS[0].v,schemaCustom:""},
 title:"",lyrics:"",suno_lyrics:"",suno_style:""};
try{var s=localStorage.getItem("sw_step");if(s)SW.step=Math.min(6,Math.max(1,parseInt(s,10)||1));}catch(e){}

/* ===== Styles ===== */
function injectCSS(){
 if($id("swStyle"))return;var st=document.createElement("style");st.id="swStyle";
 st.textContent=[
 "#swLaunch{flex:0 0 auto;white-space:nowrap;border:none;background:linear-gradient(135deg,#7b61ff,#d65db1);color:#fff;font-weight:700;font-size:13px;padding:9px 14px;border-radius:9px;cursor:pointer;font-family:var(--body)}",
 ".sw-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:20px}",
 ".sw-ov.open{display:flex}",
 ".sw-box{background:#fff;max-width:780px;width:100%;border-radius:18px;padding:18px 18px 22px;box-shadow:0 24px 70px rgba(0,0,0,.3)}",
 ".sw-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}",
 ".sw-x{border:none;background:#eee;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:16px}",
 ".sw-rail{display:flex;gap:5px;margin:8px 0 14px}",
 ".sw-seg{flex:1;height:6px;border-radius:99px;background:#e5e5ea}.sw-seg.done{background:#34c759}.sw-seg.cur{background:#7b61ff}",
 ".sw-help{background:#f3efff;border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.55;margin-bottom:14px;color:#1d1d1f}",
 ".sw-h{font-size:16px;font-weight:800;margin:0 0 5px}",
 ".sw-foot{display:flex;gap:8px;margin-top:16px}.sw-foot .btn{flex:1}",
 ".sw-field{display:block;margin-top:12px}.sw-field .tag{display:block;margin-bottom:6px}",
 ".sw-sel,.sw-ta,.sw-in{width:100%;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-family:var(--body);font-size:14px;background:#fff}",
 ".sw-ta{min-height:74px;resize:vertical}",
 ".sw-lyrics{background:var(--soft);border-radius:12px;padding:14px;font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:10px}",
 ".sw-theme{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid var(--line2);border-radius:12px;padding:10px;margin-top:8px}",
 ".sw-imp{display:flex;gap:5px}.sw-imp .chip{padding:5px 10px;font-size:12px}",
 ".sw-asset{display:inline-flex;align-items:center;gap:6px;background:var(--soft);border-radius:9px;padding:6px 10px;font-size:12px;margin:6px 6px 0 0}"
 ].join("\n");
 document.head.appendChild(st);
}

/* ===== Overlay ===== */
function ensureOverlay(){
 if($id("swOv"))return;
 var ov=document.createElement("div");ov.id="swOv";ov.className="sw-ov";
 ov.innerHTML='<div class="sw-box"><div class="sw-top"><b style="font-size:16px">\ud83c\udfb5 Therapeutisches Songwriting</b><button class="sw-x" id="swX">\u2715</button></div><div class="sw-rail" id="swRail"></div><div id="swBody"></div></div>';
 document.body.appendChild(ov);
 ov.addEventListener("click",function(e){if(e.target===ov)close();});
 $id("swX").onclick=close;
}
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

/* ===== Schritt-Renderer ===== */
function renderStep(){rail();var b=$id("swBody");if(!b)return;[step1,step2,step3,step4,step5,step6][SW.step-1](b);}

/* Schritt 1 — Begruessung + Richtung */
function step1(b){
 b.innerHTML='<div class="sw-h">Willkommen \u2728</div>'+
 '<div class="sw-help">Hier verwandeln wir gemeinsam das, was dich bewegt, in einen Song. Es geht nicht um perfekte Reime, sondern um <b>deinen Ausdruck</b>. Das hier ist ein kreativer Begleiter \u2013 kein Ersatz f\u00fcr professionelle Unterst\u00fctzung. Wenn dir etwas schwer auf dem Herzen liegt, ist es v\u00f6llig okay, dir auch echte Menschen an die Seite zu holen.<br><br>In welche Richtung soll es gehen? Worum oder um wen geht es? Welches Gef\u00fchl soll der Song tragen?</div>'+
 '<label class="sw-field"><span class="tag">Deine Richtung</span><textarea class="sw-ta" id="swDir" placeholder="z.B. Ein Lied f\u00fcr meine Schwester, \u00fcber Loslassen und Dankbarkeit \u2026">'+esc(SW.direction)+'</textarea></label>';
 $id("swDir").oninput=function(e){SW.direction=e.target.value;};
 foot(b,null,"Weiter \u2192 Material",function(){go(2);});
}

/* Schritt 2 — Assets */
function step2(b){
 b.innerHTML='<div class="sw-h">Schritt 2 \u00b7 Material hinzuf\u00fcgen (optional)</div>'+
 '<div class="sw-help">Leg gern Bilder, Notizen, Tagebuch- oder Textdateien dazu \u2013 alles, was die KI lesen kann. Sie h\u00f6rt sensibel heraus, welche Themen und Gef\u00fchle darin stecken, und macht daraus Roh-Material f\u00fcr deinen Songtext. Du kannst auch ohne Material weitermachen.</div>'+
 '<div class="drop" id="swDrop">Bilder / Textdateien ablegen oder tippen</div><input type="file" id="swFile" accept="image/*,text/*,.txt,.md,.csv,.json,.srt,.rtf,.log,.lrc" multiple hidden/>'+
 '<div id="swAssets">'+assetList()+'</div>'+
 '<button class="btn" id="swExtract" style="margin-top:13px">\u2728 Themen heraush\u00f6ren</button><div id="swThemesOut" class="x-err"></div>';
 var z=$id("swDrop"),f=$id("swFile");
 z.onclick=function(){f.click();};
 ["dragover","dragenter"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.add("hot");});});
 ["dragleave","drop"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.remove("hot");});});
 z.addEventListener("drop",function(e){addAssets([].slice.call(e.dataTransfer.files));});
 f.onchange=function(e){addAssets([].slice.call(e.target.files));};
 $id("swExtract").onclick=extractThemes;
 foot(b,1,"Weiter \u2192 Themen",function(){go(3);});
}
function assetList(){if(!SW.assets.length)return"";return SW.assets.map(function(a,i){return '<span class="sw-asset">'+(a.kind==="image"?"\ud83d\uddbc":"\ud83d\udcc4")+' '+esc(a.name)+' <button class="cp" data-del="'+i+'" style="color:#a11">\u2715</button></span>';}).join("");}
function refreshAssets(){var el=$id("swAssets");if(el){el.innerHTML=assetList();el.querySelectorAll("[data-del]").forEach(function(btn){btn.onclick=function(){SW.assets.splice(+btn.getAttribute("data-del"),1);refreshAssets();};});}}
function addAssets(files){var ps=files.map(function(f){
  if(f.type&&f.type.indexOf("image/")===0){return readDataURL(f).then(function(d){return fitImage(d,1568);}).then(function(u){SW.assets.push({kind:"image",name:f.name||"Bild",data:u});});}
  if(isTextFile(f)){return readText(f).then(function(t){SW.assets.push({kind:"text",name:f.name||"Text",text:(t||"").slice(0,8000)});});}
  SW.assets.push({kind:"skip",name:(f.name||"Datei")+" (Format nicht lesbar)"});return Promise.resolve();
 });
 Promise.all(ps).then(refreshAssets);
}
function assetBlocks(){var out=[];SW.assets.forEach(function(a){if(a.kind==="image"){var ib=imgBlock(a.data);if(ib)out.push(ib);}else if(a.kind==="text"){out.push({type:"text",text:"DATEI \u201e"+a.name+"\u201c:\n"+a.text});}});return out;}
function extractThemes(){var btn=$id("swExtract");busy(btn,true,"h\u00f6rt zu");$id("swThemesOut").textContent="";
 var content=assetBlocks();content.push({type:"text",text:"RICHTUNG DES NUTZERS: "+(SW.direction||"(frei)")+"\n\nH\u00f6re die Themen heraus."});
 claude([{role:"user",content:content}],SW_THEMES,1600).then(function(txt){var j=parseJSON(txt);
  (j.themes||[]).forEach(function(t){SW.themes.push({title:t.title_de||"",note:t.note_de||"",importance:"mittel"});});
  SW._reflection=j.reflection_de||"";go(3);
 }).catch(function(e){$id("swThemesOut").textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php). Du kannst Themen auch im n\u00e4chsten Schritt selbst eintragen.";busy(btn,false);});
}

/* Schritt 3 — Themen-Mindmap */
function step3(b){
 var refl=SW._reflection?'<div class="expl">'+esc(SW._reflection)+'</div>':"";
 var list=SW.themes.length?SW.themes.map(function(t,i){return '<div class="sw-theme"><div><b>'+esc(t.title||("Thema "+(i+1)))+'</b><div class="small">'+esc(t.note||"")+'</div></div><div class="sw-imp" data-i="'+i+'">'+
   ["hoch","mittel","niedrig"].map(function(v){return '<button type="button" class="chip'+(t.importance===v?" on":"")+'" data-imp="'+v+'">'+v+'</button>';}).join("")+'</div></div>';}).join(""):'<div class="small">Noch keine Themen \u2013 trag unten dein erstes ein.</div>';
 b.innerHTML='<div class="sw-h">Schritt 3 \u00b7 Deine Themen \u2013 wie eine Mindmap</div>'+
 '<div class="sw-help">Das sind die Themen, die wir heraush\u00f6ren. Markiere bei jedem, wie <b>wichtig</b> es dir ist. Die KI sortiert dann nach deiner Gewichtung \u2013 das Wichtigste tr\u00e4gt den Song. Du kannst eigene Themen erg\u00e4nzen.</div>'+
 refl+'<div id="swThemeList">'+list+'</div>'+
 '<div class="sw-field" style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1"><span class="tag">Eigenes Thema</span><input class="sw-in" id="swNewTheme" placeholder="Was geh\u00f6rt noch rein?"/></div><button class="btn sec" id="swAddTheme" style="width:auto;padding:11px 14px">+ Hinzuf\u00fcgen</button></div>'+
 '<button class="btn" id="swSort" style="margin-top:13px">\u2728 Nach Wichtigkeit sortieren</button><div id="swSortErr" class="x-err"></div>';
 wireThemes();
 $id("swAddTheme").onclick=function(){var v=$id("swNewTheme").value.trim();if(v){SW.themes.push({title:v,note:"",importance:"hoch"});renderStep();}};
 $id("swSort").onclick=sortThemes;
 foot(b,2,"Weiter \u2192 Gestaltung",function(){go(4);});
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
 '<div class="sw-field"><span class="tag">Instrumente (mehrere m\u00f6glich)</span><div class="chips" id="swInstr">'+chips(INSTRUMENTS,d.instruments,true)+'</div><input class="sw-in" id="swInstrCustom" style="margin-top:8px" placeholder="weitere Instrumente, kommagetrennt \u2026"/></div>'+
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
 foot(b,3,"Weiter \u2192 Songtext",function(){go(5);});
}
function designSummary(){var d=SW.design;var instr=d.instruments.concat((d.instrCustom||"").split(",").map(function(x){return x.trim();}).filter(Boolean));
 return "Genre: "+d.genre+"\nStimmung: "+(d.mood.join(", ")||"offen")+"\nTonart: "+d.key+"\nTakt: "+d.timesig+"\nTempo: "+d.bpm+" BPM ("+d.feel+")\nInstrumente: "+(instr.join(", ")||"offen")+"\nSongschema: "+((d.schema==="" ? (d.schemaCustom||"frei") : d.schema));}

/* Schritt 5 — Songtext */
function step5(b){
 var themes=SW.themes.slice().sort(function(a,c){var o={hoch:0,mittel:1,niedrig:2};return (o[a.importance]||1)-(o[c.importance]||1);});
 b.innerHTML='<div class="sw-h">Schritt 5 \u00b7 Euer Songtext</div>'+
 '<div class="sw-help">Jetzt schreiben wir den Text \u2013 aus deinen wichtigsten Themen, in deinem Sound. Du kannst danach jeden Wunsch \u00e4u\u00dfern (\u201eRefrain hoffnungsvoller\u201c, \u201eweniger Reime\u201c \u2026) und die KI \u00fcberarbeitet.</div>'+
 '<button class="btn" id="swWrite" style="margin-bottom:4px">\u2728 Songtext schreiben</button><div id="swLyrErr" class="x-err"></div>'+
 (SW.title?'<div class="tag" style="margin-top:12px">Titel</div><b>'+esc(SW.title)+'</b>':"")+
 (SW.lyrics?'<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="cp" data-cp="swLyrEl">kopieren</button></div><div class="sw-lyrics" id="swLyrEl">'+esc(SW.lyrics)+'</div>'+
   '<div class="sw-field" style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1"><span class="tag">\u00c4nderungswunsch</span><input class="sw-in" id="swWish" placeholder="z.B. Bridge zarter, mehr Bild von Meer \u2026"/></div><button class="btn sec" id="swRefine" style="width:auto;padding:11px 14px">\u00dcberarbeiten</button></div>':"");
 $id("swWrite").onclick=writeLyrics;
 if($id("swRefine"))$id("swRefine").onclick=refineLyrics;
 copyWire(b);
 foot(b,4,"Weiter \u2192 Suno-Prompts",function(){go(6);});
}
function writeLyrics(){var btn=$id("swWrite");busy(btn,true,"schreibt");$id("swLyrErr").textContent="";
 var themes=SW.themes.slice().sort(function(a,c){var o={hoch:0,mittel:1,niedrig:2};return (o[a.importance]||1)-(o[c.importance]||1);});
 var payload="THEMEN (wichtigste zuerst):\n"+themes.map(function(t){return "- ["+t.importance+"] "+t.title+(t.note?": "+t.note:"");}).join("\n")+"\n\nRICHTUNG: "+(SW.direction||"\u2014")+"\n\nDESIGN:\n"+designSummary();
 claude([{role:"user",content:payload}],SW_LYRICS,2600).then(function(txt){var j=parseJSON(txt);SW.title=j.title_de||"";SW.lyrics=j.lyrics_de||"";renderStep();}).catch(function(e){$id("swLyrErr").textContent="\u26a0 "+e.message+" \u2014 Backend pr\u00fcfen (api.php).";busy(btn,false);});
}
function refineLyrics(){var wish=$id("swWish").value.trim();if(!wish)return;var btn=$id("swRefine");busy(btn,true,"\u00fcberarbeitet");
 claude([{role:"user",content:"SONG TEXT:\n"+SW.lyrics+"\n\nWISH: "+wish}],SW_REFINE,2600).then(function(txt){var j=parseJSON(txt);if(j.lyrics_de)SW.lyrics=j.lyrics_de;renderStep();}).catch(function(e){busy(btn,false);alert("\u26a0 "+e.message);});
}

/* Schritt 6 — Suno-Output */
function step6(b){
 b.innerHTML='<div class="sw-h">Schritt 6 \u00b7 Suno-Prompts (kopierbar)</div>'+
 '<div class="sw-help">Zum Schluss bauen wir aus deinem Song zwei fertige Felder f\u00fcr Suno: den <b>Textprompt</b> (Lyrics mit [Abschnitts-Tags]) und den <b>Styleprompt</b> (Genre, Stimmung, Instrumente, Tempo, Tonart, Gesang). Beide direkt kopierbar.</div>'+
 '<button class="btn" id="swSuno">\u2728 Suno-Prompts erzeugen</button><div id="swSunoErr" class="x-err"></div>'+
 (SW.suno_lyrics?'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px"><span class="tag" style="margin:0">Suno \u00b7 Textprompt (Custom Lyrics)</span><button class="cp" data-cp="swSunoLyr">kopieren</button></div><pre class="out" id="swSunoLyr">'+esc(SW.suno_lyrics)+'</pre>':"")+
 (SW.suno_style?'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span class="tag" style="margin:0">Suno \u00b7 Styleprompt (Style of Music)</span><button class="cp" data-cp="swSunoSty">kopieren</button></div><pre class="out" id="swSunoSty">'+esc(SW.suno_style)+'</pre>':"");
 $id("swSuno").onclick=makeSuno;
 copyWire(b);
 var done=document.createElement("button");done.className="btn sec";done.textContent="Fertig \u2192 schlie\u00dfen";done.onclick=close;
 foot(b,5,"Neu beginnen",function(){if(confirm("Songwriting zur\u00fccksetzen?")){SW.direction="";SW.assets=[];SW.themes=[];SW.title="";SW.lyrics="";SW.suno_lyrics="";SW.suno_style="";SW._reflection="";go(1);}},done);
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
