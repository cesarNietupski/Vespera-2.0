// Original software pixel renderer. Native pixels, no antialiasing or indexed PNGs.
export function seeded(seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const colors = new Map();
export function rgba(color) {
  if (Array.isArray(color)) return color;
  if (colors.has(color)) return colors.get(color);
  const h = color.replace("#", ""),
    v = [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255,
    ];
  colors.set(color, v);
  return v;
}
export const mix = (a, b, t) => {
  const x = rgba(a),
    y = rgba(b);
  return x.map((v, i) => Math.round(v + (y[i] - v) * t));
};
export const INK = "#101322";
export class PixelCanvas {
  constructor(w, h = w) {
    this.width = w;
    this.height = h;
    this.data = Buffer.alloc(w * h * 4);
  }
  pixel(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const c = rgba(color),
      i = (y * this.width + x) * 4;
    if (c[3] === 255) {
      this.data[i] = c[0];
      this.data[i + 1] = c[1];
      this.data[i + 2] = c[2];
      this.data[i + 3] = 255;
    } else if (c[3] > 0) {
      const a = c[3] / 255,
        old = this.data[i + 3] / 255,
        alpha = a + old * (1 - a);
      for (let k = 0; k < 3; k++)
        this.data[i + k] = Math.round(
          (c[k] * a + this.data[i + k] * old * (1 - a)) / alpha,
        );
      this.data[i + 3] = Math.round(alpha * 255);
    }
  }
  rect(x, y, w, h, c) {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy++)
      for (let xx = Math.round(x); xx < Math.round(x + w); xx++)
        this.pixel(xx, yy, c);
  }
  line(x0, y0, x1, y1, c, width = 1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1,
      dy = -Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let steps = 0; steps < 500; steps++) {
      this.rect(
        x0 - Math.floor(width / 2),
        y0 - Math.floor(width / 2),
        width,
        width,
        c,
      );
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  poly(points, c, outline) {
    let minY = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1])))),
      maxY = Math.min(
        this.height - 1,
        Math.ceil(Math.max(...points.map((p) => p[1]))),
      );
    for (let y = minY; y <= maxY; y++) {
      const hits = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[j],
          b = points[i];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y))
          hits.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2)
        this.line(Math.ceil(hits[i]), y, Math.floor(hits[i + 1]), y, c);
    }
    if (outline)
      for (let i = 0; i < points.length; i++)
        this.line(...points[i], ...points[(i + 1) % points.length], outline);
  }
  ellipse(cx, cy, rx, ry, c, outline) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const n = (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2;
        if (n <= 1) this.pixel(x, y, outline && n > 0.76 ? outline : c);
      }
  }
  ring(cx, cy, rx, ry, c, phase = 0, thickness = 1) {
    let last;
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2 + phase,
        p = [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
      if (last) this.line(...last, ...p, c, thickness);
      last = p;
    }
  }
  limb(a, b, width, base, highlight) {
    this.line(...a, ...b, INK, width + 2);
    this.line(...a, ...b, base, width);
    if (highlight)
      this.line(
        a[0] - 1,
        a[1],
        b[0] - 1,
        b[1],
        highlight,
        Math.max(1, width - 2),
      );
  }
  gem(x, y, r, color, light = "#e7ffdf") {
    this.poly(
      [
        [x, y - r],
        [x + r * 0.65, y],
        [x, y + r],
        [x - r * 0.65, y],
      ],
      color,
      INK,
    );
    this.line(x, y - r + 1, x, y, light);
    this.pixel(x - 1, y - 1, light);
  }
  fade(opacity, dissolve = 0, seed = 0) {
    const r = seeded(seed);
    for (let i = 0; i < this.data.length; i += 4) {
      if (dissolve && r() < dissolve) this.data[i + 3] = 0;
      else this.data[i + 3] = Math.round(this.data[i + 3] * opacity);
    }
  }
  raw() {
    return { raw: { width: this.width, height: this.height, channels: 4 } };
  }
}
export const ease = (t) => t * t * (3 - 2 * t);
export function keys(t, points) {
  for (let i = 1; i < points.length; i++)
    if (t <= points[i][0]) {
      const a = points[i - 1],
        b = points[i],
        p = ease(Math.max(0, (t - a[0]) / (b[0] - a[0])));
      return a[1] + (b[1] - a[1]) * p;
    }
  return points.at(-1)[1];
}
