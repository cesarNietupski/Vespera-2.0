import { PixelCanvas, seeded, mix, INK } from "./pixel-raster.mjs";
export const PALETTES = [
  [
    "#102631",
    "#1c3740",
    "#294a4d",
    "#3e625f",
    "#638b77",
    "#9eb794",
    "#d3d5a5",
    "#569b8c",
  ],
  [
    "#241e2b",
    "#3b2930",
    "#573a35",
    "#79513d",
    "#a47549",
    "#cca262",
    "#f0cf8c",
    "#cf794b",
  ],
  [
    "#1d223c",
    "#2c3450",
    "#424d69",
    "#5b6886",
    "#7c92a8",
    "#a5b9bf",
    "#d1d9c8",
    "#808fc1",
  ],
  [
    "#211f31",
    "#35303f",
    "#4d4350",
    "#6a5b60",
    "#99806c",
    "#c3a780",
    "#e5d2a4",
    "#b35e6e",
  ],
];
const GOLD = ["#3b2730", "#694232", "#93633e", "#bc8b50", "#e0b66c", "#f5d9a0"];
const STONE = ["#142332", "#2b3d48", "#47565d", "#6c7975", "#a7ac94"];
const MAGIC = ["#143a48", "#28636e", "#4c9b96", "#9cddbb", "#deefc2"];
export function tileFrame(biome, n) {
  const c = new PixelCanvas(48),
    p = PALETTES[biome],
    r = seeded(`terrain-${biome}-${n}`);
  c.poly(
    [
      [0, 29],
      [24, 17],
      [47, 29],
      [47, 33],
      [24, 45],
      [0, 33],
    ],
    p[0],
    INK,
  );
  c.poly(
    [
      [1, 30],
      [24, 41],
      [24, 45],
      [1, 33],
    ],
    p[1],
  );
  c.poly(
    [
      [24, 41],
      [47, 30],
      [47, 33],
      [24, 45],
    ],
    p[0],
  );
  c.poly(
    [
      [0, 29],
      [24, 17],
      [47, 29],
      [24, 41],
    ],
    p[2],
  );
  // Stone planes use clustered, seeded pixels and carved isometric joints.
  for (let y = 18; y <= 41; y++)
    for (let x = 1; x < 47; x++)
      if (Math.abs(x - 24) / 24 + Math.abs(y - 29) / 12 < 0.95) {
        const noise = r(),
          tile =
            (Math.floor((x + y * 2) / 14) + Math.floor((x - y * 2) / 14)) % 3;
        if (noise < 0.08) c.pixel(x, y, p[tile === 0 ? 3 : 1]);
        else if (noise > 0.96) c.rect(x, y, 2, 1, p[3]);
      }
  c.line(1, 29, 24, 18, p[4]);
  c.line(24, 18, 46, 29, p[3]);
  c.line(2, 30, 24, 40, p[1]);
  c.line(24, 40, 46, 30, p[0]);
  if (n < 4) {
    c.line(13, 23, 35, 34, p[1]);
    c.line(13, 35, 35, 24, p[1]);
    c.line(14, 22, 36, 33, p[3]);
    c.line(14, 34, 36, 23, p[3]);
    if (n === 0) {
      c.poly(
        [
          [6, 29],
          [24, 20],
          [42, 29],
          [24, 38],
        ],
        p[2],
        p[4],
      );
      c.line(9, 29, 24, 22, p[1]);
      c.line(24, 22, 39, 29, p[3]);
      c.line(39, 29, 24, 36, p[1]);
    }
    if (n === 2) {
      c.ring(24, 29, 9, 4, p[4]);
      c.poly(
        [
          [24, 24],
          [30, 29],
          [24, 34],
          [18, 29],
        ],
        p[1],
      );
      c.pixel(24, 28, p[5]);
    }
    if (n === 3) {
      for (let i = 0; i < 4; i++)
        c.line(9 + i * 5, 28 - i * 2, 19 + i * 5, 33 - i * 2, p[4]);
    }
  } else if (n < 8) {
    const crack = [
      [13 + n, 22],
      [24, 28],
      [20, 32],
      [32, 36],
    ];
    for (let i = 1; i < crack.length; i++) {
      c.line(...crack[i - 1], ...crack[i], p[0]);
      c.pixel(crack[i][0] + 1, crack[i][1], p[3]);
    }
    c.line(24, 28, 33, 25, p[0]);
    for (let i = 0; i < 14; i++) {
      const x = 8 + r() * 32,
        y = 24 + r() * 12;
      if (Math.abs(x - 24) / 24 + Math.abs(y - 29) / 12 < 0.85)
        c.rect(x, y, r() > 0.5 ? 2 : 1, 1, biome === 0 ? p[4] : p[1]);
    }
  } else {
    if (biome === 0) {
      for (let i = 0; i < 32; i++) {
        const x = 5 + r() * 37,
          y = 20 + r() * 18;
        if (Math.abs(x - 24) / 24 + Math.abs(y - 29) / 12 < 0.8) {
          c.rect(x, y, 2, 1, p[3]);
          if (i % 5 === 0) c.pixel(x + 1, y - 1, p[5]);
        }
      }
      c.line(10, 31, 19, 27, p[7]);
      c.line(19, 27, 27, 28, p[4]);
    }
    if (biome === 1) {
      c.poly(
        [
          [8, 29],
          [24, 21],
          [40, 29],
          [24, 37],
        ],
        p[0],
        p[3],
      );
      for (let y = 24; y < 35; y += 3) c.line(15, y, 31, y + 1, p[3]);
      c.line(18, 29, 28, 31, p[7]);
      c.pixel(24, 30, p[6]);
    }
    if (biome === 2) {
      c.poly(
        [
          [4, 29],
          [24, 19],
          [44, 29],
          [24, 39],
        ],
        p[1],
      );
      for (let j = 0; j < 4; j++) {
        const yy = 25 + j * 3;
        c.line(12 + (j % 2) * 4, yy, 29 + (j % 3) * 3, yy - 2, p[4]);
        c.line(17, yy + 1, 36, yy - 1, p[3]);
      }
      c.pixel(29, 26, p[6]);
    }
    if (biome === 3) {
      c.ring(24, 29, 15, 7, p[4]);
      c.ring(24, 29, 11, 5, p[1]);
      c.line(12, 28, 35, 30, p[5]);
      c.line(24, 23, 23, 35, p[5]);
      c.gem(24, 29, 4, p[3], p[6]);
    }
  }
  return c;
}
export function villageGroundFrame(kind) {
  const c = new PixelCanvas(48), grass = kind === "village-grass";
  const r = seeded(kind);
  // Same 48px isometric footprint and 29.5px support as the existing terrain.
  c.poly([[0,29],[24,17],[47,29],[47,33],[24,45],[0,33]],grass?"#395537":"#927e5b");
  c.poly([[0,29],[24,41],[24,45],[0,33]],grass?"#3f5b39":"#a18c65");
  c.poly([[24,41],[47,29],[47,33],[24,45]],grass?"#344f34":"#8c7858");
  c.poly([[0,29],[24,17],[47,29],[24,41]],grass?"#4c6b44":"#bda87f");
  if (grass) {
    // Tufts and clustered blades replace tile seams; adjoining fields read as grass.
    for(let y=18;y<=40;y++)for(let x=0;x<48;x++) {
      if(Math.abs(x-23.5)/23.5+Math.abs(y-29)/12>.94)continue;
      const noise=r();
      if(noise<.13)c.pixel(x,y,"#405d3a");
      else if(noise>.83)c.pixel(x,y,"#5c7c4e");
    }
    for(let i=0;i<24;i++) {
      const x=2+Math.floor(r()*44),y=20+Math.floor(r()*19);
      if(Math.abs(x-23.5)/23.5+Math.abs(y-29)/12>.8)continue;
      c.line(x,y,x-1,y-2,"#78915c");
      c.pixel(x+1,y-1,"#63834f");
      if(i%7===0)c.pixel(x-1,y,"#91a76a");
    }
    // A soft irregular edge hides the repeated masonry silhouette.
    for(const[x,y]of[[5,27],[10,24],[19,20],[32,22],[39,26],[43,28],[13,35],[31,36]]){
      c.pixel(x,y,"#5a794b");c.pixel(x+1,y-1,"#6b8754");
    }
  } else {
    const P=(u,v)=>[23.5+(u-v)*5.875,17+(u+v)*3];
    const stone=["#bda87f","#c7b38c","#b6a079","#cdb991"];
    for(let u=0;u<4;u++)for(let v=0;v<4;v++) {
      c.poly([P(u,v),P(u+1,v),P(u+1,v+1),P(u,v+1)],stone[(u*3+v)%stone.length],"#8e7c5d");
      const p=P(u+.35,v+.4);c.pixel(p[0],p[1],"#dfcba5");
      const q=P(u+.65,v+.7);if((u+v)%3===0)c.pixel(q[0],q[1],"#a18b65");
    }
    c.line(1,29,24,18,"#e0cca5");c.line(24,18,46,29,"#cfbb94");
    c.line(1,33,24,44,"#877453");c.line(25,44,46,33,"#796b50");
  }
  return c;
}
export function propFrame(kind, f = 0, count = 1) {
  const c = new PixelCanvas(96),
    r = seeded(kind),
    t = (f / count) * Math.PI * 2,
    pulse = Math.sin(t),
    base = 86;
  const poly = (p, col, ...edge) => c.poly(p, col, edge.length ? edge[0] : INK),
    line = (a, b, col, w = 1) => c.line(...a, ...b, col, w);
  if (kind === "column") {
    poly(
      [
        [29, 82],
        [46, 73],
        [65, 82],
        [48, 92],
      ],
      STONE[1],
    );
    poly(
      [
        [34, 79],
        [34, 25],
        [48, 18],
        [61, 25],
        [61, 80],
        [48, 87],
      ],
      STONE[1],
    );
    poly(
      [
        [36, 27],
        [47, 22],
        [47, 83],
        [36, 78],
      ],
      STONE[2],
      undefined,
    );
    poly(
      [
        [49, 23],
        [59, 27],
        [59, 78],
        [49, 84],
      ],
      STONE[0],
      undefined,
    );
    for (let i = 0; i < 4; i++) {
      line(
        [37 + i * 3, 30 - i],
        [37 + i * 3, 74 + i],
        i % 2 ? STONE[1] : STONE[3],
      );
      line([51 + i * 2, 29 + i], [51 + i * 2, 77 - i], STONE[2]);
    }
    poly(
      [
        [27, 24],
        [48, 13],
        [69, 24],
        [69, 31],
        [48, 42],
        [27, 31],
      ],
      STONE[2],
    );
    poly(
      [
        [30, 24],
        [48, 16],
        [66, 24],
        [48, 33],
      ],
      STONE[3],
    );
    line([31, 24], [48, 17], STONE[4]);
    line([29, 30], [48, 39], STONE[1]);
    line([48, 39], [67, 29], STONE[0]);
    poly(
      [
        [31, 77],
        [47, 85],
        [64, 77],
        [64, 83],
        [48, 92],
        [31, 84],
      ],
      STONE[2],
    );
    line([33, 79], [48, 87], STONE[3]);
    line([42, 36], [39, 45], STONE[0]);
    line([39, 45], [43, 52], STONE[0]);
    line([43, 52], [41, 61], STONE[0]);
    line([34, 80], [32, 64], "#294e42", 2);
    line([32, 64], [37, 48], "#3f6c52", 2);
    line([37, 48], [32, 31], "#477a5c");
    for (const [x, y] of [
      [33, 66],
      [36, 51],
      [35, 43],
      [32, 72],
    ]) {
      c.ellipse(x, y, 4, 2, "#527c57");
      c.pixel(x - 1, y - 1, "#8aab70");
    }
  } else if (kind === "tree") {
    poly(
      [
        [44, 84],
        [32, 93],
        [37, 81],
        [22, 86],
        [35, 75],
        [42, 55],
        [39, 38],
        [30, 29],
        [19, 27],
        [26, 23],
        [15, 12],
        [31, 22],
        [39, 29],
        [44, 18],
        [42, 9],
        [48, 15],
        [51, 6],
        [52, 29],
        [64, 22],
        [69, 11],
        [73, 12],
        [69, 25],
        [61, 34],
        [54, 46],
        [54, 75],
        [68, 88],
        [55, 84],
        [61, 94],
      ],
      "#253c3b",
    );
    line([43, 78], [48, 50], "#526559", 3);
    line([48, 51], [46, 29], "#6c7c61", 2);
    line([47, 44], [34, 30], "#506d55", 2);
    line([51, 41], [64, 28], "#738467", 2);
    line([45, 76], [37, 85], "#7f8c6c");
    const clusters = [
      [21, 22, 12, 7],
      [32, 12, 14, 8],
      [51, 13, 13, 7],
      [66, 23, 14, 9],
      [58, 38, 12, 6],
      [29, 34, 11, 5],
    ];
    for (const [x, y, rx, ry] of clusters) {
      c.ellipse(x, y, rx, ry, "#203d3b", INK);
      c.ellipse(x - 2, y - 2, rx - 2, ry - 2, "#33594a");
      for (let i = 0; i < 38; i++) {
        const xx = x + (r() - 0.5) * rx * 2,
          yy = y + (r() - 0.5) * ry * 2;
        if ((xx - x) ** 2 / rx ** 2 + (yy - y) ** 2 / ry ** 2 < 0.85)
          c.rect(
            xx,
            yy,
            2,
            1,
            i % 7 === 0 ? "#91b58b" : i % 2 ? "#466c53" : "#638965",
          );
      }
    }
    for (const [x, y] of [
      [23, 22],
      [38, 13],
      [68, 27],
      [55, 38],
    ]) {
      c.pixel(x, y, "#a2e1af");
      c.pixel(x + 1, y, "#d9efc0");
    }
  } else if (kind === "crystal") {
    c.ellipse(48, 85, 20, 6, "#122e37");
    for (const [x, y, h, w] of [
      [33, 84, 23, 6],
      [48, 85, 44, 9],
      [62, 84, 31, 7],
    ]) {
      poly(
        [
          [x - w, y - 2],
          [x - w, y - h + 10],
          [x, y - h],
          [x + w, y - h + 11],
          [x + w - 1, y - 3],
          [x, y + 2],
        ],
        MAGIC[1],
      );
      poly(
        [
          [x, y - h + 1],
          [x + w - 1, y - h + 11],
          [x + 2, y - 3],
          [x, y],
        ],
        MAGIC[2],
        undefined,
      );
      poly(
        [
          [x - 1, y - h + 2],
          [x - 1, y - 3],
          [x - w + 2, y - 5],
          [x - w + 2, y - h + 10],
        ],
        MAGIC[3],
        undefined,
      );
      line([x, y - h + 3], [x, y - 6], MAGIC[4]);
    }
    const glint = f % 8;
    c.pixel(48, 45 + glint * 4, MAGIC[4]);
    c.pixel(49, 46 + glint * 4, MAGIC[4]);
  } else if (kind === "urn") {
    c.ellipse(48, 85, 12, 4, STONE[0]);
    poly(
      [
        [40, 64],
        [38, 69],
        [36, 76],
        [38, 83],
        [44, 87],
        [53, 87],
        [59, 81],
        [58, 71],
        [54, 65],
        [55, 61],
        [40, 61],
      ],
      GOLD[1],
    );
    c.ellipse(47, 65, 8, 3, GOLD[3]);
    c.ellipse(47, 63, 7, 2, STONE[0]);
    poly(
      [
        [39, 70],
        [44, 69],
        [42, 82],
        [39, 80],
      ],
      GOLD[3],
      undefined,
    );
    poly(
      [
        [46, 69],
        [52, 69],
        [54, 83],
        [46, 85],
      ],
      GOLD[2],
      undefined,
    );
    line([38, 74], [57, 74], GOLD[4]);
    line([39, 78], [57, 78], GOLD[0]);
    line([41, 82], [54, 82], GOLD[3]);
  } else if (kind === "rubble") {
    for (const [x, y, w, h] of [
      [31, 84, 10, 8],
      [48, 79, 15, 11],
      [62, 86, 12, 6],
      [44, 89, 9, 5],
    ]) {
      poly(
        [
          [x - w, y],
          [x - w * 0.5, y - h],
          [x + w * 0.5, y - h * 0.8],
          [x + w, y],
          [x, y + h * 0.5],
        ],
        STONE[1],
      );
      poly(
        [
          [x - w + 1, y - 1],
          [x - w * 0.5, y - h + 1],
          [x + w * 0.5, y - h * 0.8 + 1],
          [x, y + 1],
        ],
        STONE[3],
        undefined,
      );
      line([x, y + 1], [x, y + h * 0.5], STONE[0]);
    }
  } else if (kind === "flower") {
    const sway = Math.round(Math.sin(t) * 2),
      x = 47 + sway;
    c.ellipse(48, 85, 16, 4, "#1b3738");
    line([48, 85], [x, 57], "#4d7753", 2);
    line([48, 77], [35, 68], "#5b8b62", 2);
    line([48, 73], [61, 64], "#426b4e", 2);
    for (const [xx, yy] of [
      [36, 69],
      [57, 67],
      [49, 79],
    ]) {
      poly(
        [
          [xx - 7, yy],
          [xx - 2, yy - 4],
          [xx + 5, yy - 1],
          [xx + 2, yy + 2],
        ],
        "#507c55",
      );
      line([xx - 5, yy], [xx + 3, yy - 1], "#93ad6e");
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2,
        xx = x + Math.cos(a) * 7,
        yy = 56 + Math.sin(a) * 5;
      c.ellipse(xx, yy, 5, 4, "#619e94", INK);
      c.ellipse(xx - 1, yy - 1, 3, 2, "#a6d3b3");
    }
    c.ellipse(x, 56, 3, 3, GOLD[4], GOLD[1]);
    c.pixel(x, 55, "#fff1bd");
  } else if (kind === "mirror") {
    poly(
      [
        [37, 86],
        [41, 68],
        [54, 68],
        [61, 86],
      ],
      STONE[1],
    );
    line([40, 82], [57, 82], GOLD[2], 2);
    c.ellipse(48, 56, 16, 24, GOLD[1], INK);
    c.ellipse(48, 55, 13, 21, GOLD[4]);
    c.ellipse(48, 55, 11, 19, "#284d60");
    c.ellipse(46, 52, 9, 16, "#416e7a");
    line([40, 61], [53, 42], "#92c3bc", 2);
    line([45, 65], [56, 49], "#6f9a9c");
    c.pixel(42 + (f % 5), 48, MAGIC[4]);
    c.gem(48, 30, 3, GOLD[3]);
  } else if (kind === "torch" || kind === "obelisk") {
    const ob = kind === "obelisk";
    poly(
      [
        [32, 84],
        [48, 76],
        [65, 84],
        [49, 93],
      ],
      STONE[1],
    );
    poly(
      [
        [39, 81],
        [40, ob ? 42 : 59],
        [48, ob ? 27 : 54],
        [57, ob ? 43 : 59],
        [57, 82],
        [48, 87],
      ],
      STONE[2],
    );
    poly(
      [
        [42, ob ? 44 : 60],
        [47, ob ? 32 : 57],
        [47, 83],
        [42, 80],
      ],
      STONE[3],
      undefined,
    );
    line([48, ob ? 32 : 60], [48, 84], STONE[0]);
    if (ob) {
      for (let i = 0; i < 3; i++) {
        line([44, 52 + i * 7], [48, 55 + i * 7], MAGIC[2]);
        line([48, 55 + i * 7], [53, 51 + i * 7], MAGIC[3]);
      }
      c.gem(48, 44, 4, MAGIC[3], MAGIC[4]);
    } else {
      poly(
        [
          [35, 58],
          [48, 65],
          [61, 58],
          [59, 53],
          [37, 53],
        ],
        GOLD[1],
      );
      line([37, 55], [48, 61], GOLD[4]);
      line([48, 61], [59, 55], GOLD[2]);
      const top = 32 + Math.round(pulse * 3);
      poly(
        [
          [42, 54],
          [38, 46],
          [41, 39],
          [44, 46],
          [47, top],
          [51, top - 5],
          [50, 41],
          [55, 35 + (f % 3)],
          [57, 45],
          [54, 54],
        ],
        MAGIC[2],
      );
      poly(
        [
          [45, 54],
          [42, 47],
          [46, 40],
          [48, 45],
          [51, 37],
          [52, 49],
          [50, 54],
        ],
        MAGIC[3],
        undefined,
      );
      poly(
        [
          [47, 54],
          [46, 48],
          [49, 44],
          [51, 51],
        ],
        MAGIC[4],
        undefined,
      );
      c.pixel(46, top - 6, MAGIC[2]);
    }
  } else if (kind === "gate-closed" || kind === "gate-open" || kind.startsWith("gate-open-")) {
    const opening=kind==="gate-closed"?0:kind==="gate-open"?1:Math.max(0,Math.min(1,Number(kind.split("-").at(-1))/7));
    poly([[15,85],[47,77],[82,85],[49,94]],STONE[1]);
    poly([[17,84],[47,79],[79,84],[48,90]],STONE[3]);
    poly([[28,84],[28,49],[34,34],[48,21],[62,35],[68,49],[68,84]],"#12222c");
    const width=20*Math.cos(opening*Math.PI*.62),swing=8*Math.sin(opening*Math.PI*.62);
    for(const side of [-1,1]) {
      const hinge=side===-1?28:68,sign=-side;
      const q=(along,y)=>[hinge+sign*width*along,y+swing*along];
      poly([q(0,44),q(.35,35),q(1,24),q(1,84),q(0,83)],side===-1?GOLD[2]:GOLD[1]);
      for(let i=1;i<5;i++)line(q(i/5,44-i*4),q(i/5,83),GOLD[0]);
      for(const y of [51,72]) {
        line(q(.04,y),q(.96,y),STONE[0],4);
        line(q(.04,y-1),q(.96,y-1),STONE[2],2);
        for(const a of [.16,.8]){const p=q(a,y);c.pixel(...p,STONE[4]);}
      }
      line(q(.08,79),q(.92,48),STONE[1],2);
      const handle=q(.85,62);c.ring(...handle,2,3,GOLD[3],0,1);
      if(opening<.3){const p=q(.97,61);c.rect(p[0]-1,p[1]-3,3,7,STONE[2]);}
    }
    poly([[17,86],[16,49],[22,32],[33,18],[48,7],[63,18],[75,33],[81,51],[79,87],[65,87],[67,51],[61,37],[54,28],[48,22],[40,29],[33,40],[29,52],[31,86]],STONE[2]);
    for(let i=0;i<5;i++) {
      const y=49+i*7;
      c.rect(18,y,11,6,i%2?STONE[2]:STONE[3]);line([18,y],[28,y],STONE[4]);
      line([17,y+6],[30,y+6],STONE[0]);
      c.rect(68,y+1,10,6,i%2?STONE[1]:STONE[2]);line([68,y+1],[77,y+1],STONE[3]);
      line([67,y+7],[78,y+7],STONE[0]);
    }
    for(const[a,b]of[[[19,43],[31,47]],[[23,31],[35,37]],[[31,20],[41,29]],[[41,12],[45,24]],[[54,12],[51,24]],[[64,20],[56,30]],[[74,34],[62,40]]]) {
      line(a,b,STONE[0],2);line([a[0],a[1]-1],[b[0],b[1]-1],STONE[3]);
    }
    line([18,46],[25,31],STONE[4]);line([25,31],[35,19],STONE[4]);line([35,19],[48,9],STONE[3]);
    poly([[43,10],[48,7],[53,11],[51,24],[46,26]],STONE[3]);line([45,12],[47,22],STONE[4]);
    c.gem(48,17,2,GOLD[4]);
    for(const[x,y]of[[19,61],[21,74],[29,37],[36,22],[70,68]]){c.rect(x,y,2,3,"#708268");c.pixel(x+2,y+2,"#9ba58a");}
  } else if (kind === "gate-key") {
    c.ellipse(48,82,16,4,"#d4a96225");
    c.ring(40,64,5,5,GOLD[1],0,3);c.ring(40,64,4,4,GOLD[4],0,1);
    line([44,68],[59,81],GOLD[1],4);line([44,67],[59,80],GOLD[3],2);
    line([54,76],[58,72],GOLD[3],2);line([59,80],[63,76],GOLD[4],2);
    c.pixel(37,61,GOLD[5]);c.pixel(58,64,GOLD[4]);c.pixel(31,74,GOLD[3]);
  } else if (kind === "key-cache") {
    poly([[24,82],[24,38],[47,29],[72,39],[72,82],[48,91]],STONE[1]);
    poly([[25,39],[48,47],[48,89],[25,81]],STONE[2]);
    poly([[25,38],[47,30],[71,39],[48,46]],STONE[3]);
    for(let y=49;y<82;y+=10){line([25,y],[47,y+6],STONE[0],2);line([49,y+6],[71,y],STONE[0],2);}
    poly([[37,50],[53,47],[60,56],[57,72],[42,76],[34,66]],"#17232c");
    line([44,43],[40,51],STONE[4]);line([40,51],[43,60],STONE[0],2);line([43,60],[37,69],STONE[0],2);
    poly([[38,52],[48,48],[57,55],[52,62],[42,61]],STONE[3]);
    c.ring(47,66,3,3,GOLD[3],0,1);line([49,68],[55,73],GOLD[3],2);c.pixel(54,71,GOLD[5]);
    c.rect(28,78,3,2,"#71846a");
  } else if (kind === "portal") {
    // Thick masonry jambs, individual voussoirs and a recessed energy opening.
    poly([[15, 85], [47, 77], [82, 85], [49, 94]], STONE[1]);
    poly([[17, 84], [47, 79], [79, 84], [48, 90]], STONE[3]);
    poly([[29, 84], [28, 49], [34, 34], [48, 20], [62, 35], [68, 49], [67, 84]], "#122c3b90");
    const arch = [
      [17, 86], [16, 49], [22, 32], [33, 18], [48, 7],
      [63, 18], [75, 33], [81, 51], [79, 87], [65, 87],
      [67, 51], [61, 37], [54, 28], [48, 22], [40, 29],
      [33, 40], [29, 52], [31, 86],
    ];
    poly(arch, STONE[2]);
    poly([[72, 35], [81, 50], [79, 87], [75, 88], [76, 52]], STONE[1]);
    for (let i = 0; i < 5; i++) {
      const y = 49 + i * 7;
      c.rect(18, y, 11, 6, i % 2 ? STONE[2] : STONE[3]);
      line([18, y], [28, y], STONE[4]);
      line([17, y + 6], [30, y + 6], STONE[0]);
      c.rect(68, y + 1, 10, 6, i % 2 ? STONE[1] : STONE[2]);
      line([68, y + 1], [77, y + 1], STONE[3]);
      line([67, y + 7], [78, y + 7], STONE[0]);
    }
    const joints = [[[19, 43], [31, 47]], [[23, 31], [35, 37]], [[31, 20], [41, 29]], [[41, 12], [45, 24]], [[54, 12], [51, 24]], [[64, 20], [56, 30]], [[74, 34], [62, 40]]];
    for (const [a, b] of joints) { line(a, b, STONE[0], 2); line([a[0], a[1] - 1], [b[0], b[1] - 1], STONE[3]); }
    line([18, 46], [25, 31], STONE[4]);
    line([25, 31], [35, 19], STONE[4]);
    line([35, 19], [48, 9], STONE[3]);
    poly([[43, 10], [48, 7], [53, 11], [51, 24], [46, 26]], STONE[3]);
    line([45, 12], [47, 22], STONE[4]);
    for (const [x, y] of [[19, 61], [21, 74], [29, 37], [36, 22], [70, 68]]) {
      c.rect(x, y, 2, 3, "#708268");
      c.pixel(x + 2, y + 2, "#9ba58a");
    }
    for (let y = 30; y < 84; y++)
      for (let x = 30; x < 68; x++) {
        const nx = (x - 48) / 19,
          ny = (y - 60) / 34;
        if (nx * nx + ny * ny < 1 && (x + y + f) % 5 === 0)
          c.pixel(x, y, "#254e5c80");
      }
    for (let i = 0; i < 3; i++) {
      const a = t + i * 2.1;
      const xx = 48 + Math.cos(a) * 12,
        yy = 58 + Math.sin(a) * 20;
      c.ring(xx, yy, 7, 11, "#79bda786", a);
      c.pixel(xx, yy - 10, MAGIC[4]);
    }
    c.gem(48, 17, 2, MAGIC[3]);
    c.ring(48, 85, 17, 4, MAGIC[2]);
  } else if (kind === "gear" || kind === "astrolabe") {
    poly(
      [
        [37, 85],
        [43, 73],
        [54, 73],
        [62, 85],
        [49, 92],
      ],
      STONE[2],
    );
    if (kind === "gear") {
      c.ring(48, 57, 25, 25, GOLD[1], 0, 5);
      c.ring(47, 56, 23, 23, GOLD[3], 0, 2);
      for (let i = 0; i < 12; i++) {
        const a = t + (i / 12) * Math.PI * 2,
          xx = 48 + Math.cos(a) * 27,
          yy = 57 + Math.sin(a) * 27;
        c.rect(xx - 3, yy - 3, 6, 6, GOLD[2]);
        line(
          [48 + Math.cos(a) * 7, 57 + Math.sin(a) * 7],
          [48 + Math.cos(a) * 20, 57 + Math.sin(a) * 20],
          GOLD[1],
          3,
        );
        c.pixel(xx - 2, yy - 2, GOLD[4]);
      }
      c.ellipse(48, 57, 8, 8, STONE[2], INK);
      c.ellipse(46, 55, 4, 4, STONE[3]);
    } else {
      c.ring(48, 51, 27, 35, GOLD[2], 0, 2);
      c.ring(48, 51, 30, 16, STONE[3], 0, 2);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2,
          xx = 48 + Math.cos(a) * 29,
          yy = 51 + Math.sin(a) * 15;
        c.pixel(xx, yy, GOLD[4]);
      }
      c.ring(48, 51, 15 + Math.abs(Math.cos(t)) * 11, 30, GOLD[3], 0, 2);
      line([48, 17], [48, 84], GOLD[1]);
      c.gem(48, 51, 10, GOLD[3], GOLD[5]);
    }
  } else if (kind === "forge") {
    poly(
      [
        [24, 83],
        [24, 40],
        [35, 32],
        [35, 13],
        [58, 13],
        [58, 32],
        [73, 41],
        [73, 84],
        [48, 94],
      ],
      STONE[1],
    );
    poly(
      [
        [27, 42],
        [46, 32],
        [46, 89],
        [27, 81],
      ],
      STONE[2],
      undefined,
    );
    poly(
      [
        [49, 33],
        [70, 43],
        [70, 82],
        [49, 89],
      ],
      STONE[0],
      undefined,
    );
    for (let y = 17; y < 37; y += 6) line([37, y], [56, y], GOLD[1], 2);
    for (let y = 43; y < 80; y += 8) line([27, y], [46, y - 5], STONE[3]);
    poly(
      [
        [33, 79],
        [34, 58],
        [39, 48],
        [48, 44],
        [59, 49],
        [64, 60],
        [64, 80],
      ],
      "#261e2c",
      GOLD[2],
    );
    poly(
      [
        [38, 78],
        [37, 65],
        [42, 54 + (f % 3)],
        [44, 66],
        [49, 50 + Math.round(pulse * 3)],
        [54, 61],
        [57, 58],
        [60, 77],
      ],
      "#c87542",
    );
    poly(
      [
        [43, 77],
        [42, 67],
        [48, 60],
        [50, 69],
        [55, 64],
        [57, 78],
      ],
      "#efb96c",
    );
    line([44, 77], [51, 70], "#ffe3a1", 3);
    line([29, 83], [48, 92], GOLD[2], 2);
  } else if (kind === "shelf") {
    poly(
      [
        [23, 83],
        [23, 22],
        [47, 11],
        [73, 23],
        [73, 83],
        [48, 94],
      ],
      "#2d2b39",
    );
    poly(
      [
        [27, 25],
        [46, 16],
        [46, 88],
        [27, 80],
      ],
      "#524242",
      GOLD[1],
    );
    poly(
      [
        [49, 16],
        [69, 26],
        [69, 80],
        [49, 88],
      ],
      "#302b3c",
      GOLD[1],
    );
    for (let row = 0; row < 3; row++) {
      const y = 34 + row * 18;
      line([26, y + 11], [47, y + 21], GOLD[2], 2);
      line([48, y + 21], [71, y + 10], GOLD[1], 2);
      for (let i = 0; i < 9; i++) {
        const x = 29 + i * 4.3,
          yy = y + Math.abs(x - 48) * -0.45,
          h = 9 + Math.floor(r() * 5),
          col = ["#697e89", "#8d696a", "#9c976f", "#4f7376", "#aa8e75"][i % 5];
        c.rect(x, yy - h, 3, h, col);
        c.pixel(x, yy - h + 2, "#d7cda0");
        c.pixel(x + 2, yy - 1, "#32313d");
      }
    }
    c.gem(48, 15, 3, "#9ab8c1");
  } else if (kind === "chest" || kind === "chest-open" || kind.startsWith("chest-open-")) {
    const opening = kind === "chest" ? 0 : kind === "chest-open" ? 1 : Math.min(1, Math.max(0, Number(kind.split("-").at(-1)) / 7));
    const open = opening > 0;
    poly([[23, 66], [49, 58], [75, 66], [74, 84], [48, 91], [23, 83]], GOLD[1]);
    poly([[23, 66], [48, 74], [48, 91], [23, 83]], GOLD[2]);
    poly([[48, 74], [75, 66], [74, 84], [48, 91]], GOLD[0]);
    for (let x = 28; x <= 43; x += 6) line([x, 69], [x, 83], GOLD[1]);
    for (let x = 54; x <= 71; x += 6) line([x, 75 - (x - 48) / 3], [x, 87 - (x - 48) / 4], GOLD[1]);
    if (open) {
      const lift = opening * 21;
      // The rear hinge stays fixed while the lid rises and its inside becomes visible.
      poly([[24, 65], [26, 52 - lift], [48, 44 - lift], [74, 52 - lift], [74, 65], [49, 58]], GOLD[2]);
      poly([[28, 61], [30, 54 - lift], [49, 49 - lift], [69, 54 - lift], [70, 61], [49, 55]], GOLD[0]);
      line([27, 52 - lift], [48, 45 - lift], GOLD[4], 2);
      line([48, 45 - lift], [73, 53 - lift], GOLD[3], 2);
      for(const x of [33, 61]) line([x,54 - lift], [x,60], STONE[2],2);
      poly([[27, 66], [49, 60], [71, 66], [48, 73]], "#17232c");
      const glow = Math.sin(Math.min(1, opening) * Math.PI) * .7 + .25;
      const alpha = Math.round(glow * 155).toString(16).padStart(2,"0");
      c.ellipse(48, 64, 14 + opening * 3, 5, `#e4bc70${alpha}`);
      if (opening > .2 && opening < 1) {
        for (const [x, shift] of [[38, -3],[48, 1],[58, 4]])
          poly([[x-2,64],[x+shift-1,42-lift*.5],[x+shift+1,42-lift*.5],[x+2,64]], `#f5dda040`, undefined);
        c.pixel(38 + opening * 6, 47 - opening * 11, GOLD[4]);
        c.pixel(56 - opening * 2, 53 - opening * 12, MAGIC[4]);
      }
      c.gem(46, 66, 3, MAGIC[2]);
      for (const x of [36, 54, 62]) c.pixel(x, 65, GOLD[4]);
    } else {
      poly([[23, 66], [26, 52], [49, 44], [73, 52], [75, 66], [48, 75]], GOLD[2]);
      poly([[26, 53], [49, 46], [71, 53], [48, 61]], GOLD[3]);
      poly([[24, 64], [26, 54], [48, 62], [48, 74]], GOLD[2]);
      poly([[48, 62], [71, 54], [74, 65], [48, 74]], GOLD[1]);
      line([27, 58], [47, 65], GOLD[1]);
      line([49, 57], [65, 52], GOLD[2]);
    }
    for (const x of [28, 41]) {
      line([x, 69], [x, 84], STONE[2], 3);
      c.pixel(x, 72, STONE[4]);
      c.pixel(x, 81, STONE[4]);
    }
    if (opening < .15) {
      c.rect(44, 71 - opening * 15, 8, 9, GOLD[3]);
      c.rect(47, 74 - opening * 15, 2, 4, GOLD[0]);
    } else {
      c.rect(46, 76, 5, 5, GOLD[2]);
      line([48,74],[48,77],STONE[3],2);
    }
    line([24, 66], [48, 74], GOLD[4]);
    line([49, 74], [74, 66], GOLD[2]);
  } else if (kind === "crate") {
    poly([[27, 52], [49, 44], [72, 52], [72, 81], [49, 89], [27, 81]], GOLD[1]);
    poly([[28, 53], [49, 60], [49, 88], [28, 80]], GOLD[2]);
    poly([[49, 60], [71, 53], [71, 80], [49, 88]], GOLD[0]);
    poly([[28, 52], [49, 45], [71, 52], [49, 59]], GOLD[3]);
    for (let x = 33; x < 48; x += 5) line([x, 55], [x, 83], GOLD[1]);
    for (let x = 54; x < 69; x += 5) line([x, 60], [x, 83 - (x - 49) / 3], GOLD[1]);
    line([30, 56], [46, 85], GOLD[3], 4);
    line([30, 78], [46, 64], GOLD[1], 4);
    line([52, 62], [68, 78], GOLD[2], 4);
    line([51, 84], [68, 57], GOLD[2], 4);
    for (const [x, y] of [[30, 57], [46, 84], [53, 63], [68, 77]]) c.pixel(x, y, STONE[4]);
    line([29, 52], [49, 46], GOLD[4]);
  } else if (kind === "barrel") {
    c.ellipse(48, 81, 17, 8, GOLD[0], INK);
    poly([[32, 49], [64, 49], [68, 62], [65, 81], [48, 88], [31, 81], [28, 63]], GOLD[2]);
    for (let x = 33; x < 65; x += 5) {
      line([x, 51], [x + (x < 48 ? -1 : 1), 80], x % 2 ? GOLD[1] : GOLD[3]);
    }
    c.ellipse(48, 49, 16, 7, GOLD[3], INK);
    c.ellipse(48, 48, 12, 4, GOLD[2]);
    line([40, 45], [41, 51], GOLD[1]);
    line([51, 45], [52, 51], GOLD[1]);
    for (const y of [57, 74]) {
      c.ring(48, y, y === 57 ? 18 : 17, 5, STONE[1], 0, 3);
      line([32, y + 1], [43, y + 4], STONE[3], 2);
      c.pixel(36, y + 2, STONE[4]);
    }
  } else if (kind === "secret-wall") {
    poly([[17, 82], [17, 29], [47, 18], [79, 30], [79, 83], [48, 94]], STONE[1]);
    poly([[18, 30], [48, 40], [48, 92], [18, 82]], STONE[2]);
    poly([[48, 40], [78, 31], [78, 82], [48, 92]], STONE[1]);
    poly([[18, 29], [47, 19], [78, 30], [48, 39]], STONE[3]);
    for (let y = 42; y <= 81; y += 10) {
      line([19, y - 5], [47, y + 4], STONE[0], 2);
      line([49, y + 4], [77, y - 5], STONE[0], 2);
      line([20, y - 6], [45, y + 2], STONE[3]);
      const x = (y % 20) ? 31 : 38;
      line([x, y - 1], [x, y + 8], STONE[0]);
      line([x + 27, y], [x + 27, y + 8], STONE[0]);
    }
    const crack = [[47, 31], [43, 42], [48, 49], [40, 58], [45, 66], [38, 77], [41, 87]];
    for (let i = 1; i < crack.length; i++) {
      line(crack[i - 1], crack[i], "#09151f", 2);
      line([crack[i - 1][0] + 2, crack[i - 1][1]], [crack[i][0] + 2, crack[i][1]], STONE[4]);
    }
    line([44, 43], [33, 47], STONE[0], 2);
    line([43, 63], [56, 70], STONE[0], 2);
    for (const [x, y] of [[22, 42], [26, 71], [64, 38], [70, 79]]) c.rect(x, y, 3, 2, "#687b63");
    c.pixel(41, 58, MAGIC[3]);
  } else if (kind === "upgrade-altar") {
    poly([[19, 79], [48, 69], [79, 80], [49, 92]], STONE[1]);
    poly([[25, 74], [48, 66], [72, 75], [71, 83], [49, 90], [25, 82]], STONE[2]);
    poly([[30, 72], [30, 58], [48, 51], [67, 58], [67, 73], [49, 80]], STONE[2]);
    poly([[30, 58], [48, 51], [67, 58], [49, 65]], STONE[4]);
    poly([[31, 60], [48, 65], [48, 78], [31, 72]], STONE[3]);
    for (const x of [33, 60]) { c.rect(x, 51, 4, 10, GOLD[2]); c.pixel(x + 1, 51, GOLD[4]); }
    c.ring(48, 49, 15, 6, GOLD[2], 0, 2);
    c.gem(48, 38, 17, MAGIC[2], MAGIC[4]);
    c.poly([[48, 22], [52, 38], [48, 52], [48, 37]], MAGIC[3]);
    c.pixel(42, 29, MAGIC[4]);
    c.pixel(56, 22, MAGIC[2]);
    c.pixel(36, 38, MAGIC[3]);
    line([36, 71], [42, 73], GOLD[3]);
    line([52, 75], [61, 72], GOLD[2]);
  } else if (kind === "well") {
    c.ellipse(48,80,24,10,STONE[0],INK);
    c.rect(24,68,48,12,STONE[1]);
    c.ellipse(48,68,24,10,STONE[3],INK);c.ellipse(48,68,18,6,"#1e3945");c.ellipse(48,69,13,3,"#547e87");
    for(let i=0;i<5;i++){const x=28+i*9;line([x,74],[x,82],STONE[0]);c.pixel(x+2,76,STONE[3]);}
    for(const x of[25,70])line([x,79],[x,31],GOLD[1],4);
    line([24,35],[71,35],GOLD[2],4);line([46,35],[46,61],GOLD[3]);
    c.ellipse(46,63,5,3,GOLD[2],INK);c.rect(42,63,8,6,GOLD[2]);
    poly([[18,32],[47,17],[78,32],[48,45]],"#5d7978");
    line([20,32],[47,19],"#94b4a4");line([47,19],[75,32],"#395960",2);
    for(let i=0;i<4;i++)line([25+i*11,30],[45+i*5,39],"#3a555c");
  } else if (kind === "bench") {
    for(const[x,y]of[[23,73],[37,84],[62,65],[76,76]])line([x,y],[x,y+7],GOLD[0],3);
    poly([[19,67],[57,54],[79,66],[40,80]],GOLD[2]);
    for(let i=0;i<3;i++)line([22+i*5,67+i*3],[58+i*6,55+i*3],GOLD[3],2);
    for(const[x,y]of[[24,65],[65,54]])line([x,y],[x,y-14],GOLD[1],3);
    line([24,52],[65,40],GOLD[2],4);line([24,60],[65,48],GOLD[2],4);
    line([25,50],[65,38],GOLD[4]);
  } else if (kind === "planter") {
    poly([[24,67],[54,57],[76,68],[45,80]],GOLD[2]);
    poly([[24,67],[45,76],[76,67],[72,82],[45,90],[27,82]],GOLD[1]);
    poly([[28,67],[54,60],[71,68],[45,76]],"#342d32");
    line([26,70],[45,79],GOLD[3],2);line([45,79],[74,70],GOLD[2],2);
    for(let i=0;i<7;i++){
      const x=31+i*6,y=69-Math.abs(3-i)*1.3;
      line([x,y],[x-1,y-11],"#607b57",2);
      c.ellipse(x-3,y-6,4,2,"#75936a");c.ellipse(x+2,y-10,3,2,"#98ad75");
      if(i%2===0){c.ellipse(x-1,y-13,3,2,i%4?"#d6b477":"#bc8da1");c.pixel(x-1,y-13,"#f3ddb3");}
    }
  } else if (kind === "lamp") {
    c.ellipse(48,86,11,4,STONE[1],INK);c.ellipse(48,83,7,3,STONE[3]);
    line([48,82],[48,33],STONE[0],4);line([47,80],[47,34],STONE[3]);
    poly([[37,31],[48,25],[59,31],[56,48],[48,52],[40,48]],GOLD[1]);
    poly([[41,33],[47,30],[47,47],[42,45]],"#e9c779");
    poly([[50,30],[55,33],[53,45],[50,47]],"#9d7847");
    c.gem(48,39,5,"#f5d98c","#fff0bd");
    for(const x of[39,48,57])line([x,31],[x<48?42:x>48?54:48,48],GOLD[1],2);
    poly([[35,31],[48,21],[61,31],[48,36]],GOLD[2]);line([38,30],[48,23],GOLD[4]);
    line([48,22],[48,17],GOLD[2],2);c.gem(48,17,2,GOLD[3]);
  } else if (kind === "sign") {
    line([48,85],[48,39],GOLD[1],4);line([47,83],[47,40],GOLD[3]);
    poly([[24,43],[66,43],[75,50],[66,57],[24,57]],GOLD[2]);
    poly([[69,60],[31,60],[22,67],[31,74],[69,74]],GOLD[1]);
    line([27,45],[65,45],GOLD[4]);line([31,62],[66,62],GOLD[3]);
    for(const[x,y]of[[31,49],[39,49],[49,49],[57,49],[36,66],[44,66],[53,66]])line([x,y],[x+4,y],"#4a3432",2);
    c.pixel(27,51,STONE[4]);c.pixel(66,68,STONE[4]);c.rect(41,84,14,3,STONE[2]);
  } else if (kind === "cookpot") {
    line([24, 86], [30, 49], GOLD[1], 4);
    line([71, 85], [66, 49], GOLD[1], 4);
    line([27, 50], [69, 50], GOLD[2], 3);
    c.ellipse(48, 72, 23, 13, "#26323d", INK);
    c.ellipse(48, 64, 23, 9, "#536168", INK);
    c.ellipse(48, 62, 19, 6, "#bb8152", GOLD[1]);
    for (let j = 0; j < 12; j++)
      c.rect(35 + r() * 24, 59 + r() * 7, 2, 1, j % 2 ? "#7e9b64" : "#e2b979");
    c.ring(48, 79, 13, 5, "#da8c4c");
    for (let j = 0; j < 3; j++)
      line([39 + j * 9, 54], [37 + j * 9, 42 - j * 3], "#b4c1a380", 2);
    c.rect(35, 84, 26, 3, GOLD[0]);
  } else if (kind === "cistern") {
    c.ellipse(45, 79, 20, 10, GOLD[1], INK);
    c.rect(25, 49, 40, 30, "#76503d");
    for (let j = 0; j < 7; j++)
      line([28 + j * 5, 53], [28 + j * 5, 78], j % 2 ? "#9f7951" : "#563c34");
    c.ellipse(45, 49, 20, 10, GOLD[2], INK);
    c.ellipse(45, 48, 16, 7, "#4d8b94", INK);
    line([29, 62], [61, 62], STONE[3], 3);
    line([29, 74], [61, 74], STONE[2], 3);
    line([67, 75], [67, 27], STONE[2], 5);
    line([66, 27], [78, 31], STONE[3], 4);
    line([77, 30], [77, 43], STONE[2], 3);
    line([64, 35], [55, 29], GOLD[2], 3);
    c.ellipse(57, 29, 3, 2, GOLD[3]);
    c.ellipse(77, 48, 2, 4, "#a4d9d3");
  } else if (kind === "loom") {
    for (const x of [25, 69]) {
      line([x, 84], [x, 25], GOLD[2], 5);
      line([x - 5, 87], [x + 7, 82], GOLD[1], 4);
    }
    line([24, 27], [71, 27], GOLD[3], 5);
    line([24, 76], [70, 76], GOLD[2], 4);
    c.rect(31, 34, 33, 38, "#7c536e");
    for (let j = 0; j < 12; j++)
      line(
        [32 + j * 2.5, 31],
        [32 + j * 2.5, 72],
        j % 2 ? "#c49a97" : "#a37c89",
      );
    for (let j = 0; j < 7; j++)
      line([31, 49 + j * 3], [63, 49 + j * 3], j % 2 ? "#d7b092" : "#65405c");
    line([29, 46], [67, 46], GOLD[3], 3);
    c.ellipse(77, 78, 8, 7, "#c39986", GOLD[1]);
    for (let j = 0; j < 4; j++)
      line([72, 74 + j * 2], [82, 76 + j * 2], "#ead0a1");
  }
  return c;
}

export function backgroundFrame() {
  const c = new PixelCanvas(640, 360),
    r = seeded("VESPERA-32BIT-TITLE");
  const sky = [
    "#0f1728",
    "#142336",
    "#1a3040",
    "#244149",
    "#365b58",
    "#547064",
  ];
  for (let y = 0; y < 360; y++) {
    const band = Math.min(4, Math.floor(y / 72)),
      blend = (y - band * 72) / 72;
    c.rect(0, y, 640, 1, mix(sky[band], sky[band + 1], blend));
  }
  for (let i = 0; i < 400; i++) {
    const x = r() * 640,
      y = r() * 205;
    c.pixel(x, y, i % 17 === 0 ? "#b6cbb0" : i % 3 ? "#405c67" : "#7d9c99");
    if (i % 29 === 0) {
      c.pixel(x + 1, y, "#7d9c99");
      c.pixel(x, y + 1, "#7d9c99");
    }
  }
  // Moon/astrolabe: irregular broken rings, engraved teeth and a dark core.
  c.ellipse(344, 117, 68, 65, "#385b5d");
  c.ellipse(338, 111, 51, 49, "#648477");
  c.ellipse(335, 108, 34, 33, "#aab991");
  c.ellipse(333, 105, 25, 25, "#d9d6a6");
  for (let k = 0; k < 4; k++) {
    const rad = 77 + k * 13;
    c.ring(
      344,
      117,
      rad,
      rad * 0.95,
      k % 2 ? "#718574" : "#a99c6d",
      0,
      k === 2 ? 2 : 1,
    );
  }
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    c.line(
      344 + Math.cos(a) * 103,
      117 + Math.sin(a) * 98,
      344 + Math.cos(a) * (i % 4 === 0 ? 111 : 107),
      117 + Math.sin(a) * (i % 4 === 0 ? 106 : 102),
      "#b5a16e",
    );
  }
  c.poly(
    [
      [334, 79],
      [350, 87],
      [341, 108],
      [361, 127],
      [349, 148],
      [337, 131],
      [332, 114],
      [324, 100],
    ],
    "#243b48",
    INK,
  );
  c.line(334, 79, 350, 87, "#d7c48c");
  // Distant skyline, roof crenellations, arched windows and suspended bridges.
  for (let layer = 0; layer < 3; layer++)
    for (let i = 0; i < 13; i++) {
      const x = i * 59 + (layer % 2) * 25 - 30,
        h = 35 + r() * 95,
        y = 260 + layer * 20;
      const col = ["#213c47", "#1a303e", "#142735"][layer];
      c.rect(x, y - h, 25, y + h, col);
      c.poly(
        [
          [x - 3, y - h],
          [x + 12, y - h - 23],
          [x + 28, y - h],
        ],
        col,
      );
      for (let n = 0; n < 4; n++) {
        c.rect(x + n * 7, y - h - 4, 3, 6, col);
      }
      for (let wy = y - h + 12; wy < y - 5; wy += 18) {
        c.rect(x + 9, wy, 5, 9, "#102331");
        c.pixel(x + 10, wy, "#547063");
      }
      if (i % 3 === 0) c.line(x + 22, y - h + 22, x + 65, y - h + 18, col, 4);
    }
  // Layered mist is painted in pixel clusters; foreground is never filtered.
  for (let layer = 0; layer < 4; layer++) {
    const yy = 210 + layer * 27;
    for (let i = 0; i < 60; i++) {
      const x = r() * 640,
        y = yy + r() * 12;
      c.line(
        x,
        y,
        x + 14 + r() * 40,
        y,
        ["#46656340", "#536f6140", "#30514f50", "#18393680"][layer],
        1,
      );
    }
  }
  c.poly(
    [
      [0, 325],
      [93, 298],
      [165, 310],
      [211, 287],
      [270, 313],
      [339, 299],
      [450, 325],
      [523, 295],
      [640, 319],
      [640, 360],
      [0, 360],
    ],
    "#142b32",
  );
  for (let i = 0; i < 1900; i++) {
    const x = r() * 640,
      y = 318 + r() * 42;
    c.rect(x, y, 2, 1, i % 4 ? "#203c3d" : "#456151");
  }
  // Foreground shrine frames the menu: native pixel brickwork and twin braziers.
  for (const side of [0, 1]) {
    const x = side ? 565 : 48;
    c.rect(x, 85, 25, 251, "#14252e");
    c.rect(x + 3, 91, 18, 238, "#293e42");
    for (let yy = 95; yy < 334; yy += 12) {
      c.line(x + 3, yy, x + 21, yy, "#40544f");
      c.line(
        x + 9 + (yy % 24 ? 0 : 6),
        yy,
        x + 9 + (yy % 24 ? 0 : 6),
        yy + 10,
        "#172b32",
      );
    }
    c.poly(
      [
        [x - 6, 85],
        [x + 12, 75],
        [x + 31, 85],
        [x + 12, 94],
      ],
      "#4a5e56",
      INK,
    );
    c.rect(x - 4, 87, 32, 7, "#324a48");
    const tx = side ? 536 : 98;
    c.rect(tx, 271, 8, 53, "#3b4a44");
    c.rect(tx - 5, 268, 18, 7, "#a17a45");
    c.poly(
      [
        [tx - 2, 267],
        [tx - 8, 257],
        [tx - 3, 240],
        [tx + 1, 246],
        [tx + 3, 231],
        [tx + 9, 243],
        [tx + 12, 255],
        [tx + 7, 268],
      ],
      "#418e80",
      INK,
    );
    c.poly(
      [
        [tx, 266],
        [tx - 3, 256],
        [tx + 2, 246],
        [tx + 4, 251],
        [tx + 7, 258],
        [tx + 5, 267],
      ],
      "#a9d2a6",
    );
    c.rect(tx + 1, 259, 3, 7, "#e5e7bb");
  }
  // Leaf clusters and roots border the scene without covering the menu text.
  for (const side of [0, 1])
    for (let i = 0; i < 18; i++) {
      const x = side ? 625 - r() * 65 : r() * 65,
        y = r() * 340;
      c.ellipse(x, y, 10 + r() * 15, 6 + r() * 6, "#132b30");
      for (let j = 0; j < 10; j++)
        c.rect(
          x + (r() - 0.5) * 22,
          y + (r() - 0.5) * 9,
          2,
          1,
          j % 3 ? "#284b42" : "#5c7b56",
        );
    }
  return c;
}
