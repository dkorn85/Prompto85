/* Prompto85 — Geführte Reise (Add-on)
 * Eigenständiges Modul: hängt sich an die bestehende index.html, ohne deren Logik zu verändern.
 * Spricht die App nur über globale Funktionen (addActors, openStyleGallery, render ...) und das DOM an.
 * Implementiert die 7-Schritt-Reise aus docs/05: Foto -> Stil -> Sheet-Prompt -> Sheet+QA -> Besetzungs-Gate -> Storywriter -> Daumenkino.
 * Einbau: <script src="prompto-guided.js"></script> direkt vor </body> in index.html.
 * Optional fuer volle Treue in Schritt 5/6: einmal window.S=S; window.STYLES=STYLES; im Inline-Script setzen.
 */
(function(){
"use strict";
if(window.__promptoGuided)return; window.__promptoGuided=true;

/* ===== lokale Helfer (keine Abhaengigkeit vom Inline-Scope) ===== */
function api(body){return fetch("./api.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});});}
function claude(messages,system,max){var eng=(window.S&&window.S.engine)||"claude-sonnet-4-6";return api({model:eng,max_tokens:max||3000,system:system,messages:messages}).then(function(res){var d=res.d;if(d&&d.error)throw new Error((d.error&&(d.error.message||d.error))||"API");if(!res.ok)throw new Error("HTTP");return ((d&&d.content)||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("\n");});}
function parseJSON(t){t=(t||"").replace(/```json|```/g,"").trim();var a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0)t=t.slice(a,b+1);return JSON.parse(t);}
function imgBlock(dataUrl){var m=(dataUrl||"").match(/^data:(image\/\w+);base64,(.+)$/);return m?{type:"image",source:{type:"base64",media_type:m[1],data:m[2]}}:null;}
function fitImage(dataUrl,maxEdge){return new Promise(function(res){var im=new Image();im.onload=function(){var w=im.width,h=im.height,s=Math.min(1,(maxEdge||1568)/Math.max(w,h));var cv=document.createElement("canvas");cv.width=Math.round(w*s);cv.height=Math.round(h*s);cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL("image/jpeg",0.85));};im.onerror=function(){res(dataUrl);};im.src=dataUrl;});}
function esc(s){return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function $id(id){return document.getElementById(id);}
function readFile(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result);};r.onerror=rej;r.readAsDataURL(file);});}

function styleTok(){var cu=$id("styleCustom");if(cu&&cu.value.trim())return cu.value.trim();if(window.S&&window.S.style)return window.S.style;var sel=$id("style");return sel?sel.value:"";}
function aspect(){return (window.S&&window.S.aspect)||"9:16";}
function brand(){var b=$id("brand");return (b&&b.value)||(window.S&&window.S.brand)||"Deutsch";}
function storyText(){var s=$id("story");return (s&&s.value)||"";}
function setStory(t){var s=$id("story");if(s){s.value=t;}}
function castSummary(){try{var A=(window.S&&window.S.cast&&window.S.cast.actors)||[];var sel=A.filter(function(a){return a.selected;});var use=sel.length?sel:A;return use.map(function(a){return "@"+((a.name||"Char").replace(/\s+/g,""))+" \u2014 "+(a.dna||"");}).join("\n");}catch(e){return "";}}
function castActors(){try{return (window.S&&window.S.cast&&window.S.cast.actors)||null;}catch(e){return null;}}

/* ===== System-Prompts ===== */
var SYS_SHEET_PHOTO="You are PROMPTO85. Look at the supplied REFERENCE PHOTO of a real person. Write ONE image prompt in ENGLISH for a 4K CHARACTER REFERENCE SHEET that PRESERVES this person's likeness (face shape, hair, build, distinctive features) rendered in the locked STYLE. The sheet shows the SAME single character in front, 3/4, profile and back views plus a row of facial expressions, on a plain greenscreen background, NO green tones on the character, consistent identity across all views, ONE identity figure only, and absolutely NO text/letters/numbers anywhere on the sheet. Reuse the STYLE token block. Return ONLY JSON: {\"prompt_en\":\"...\",\"notes_de\":\"kurze deutsche Notiz, was der Nutzer auf seiner Plattform tun soll\"}";
var SYS_SHEET_TEXT="You are PROMPTO85. Write ONE image prompt in ENGLISH for a 4K CHARACTER REFERENCE SHEET (front, 3/4, profile, back views plus a row of facial expressions), plain greenscreen background, NO green tones on the character, consistent identity, ONE identity figure only, NO text/letters/numbers anywhere. Use the locked CHARACTER DNA + STYLE. Return ONLY JSON: {\"prompt_en\":\"...\",\"notes_de\":\"kurze deutsche Notiz\"}";
var SYS_QA="You are PROMPTO85's quality check. Look at the uploaded CHARACTER SHEET (and the REFERENCE PHOTO if provided). Judge whether it is a usable, consistent character reference. Check: likeness to the reference photo (if given); consistency of the character across the views; clean plain/greenscreen background; NO green tones on the character itself; NO text/letters/numbers in the image; exactly ONE identity figure. Return ONLY JSON: {\"match_ok\":true,\"issues_de\":[\"kurze deutsche Probleme, leer wenn keine\"],\"tips_de\":[\"konkrete deutsche Tipps zum Nachbessern, leer wenn alles passt\"]}";
var SYS_STYLE_ADVICE="You are PROMPTO85's style consultant. The user describes mood, genre and audience. Recommend 2-3 fitting visual styles. Reply in GERMAN, concise. For EACH recommendation give: a name, one sentence why it fits, and a ready ENGLISH token block on its own line prefixed exactly with 'TOKEN: '. Keep it short.";
var SYS_STORYWRITER="You are PROMPTO85's STORYWRITER and storyboard director. Given the agreed STORY, the locked STYLE, the CAST (named characters with identity DNA), FORMAT and BRAND LANGUAGE: (1) tighten the story into a clear arc, (2) break it into SCENES. For EACH scene write a ready ENGLISH storyboard-sheet prompt that renders ONE multi-panel sheet (default 6 panels, 2x3) in the locked STYLE with the relevant cast (keep each character's DNA byte-identical, tag @Name). RULES: each panel is a STILL image (no time/motion verbs \u2014 translate to a visible pose); NO text, numbers or captions anywhere on the sheet; restate every stateful detail per panel; one panel = one beat; panels in the FORMAT orientation; one identity figure rule applies to character sheets not scene sheets. Return ONLY JSON: {\"story_de\":\"...\",\"scenes\":[{\"title_de\":\"...\",\"beats_de\":[\"...\"],\"cast_present\":[\"@Name\"],\"storyboard_prompt_en\":\"...\",\"notes_de\":\"...\"}]}";

/* ===== Zustand ===== */
var GS={step:1,refPhoto:null,refThumb:null,sheetPrompt:null,qa:null,scenes:null,story_de:null,flip:[],flipIdx:0,flipTimer:null,flipSpeed:1200,busy:false};
try{var saved=localStorage.getItem("pg_step");if(saved)GS.step=Math.min(7,Math.max(1,parseInt(saved,10)||1));}catch(e){}

/* ===== Styles injizieren ===== */
function injectCSS(){
 if($id("pgStyle"))return;
 var st=document.createElement("style");st.id="pgStyle";
 st.textContent=[
 "#pgLaunch{flex:0 0 auto;white-space:nowrap;border:none;background:linear-gradient(135deg,#0071e3,#5e5ce6);color:#fff;font-weight:700;font-size:13px;padding:9px 14px;border-radius:9px;cursor:pointer;font-family:var(--body)}",
 ".pg-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:20px}",
 ".pg-ov.open{display:flex}",
 ".pg-box{background:#fff;max-width:760px;width:100%;border-radius:18px;padding:18px 18px 22px;box-shadow:0 24px 70px rgba(0,0,0,.3)}",
 ".pg-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}",
 ".pg-x{border:none;background:#eee;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:16px}",
 ".pg-rail{display:flex;gap:5px;margin:8px 0 14px}",
 ".pg-seg{flex:1;height:6px;border-radius:99px;background:#e5e5ea;transition:background .2s}",
 ".pg-seg.done{background:#34c759}.pg-seg.cur{background:#0071e3}",
 ".pg-help{background:#eef4ff;border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.55;margin-bottom:14px;color:#1d1d1f}",
 ".pg-h{font-size:16px;font-weight:800;margin:0 0 5px}",
 ".pg-foot{display:flex;gap:8px;margin-top:16px}",
 ".pg-foot .btn{flex:1}",
 ".pg-thumb{max-width:100%;max-height:280px;border-radius:12px;border:1px solid #e8e8ed;margin-top:10px;display:block}",
 ".pg-note{background:#fff6e6;border-radius:10px;padding:10px 13px;font-size:12.5px;line-height:1.55;margin-top:10px}",
 ".pg-ok{background:#e7f8ec;border-radius:10px;padding:10px 13px;font-size:12.5px;line-height:1.55;margin-top:10px;color:#1a7f37}",
 ".pg-flipwrap{position:relative;background:#0b0b0c;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:300px;margin-top:10px}",
 ".pg-flipwrap img{max-width:100%;max-height:62vh;display:block}",
 ".pg-flipcap{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);color:#fff;font-size:12px;padding:7px 11px}",
 ".pg-flipctl{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}",
 ".pg-scene{border:1px solid var(--line2);border-radius:12px;padding:12px;margin-top:10px}",
 ".pg-scene h4{margin:0 0 4px;font-size:14px}"
 ].join("\n");
 document.head.appendChild(st);
}

/* ===== Overlay-Geruest ===== */
function ensureOverlay(){
 if($id("pgOv"))return;
 var ov=document.createElement("div");ov.id="pgOv";ov.className="pg-ov";
 ov.innerHTML='<div class="pg-box"><div class="pg-top"><b style="font-size:16px">\u2728 Prompto85 \u2014 Gef\u00fchrt</b><button class="pg-x" id="pgX">\u2715</button></div><div class="pg-rail" id="pgRail"></div><div id="pgBody"></div></div>';
 document.body.appendChild(ov);
 ov.addEventListener("click",function(e){if(e.target===ov)close();});
 $id("pgX").onclick=close;
}
function rail(){
 var r=$id("pgRail");if(!r)return;var h="";for(var i=1;i<=7;i++){var c="pg-seg"+(i<GS.step?" done":"")+(i===GS.step?" cur":"");h+='<div class="'+c+'" title="Schritt '+i+'"></div>';}r.innerHTML=h;
}
function open(step){injectCSS();ensureOverlay();if(step)GS.step=step;$id("pgOv").classList.add("open");renderStep();}
function close(){var o=$id("pgOv");if(o)o.classList.remove("open");stopFlip();}
function go(step){GS.step=Math.min(7,Math.max(1,step));try{localStorage.setItem("pg_step",String(GS.step));}catch(e){}renderStep();}

function busy(btn,on,label){if(!btn)return;if(on){btn.disabled=true;btn._o=btn.innerHTML;btn.innerHTML='<span class="spin"></span> '+(label||"\u2026");}else{btn.disabled=false;if(btn._o)btn.innerHTML=btn._o;}}
function copyBtnWire(scope){(scope||document).querySelectorAll("[data-cp]").forEach(function(b){b.onclick=function(){var pre=document.getElementById(b.getAttribute("data-cp"));if(pre&&navigator.clipboard)navigator.clipboard.writeText(pre.textContent);var o=b.textContent;b.textContent="kopiert";setTimeout(function(){b.textContent=o;},1000);};});}

/* ===== Schritt-Renderer ===== */
function renderStep(){rail();var b=$id("pgBody");if(!b)return;var fn=[step1,step2,step3,step4,step5,step6,step7][GS.step-1];fn(b);}

function foot(b,backStep,nextLabel,nextFn,opts){
 opts=opts||{};
 var f=document.createElement("div");f.className="pg-foot";
 if(backStep){var bk=document.createElement("button");bk.className="btn sec";bk.textContent="\u2190 Zur\u00fcck";bk.onclick=function(){go(backStep);};f.appendChild(bk);}
 if(opts.skip){var sk=document.createElement("button");sk.className="btn sec";sk.textContent=opts.skip;sk.onclick=opts.skipFn;f.appendChild(sk);}
 var nx=document.createElement("button");nx.className="btn";nx.textContent=nextLabel;nx.onclick=nextFn;f.appendChild(nx);
 b.appendChild(f);
}

/* Schritt 1 — Referenzfoto */
function step1(b){
 b.innerHTML='<div class="pg-h">Schritt 1 von 7 \u00b7 Deine Figur beginnt mit einem Bild</div>'+
 '<div class="pg-help">Lade ein Foto von dir \u2013 oder von der Person, die zur Figur werden soll. Daraus baut die KI dein Charactersheet. Am besten: Gesicht klar erkennbar, gutes Licht, frontal, wenig harte Schatten. Du kannst mehrere Figuren nacheinander anlegen.<br><br><i>Kein Foto zur Hand? \u00dcberspringe diesen Schritt und arbeite nur mit Text-DNA + Stil.</i></div>'+
 '<div class="drop" id="pgDrop1">Referenzfoto hier ablegen / tippen</div><input type="file" id="pgFile1" accept="image/*" hidden/>'+
 (GS.refThumb?'<img class="pg-thumb" src="'+GS.refThumb+'"/>':'');
 var z=$id("pgDrop1"),f=$id("pgFile1");
 z.onclick=function(){f.click();};
 ["dragover","dragenter"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.add("hot");});});
 ["dragleave","drop"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.remove("hot");});});
 z.addEventListener("drop",function(e){var x=[].slice.call(e.dataTransfer.files).filter(function(v){return v.type.indexOf("image/")===0;})[0];if(x)takePhoto(x);});
 f.onchange=function(e){if(e.target.files[0])takePhoto(e.target.files[0]);};
 foot(b,null,"Weiter zu Schritt 2 \u2192",function(){go(2);},{skip:"\u00dcberspringen",skipFn:function(){go(2);}});
}
function takePhoto(file){readFile(file).then(function(d){return Promise.all([fitImage(d,1568),fitImage(d,512)]);}).then(function(a){GS.refPhoto=a[0];GS.refThumb=a[1];renderStep();});}

/* Schritt 2 — Stil */
function step2(b){
 var cur=(window.S&&window.S.style)?"gesetzt":(($id("style")&&$id("style").value)||"\u2014");
 b.innerHTML='<div class="pg-h">Schritt 2 von 7 \u00b7 Der Look f\u00fcr alles</div>'+
 '<div class="pg-help">W\u00e4hle den visuellen Stil \u2013 \u00fcber die Galerie, einen eigenen Token-Block, oder lass dich von der KI beraten. Der Stil bleibt \u00fcber alle Figuren und Szenen gleich; das h\u00e4lt den Look konsistent.<br><br><i>Du willst bewusst einen neuen Look? Sag es ausdr\u00fccklich \u2013 sonst behalten wir den letzten bei.</i></div>'+
 '<button class="btn sec" id="pgGal">\ud83d\uddbc Stil-Galerie \u00f6ffnen</button>'+
 '<label style="display:block;margin-top:12px"><span class="tag">Eigener Token-Block</span><textarea id="pgCustom" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-family:var(--body);font-size:14px" placeholder="\u2026eigener Stil-Token-Block"></textarea></label>'+
 '<div style="margin-top:12px"><span class="tag">Mit KI beraten</span><input type="text" id="pgStyleAsk" placeholder="z.B. mystische Jugendserie, abends, ruhig" style="width:100%;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-family:var(--body);font-size:14px"/><button class="btn sec" id="pgStyleAdvise" style="margin-top:8px">Vorschl\u00e4ge holen</button><div id="pgStyleOut"></div></div>';
 var gal=$id("pgGal");gal.onclick=function(){if(typeof window.openStyleGallery==="function"){close();window.openStyleGallery();}else{alert("Galerie im Stil-Feld links verf\u00fcgbar.");}};
 var cu=$id("pgCustom");var liveCu=$id("styleCustom");if(liveCu&&liveCu.value)cu.value=liveCu.value;
 cu.oninput=function(){if(liveCu){liveCu.value=cu.value;if(window.S)window.S.custom=cu.value;}};
 $id("pgStyleAdvise").onclick=function(){var btn=this;var q=$id("pgStyleAsk").value.trim();if(!q)return;busy(btn,true,"denkt nach");
  claude([{role:"user",content:"MOOD/GENRE/AUDIENCE: "+q}],SYS_STYLE_ADVICE,1100).then(function(txt){$id("pgStyleOut").innerHTML='<div class="expl" style="margin-top:10px">'+esc(txt)+'</div><div class="small">Kopiere einen TOKEN-Block oben in \u201eEigener Token-Block\u201c.</div>';busy(btn,false);}).catch(function(e){$id("pgStyleOut").innerHTML='<div class="x-err">\u26a0 '+esc(e.message)+'</div>';busy(btn,false);});};
 foot(b,1,"Stil \u00fcbernehmen \u2192",function(){go(3);});
}

/* Schritt 3 — Sheet-Prompt */
function step3(b){
 b.innerHTML='<div class="pg-h">Schritt 3 von 7 \u00b7 Der Bau-Auftrag f\u00fcrs Charactersheet</div>'+
 '<div class="pg-help">Aus deinem Referenzfoto + dem Stil schreibt die KI einen fertigen Prompt f\u00fcr ein 4K-Charactersheet (Vorderansicht, 3/4, Profil, R\u00fcckansicht, Ausdrucksreihe). Greenscreen und \u201ekeine Gr\u00fcnt\u00f6ne an der Figur\u201c sind schon drin. Eine Identit\u00e4tsfigur pro Sheet = beste Treue.</div>'+
 (GS.refThumb?'<img class="pg-thumb" src="'+GS.refThumb+'"/>':'<div class="pg-note">Kein Referenzfoto gesetzt \u2013 die KI baut aus der Text-DNA (Feld links) + Stil. F\u00fcr Foto-Treue zur\u00fcck zu Schritt 1.</div>')+
 '<button class="btn" id="pgSheetGen" style="margin-top:12px">\u2728 Charactersheet-Prompt erzeugen</button><div id="pgSheetOut"></div>';
 $id("pgSheetGen").onclick=function(){var btn=this;busy(btn,true,"schreibt");
  var msgs,sys;
  if(GS.refPhoto){var ib=imgBlock(GS.refPhoto);sys=SYS_SHEET_PHOTO;msgs=[{role:"user",content:[ib,{type:"text",text:"STYLE: "+styleTok()+"\nFORMAT: "+aspect()}]}];}
  else{sys=SYS_SHEET_TEXT;var dna=($id("dna")&&$id("dna").value)||"[keine \u2014 erfinde eine plausible aus dem Stil]";msgs=[{role:"user",content:"CHARACTER DNA: "+dna+"\nSTYLE: "+styleTok()+"\nFORMAT: "+aspect()}];}
  claude(msgs,sys,1500).then(function(txt){var j=parseJSON(txt);GS.sheetPrompt=j.prompt_en||"";var out=$id("pgSheetOut");
   out.innerHTML=(j.notes_de?'<div class="expl" style="margin-top:12px">'+esc(j.notes_de)+'</div>':'')+
    '<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="cp" data-cp="pgSheetPre">kopieren</button></div>'+
    '<pre class="out" id="pgSheetPre">'+esc(GS.sheetPrompt)+'</pre>'+
    '<div class="pg-ok">So erstellst du es: \u00f6ffne GPT Image 2.0 oder Nano Banana Pro, lade dort dein Referenzfoto hoch und f\u00fcge diesen Prompt ein. Lade das Ergebnis dann in Schritt 4 hoch.</div>';
   copyBtnWire(out);busy(btn,false);
  }).catch(function(e){$id("pgSheetOut").innerHTML='<div class="x-err">\u26a0 '+esc(e.message)+' \u2014 Backend pr\u00fcfen (api.php).</div>';busy(btn,false);});};
 foot(b,2,"Auf meiner Plattform erstellt \u2192",function(){go(4);});
}

/* Schritt 4 — Sheet hochladen + QA */
function step4(b){
 b.innerHTML='<div class="pg-h">Schritt 4 von 7 \u00b7 Sheet hochladen, KI pr\u00fcft</div>'+
 '<div class="pg-help">Lade das fertige Charactersheet hoch. Die KI liest die Figur aus, vergibt Name + wiederverwendbare DNA (erscheint im Cast-Tab) \u2013 und sagt dir ehrlich, wenn etwas nicht passt: Gesicht weicht vom Foto ab, Ansichten uneinheitlich, Gr\u00fcnt\u00f6ne an der Figur, Text im Bild.</div>'+
 '<div class="drop" id="pgDrop4">Charactersheet hier ablegen / tippen</div><input type="file" id="pgFile4" accept="image/*" hidden/><div id="pgQaOut"></div>';
 var z=$id("pgDrop4"),f=$id("pgFile4");
 z.onclick=function(){f.click();};
 ["dragover","dragenter"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.add("hot");});});
 ["dragleave","drop"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.remove("hot");});});
 z.addEventListener("drop",function(e){var x=[].slice.call(e.dataTransfer.files).filter(function(v){return v.type.indexOf("image/")===0;})[0];if(x)takeSheet(x);});
 f.onchange=function(e){if(e.target.files[0])takeSheet(e.target.files[0]);};
 foot(b,3,"Weiter zu Schritt 5 \u2192",function(){go(5);});
}
function takeSheet(file){
 var out=$id("pgQaOut");out.innerHTML='<div class="small"><span class="spin"></span> analysiere \u2026</div>';
 // 1) in den App-Cast aufnehmen (nutzt die bestehende Pipeline, falls vorhanden)
 if(typeof window.addActors==="function"){try{window.addActors([file]);}catch(e){}}
 // 2) eigener QA-Pass (rein beratend)
 readFile(file).then(function(d){return fitImage(d,1568);}).then(function(big){
  var content=[imgBlock(big)];if(GS.refPhoto){content.push(imgBlock(GS.refPhoto));content.push({type:"text",text:"First image = character sheet to check. Second image = reference photo."});}else{content.push({type:"text",text:"Check this character sheet."});}
  return claude([{role:"user",content:content}],SYS_QA,900);
 }).then(function(txt){var j=parseJSON(txt);GS.qa=j;var issues=(j.issues_de||[]).filter(Boolean),tips=(j.tips_de||[]).filter(Boolean);
  var h='<div class="pg-ok">Figur hinzugef\u00fcgt \u2013 sie erscheint im Cast-Tab. Name &amp; DNA dort editierbar.</div>';
  if(!issues.length){h+='<div class="pg-ok">QA: sieht stimmig aus \u2713</div>';}
  else{h+='<div class="pg-note"><b>QA-Hinweise:</b><ul style="margin:6px 0 0;padding-left:18px">';issues.forEach(function(x){h+='<li>'+esc(x)+'</li>';});h+='</ul>';if(tips.length){h+='<b>Tipps:</b><ul style="margin:6px 0 0;padding-left:18px">';tips.forEach(function(x){h+='<li>'+esc(x)+'</li>';});h+='</ul>';}h+='</div>';}
  out.innerHTML=h;
 }).catch(function(e){out.innerHTML='<div class="pg-ok">Figur hinzugef\u00fcgt (Cast-Tab).</div><div class="x-err">QA \u00fcbersprungen: '+esc(e.message)+'</div>';});
}

/* Schritt 5 — Besetzung komplett? */
function step5(b){
 var A=castActors();var listHtml;
 if(A){if(!A.length)listHtml='<div class="pg-note">Noch keine Figuren \u2013 zur\u00fcck zu Schritt 1.</div>';
  else{listHtml='<div class="chips" style="margin-top:6px">'+A.map(function(a){return '<span class="chip'+(a.selected?" on":"")+'" style="display:inline-flex;align-items:center;gap:6px">'+(a.thumb?'<img src="'+a.thumb+'" style="width:20px;height:20px;border-radius:4px;object-fit:cover"/>':"")+esc(a.name||"?")+'</span>';}).join("")+'</div>';}
 }else{listHtml='<div class="pg-note">Deine Figuren siehst du im <b>Cast-Tab</b>. (F\u00fcr die Inline-Liste hier einmal <code>window.S=S</code> in der index.html setzen.)</div>';}
 b.innerHTML='<div class="pg-h">Schritt 5 von 7 \u00b7 Ist die Besetzung komplett?</div>'+
 '<div class="pg-help">Das ist deine Besetzung. Fehlt noch eine Figur f\u00fcr deine Szene? \u2192 <b>Weitere Figur anlegen</b> bringt dich zur\u00fcck zu Schritt 1. Sind alle da? \u2192 <b>weiter zur Story</b>.</div>'+listHtml;
 var f=document.createElement("div");f.className="pg-foot";
 var bk=document.createElement("button");bk.className="btn sec";bk.textContent="\u2190 Zur\u00fcck";bk.onclick=function(){go(4);};
 var more=document.createElement("button");more.className="btn sec";more.textContent="+ Weitere Figur";more.onclick=function(){GS.refPhoto=null;GS.refThumb=null;GS.sheetPrompt=null;GS.qa=null;go(1);};
 var nx=document.createElement("button");nx.className="btn";nx.textContent="Besetzung komplett \u2192";nx.onclick=function(){go(6);};
 f.appendChild(bk);f.appendChild(more);f.appendChild(nx);b.appendChild(f);
}

/* Schritt 6 — Storywriter */
function step6(b){
 b.innerHTML='<div class="pg-h">Schritt 6 von 7 \u00b7 Eure Geschichte</div>'+
 '<div class="pg-help">Schreib deine Story-Idee \u2013 der Storywriter macht daraus einen klaren Bogen und zerlegt ihn in Szenen, mit je einem fertigen Storyboard-Prompt (deine Besetzung, im Stil, ohne Text in den Panels). Du kannst die Idee frei formulieren.</div>'+
 '<label style="display:block"><span class="tag">Story-Idee</span><textarea id="pgStoryIdea" style="width:100%;min-height:80px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-family:var(--body);font-size:14px"></textarea></label>'+
 '<label style="display:block;margin-top:10px"><span class="tag">Besetzung (Name \u2014 DNA, pro Zeile)</span><textarea id="pgCastBox" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-family:var(--mono);font-size:12px"></textarea></label>'+
 '<button class="btn" id="pgStoryGo" style="margin-top:12px">\u2728 Story in Szenen + Storyboard-Prompts zerlegen</button><div id="pgStoryOut"></div>';
 $id("pgStoryIdea").value=storyText();
 $id("pgCastBox").value=castSummary();
 $id("pgStoryGo").onclick=function(){var btn=this;var idea=$id("pgStoryIdea").value.trim();if(!idea){return;}setStory(idea);var cast=$id("pgCastBox").value.trim();busy(btn,true,"schreibt");
  var payload="STORY: "+idea+"\nSTYLE: "+styleTok()+"\nFORMAT: "+aspect()+"\nBRAND LANGUAGE: "+brand()+(cast?"\nCAST:\n"+cast:"");
  claude([{role:"user",content:payload}],SYS_STORYWRITER,4000).then(function(txt){var j=parseJSON(txt);GS.scenes=j.scenes||[];GS.story_de=j.story_de||"";renderScenes();busy(btn,false);}).catch(function(e){$id("pgStoryOut").innerHTML='<div class="x-err">\u26a0 '+esc(e.message)+' \u2014 Backend pr\u00fcfen (api.php).</div>';busy(btn,false);});};
 if(GS.scenes)renderScenes();
 foot(b,5,"Weiter zu Schritt 7 \u2192",function(){go(7);});
}
function renderScenes(){var out=$id("pgStoryOut");if(!out)return;var h="";if(GS.story_de)h+='<div class="expl" style="margin-top:12px">'+esc(GS.story_de)+'</div>';
 (GS.scenes||[]).forEach(function(s,i){var pid="pgScenePre"+i;h+='<div class="pg-scene"><h4>Szene '+(i+1)+' \u00b7 '+esc(s.title_de||"")+'</h4>'+
  ((s.cast_present&&s.cast_present.length)?'<div class="small">Besetzung: '+esc(s.cast_present.join(", "))+'</div>':"")+
  ((s.beats_de&&s.beats_de.length)?'<div class="small" style="line-height:1.6">\u2022 '+s.beats_de.map(esc).join("<br>\u2022 ")+'</div>':"")+
  '<div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="cp" data-cp="'+pid+'">kopieren</button></div><pre class="out" id="'+pid+'">'+esc(s.storyboard_prompt_en||"")+'</pre>'+
  (s.notes_de?'<div class="small">'+esc(s.notes_de)+'</div>':"")+'</div>';});
 out.innerHTML=h;copyBtnWire(out);
}

/* Schritt 7 — Daumenkino */
function step7(b){
 b.innerHTML='<div class="pg-h">Schritt 7 von 7 \u00b7 Storyboards &amp; Daumenkino</div>'+
 '<div class="pg-help">Erstelle die Storyboard-Sheets (auf deiner Plattform, mit den Szenen-Prompts aus Schritt 6) und lade sie hier <b>in Reihenfolge</b> hoch. Prompto baut ein Daumenkino daraus: alle Sheets laufen nacheinander durch, damit du die ganze Story als Sequenz siehst und Br\u00fcche sofort erkennst.</div>'+
 '<div class="drop" id="pgDrop7">Storyboard-Sheets ablegen / tippen (mehrere)</div><input type="file" id="pgFile7" accept="image/*" multiple hidden/>'+
 '<div id="pgFlip"></div>';
 var z=$id("pgDrop7"),f=$id("pgFile7");
 z.onclick=function(){f.click();};
 ["dragover","dragenter"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.add("hot");});});
 ["dragleave","drop"].forEach(function(ev){z.addEventListener(ev,function(e){e.preventDefault();z.classList.remove("hot");});});
 z.addEventListener("drop",function(e){addFlip([].slice.call(e.dataTransfer.files).filter(function(v){return v.type.indexOf("image/")===0;}));});
 f.onchange=function(e){addFlip([].slice.call(e.target.files));};
 if(GS.flip.length)renderFlip();
 foot(b,6,"Fertig \u2192 schlie\u00dfen",function(){close();});
}
function addFlip(files){var titles=(GS.scenes||[]).map(function(s){return s.title_de||"";});
 var ps=files.map(function(f){return readFile(f).then(function(d){return fitImage(d,1280);});});
 Promise.all(ps).then(function(urls){urls.forEach(function(u,i){GS.flip.push({url:u,title:titles[GS.flip.length]||("Sheet "+(GS.flip.length+1))});});GS.flipIdx=0;renderFlip();});
}
function renderFlip(){var box=$id("pgFlip");if(!box)return;if(!GS.flip.length){box.innerHTML="";return;}
 if(GS.flipIdx>=GS.flip.length)GS.flipIdx=0;var cur=GS.flip[GS.flipIdx];
 box.innerHTML='<div class="pg-flipwrap"><img src="'+cur.url+'"/><div class="pg-flipcap">'+(GS.flipIdx+1)+' / '+GS.flip.length+' \u00b7 '+esc(cur.title||"")+'</div></div>'+
  '<div class="pg-flipctl"><button class="btn sec" id="pgPrev" style="width:auto;padding:9px 14px">\u2039</button>'+
  '<button class="btn" id="pgPlay" style="width:auto;padding:9px 16px">'+(GS.flipTimer?"\u23f8 Pause":"\u25b6 Abspielen")+'</button>'+
  '<button class="btn sec" id="pgNext" style="width:auto;padding:9px 14px">\u203a</button>'+
  '<span class="small" style="margin:0">Tempo</span><input type="range" id="pgSpeed" min="400" max="2500" step="100" value="'+GS.flipSpeed+'" style="flex:1;min-width:120px"/>'+
  '<button class="btn sec" id="pgClearFlip" style="width:auto;padding:9px 14px">Leeren</button></div>';
 $id("pgPrev").onclick=function(){stopFlip();GS.flipIdx=(GS.flipIdx-1+GS.flip.length)%GS.flip.length;renderFlip();};
 $id("pgNext").onclick=function(){stopFlip();GS.flipIdx=(GS.flipIdx+1)%GS.flip.length;renderFlip();};
 $id("pgPlay").onclick=function(){if(GS.flipTimer)stopFlip();else startFlip();renderFlip();};
 $id("pgSpeed").oninput=function(e){GS.flipSpeed=parseInt(e.target.value,10)||1200;if(GS.flipTimer){stopFlip();startFlip();}};
 $id("pgClearFlip").onclick=function(){stopFlip();GS.flip=[];GS.flipIdx=0;renderFlip();};
}
function startFlip(){if(GS.flip.length<2)return;GS.flipTimer=setInterval(function(){GS.flipIdx=(GS.flipIdx+1)%GS.flip.length;var box=$id("pgFlip");if(!box){stopFlip();return;}var cur=GS.flip[GS.flipIdx];var img=box.querySelector(".pg-flipwrap img");var cap=box.querySelector(".pg-flipcap");if(img)img.src=cur.url;if(cap)cap.textContent=(GS.flipIdx+1)+" / "+GS.flip.length+" \u00b7 "+(cur.title||"");},GS.flipSpeed);}
function stopFlip(){if(GS.flipTimer){clearInterval(GS.flipTimer);GS.flipTimer=null;}}

/* ===== Launcher + Init ===== */
function mountLauncher(){
 var nav=$id("nav");if(nav&&!$id("pgLaunch")){var btn=document.createElement("button");btn.id="pgLaunch";btn.type="button";btn.textContent="\u2728 Gef\u00fchrt";btn.onclick=function(){open();};nav.insertBefore(btn,nav.firstChild);}
 if(!nav&&!$id("pgLaunchFloat")){var fb=document.createElement("button");fb.id="pgLaunchFloat";fb.textContent="\u2728 Gef\u00fchrt";fb.style.cssText="position:fixed;right:18px;bottom:18px;z-index:9000;border:none;background:#0071e3;color:#fff;font-weight:700;padding:12px 16px;border-radius:12px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)";fb.onclick=function(){open();};document.body.appendChild(fb);}
}
function firstRun(){try{if(!localStorage.getItem("pg_seen")){localStorage.setItem("pg_seen","1");open(1);}}catch(e){}}
function init(){injectCSS();mountLauncher();firstRun();}
function waitReady(tries){if($id("nav")||document.body){init();return;}if((tries||0)<40){setTimeout(function(){waitReady((tries||0)+1);},150);}else{init();}}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){waitReady(0);});}else{waitReady(0);}
})();
