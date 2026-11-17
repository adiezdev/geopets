import { W, H, SHAPES, ALL_STATES, HTTP, maskFrom, layout, svgPet, standalone, fileName, slugify } from "../lib/geopets.js";
import { t as tr } from "../lib/i18n/index.js";
import { packEntries, packName, buildPack, fileForFormat, extFor } from "./pack.js";
import { petGif } from "./gif.js";

const { site, dict } = JSON.parse(document.getElementById("i18n").textContent);
const t = (key, vars) => tr(dict, key, vars);
const $ = (id) => document.getElementById(id);
const label = (st) => t(`state.${st}`);
const isHttp = (st) => st in HTTP;
const petOpts = (s) => ({ color: s.color, legs: s.legs, shade: s.shade });
const pet = (mask, opts, p) => svgPet(mask, { ...opts, emptyLabel: t("create.empty") }, p);

// ---------- helpers ----------
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._h);
  el._h = setTimeout(() => el.classList.remove("show"), 1800);
}

async function download(filename, data) {
  let dl = null;
  try { dl = window.claude?.use ? await window.claude.use("downloads") : null; } catch {}
  if (dl) {
    try { await dl.save({ filename, data }); toast(t("toast.saved", { file: filename })); }
    catch (e) { toast(e?.code === "declined" ? t("toast.cancelled") : t("toast.downloadFailed")); }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: "image/svg+xml" }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function copy(text, okKey = "toast.copied") {
  try { await navigator.clipboard.writeText(text); toast(t(okKey)); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast(t(okKey)); } catch { toast(t("toast.copyManual")); }
    ta.remove();
  }
}

// ---------- format: SVG or GIF ----------
let fmt = "svg"; // svg | gif (transparent) | gifw (white background)
const ext = () => extFor(fmt);
function renderFmt() {
  document.querySelectorAll(".fmtChips").forEach((c) => {
    c.innerHTML = ["svg", "gif", "gifw"].map((k) => `<button data-fmt="${k}" aria-pressed="${k === fmt}">${t(`fmt.${k}`)}</button>`).join("");
  });
  $("dlBtn").textContent = t("btn.downloadFmt", { ext: ext().toUpperCase() });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-fmt]");
  if (b) { fmt = b.dataset.fmt; renderFmt(); }
});

async function saveOne(name, mask, opts) {
  const format = fmt;
  try { await download(`${name}.${extFor(format)}`, await fileForFormat(format, petGif)(mask, opts)); }
  catch (e) { console.error(e); toast(t("toast.gifFailed")); }
}

async function packDownload(btn, filename, entries) {
  const format = fmt; // fixed for the whole pack
  btn.disabled = true;
  const text = btn.textContent;
  btn.textContent = t("btn.preparing");
  try {
    const blob = await buildPack(entries, {
      ext: extFor(format), licenseTxt: dict.licenseTxt, fileFor: fileForFormat(format, petGif),
      onProgress: (i, n) => { if (format !== "svg") btn.textContent = t("progress.gif", { i, n }); },
    });
    await download(filename, blob);
  } catch (e) { console.error(e); toast(t("toast.packFailed")); }
  finally { btn.disabled = false; btn.textContent = text; }
}

// ---------- gallery ----------
let filter = "all", kind = "states";
function renderChips() {
  $("kindChips").innerHTML = ["states", "http", "all"].map((k) => `<button data-k="${k}" aria-pressed="${k === kind}">${t(`kind.${k}`)}</button>`).join("");
  $("shapeChips").innerHTML = [["all", t("filter.all")], ...Object.entries(SHAPES).map(([k, s]) => [k, s.name])]
    .map(([k, l]) => `<button data-f="${k}" aria-pressed="${k === filter}">${l}</button>`).join("");
  $("packBtn").textContent = filter === "all" ? t("btn.pack") : t("btn.packShape", { name: SHAPES[filter].name });
}
function renderGrid() {
  const items = [];
  for (const [k, s] of Object.entries(SHAPES)) {
    if (filter !== "all" && filter !== k) continue;
    for (const st of ALL_STATES) {
      if (kind !== "all" && (kind === "http") !== isHttp(st)) continue;
      const id = `${k}|${st}`, vars = { name: s.name, state: label(st) };
      items.push(`<div class="card"><div class="stage">${pet(maskFrom(s.fn), { ...petOpts(s), state: st })}</div>
        <div class="name"><b>${label(st)}</b><span class="mono muted">${s.name}</span></div>
        <div class="acts"><button data-dl="${id}">${t("btn.download")}</button><button data-cp="${id}">${t("btn.copy")}</button><button data-url="${id}" aria-label="${t("aria.embed", vars)}">${t("btn.embed")}</button><button data-ed="${id}" aria-label="${t("aria.edit", vars)}">${t("btn.edit")}</button></div></div>`);
    }
  }
  $("grid").innerHTML = items.join("");
}
$("kindChips").addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) { kind = b.dataset.k; renderChips(); renderGrid(); } });
$("shapeChips").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { filter = b.dataset.f; renderChips(); renderGrid(); } });
$("grid").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const { dl, cp, url, ed } = b.dataset;
  const [k, st] = (dl || cp || url || ed).split("|"), s = SHAPES[k], m = maskFrom(s.fn), o = { ...petOpts(s), state: st };
  if (dl) saveOne(fileName(k, st, ext()).replace(/\.\w+$/, ""), m, o);
  else if (cp) copy(standalone(m, o));
  else if (url) copy(`${site}pets/${fileName(k, st, "svg")}`, "toast.urlCopied");
  else { loadPreset(k); cur.state = st; renderCreator(); $("create").scrollIntoView({ behavior: "smooth" }); }
});
$("packBtn").onclick = (e) => packDownload(e.currentTarget, packName(filter), packEntries(filter));

// ---------- creator ----------
const cur = { mask: maskFrom(SHAPES.cube.fn), ...petOpts(SHAPES.cube), eye: "#1E1B2E", state: "idle" };
function loadPreset(k) {
  Object.assign(cur, { mask: maskFrom(SHAPES[k].fn), ...petOpts(SHAPES[k]) });
  $("bodyColor").value = cur.color;
  $("petName").value = t("create.presetName", { shape: k });
}
$("presetChips").innerHTML = Object.entries(SHAPES).map(([k, s]) => `<button data-p="${k}">${s.name}</button>`).join("");
$("presetChips").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { loadPreset(b.dataset.p); renderCreator(); } });

const ed = $("editor");
ed.innerHTML = Array.from({ length: W * H }, (_, i) =>
  `<div data-i="${i}" role="checkbox" aria-label="${t("aria.pixel", { x: (i % W) + 1, y: Math.floor(i / W) + 1 })}"></div>`).join("");
let paint = null;
function setCell(el) {
  const i = +el.dataset.i;
  cur.mask[Math.floor(i / W)][i % W] = paint;
  el.classList.toggle("on", !!paint);
  el.setAttribute("aria-checked", !!paint);
}
ed.addEventListener("pointerdown", (e) => {
  const c = e.target.closest("[data-i]");
  if (!c) return;
  const i = +c.dataset.i;
  paint = cur.mask[Math.floor(i / W)][i % W] ? 0 : 1;
  setCell(c);
  e.preventDefault();
});
ed.addEventListener("pointermove", (e) => {
  if (paint === null) return;
  const c = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("#editor [data-i]");
  if (c) setCell(c);
});
addEventListener("pointerup", () => { if (paint !== null) { paint = null; renderPreview(); } });

$("clearBtn").onclick = () => { cur.mask = maskFrom(() => 0); renderCreator(); };
$("invertBtn").onclick = () => { cur.mask = cur.mask.map((r) => r.map((v) => (v ? 0 : 1))); renderCreator(); };
$("mirrorBtn").onclick = () => { cur.mask = cur.mask.map((r) => r.map((v, x) => (x <= 6 ? v : r[W - 1 - x]))); renderCreator(); };
$("bodyColor").oninput = (e) => { cur.color = e.target.value; renderCreator(); };
$("eyeColor").oninput = (e) => { cur.eye = e.target.value; renderPreview(); };
$("strip").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { cur.state = b.dataset.s; renderPreview(); } });

const petSlug = () => slugify($("petName").value);
const hasPixels = () => { if (layout(cur.mask)) return true; toast(t("toast.emptyMask")); return false; };
$("myPackBtn").onclick = (e) => {
  if (!hasPixels()) return;
  const n = petSlug();
  packDownload(e.currentTarget, `${n}-pack.zip`, [[n, cur.mask, { color: cur.color, eye: cur.eye, legs: cur.legs, shade: cur.shade }]]);
};
$("dlBtn").onclick = async (e) => {
  if (!hasPixels()) return;
  const b = e.currentTarget;
  b.disabled = true;
  try { await saveOne(`${petSlug()}-${cur.state}`, cur.mask, cur); } finally { b.disabled = false; }
};
$("copyBtn").onclick = () => copy(standalone(cur.mask, cur));

function renderEditor() {
  ed.style.setProperty("--pet", cur.color);
  [...ed.children].forEach((c, i) => {
    const on = !!cur.mask[Math.floor(i / W)][i % W];
    c.classList.toggle("on", on);
    c.setAttribute("aria-checked", on);
  });
}
function renderPreview() {
  $("bigStage").innerHTML = pet(cur.mask, cur);
  $("strip").innerHTML = ALL_STATES.map((s) => `<button data-s="${s}" aria-pressed="${s === cur.state}">${pet(cur.mask, { ...cur, state: s })}${label(s)}</button>`).join("");
}
function renderCreator() { renderEditor(); renderPreview(); }

renderChips(); renderGrid(); renderCreator(); renderFmt();
