import { PixelCanvas, INK, seeded, keys, ease } from "./pixel-raster.mjs";

const STEEL = ["#20293a", "#36485a", "#526979", "#829994", "#c8d6bb"];
const GOLD = ["#47313d", "#77513d", "#a77a49", "#d6ac64", "#f8dda0"];
const CLOTH = ["#30243b", "#56334d", "#8b455e", "#bd6a71", "#e39a8b"];
const HAIR = ["#4b566b", "#7e939b", "#b3c4bf", "#e0e2c6"];
const SKIN = ["#674652", "#ad7b72", "#d8ac8b", "#f3d4a4"];
const AURORA = ["#19464e", "#2b807d", "#69bd9d", "#b5efcb", "#f0ffd8"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const point = (x, y) => [x, y];

export function heroFrame(state, f, count, dir, weapon = "blade", npc = "") {
  const c = new PixelCanvas(56),
    u = f / Math.max(1, count - 1),
    cycle = (f / count) * Math.PI * 2;
  const moving = state === "walk" || state === "run" || state === "move",
    running = state === "run",
    atk = state.startsWith("attack") || state === "charged",
    attackNo = Number(state.replace("attack", "")) || 0;
  const dx = Math.cos((dir * Math.PI) / 4) - Math.sin((dir * Math.PI) / 4),
    dy = (Math.cos((dir * Math.PI) / 4) + Math.sin((dir * Math.PI) / 4)) * 0.6;
  const flip = dx >= 0 ? 1 : -1,
    front = dy >= -0.01,
    view = 0.82 + (Math.abs(dx) / Math.SQRT2) * 0.18;
  const strike = keys(u, [
    [0, 0],
    [0.22, -1],
    [0.36, -0.85],
    [0.5, 1],
    [0.65, 0.55],
    [1, 0],
  ]);
  const bob = moving
    ? -Math.abs(Math.sin(cycle)) * 1.5
    : state === "dash"
      ? -1
      : Math.sin(cycle) * 0.6;
  const crouch =
    state === "charged"
      ? keys(u, [
          [0, 0],
          [0.3, 3],
          [0.45, 2],
          [0.55, -1],
          [0.8, 2],
          [1, 0],
        ])
      : state === "hurt"
        ? keys(u, [
            [0, 0],
            [0.2, 3],
            [1, 0],
          ])
        : 0;
  const lean =
    state === "dash"
      ? 5
      : atk
        ? strike * (weapon === "hammer" ? 2 : 1.6)
        : moving
          ? 1.2
          : state === "hurt"
            ? -2 * (1 - u)
            : 0;
  const death = state === "death",
    rise =
      state === "resurrect"
        ? keys(u, [
            [0, 6],
            [0.5, 2],
            [1, 0],
          ])
        : 0;
  const fall = death ? ease(u) : 0,
    ox = 28,
    oy = 45;
  const P = (x, y) => {
    const upperBody = clamp(-y / 20, 0, 1),
      xx = x * view + lean * upperBody,
      yy = y + (bob + crouch) * upperBody + rise;
    if (death) {
      const angle = -fall * 1.25,
        cy = yy + 20;
      return [
        ox + (xx * Math.cos(angle) - cy * Math.sin(angle)) * flip,
        oy + xx * Math.sin(angle) + cy * Math.cos(angle) - 20 + fall * 4,
      ];
    }
    return [ox + xx * flip, oy + yy];
  };
  const line = (a, b, color, width = 1) =>
    c.line(...P(...a), ...P(...b), color, width);
  const poly = (p, color, ...edge) =>
    c.poly(
      p.map((v) => P(...v)),
      color,
      edge.length ? edge[0] : INK,
    );
  const ell = (x, y, rx, ry, color, outline) =>
    c.ellipse(...P(x, y), rx, ry, color, outline);
  const limb = (a, b, w, color, light) =>
    c.limb(P(...a), P(...b), w, color, light);
  const cloth =
    npc === "salvia"
      ? ["#242939", "#354a61", "#526f80", "#83a6a5", "#bdd3bb"]
      : npc === "orren"
        ? ["#2d2632", "#5a3c3d", "#966147", "#c39760", "#e4c18a"]
        : CLOTH;
  const armor = npc === "salvia" ? GOLD : STEEL;
  const stride = moving
      ? Math.sin(cycle) * (running ? 5 : 3)
      : atk
        ? strike * 1.3
        : 0,
    legLift = moving ? Math.max(0, Math.cos(cycle)) * 2 : 0;
  if (state === "resurrect") {
    c.ring(28, 46, 16 * (1 - u) + 5, 4, "#73c5b18a");
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      c.pixel(
        28 + Math.cos(a) * (16 - u * 8),
        43 - u * 35 + (i % 3) * 2,
        AURORA[3],
      );
    }
  }
  if (npc === "nim") return nimFrame(state, f, count, dir);
  // Back hair strands and asymmetric cape respond with delayed phase.
  const flutter = Math.sin(cycle - 0.8) * (moving ? 2.5 : 1),
    trail = state === "dash" ? 9 : moving ? 4 : 2;
  poly(
    [
      [-6, -29],
      [-10, -27],
      [-12 - trail, -10 + flutter],
      [-7 - trail, -12],
      [-5 - trail, -5 + flutter],
      [0, -13],
      [4, -29],
    ],
    cloth[1],
  );
  poly(
    [
      [-7, -28],
      [-9 - trail, -12 + flutter],
      [-5 - trail, -13],
      [0, -20],
      [1, -29],
    ],
    cloth[2],
    undefined,
  );
  line([-7, -26], [-9 - trail, -10 + flutter], cloth[3]);
  line([-4, -26], [-5 - trail, -14], cloth[0]);
  // Legs use independently lifted feet and a two-joint stride, not whole-body wobble.
  for (const [side, offset] of [
    [-1, 0],
    [1, Math.PI],
  ]) {
    const step = side * stride,
      foot = [
        side * 3 + step,
        -Math.max(0, Math.sin(cycle + offset)) * (moving ? 2.5 : 0),
      ];
    const knee = [
      side * 3 + step * 0.45,
      -8 + legLift * (side === 1 ? 1 : -0.3),
    ];
    limb([side * 2, -17], knee, 4, STEEL[1], STEEL[2]);
    limb(knee, foot, 3, STEEL[0], STEEL[2]);
    poly(
      [
        [foot[0] - 2, foot[1] - 3],
        [foot[0] + 2, foot[1] - 3],
        [foot[0] + 4, foot[1]],
        [foot[0] - 2, foot[1]],
      ],
      STEEL[0],
    );
    line([foot[0] - 1, foot[1] - 2], [foot[0] + 2, foot[1] - 1], GOLD[2]);
  }
  // Leather skirt, segmented cuirass and engraved solar clasps.
  poly(
    [
      [-5, -20],
      [5, -20],
      [7, -12],
      [1, -14],
      [-2, -12],
      [-7, -14],
    ],
    cloth[1],
  );
  line([-4, -18], [-5, -14], cloth[3]);
  line([2, -18], [4, -14], GOLD[2]);
  poly(
    [
      [-5, -30],
      [2, -32],
      [7, -28],
      [6, -18],
      [-4, -18],
      [-7, -25],
    ],
    armor[1],
  );
  poly(
    [
      [-4, -29],
      [0, -30],
      [0, -20],
      [-4, -21],
    ],
    armor[3],
    undefined,
  );
  poly(
    [
      [1, -30],
      [5, -27],
      [4, -21],
      [1, -20],
    ],
    armor[2],
    undefined,
  );
  line([-5, -19], [5, -19], GOLD[3]);
  line([-4, -23], [4, -23], STEEL[0]);
  line([0, -30], [0, -20], GOLD[2]);
  ell(-6, -28, 4, 3, GOLD[2], INK);
  line([-9, -29], [-5, -31], GOLD[4]);
  const aim = Math.atan2(dy, Math.abs(dx) || 0.01);
  let offset = 0,
    reach = 0,
    hand = [6, -24];
  if (atk) {
    if (weapon === "bow") {
      offset = [-0.1, -0.35, 0.2, -0.12, 0.45, 0][(attackNo || 1) - 1] ?? 0;
      reach = keys(u, [
        [0, 0],
        [0.34, -4],
        [0.49, -4],
        [0.52, 3],
        [1, 0],
      ]);
      hand = [8 + reach * 0.3, -25];
    } else {
      const sweeps = {
        1: [-1.3, 1.1],
        2: [1.4, -1.1],
        3: [-0.1, 0.1],
        4: [-2.5, 2.4],
        5: [1.9, -1.7],
        6: [-2.2, 1.3],
      };
      const [from, to] = sweeps[attackNo] ?? [-2.1, 1.4];
      offset = keys(u, [
        [0, from * 0.3],
        [0.28, from],
        [0.38, from],
        [0.54, to],
        [0.7, to],
        [1, 0.2],
      ]);
      reach =
        attackNo === 3
          ? keys(u, [
              [0, -2],
              [0.35, -3],
              [0.5, 3.5],
              [0.75, 2],
              [1, 0],
            ])
          : strike * 1.5;
      if (weapon === "hammer") {
        offset = attackNo === 2 || attackNo === 4 ? offset * 0.8 : offset - 0.8;
        hand = [4 + strike, -22 + Math.sin(offset) * 2];
      } else hand = [6 + reach, -23 + Math.sin(offset) * 2];
    }
  } else if (state === "dash") {
    offset = -1.3;
    hand = [-1, -20];
  } else if (state === "interact") {
    hand = [7 + Math.sin(cycle) * 2, -29 - Math.sin(cycle) * 3];
    offset = -0.6;
  }
  const shoulder = [5, -28],
    elbow = [hand[0] - 3, -23 + (weapon === "bow" ? -1 : 2)];
  limb(shoulder, elbow, 3, STEEL[1], STEEL[3]);
  limb(elbow, hand, 3, SKIN[1], SKIN[3]);
  if (npc === "salvia") {
    line([8, -30], [9, -1], GOLD[2], 2);
    ell(9, -34, 3, 4, AURORA[2], INK);
    c.gem(...P(9, -35), 2, AURORA[3]);
  } else if (npc === "orren") {
    line([7, -21], [12, -9], GOLD[2], 2);
    poly(
      [
        [7, -12],
        [15, -16],
        [18, -10],
        [11, -6],
      ],
      STEEL[2],
    );
    line([9, -13], [15, -14], STEEL[4]);
  } else if (state === "interact") {
    limb([-4, -28], [2, -27], 3, STEEL[2], STEEL[3]);
    c.gem(...P(8, -31), 2, AURORA[2]);
  } else if (weapon === "bow") {
    const vx = Math.cos(aim),
      vy = Math.sin(aim),
      nx = -vy,
      ny = vx,
      bx = hand[0] + vx * 3,
      by = hand[1] + vy * 3,
      draw = atk
        ? (1 - Math.min(1, u / 0.48)) * 3 +
          Math.max(0, Math.sin(u * Math.PI)) * 3
        : 0;
    const top = [bx + nx * 12, by + ny * 12],
      bottom = [bx - nx * 12, by - ny * 12],
      mid = [bx + vx * 5, by + vy * 5];
    line(top, [mid[0] + nx * 6, mid[1] + ny * 6], GOLD[1], 3);
    line(
      [mid[0] + nx * 6, mid[1] + ny * 6],
      [mid[0] - nx * 6, mid[1] - ny * 6],
      GOLD[3],
      2,
    );
    line([mid[0] - nx * 6, mid[1] - ny * 6], bottom, GOLD[2], 3);
    const string = [bx - vx * draw, by - vy * draw];
    line(top, string, HAIR[2]);
    line(string, bottom, HAIR[2]);
    if (!atk || u < 0.52) {
      line(
        [string[0] - vx * 6, string[1] - vy * 6],
        [bx + vx * 11, by + vy * 11],
        AURORA[3],
      );
      line(
        [bx + vx * 11, by + vy * 11],
        [bx + vx * 8 + nx * 2, by + vy * 8 + ny * 2],
        AURORA[4],
      );
    }
    limb(
      [-4, -28],
      [string[0] - vx * 3, string[1] - vy * 3],
      3,
      SKIN[1],
      SKIN[3],
    );
  } else {
    const a = aim + offset + (atk ? 0 : 0.85),
      vx = Math.cos(a),
      vy = Math.sin(a),
      nx = -vy,
      ny = vx,
      len = weapon === "hammer" ? 12 : attackNo === 3 ? 14 : 17;
    const h = [hand[0] + vx * 3, hand[1] + vy * 3],
      tip = [hand[0] + vx * len, hand[1] + vy * len];
    line([hand[0] - vx * 3, hand[1] - vy * 3], tip, GOLD[1], 2);
    line([hand[0] - vx * 3, hand[1] - vy * 3], h, GOLD[3]);
    if (weapon === "hammer") {
      poly(
        [
          [tip[0] + nx * 5 - vx * 2, tip[1] + ny * 5 - vy * 2],
          [tip[0] - nx * 5 - vx * 2, tip[1] - ny * 5 - vy * 2],
          [tip[0] - nx * 5 + vx * 5, tip[1] - ny * 5 + vy * 5],
          [tip[0] + nx * 5 + vx * 5, tip[1] + ny * 5 + vy * 5],
        ],
        STEEL[2],
      );
      line(
        [tip[0] + nx * 4 - vx, tip[1] + ny * 4 - vy],
        [tip[0] - nx * 4 - vx, tip[1] - ny * 4 - vy],
        GOLD[4],
        2,
      );
      c.gem(...P(tip[0] + vx * 2, tip[1] + vy * 2), 2, GOLD[3]);
    } else {
      poly(
        [
          [h[0] + nx * 1.4, h[1] + ny * 1.4],
          [tip[0], tip[1]],
          [h[0] - nx * 1.4, h[1] - ny * 1.4],
        ],
        AURORA[2],
      );
      line(h, tip, AURORA[4]);
      line(
        [h[0] - nx * 3, h[1] - ny * 3],
        [h[0] + nx * 3, h[1] + ny * 3],
        GOLD[3],
      );
    }
    // Hand-authored smear pixels occur only on the strike frames, never idle/recovery.
    if (atk && u >= 0.4 && u < 0.62) {
      for (let i = 0; i < 10; i++) {
        const aa = a - 0.5 + i * 0.11,
          r = weapon === "hammer" ? 14 : 14;
        const q = P(hand[0] + Math.cos(aa) * r, hand[1] + Math.sin(aa) * r);
        c.pixel(...q, i > 6 ? "#e8ffd5" : "#65bda7a0");
      }
    }
  }
  // Neck, face planes, eyes, segmented hair and headband.
  poly(
    [
      [-2, -31],
      [2, -31],
      [2, -28],
      [-2, -28],
    ],
    SKIN[1],
  );
  const headTilt = atk ? strike * 0.5 : state === "hurt" ? -1 : 0;
  ell(headTilt, -35, 4, 5, SKIN[2], INK);
  poly(
    [
      [-3 + headTilt, -38],
      [1 + headTilt, -39],
      [3 + headTilt, -36],
      [3 + headTilt, -32],
      [0 + headTilt, -31],
      [-3 + headTilt, -33],
    ],
    SKIN[2],
    undefined,
  );
  line([-2 + headTilt, -36], [-2 + headTilt, -33], SKIN[3]);
  if (front) {
    c.pixel(...P(1 + headTilt, -35), INK);
    c.pixel(...P(3 + headTilt, -35), HAIR[0]);
    c.pixel(...P(2 + headTilt, -32), SKIN[0]);
  }
  poly(
    [
      [-5 + headTilt, -36],
      [-4 + headTilt, -40],
      [0 + headTilt, -42],
      [4 + headTilt, -40],
      [5 + headTilt, -36],
      [2 + headTilt, -38],
      [0 + headTilt, -37],
      [-2 + headTilt, -39],
      [-3 + headTilt, -34],
    ],
    HAIR[2],
  );
  line([-3 + headTilt, -40], [1 + headTilt, -41], HAIR[3]);
  line([2 + headTilt, -40], [4 + headTilt, -38], HAIR[0]);
  const hairWind = Math.sin(cycle - 1.4) * (moving ? 2 : 1);
  poly(
    [
      [-4, -38],
      [-5, -33],
      [-8 - trail * 0.4, -29 + hairWind],
      [-7, -34],
      [-8, -37],
    ],
    HAIR[1],
  );
  line([-5, -37], [-7 - trail * 0.3, -31 + hairWind], HAIR[3]);
  line([-3, -38], [3, -38], GOLD[2]);
  c.pixel(...P(-1, -38), GOLD[4]);
  if (!front) {
    ell(0, -36, 4, 5, HAIR[1], INK);
    line([-2, -40], [1, -41], HAIR[3]);
    line([2, -38], [2, -33], HAIR[0]);
    poly(
      [
        [-5, -29],
        [0, -31],
        [6, -28],
        [4, -15],
        [0, -11],
        [-5, -18],
      ],
      cloth[2],
    );
    line([-2, -27], [-1, -16], cloth[3]);
    c.gem(...P(1, -25), 2, GOLD[2]);
  } else if (npc === "orren") {
    line([-3, -35], [4, -35], cloth[0], 2);
    line([-3, -34], [4, -34], GOLD[3]);
  } else c.gem(...P(0, -25), 2, AURORA[3]);
  if (state === "interact")
    for (let i = 0; i < 4; i++) {
      const a = cycle + (i * Math.PI) / 2;
      c.pixel(...P(9 + Math.cos(a) * 4, -31 + Math.sin(a) * 4), AURORA[3]);
    }
  if (death)
    c.fade(
      1 - fall * 0.9,
      Math.max(0, u - 0.6) * 1.8,
      `hero-${weapon}-${dir}-${f}`,
    );
  if (state === "resurrect")
    c.fade(clamp(u * 2 + 0.1, 0, 1), Math.max(0, 0.35 - u), `rise-${f}`);
  return c;
}

function nimFrame(state, f, count, dir) {
  const c = new PixelCanvas(56),
    t = (f / count) * Math.PI * 2,
    y = 28 + Math.sin(t) * 2;
  c.ring(28, y + 1, 10, 5, "#5a75a178");
  c.poly(
    [
      [22, y - 7],
      [29, y - 11],
      [35, y - 6],
      [33, y + 4],
      [28, y + 8],
      [23, y + 3],
    ],
    "#5b658a",
    INK,
  );
  c.poly(
    [
      [24, y - 6],
      [29, y - 8],
      [32, y - 5],
      [31, y + 3],
      [26, y + 4],
    ],
    "#b9b6d2",
  );
  c.rect(25, y - 3, 6, 3, "#1d3544");
  c.pixel(27, y - 2, "#c9ffdd");
  c.poly(
    [
      [23, y + 3],
      [20, y + 13],
      [26, y + 8],
      [30, y + 16],
      [34, y + 5],
    ],
    "#696d97",
    INK,
  );
  for (let i = 0; i < 5; i++) {
    const a = t + (i / 5) * Math.PI * 2;
    c.pixel(28 + Math.cos(a) * 12, y + Math.sin(a) * 10, "#c9c8ea");
  }
  return c;
}

export function enemyFrame(kind, state, f, count, dir) {
  const c = new PixelCanvas(56),
    u = f / Math.max(1, count - 1),
    t = (f / count) * Math.PI * 2,
    dx = Math.cos((dir * Math.PI) / 4) - Math.sin((dir * Math.PI) / 4),
    dy = Math.cos((dir * Math.PI) / 4) + Math.sin((dir * Math.PI) / 4),
    flip = dx >= 0 ? 1 : -1;
  const move = state === "move",
    dead = state === "death",
    charge = state === "charge",
    atk = state === "attack",
    st = atk
      ? keys(u, [
          [0, -1],
          [0.2, -0.8],
          [0.38, 1],
          [0.6, 0.5],
          [1, 0],
        ])
      : charge
        ? -ease(u)
        : 0;
  const bob =
    kind === "wraith" || kind === "summoner"
      ? Math.sin(t) * 1.5
      : move
        ? -Math.abs(Math.sin(t)) * 1.5
        : Math.sin(t) * 0.4;
  const fall = dead ? ease(u) : 0;
  const P = (x, y) =>
    dead
      ? [
          28 +
            (x * Math.cos(fall * 1.2) - (y + 20) * Math.sin(fall * 1.2)) * flip,
          45 +
            x * Math.sin(fall * 1.2) +
            (y + 20) * Math.cos(fall * 1.2) -
            20 +
            fall * 4 +
            Math.sin(fall * Math.PI) * 2,
        ]
      : [
          28 + (x + st * 1.7 * clamp(-y / 18, 0, 1)) * flip,
          45 +
            y +
            (bob + (state === "hurt" ? 1.5 * (1 - u) : 0)) *
              (kind === "wraith" || kind === "summoner"
                ? 1
                : clamp(-y / 16, 0, 1)),
        ];
  const poly = (p, col, ...edge) =>
      c.poly(
        p.map((q) => P(...q)),
        col,
        edge.length ? edge[0] : INK,
      ),
    line = (a, b, col, w = 1) => c.line(...P(...a), ...P(...b), col, w),
    ell = (x, y, rx, ry, col, out) => c.ellipse(...P(x, y), rx, ry, col, out),
    limb = (a, b, w, col, light) => c.limb(P(...a), P(...b), w, col, light);
  const step = move ? Math.sin(t) * 4 : 0;
  if (kind === "hound") {
    const jump = atk ? Math.sin(u * Math.PI) * 4 : 0;
    for (let i = 0; i < 4; i++) {
      const x = i < 2 ? -9 : 7,
        s = (i % 2 ? -1 : 1) * step;
      limb([x, -13 - jump], [x + s, -6 - jump], 2, STEEL[2], STEEL[3]);
      limb([x + s, -6 - jump], [x + s * 1.4 + 2, -1], 2, STEEL[1], STEEL[3]);
    }
    poly(
      [
        [-16, -18 - jump],
        [-10, -24 - jump],
        [6, -25 - jump],
        [14, -18 - jump],
        [8, -10 - jump],
        [-10, -12 - jump],
      ],
      "#314954",
    );
    poly(
      [
        [-12, -21 - jump],
        [-3, -26 - jump],
        [9, -21 - jump],
        [4, -15 - jump],
        [-8, -16 - jump],
      ],
      "#718e84",
    );
    line([-10, -21 - jump], [3, -23 - jump], "#b9c8a5");
    poly(
      [
        [8, -24 - jump],
        [10, -33 - jump],
        [14, -28 - jump],
        [18, -30 - jump],
        [21, -22 - jump],
        [18, -16 - jump],
        [10, -18 - jump],
      ],
      "#8aa89c",
    );
    line([15, -24 - jump], [19, -24 - jump], AURORA[3]);
    line([16, -18 - jump], [20, -18 - jump], INK);
    c.pixel(...P(19, -18 - jump), "#e6e0c0");
    line([-14, -19 - jump], [-22, -26 + Math.sin(t) * 2], STEEL[2], 3);
    line([-20, -24], [-24, -22], AURORA[1]);
  } else if (kind === "automaton") {
    for (const s of [-1, 1]) {
      limb([s * 6, -15], [s * (8 + step * 0.3), -7], 3, GOLD[1], GOLD[3]);
      poly(
        [
          [s * 6, -8],
          [s * 12, -7],
          [s * 13, -1],
          [s * 7, -1],
        ],
        STEEL[1],
      );
      line([s * 7, -3], [s * 12, -2], STEEL[3]);
    }
    poly(
      [
        [-9, -29],
        [-5, -34],
        [6, -33],
        [10, -28],
        [9, -14],
        [-8, -14],
      ],
      STEEL[1],
    );
    for (let i = 0; i < 3; i++)
      line([-8, -26 + i * 4], [8, -26 + i * 4], STEEL[2]);
    ell(0, -23, 6, 7, GOLD[1], INK);
    ell(-1, -24, 4, 5, charge ? "#f6d688" : "#c9854b", GOLD[3]);
    c.ring(...P(0, -23), 4, 4, GOLD[4], t);
    line([-6, -34], [6, -34], GOLD[3], 2);
    line([-4, -35], [-4, -39], STEEL[2], 2);
    line([5, -34], [5, -38], STEEL[3]);
    for (const s of [-1, 1]) {
      limb(
        [s * 9, -27],
        [s * 13, -18 + Math.sin(t + s) * 2],
        3,
        STEEL[1],
        GOLD[2],
      );
      line([s * 14, -19], [s * 14, -12], GOLD[3], 2);
    }
    if (charge || atk) c.ring(...P(0, -23), 9 + (f % 3), 10, "#ffbf6c", 0);
  } else if (kind === "wraith" || kind === "summoner") {
    const purple = kind === "summoner",
      ramp = purple
        ? ["#25233e", "#463d65", "#7b6490", "#b399ba"]
        : ["#16313f", "#285361", "#528d92", "#a0ccc1"];
    const wave = Math.sin(t) * 3;
    poly(
      [
        [-7, -32],
        [4, -35],
        [10, -29],
        [9, -13],
        [14, -5],
        [5, -8],
        [2, 1],
        [-3, -7],
        [-12, -2],
        [-9, -18],
      ],
      ramp[1],
    );
    poly(
      [
        [-6, -28],
        [1, -30],
        [6, -25],
        [4, -13],
        [7 + wave, -6],
        [1, -9],
        [-3, -4],
        [-4, -20],
      ],
      ramp[2],
      undefined,
    );
    for (let i = 0; i < 4; i++)
      line(
        [-5 + i * 3, -20],
        [-6 + i * 4 + Math.sin(t + i) * 2, -6 + (i % 2) * 3],
        ramp[0],
      );
    poly(
      [
        [-7, -31],
        [-4, -40],
        [2, -42],
        [8, -36],
        [8, -29],
        [1, -34],
      ],
      ramp[2],
    );
    poly(
      [
        [-4, -35],
        [5, -35],
        [4, -29],
        [-3, -29],
      ],
      INK,
      undefined,
    );
    line([-2, -33], [3, -33], purple ? "#e6c4f1" : AURORA[3]);
    for (const s of [-1, 1]) {
      const hand = [
        s * (13 + st * 2),
        -22 - (charge ? u * 8 : atk ? (1 - u) * 7 : 0),
      ];
      limb([s * 7, -28], [s * 11, -22], 3, ramp[1], ramp[2]);
      limb([s * 11, -22], hand, 3, ramp[2], ramp[3]);
      ell(
        hand[0],
        hand[1] - 3,
        charge ? 2 + u * 2 : 3,
        3,
        purple ? "#bea0d9" : "#b6edd1",
        ramp[0],
      );
    }
    if (purple) {
      line([-15, -5], [-14, -39], GOLD[1], 2);
      c.gem(...P(-14, -39), 3, "#b095d3");
    } else c.ring(...P(0, -26), 12, 16, "#528e9a70", t);
  } else {
    const heavy = kind === "guardian",
      elite = kind === "elite",
      archer = kind === "archer",
      cloth = elite
        ? ["#321f35", "#65344d", "#a35569"]
        : archer
          ? ["#22313e", "#3e5a6d", "#79939c"]
          : ["#29293a", "#574452", "#99716d"];
    poly(
      [
        [-6, -27],
        [-9, -8],
        [-2, -11],
        [5, -6],
        [8, -28],
      ],
      cloth[1],
    );
    line([-6, -24], [-7, -10], cloth[2]);
    for (const s of [-1, 1]) {
      const foot = [s * 4 + step * s, 0],
        knee = [s * 4 + step * s * 0.5, -8];
      limb([s * 3, -17], knee, heavy ? 5 : 3, STEEL[1], STEEL[3]);
      limb(knee, foot, heavy ? 4 : 3, STEEL[0], STEEL[2]);
      line([foot[0] - 2, -1], [foot[0] + 3, -1], STEEL[3], 2);
    }
    poly(
      [
        [-(heavy ? 9 : 6), -31],
        [0, -34],
        [heavy ? 10 : 7, -29],
        [6, -17],
        [-5, -17],
      ],
      STEEL[1],
    );
    poly(
      [
        [-5, -30],
        [-1, -32],
        [-1, -20],
        [-5, -21],
      ],
      STEEL[3],
      undefined,
    );
    poly(
      [
        [1, -32],
        [6, -29],
        [4, -21],
        [1, -20],
      ],
      STEEL[2],
      undefined,
    );
    line([-5, -18], [6, -18], GOLD[2], 2);
    for (const s of [-1, 1]) {
      ell(
        s * (heavy ? 9 : 6),
        -29,
        heavy ? 4 : 3,
        3,
        elite ? GOLD[2] : STEEL[2],
        INK,
      );
      line([s * 5, -31], [s * 9, -30], STEEL[4]);
    }
    ell(0, -37, 5, 5, STEEL[2], INK);
    poly(
      [
        [-4, -39],
        [0, -43],
        [5, -39],
        [4, -32],
        [-3, -32],
      ],
      STEEL[1],
    );
    line([-3, -36], [4, -36], elite ? "#e68b94" : AURORA[3]);
    line([0, -42], [0, -33], GOLD[2]);
    if (elite) {
      poly(
        [
          [-3, -40],
          [-6, -43],
          [-1, -41],
          [1, -43],
          [4, -40],
        ],
        GOLD[2],
      );
    }
    if (archer) {
      const draw = charge ? u * 4 : atk ? (1 - ease(u)) * 4 : 1,
        bx = 11,
        by = -27;
      limb([5, -29], [bx, -27], 3, STEEL[1], STEEL[3]);
      line([bx, -38], [bx + 5, -29], GOLD[2], 2);
      line([bx + 5, -29], [bx + 4, -21], GOLD[3], 2);
      line([bx + 4, -21], [bx, -16], GOLD[2], 2);
      line([bx, -38], [bx - draw, -27], HAIR[1]);
      line([bx - draw, -27], [bx, -16], HAIR[1]);
      limb([-5, -29], [bx - draw - 3, -26], 3, cloth[1], cloth[2]);
      if (!atk || u < 0.2) line([bx - draw - 6, -27], [20, -27], AURORA[3]);
    } else {
      const a = (heavy ? -0.9 : 0) + st * 1.8 + (charge ? -0.8 : 0),
        h = [7, -24],
        tip = [h[0] + Math.cos(a) * 16, h[1] + Math.sin(a) * 16];
      limb([6, -29], h, 3, STEEL[1], STEEL[3]);
      line(h, tip, STEEL[0], 3);
      line(h, tip, elite ? GOLD[3] : STEEL[4]);
      line([h[0] + 2, -27], [h[0] - 1, -21], GOLD[2], 2);
      if (heavy) {
        const sy = charge ? -1 : atk ? st * 2 : 0;
        poly(
          [
            [-8, -31 + sy],
            [-18, -29 + sy],
            [-18, -14 + sy],
            [-11, -9 + sy],
            [-5, -17 + sy],
          ],
          STEEL[1],
        );
        poly(
          [
            [-9, -29 + sy],
            [-16, -27 + sy],
            [-16, -15 + sy],
            [-11, -12 + sy],
            [-8, -17 + sy],
          ],
          STEEL[2],
        );
        line([-12, -27 + sy], [-12, -15 + sy], GOLD[3]);
        line([-15, -22 + sy], [-9, -22 + sy], GOLD[2]);
      } else if (elite) {
        limb([-6, -29], [-10, -23], 3, STEEL[1], GOLD[2]);
        line([-10, -23], [-18, -31 - st * 8], STEEL[3], 2);
        line([-10, -23], [-18, -31 - st * 8], GOLD[3]);
      } else limb([-6, -28], [-8, -18], 3, STEEL[1], STEEL[3]);
    }
    if (dy < -0.1) {
      poly(
        [
          [-5, -39],
          [0, -42],
          [5, -38],
          [3, -32],
          [-4, -32],
        ],
        STEEL[1],
      );
      line([-2, -40], [-2, -34], STEEL[3]);
    }
  }
  if (dead)
    c.fade(1 - fall * 0.8, Math.max(0, u - 0.5) * 1.7, `${kind}-${dir}-${f}`);
  return c;
}

export function bossFrame(kind, state, f, count) {
  const c = new PixelCanvas(96),
    u = f / Math.max(1, count - 1),
    t = (f / count) * Math.PI * 2,
    charge = state === "charge",
    dead = state === "death",
    rush = state === "rush",
    volley = state === "volley",
    eruption = state === "eruption",
    nova = state === "nova",
    atk = ["attack", "rush", "volley", "eruption", "nova"].includes(state);
  const pulse = Math.sin(t),
    motion = atk
      ? keys(u, [
          [0, -1],
          [0.2, -1],
          [0.4, 1],
          [0.65, 0.7],
          [1, 0],
        ])
      : 0,
    fall = dead ? ease(u) : 0;
  const P = (x, y) => [
    48 + x * 0.9,
    89 + y + (kind > 1 ? pulse * 1.2 : 0) + fall * 1,
  ];
  const line = (a, b, col, w = 1) => c.line(...P(...a), ...P(...b), col, w),
    poly = (p, col, ...edge) =>
      c.poly(
        p.map((q) => P(...q)),
        col,
        edge.length ? edge[0] : INK,
      ),
    ell = (x, y, rx, ry, col, out) => c.ellipse(...P(x, y), rx, ry, col, out),
    limb = (a, b, w, col, l) => c.limb(P(...a), P(...b), w, col, l);
  if (kind === 0) {
    const tilt = rush ? 7 : charge ? 3 : 0,
      step = state === "move" || rush ? Math.sin(t) * 5 : motion * 2;
    for (let i = 0; i < 4; i++) {
      const x = [-19, -10, 11, 20][i],
        s = i % 2 ? -step : step;
      limb([x, -27], [x + s, -13], 3, AURORA[1], AURORA[3]);
      limb([x + s, -13], [x + s * 1.4, -2], 2, STEEL[2], AURORA[2]);
      line([x + s * 1.4 - 2, -1], [x + s * 1.4 + 2, -1], GOLD[3], 2);
    }
    poly(
      [
        [-26, -35],
        [-21, -46],
        [-5, -50],
        [14, -43],
        [21, -38],
        [12, -22],
        [-14, -24],
      ],
      "#31535b",
    );
    poly(
      [
        [-23, -35],
        [-17, -43],
        [-4, -45],
        [12, -39],
        [8, -28],
        [-12, -29],
      ],
      "#6eaa9b",
      undefined,
    );
    line([-21, -40], [-9, -46], AURORA[3], 2);
    line([-16, -36], [9, -31], AURORA[1]);
    poly(
      [
        [12, -37],
        [17 + tilt, -57],
        [22 + tilt, -62],
        [29 + tilt, -56],
        [26 + tilt, -41],
        [19, -27],
      ],
      "#58928a",
    );
    poly(
      [
        [18, -44],
        [21 + tilt, -57],
        [25 + tilt, -55],
        [22, -39],
      ],
      "#a2d5ba",
      undefined,
    );
    poly(
      [
        [20 + tilt, -57],
        [24 + tilt, -67],
        [32 + tilt, -63],
        [35 + tilt, -57],
        [30 + tilt, -51],
        [24 + tilt, -51],
      ],
      "#9cc8b1",
    );
    line([28 + tilt, -60], [31 + tilt, -60], AURORA[4]);
    line([30 + tilt, -54], [35 + tilt, -55], STEEL[0]);
    for (const s of [-1, 1]) {
      const bx = 24 + tilt + (s < 0 ? -2 : 5),
        by = -65;
      line([bx, by], [bx + s * 5, -78], AURORA[2], 3);
      line([bx + s * 5, -78], [bx + s * 10, -84], AURORA[3], 2);
      line([bx + s * 5, -77], [bx + s * 3, -85], AURORA[2], 2);
      line([bx + s * 3, -84], [bx + s * 7, -84], AURORA[3]);
      line([bx + s * 4, -73], [bx + s * 12, -73], AURORA[3], 2);
      line([bx + s * 12, -73], [bx + s * 14, -77], AURORA[4]);
    }
    c.gem(...P(-2, -37), 8, AURORA[2], AURORA[4]);
    c.ring(...P(-2, -37), 6 + (pulse + 1), 8, "#b0ebbc", t);
    poly(
      [
        [-23, -40],
        [-34, -50],
        [-31, -37],
        [-25, -32],
      ],
      AURORA[1],
    );
  } else if (kind === 1) {
    const crouch = charge ? u * 3 : eruption ? Math.sin(u * Math.PI) * 3 : 0;
    for (const s of [-1, 1]) {
      limb([s * 9, -27 + crouch], [s * 12, -15], 7, STEEL[1], STEEL[3]);
      poly(
        [
          [s * 8, -18],
          [s * 17, -15],
          [s * 18, -2],
          [s * 7, -2],
        ],
        STEEL[1],
      );
      line([s * 9, -4], [s * 17, -3], GOLD[3], 2);
      line([s * 10, -14], [s * 14, -13], GOLD[2], 2);
    }
    poly(
      [
        [-19, -55 + crouch],
        [-11, -65 + crouch],
        [12, -65 + crouch],
        [21, -54 + crouch],
        [15, -27],
        [-14, -27],
      ],
      STEEL[1],
    );
    poly(
      [
        [-14, -54],
        [-3, -60],
        [-3, -33],
        [-13, -35],
      ],
      STEEL[3],
      undefined,
    );
    poly(
      [
        [1, -60],
        [15, -53],
        [12, -34],
        [1, -31],
      ],
      STEEL[2],
      undefined,
    );
    for (let i = 0; i < 3; i++)
      line([-12, -47 + i * 5], [12, -47 + i * 5], GOLD[1], 2);
    c.gem(...P(1, -46), 6, "#d39251", "#ffe1a1");
    for (const s of [-1, 1]) {
      poly(
        [
          [s * 15, -63],
          [s * 27, -60],
          [s * 28, -50],
          [s * 17, -48],
        ],
        GOLD[2],
      );
      line([s * 17, -61], [s * 25, -59], GOLD[4], 2);
    }
    ell(0, -71, 10, 10, STEEL[1], INK);
    poly(
      [
        [-9, -76],
        [-5, -83],
        [6, -81],
        [11, -73],
        [7, -64],
        [-7, -64],
      ],
      GOLD[1],
    );
    line([-6, -72], [7, -72], "#ffd68d", 2);
    line([0, -81], [0, -65], GOLD[3], 2);
    const hx = 25 + Math.sin(motion * 1.8) * 8,
      hy = -43 - Math.cos(motion * 2) * 12 - (charge ? u * 8 : 0);
    limb([18, -55], [22, -40], 7, STEEL[1], STEEL[3]);
    limb([22, -40], [hx, hy], 6, STEEL[2], GOLD[3]);
    line([hx - 6, hy - 9], [hx + 4, hy + 13], GOLD[2], 3);
    poly(
      [
        [hx - 3, hy + 5],
        [hx + 13, hy + 1],
        [hx + 17, hy + 13],
        [hx + 1, hy + 18],
      ],
      STEEL[2],
    );
    line([hx, hy + 5], [hx + 12, hy + 2], GOLD[4], 3);
    c.gem(...P(hx + 7, hy + 10), 3, "#e3a95d");
    limb([-18, -54], [-25, -37], 8, STEEL[1], GOLD[2]);
    limb([-25, -37], [-20, -28], 7, STEEL[2], STEEL[3]);
  } else if (kind === 2) {
    const wave = Math.sin(t) * 3;
    poly(
      [
        [-12, -66],
        [-20, -39],
        [-27, -13],
        [-19, -18],
        [-12, -6],
        [-4, -15],
        [5, -3],
        [13, -18],
        [25, -10],
        [20, -42],
        [13, -65],
      ],
      "#30394f",
    );
    poly(
      [
        [-8, -58],
        [-14, -29],
        [-17, -15],
        [-7, -21],
        [-3, -11],
        [4, -20],
        [11, -12],
        [12, -36],
        [8, -58],
      ],
      "#6e8ba1",
      undefined,
    );
    for (let i = 0; i < 7; i++)
      line(
        [-14 + i * 4, -39],
        [-18 + i * 5 + Math.sin(t + i) * 2, -14 + (i % 3) * 3],
        "#a4b8ba",
      );
    poly(
      [
        [-10, -71],
        [0, -83],
        [12, -72],
        [9, -60],
        [-8, -60],
      ],
      "#536382",
    );
    poly(
      [
        [-6, -72],
        [7, -72],
        [5, -62],
        [-4, -62],
      ],
      INK,
      undefined,
    );
    line([-3, -69], [5, -69], "#d2efda", 2);
    line([-11, -74], [0, -85], GOLD[3]);
    for (const s of [-1, 1]) {
      limb([s * 11, -61], [s * 25, -47 - motion * 4], 4, "#627b9b", "#b6c3c5");
      limb(
        [s * 25, -47 - motion * 4],
        [s * 34, -55 - motion * 8],
        3,
        "#a2b7ba",
        "#dee0cf",
      );
    }
    for (let i = 0; i < 9; i++) {
      const a = t * 0.6 + (i / 9) * Math.PI * 2,
        x = Math.cos(a) * 33,
        y = -43 + Math.sin(a) * 20 + wave;
      poly(
        [
          [x - 4, y - 5],
          [x, y - 4],
          [x + 5, y - 6],
          [x + 5, y + 3],
          [x, y + 5],
          [x - 5, y + 3],
        ],
        "#c8cdb5",
      );
      line([x, y - 3], [x, y + 4], "#62758c");
      line([x - 3, y], [x - 1, y + 1], "#718998");
      line([x + 2, y], [x + 4, y - 1], "#718998");
    }
  } else {
    c.ring(...P(0, -49), 28, 37, GOLD[2], t * 0.05, 2);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.08;
      c.gem(...P(Math.cos(a) * 28, -49 + Math.sin(a) * 37), 1.5, GOLD[3]);
    }
    poly(
      [
        [-12, -66],
        [-15, -42],
        [-20, -8],
        [-10, -14],
        [-4, -2],
        [4, -13],
        [19, -6],
        [13, -43],
        [12, -66],
      ],
      "#272737",
    );
    poly(
      [
        [-9, -63],
        [-8, -32],
        [-12, -10],
        [-5, -17],
        [0, -8],
        [4, -18],
        [11, -12],
        [7, -44],
        [8, -64],
      ],
      "#514557",
      undefined,
    );
    poly(
      [
        [-2, -63],
        [-4, -26],
        [1, -12],
        [6, -28],
        [3, -63],
      ],
      "#863e56",
      undefined,
    );
    for (let i = 0; i < 5; i++)
      line([-12 + i * 6, -40], [-15 + i * 7, -12], i % 2 ? GOLD[1] : STEEL[0]);
    poly(
      [
        [-9, -73],
        [-6, -84],
        [-1, -79],
        [6, -85],
        [11, -75],
        [6, -64],
        [-6, -64],
      ],
      INK,
    );
    line([-6, -75], [6, -75], GOLD[4], 2);
    line([-8, -73], [-5, -83], GOLD[2]);
    line([7, -82], [10, -75], GOLD[3]);
    for (const s of [-1, 1]) {
      poly(
        [
          [s * 9, -66],
          [s * 22, -71],
          [s * 16, -58],
        ],
        GOLD[2],
      );
      line([s * 12, -65], [s * 20, -69], GOLD[4]);
      const hand = [s * (27 + motion * 4), -48 - motion * 9];
      limb([s * 13, -61], [s * 21, -47], 4, STEEL[2], GOLD[3]);
      limb([s * 21, -47], hand, 3, "#c1ac91", "#edcf9e");
      c.gem(...P(hand[0], hand[1] - 3), 3, volley ? "#dbb0b4" : GOLD[3]);
    }
    ell(0, -48, 7, 8, "#e5c890", GOLD[1]);
    ell(-1, -50, 4, 5, "#fff1bb");
  }
  // Each learned attack has its own animated silhouette and readable energy motif.
  if (volley) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.35;
      c.gem(
        ...P(Math.cos(a) * (23 + u * 10), -43 + Math.sin(a) * (20 + u * 8)),
        2,
        kind === 1 ? "#efb878" : "#b2e0c0",
      );
    }
  }
  if (eruption)
    c.ring(
      ...P(0, -4),
      18 + u * 20,
      4 + u * 3,
      kind === 1 ? "#f7bb75" : "#a0d7bb",
      t,
      2,
    );
  if (nova) {
    c.ring(...P(0, -42), 12 + u * 28, 18 + u * 25, GOLD[3], t);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + t;
      line(
        [Math.cos(a) * 17, -42 + Math.sin(a) * 20],
        [Math.cos(a) * (20 + u * 20), -42 + Math.sin(a) * (25 + u * 20)],
        AURORA[2],
      );
    }
  }
  if (state === "phase") {
    for (let i = 0; i < 12; i++) {
      const a = t + (i / 12) * Math.PI * 2;
      c.pixel(
        ...P(Math.cos(a) * 32, -44 + Math.sin(a) * 35),
        i % 2 ? GOLD[3] : AURORA[3],
      );
    }
  }
  if (dead)
    c.fade(1 - fall * 0.8, Math.max(0, u - 0.35) * 1.4, `boss-${kind}-${f}`);
  return c;
}
