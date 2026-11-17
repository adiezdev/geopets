import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { svgPet } from "../lib/geopets.js";

const STEP = 50; // ms per frame, 20 fps
const GW = 168, GH = 184; // 8 px per pet pixel (viewBox 21×23)
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// frames needed to loop: LCM of all periods, or the longest one if the LCM is over 4 s
export function frameCount(periods, step = STEP) {
  if (!periods.length) return 1;
  let l = periods[0];
  for (const p of periods) {
    l = (l / gcd(l, p)) * p;
    if (l > 4000) { l = Math.max(...periods); break; }
  }
  return Math.max(1, Math.round(l / step));
}

// Wraps an async fn so calls run one at a time, in order; a failed call doesn't block the next.
export function serial(fn) {
  let last = Promise.resolve();
  return (...args) => {
    const run = last.then(() => fn(...args));
    last = run.catch(() => {});
    return run;
  };
}

let host;
// One GIF at a time: every render shares the hidden `host`, so overlapping calls would wipe each other's DOM.
export const petGif = serial(renderGif);

// Samples the live CSS animation: pause every animation at time t, bake computed transform/opacity into a clone, rasterize.
async function renderGif(mask, opts, bg) {
  if (!host) {
    host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:210px;height:230px;pointer-events:none";
    document.body.appendChild(host);
  }
  host.innerHTML = svgPet(mask, opts, "gx-");
  const svg = host.firstElementChild;
  // getAnimations() flushes styles itself; no requestAnimationFrame wait, which stalls in hidden tabs
  const anims = svg.getAnimations({ subtree: true });
  const periods = anims.map((a) => {
    const t = a.effect.getTiming();
    return Math.round(t.duration / 10) * 10 * (String(t.direction).includes("alternate") ? 2 : 1);
  }).filter((d) => d > 0);
  const n = frameCount(periods);
  const cv = document.createElement("canvas");
  cv.width = GW; cv.height = GH;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const gif = GIFEncoder();
  const els = [...svg.querySelectorAll("*")];
  for (let i = 0; i < n; i++) {
    anims.forEach((a) => { a.pause(); a.currentTime = 20000 + i * STEP; });
    const frozen = els.map((el) => { const cs = getComputedStyle(el); return cs.animationName !== "none" ? [cs.transform, cs.opacity] : null; });
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", GW); clone.setAttribute("height", GH);
    [...clone.querySelectorAll("*")].forEach((el, j) => {
      const f = frozen[j];
      if (f) { el.style.animation = "none"; el.style.transform = f[0]; el.style.opacity = f[1]; }
    });
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    await img.decode();
    ctx.clearRect(0, 0, GW, GH);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, GW, GH); }
    ctx.drawImage(img, 0, 0, GW, GH);
    const data = ctx.getImageData(0, 0, GW, GH).data;
    if (bg) {
      const pal = quantize(data, 256);
      gif.writeFrame(applyPalette(data, pal), GW, GH, { palette: pal, delay: STEP });
    } else {
      const pal = quantize(data, 256, { format: "rgba4444", oneBitAlpha: true });
      const ti = pal.findIndex((c) => c[3] === 0);
      gif.writeFrame(applyPalette(data, pal, "rgba4444"), GW, GH, { palette: pal, delay: STEP, transparent: ti >= 0, transparentIndex: Math.max(0, ti), dispose: 2 });
    }
  }
  gif.finish();
  host.innerHTML = "";
  return gif.bytes();
}
