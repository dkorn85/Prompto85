import React, { useState, useMemo } from "react";
import { Copy, Check, Sparkles, Film, Image as ImageIcon, Scissors, Loader2, ChevronDown } from "lucide-react";

/* ============================================================
   PROMPTO85 — prompt engine for Seedance 2.0, Kling 3.0/Omni,
   HappyHorse 1.0, Veo 3.1, Gemini Omni, GPT Image 2, Nano Banana Pro.
   Builds a model-agnostic master storyboard, then CUTs it into
   model-correct prompts. Optional Claude enhancement.
   ============================================================ */

const STYLES = [
  { g: "Project DNA", name: "Dirty Sacred (Chazon)", token: "minimal dark sacred aesthetic, near-monochrome, single-source light in darkness, fine particulate haze, sacred geometry motifs, restrained palette, hyperreal precision, slow contemplative motion" },
  { g: "Project DNA", name: "Precision Object (Elements)", token: "physical precision object under single-source light, SEM/CERN reference aesthetic, near-monochromatic, clean large-format, extreme surface detail, black void background, volumetric light" },
  { g: "Anime/Manga", name: "Records-of-Ragnarök-style", token: "high-contrast anime, mythic god-versus-human duel energy, hyper-muscular dramatic character art, bold inked outlines, intense speed lines and impact bursts, divine aura glow, dramatic low angles, saturated dramatic lighting, ornate mythological costume detail" },
  { g: "Anime/Manga", name: "Shonen Action", token: "cel-shaded shonen anime, dynamic action pose, motion-line speed streaks, vivid saturated palette, hard rim light, energy effects, dramatic foreshortening, bold black outlines" },
  { g: "Anime/Manga", name: "Painterly (Ghibli-tradition)", token: "painterly anime, lush hand-painted watercolor backgrounds, soft natural light, gentle pastel-natural palette, warm humanist mood, detailed nature, cozy atmosphere" },
  { g: "Cinematic", name: "Epic Blockbuster", token: "65mm large-format, anamorphic horizontal flare, oval bokeh, teal-orange grade, low-angle, volumetric haze, deep focus, cinematic contrast" },
  { g: "Cinematic", name: "Neo-Noir Neon", token: "low-key neon practicals, magenta and cyan, wet reflective streets, halation, desaturated mids, crushed blacks, shallow depth of field" },
  { g: "Cinematic", name: "70s New Hollywood", token: "1970s film stock, warm faded Kodak palette, heavy grain, soft contrast, naturalistic available light, anamorphic, slightly desaturated, lived-in realism" },
  { g: "Cinematic", name: "Brutalist Sci-Fi", token: "brutalist concrete architecture, cold steel-blue palette, hard overhead light, deep shadow, fog, monumental scale, clinical sci-fi, anamorphic widescreen" },
  { g: "Cinematic", name: "Film Noir", token: "black-and-white film noir, hard low-key key light, venetian-blind shadows, deep blacks, smoke, wet streets, dramatic chiaroscuro, 1940s mood" },
  { g: "Cinematic", name: "Cosmic Horror", token: "cosmic horror, sickly green-teal palette, low-key fog, suggestion not reveal, unnatural scale, grain, desaturated, dread atmosphere, deep blacks" },
  { g: "Photography", name: "Editorial Fashion", token: "high-fashion editorial, sculpted studio strobe, glossy skin, bold color block backdrop, sharp 85mm, confident pose, magazine polish" },
  { g: "Photography", name: "Golden-Hour Portrait", token: "golden-hour portrait, soft backlight rim, warm amber glow, creamy bokeh, 85mm, gentle skin tones, hazy lens bloom" },
  { g: "Photography", name: "Product Macro", token: "macro product photography, single softbox key, glossy specular highlights, seamless gradient backdrop, razor-sharp detail, controlled reflections" },
  { g: "Photography", name: "Documentary", token: "photojournalistic, available light, 35mm reportage, natural grain, candid decisive-moment framing, muted real palette, honest texture" },
  { g: "Illustration", name: "Risograph", token: "risograph print, 2-color duotone fluoro pink and blue, visible halftone grain, slight misregistration, flat shapes, retro zine aesthetic" },
  { g: "Illustration", name: "Art Nouveau", token: "Art Nouveau, flowing organic linework, ornamental floral borders, muted jewel palette, gold accents, decorative flat panels, elegant curves" },
  { g: "Illustration", name: "Ukiyo-e Woodblock", token: "ukiyo-e woodblock, flat color planes, bold outline, traditional Japanese palette, wave and cloud motifs, layered depth, paper texture" },
  { g: "Fine Art", name: "Baroque Chiaroscuro", token: "baroque oil painting, dramatic chiaroscuro, single divine light source, rich dark palette, sculpted flesh, theatrical gesture, deep shadow" },
  { g: "Fine Art", name: "Sumi-e Ink Wash", token: "sumi-e ink wash, minimal expressive brushstrokes, vast negative space, monochrome black on rice paper, zen restraint, single subject" },
  { g: "3D/Digital", name: "Claymation", token: "stop-motion claymation, visible fingerprint texture, soft practical studio light, miniature set, slight imperfection, tactile handmade charm" },
  { g: "3D/Digital", name: "Y2K Chrome", token: "Y2K aesthetic, liquid chrome blobs, iridescent holographic gradients, glossy plastic, lens-flare sparkle, techno-optimist palette" },
];

const MODELS = [
  { id: "gpt", name: "GPT Image 2", type: "image", note: "8 consistent stills · text ~99% · brief format" },
  { id: "nano", name: "Nano Banana Pro", type: "image", note: "up to ~14 refs · 4K · natural-language prose" },
  { id: "seedance", name: "Seedance 2.0", type: "video", note: "@asset refs · 1 action + 1 move/clip · ≤15s" },
  { id: "kling", name: "Kling 3.0 / Omni", type: "video", note: "native storyboard · ≤6 shots / 15s · shot list" },
  { id: "happy", name: "HappyHorse 1.0", type: "video", note: "joint video+audio · best single clip · audio always on" },
  { id: "veo", name: "Veo 3.1", type: "video", note: "photoreal humans · native audio · ~6–8s" },
  { id: "omni", name: "Gemini Omni", type: "video", note: "any input → video · conversational edit · ~10s" },
];

const ASPECTS = ["9:16", "16:9", "21:9", "1:1"];

// ---------- generation helpers ----------
const beatsFrom = (brief, n) => {
  const parts = brief.split(/[.;\n]+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < n; i++) out.push(parts[i] || `beat ${i + 1} — [describe one action]`);
  return out;
};

function buildMaster({ brief, style, dna, aspect, dur, n }) {
  const beats = beatsFrom(brief, n);
  const per = (dur / n).toFixed(1);
  const head = `TITLE: ${brief.slice(0, 48) || "untitled"}\nSTYLE (locked): ${style}\nCHARACTER DNA (locked): ${dna || "—"}\nASPECT: ${aspect} · TOTAL: ${dur}s · ${n} panels`;
  const panels = beats
    .map(
      (b, i) =>
        `PANEL ${i + 1}\n  beat: ${b}\n  shot: [size + angle]\n  lens: [focal + format]\n  camera: [ONE move]\n  light: [key/quality/direction]\n  duration: ${per}s\n  audio: ambient bed only (voice + hard SFX → ElevenLabs)\n  transition: [cut/match/fade]`
    )
    .join("\n");
  return `${head}\n\n${panels}`;
}

function cut(model, { brief, style, dna, aspect, dur, n }) {
  const beats = beatsFrom(brief, n);
  const S = style;
  const D = dna ? ` ${dna}.` : "";
  switch (model) {
    case "gpt":
      return beats
        .map(
          (b, i) =>
            `# Panel ${i + 1}/${n}\nJob: storyboard panel ${i + 1} of ${n}.\nSubject:${D} ${b} — frozen at the decisive instant.\nComposition: [shot size], [angle], centered, depth layers, negative space.\nStyle: ${S}.\nConstraints: single clear focal point, no watermark, no extra objects.\nAspect ratio: ${aspect}.`
        )
        .join("\n\n");
    case "nano":
      return beats
        .map(
          (b, i) =>
            `# Panel ${i + 1}/${n}\n${dna ? dna + ", " : ""}${b}, at the decisive moment. [composition / camera angle]. [lighting / atmosphere]. ${S}. Aspect ${aspect}. Render any on-image text exactly as written in quotes.`
        )
        .join("\n\n");
    case "seedance": {
      const clips = beats.slice(0, 3);
      const body = clips
        .map(
          (b, i) =>
            `Clip${i + 1} — Subject:${D} . Action: ${b} (one beat). Camera: [shot size] + [ONE move]. Style: ${S}. Refs: use composition from @Image${i + 1}; follow camera from @Video1. Audio: ambient only.`
        )
        .join("\n");
      const stitch = clips.map((_, i) => `[Clip${i + 1}]`).join(" + transition + connect to ");
      return `${body}\n\nStitch (≤15s): ${stitch}\nNegatives: no morphing, no jitter, no extra limbs, no identity drift.`;
    }
    case "kling": {
      const shots = beats.slice(0, 6);
      const per = (dur / shots.length).toFixed(0);
      const head = `STYLE: ${S}. CHARACTERS: ${dna || "[DNA]"} (max 4). ASPECT: ${aspect}. IMAX handheld realism, realistic physics, no wide shots.`;
      const list = shots
        .map((b, i) => `Shot ${i + 1} (${per}s): [shot size] ${b} [ONE camera move] [light]. Firstframe–Transition–Lastframe.`)
        .join("\n");
      return `${head}\n${list}\nNative audio: [language] voice, natural lip-sync (final take only; keep OFF while iterating).\nOmni: bind identity via Element @char; reference @char each shot.`;
    }
    case "happy":
      return `A ${dur}s cinematic shot, ${aspect}.\nSubject:${D} Action: ${beats[0]} (one beat). Camera: [shot size] + [ONE move]. Lighting: [key/quality]. Style: ${S}.\nAudio (always on): name the ambient bed only — [room tone / wind / footsteps]; leave space for ElevenLabs voice + hard SFX in post.`;
    case "veo":
      return `[shot type] of${D ? D : " [subject]"} ${beats[0]} in [setting], [time of day], ${S}. [ONE camera move]. [lighting].\nAudio: ambient only — [wind / footsteps / ambient]. (~6–8s, ${aspect}.)`;
    case "omni":
      return `Turn 1 (~10s, ${aspect}): ${dna ? dna + ", " : ""}${beats[0]} in [setting]. [camera] [lighting]. ${S}. Audio: ambient bed only.\nTurn 2 (conversational edit): "[refine — e.g. colder light, slower push-in]"  // keeps context, holds character + voice`;
    default:
      return "";
  }
}

const ENGINE_SYSTEM = `You are PROMPTO85, a Hollywood-grade prompt engine for AI image/video models (GPT Image 2, Nano Banana Pro, Seedance 2.0, Kling 3.0/Omni, HappyHorse 1.0, Veo 3.1, Gemini Omni).
Rules: prompts in English; aspect default 9:16; ONE action + ONE camera move per shot (video); Kling = numbered time-coded shot list ≤6 shots/15s, never prose; GPT/Nano = production brief, on-image text in quotes "verbatim"; describe weight transfer/ground contact for physics; reuse the locked style token block + character DNA byte-identical across every shot; request only the ambient sound layer (voice + hard SFX are routed to ElevenLabs).
Given a brief, write (1) a MASTER STORYBOARD (model-agnostic panels: beat/shot/lens/camera/light/duration/audio/transition) then (2) the CUT for each requested model, formatted exactly to that model's rules. Be concrete and cinematic; fill real camera, lens, lighting and composition choices.`;

export default function Prompto85() {
  const [brief, setBrief] = useState("");
  const [styleSel, setStyleSel] = useState(STYLES[0].name);
  const [customStyle, setCustomStyle] = useState("");
  const [dna, setDna] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [dur, setDur] = useState(12);
  const [n, setN] = useState(3);
  const [sel, setSel] = useState({ kling: true, seedance: true, gpt: true });
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState("");
  const [aiErr, setAiErr] = useState("");

  const style = customStyle.trim() || STYLES.find((s) => s.name === styleSel)?.token || "";
  const groups = useMemo(() => [...new Set(STYLES.map((s) => s.g))], []);
  const cfg = { brief, style, dna, aspect, dur, n };
  const selected = MODELS.filter((m) => sel[m.id]);

  const master = brief ? buildMaster(cfg) : "";
  const copy = (txt, id) => { navigator.clipboard?.writeText(txt); setCopied(id); setTimeout(() => setCopied(""), 1200); };
  const toggle = (id) => setSel((s) => ({ ...s, [id]: !s[id] }));

  async function enhance() {
    setLoading(true); setAiErr(""); setAi("");
    const want = selected.map((m) => m.name).join(", ") || "Kling 3.0";
    const user = `Brief: ${brief || "[none]"}\nLocked style: ${style}\nCharacter DNA: ${dna || "—"}\nAspect: ${aspect} · Duration: ${dur}s · Panels: ${n}\nTarget models for CUT: ${want}\nWrite the master storyboard, then a clearly-labeled CUT for each target model.`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: ENGINE_SYSTEM, messages: [{ role: "user", content: user }] }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      setAi(text || "No text returned.");
    } catch (e) { setAiErr("Enhancement runs only inside the Claude.ai artifact runtime. Error: " + e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-stone-200" style={{ background: "#0a0a0c", fontFamily: "'Spline Sans', ui-sans-serif, system-ui" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Spline+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .grain:before{content:'';position:fixed;inset:0;pointer-events:none;opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");z-index:50}
        .mono{font-family:'IBM Plex Mono',monospace}`}</style>
      <div className="grain" />
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* header */}
        <header className="flex items-center gap-4 mb-8 pb-6 border-b border-stone-800">
          <svg width="46" height="46" viewBox="0 0 100 100" className="shrink-0">
            <g fill="none" stroke="#e0a73e" strokeWidth="1.1" opacity="0.95">
              <circle cx="50" cy="50" r="22" /><circle cx="50" cy="28" r="22" /><circle cx="50" cy="72" r="22" />
              <circle cx="69" cy="39" r="22" /><circle cx="31" cy="39" r="22" /><circle cx="69" cy="61" r="22" /><circle cx="31" cy="61" r="22" />
            </g>
          </svg>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }} className="text-3xl tracking-tight leading-none text-stone-100">
              PROMPTO<span style={{ color: "#e0a73e" }}>85</span>
            </h1>
            <p className="text-xs text-stone-500 mono mt-1">master storyboard → model-correct CUT · 7 engines</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* config */}
          <section className="lg:col-span-2 space-y-5">
            <Field label="Brief">
              <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={4}
                placeholder="Describe the scene. Separate beats with periods."
                className="w-full bg-stone-900/70 border border-stone-800 rounded-lg p-3 text-sm resize-none focus:border-amber-600/60 focus:outline-none" />
            </Field>

            <Field label="Target models">
              <div className="flex flex-wrap gap-2">
                {MODELS.map((m) => (
                  <button key={m.id} onClick={() => toggle(m.id)} title={m.note}
                    className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition ${sel[m.id] ? "border-amber-600/70 text-amber-300 bg-amber-950/30" : "border-stone-800 text-stone-400 hover:border-stone-600"}`}>
                    {m.type === "video" ? <Film size={12} /> : <ImageIcon size={12} />} {m.name}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Style">
              <div className="relative">
                <select value={styleSel} onChange={(e) => setStyleSel(e.target.value)} disabled={!!customStyle}
                  className="w-full appearance-none bg-stone-900/70 border border-stone-800 rounded-lg p-2.5 text-sm pr-9 focus:border-amber-600/60 focus:outline-none disabled:opacity-40">
                  {groups.map((g) => (
                    <optgroup key={g} label={g}>
                      {STYLES.filter((s) => s.g === g).map((s) => <option key={s.name}>{s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-3 text-stone-500 pointer-events-none" />
              </div>
              <input value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} placeholder="…or paste a custom style token block"
                className="w-full mt-2 bg-stone-900/70 border border-stone-800 rounded-lg p-2.5 text-xs mono focus:border-amber-600/60 focus:outline-none" />
            </Field>

            <Field label="Character DNA (locked)">
              <input value={dna} onChange={(e) => setDna(e.target.value)} placeholder="e.g. Dennis — grey top-knot, silver beard, knit suit"
                className="w-full bg-stone-900/70 border border-stone-800 rounded-lg p-2.5 text-sm focus:border-amber-600/60 focus:outline-none" />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Aspect">
                <div className="flex flex-wrap gap-1.5">
                  {ASPECTS.map((a) => (
                    <button key={a} onClick={() => setAspect(a)}
                      className={`text-xs px-2 py-1 rounded mono border ${aspect === a ? "border-amber-600/70 text-amber-300" : "border-stone-800 text-stone-400"}`}>{a}</button>
                  ))}
                </div>
              </Field>
              <Field label={`Duration ${dur}s`}>
                <input type="range" min={5} max={15} value={dur} onChange={(e) => setDur(+e.target.value)} className="w-full accent-amber-500" />
              </Field>
              <Field label={`Panels ${n}`}>
                <input type="range" min={1} max={6} value={n} onChange={(e) => setN(+e.target.value)} className="w-full accent-amber-500" />
              </Field>
            </div>

            <p className="text-[11px] text-stone-500 mono leading-relaxed border-l-2 border-stone-800 pl-3">
              audio: ElevenLabs → voice + hard SFX · model native audio → ambient only. prompts in English; spoken/displayed text may be German.
            </p>

            <button onClick={enhance} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600/90 hover:bg-amber-500 text-stone-950 font-medium rounded-lg py-2.5 text-sm transition disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Enhance with Claude
            </button>
          </section>

          {/* output */}
          <section className="lg:col-span-3 space-y-4">
            {!brief && !ai && (
              <div className="text-stone-600 text-sm border border-dashed border-stone-800 rounded-xl p-10 text-center">
                <Scissors size={22} className="mx-auto mb-3 opacity-50" />
                Enter a brief to assemble the master storyboard and the per-model CUTs.
              </div>
            )}

            {ai && <OutCard title="Claude-enhanced output" body={ai} accent onCopy={() => copy(ai, "ai")} copied={copied === "ai"} />}
            {aiErr && <p className="text-xs text-rose-400/80 mono">{aiErr}</p>}

            {master && <OutCard title="Master storyboard" body={master} onCopy={() => copy(master, "m")} copied={copied === "m"} />}

            {brief && selected.map((m) => {
              const body = cut(m.id, cfg);
              return <OutCard key={m.id} title={`CUT → ${m.name}`} sub={m.note} body={body} onCopy={() => copy(body, m.id)} copied={copied === m.id} />;
            })}
          </section>
        </div>
        <footer className="mt-10 pt-5 border-t border-stone-800 text-[11px] text-stone-600 mono">
          Prompto85 · powered by the chazon-prompt-engine skill. Model facts verified 2026 — versions move fast; re-check specs.
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-stone-500 mono">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function OutCard({ title, sub, body, onCopy, copied, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-amber-700/40 bg-amber-950/10" : "border-stone-800 bg-stone-900/40"}`}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div>
          <h3 className="text-sm font-medium text-stone-100" style={{ fontFamily: "'Fraunces', serif" }}>{title}</h3>
          {sub && <p className="text-[11px] text-stone-500 mono">{sub}</p>}
        </div>
        <button onClick={onCopy} className="shrink-0 text-stone-400 hover:text-amber-300 transition flex items-center gap-1 text-xs">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="text-xs mono text-stone-300 whitespace-pre-wrap leading-relaxed">{body}</pre>
    </div>
  );
}
