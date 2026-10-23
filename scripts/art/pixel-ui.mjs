import { PixelCanvas, seeded, INK } from "./pixel-raster.mjs";
const G = [
  "#291d25",
  "#49302a",
  "#704833",
  "#a57442",
  "#d5a45d",
  "#f3ce85",
  "#fff0bd",
];
export function frame(kind = "panel") {
  const c = new PixelCanvas(48),
    r = seeded(kind),
    paper = kind === "panel",
    primary = kind === "primary",
    button = kind === "button" || primary;
  const fill = paper ? "#d2b887" : primary ? "#875231" : "#49302d";
  c.rect(2, 2, 44, 44, G[0]);
  c.rect(3, 3, 42, 42, G[3]);
  c.rect(5, 5, 38, 38, G[1]);
  c.rect(7, 7, 34, 34, fill);
  for (let i = 0; i < 250; i++) {
    const x = 8 + r() * 32,
      y = 8 + r() * 32;
    c.rect(
      x,
      y,
      paper ? 1 : 2,
      1,
      paper
        ? i % 3
          ? "#cfb484"
          : "#d7be90"
        : primary
          ? i % 2
            ? "#8d5735"
            : "#7f4e30"
          : i % 2
            ? "#4d322e"
            : "#442d2c",
    );
  }
  c.line(4, 4, 43, 4, G[5]);
  c.line(4, 4, 4, 43, G[4]);
  c.line(4, 43, 43, 43, G[1]);
  c.line(43, 4, 43, 43, G[0]);
  c.line(7, 7, 40, 7, paper ? "#f0d7a6" : G[3]);
  c.line(7, 7, 7, 40, paper ? "#e5c894" : G[2]);
  c.line(7, 40, 40, 40, paper ? "#ab885f" : G[0]);
  c.line(40, 7, 40, 40, paper ? "#ac895c" : G[0]);
  for (const [x, y] of [
    [3, 3],
    [38, 3],
    [3, 38],
    [38, 38],
  ]) {
    c.rect(x, y, 7, 7, G[0]);
    c.rect(x + 1, y + 1, 5, 5, G[3]);
    c.line(x + 1, y + 1, x + 5, y + 1, G[5]);
    c.line(x + 1, y + 1, x + 1, y + 5, G[4]);
    c.pixel(x + 3, y + 3, G[6]);
    c.pixel(x + 5, y + 5, G[1]);
  }
  if (!button)
    for (const [x, s] of [
      [11, 1],
      [36, -1],
    ]) {
      c.line(x, 2, x + s * 6, 2, G[5]);
      c.line(x + s * 6, 2, x + s * 9, 5, G[4]);
      c.line(x + s * 9, 5, x + s * 5, 6, G[3]);
      c.pixel(x + s * 5, 5, G[6]);
      c.line(x, 45, x + s * 6, 45, G[2]);
    }
  return c;
}
export function icon(name) {
  const c = new PixelCanvas(20),
    g = G[4],
    h = G[6],
    m = "#89c7ab",
    s = "#bbc4af";
  if (name === "sun" || name === "star") {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.line(
        10 + Math.cos(a) * 6,
        10 + Math.sin(a) * 6,
        10 + Math.cos(a) * 8,
        10 + Math.sin(a) * 8,
        g,
      );
    }
    c.ellipse(10, 10, 5, 5, g, INK);
    c.ellipse(9, 9, 3, 3, h);
  } else if (name === "heart") {
    c.poly(
      [
        [3, 5],
        [6, 3],
        [10, 6],
        [14, 3],
        [17, 5],
        [17, 10],
        [10, 17],
        [3, 10],
      ],
      "#ac4d4f",
      INK,
    );
    c.line(4, 5, 7, 4, "#e48c73");
    c.line(4, 6, 4, 9, "#eaa58a");
    c.line(11, 13, 14, 10, "#783445");
  } else if (name === "dagger") {
    c.line(4,17,9,11,G[3],3);
    c.poly([[7,11],[13,5],[17,3],[15,8],[10,14]],"#c491a3",INK);
    c.line(9,11,15,5,"#f7d8c9");
    c.line(5,11,10,16,g,2);
  } else if (name === "spear") {
    c.line(3,17,14,5,INK,3);
    c.line(3,17,14,5,G[3]);
    c.poly([[10,6],[17,2],[15,9],[13,7]],s,INK);
    c.line(13,6,16,3,h);
    c.line(10,9,13,11,g,2);
  } else if (name === "greatsword") {
    c.line(4,17,8,13,G[3],3);
    c.poly([[6,11],[12,3],[17,2],[17,7],[10,15]],"#8a9cac",INK);
    c.poly([[8,11],[13,4],[16,3],[9,13]],s);
    c.line(10,11,15,5,h);
    c.line(4,10,11,17,g,2);
  } else if (name === "axe") {
    c.line(4,17,13,4,INK,4);
    c.line(4,17,13,4,G[3],2);
    c.poly([[7,4],[13,2],[18,6],[17,11],[13,12],[12,8],[9,8]],"#82999e",INK);
    c.line(15,3,17,6,s,2);
    c.line(17,6,16,10,s,2);
    c.line(9,5,14,9,g,2);
  } else if (name === "scythe") {
    c.line(4,17,12,3,INK,3);
    c.line(4,17,12,3,"#a68097");
    c.poly([[7,4],[13,2],[18,5],[18,10],[15,7],[11,5],[7,6]],"#879ab6",INK);
    c.line(12,3,16,5,"#ddd9ec");
    c.line(16,5,18,8,"#ddd9ec");
  } else if (name === "rapier") {
    c.line(4,17,16,3,INK,3);
    c.line(4,17,16,3,"#e4e9da");
    c.ring(7,13,3,3,g,0,1);
    c.line(3,17,6,14,G[3],2);
    c.line(3,14,5,11,g);
  } else if (name === "crossbow") {
    c.line(4,17,14,6,INK,4);
    c.line(4,17,14,6,G[3],2);
    c.line(8,3,16,7,s,3);
    c.line(16,7,17,13,s,3);
    c.line(8,3,7,13,h);
    c.line(7,13,17,13,h);
    c.line(5,15,16,4,m);
  } else if (name === "staff") {
    c.line(4,17,13,6,INK,3);
    c.line(4,17,13,6,"#b18ea4");
    c.ring(13,5,4,4,g,0,1);
    c.gem(13,5,3,"#a28dde","#eadcff");
    c.line(5,14,7,15,g,2);
    c.pixel(7,2,"#b8a1dd");
  } else if (name === "pistol") {
    c.poly([[3,6],[16,4],[18,6],[17,9],[9,10],[7,17],[3,16],[5,10],[3,9]],"#536d7d",INK);
    c.line(4,6,16,5,s,2);
    c.line(12,7,17,6,g,2);
    c.line(5,12,4,16,G[3],2);
    c.line(8,11,11,11,G[2]);
  } else if (name === "chakram") {
    c.ring(10,10,7,7,INK,0,3);
    c.ring(10,10,6,6,g,0,2);
    c.ring(10,10,4,4,s,0,1);
    c.pixel(5,5,h);c.pixel(15,5,h);c.pixel(15,15,h);c.pixel(5,15,h);
  } else if (name === "blade") {
    c.line(4, 17, 15, 3, INK, 4);
    c.poly(
      [
        [7, 12],
        [12, 4],
        [17, 1],
        [15, 7],
        [9, 14],
      ],
      s,
      INK,
    );
    c.line(9, 10, 15, 3, h);
    c.line(5, 11, 11, 16, g, 2);
    c.line(5, 14, 3, 17, G[3], 2);
  } else if (name === "hammer") {
    c.line(5, 17, 13, 6, INK, 4);
    c.line(5, 17, 13, 6, G[3], 2);
    c.poly(
      [
        [7, 4],
        [11, 1],
        [19, 7],
        [16, 11],
      ],
      s,
      INK,
    );
    c.line(9, 4, 15, 9, g, 2);
  } else if (name === "bow") {
    c.line(5, 2, 13, 5, g, 2);
    c.line(13, 5, 16, 11, g, 2);
    c.line(16, 11, 14, 18, g, 2);
    c.line(5, 2, 7, 12, s);
    c.line(7, 12, 14, 18, s);
    c.line(3, 14, 17, 5, m);
    c.line(14, 5, 18, 5, h);
  } else if (name === "echo" || name === "glass") {
    c.poly(
      [
        [10, 1],
        [17, 9],
        [10, 19],
        [3, 10],
      ],
      "#5c9d99",
      INK,
    );
    c.poly(
      [
        [10, 3],
        [14, 9],
        [10, 15],
        [6, 10],
      ],
      m,
    );
    c.line(10, 3, 10, 11, h);
    c.pixel(9, 7, h);
  } else if (name === "coin") {
    c.ellipse(10, 10, 7, 8, G[2], INK);
    c.ellipse(9, 9, 5, 6, g);
    c.line(9, 5, 9, 13, h, 2);
    c.line(7, 7, 12, 7, G[3]);
    c.line(7, 12, 12, 12, G[3]);
  } else if (name === "map" || name === "book") {
    c.poly(
      [
        [2, 4],
        [8, 2],
        [12, 5],
        [18, 3],
        [18, 17],
        [12, 19],
        [8, 16],
        [2, 18],
      ],
      "#d9be8e",
      INK,
    );
    c.line(8, 3, 8, 15, G[2]);
    c.line(12, 6, 12, 18, G[3]);
    c.line(4, 7, 6, 8, G[3]);
    c.line(14, 8, 16, 7, G[2]);
    c.line(4, 12, 6, 11, G[2]);
  } else if (name === "pause") {
    c.rect(5, 3, 4, 14, INK);
    c.rect(11, 3, 4, 14, INK);
    c.rect(5, 3, 3, 13, g);
    c.rect(11, 3, 3, 13, h);
  } else if (name === "gear") {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.rect(8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, 4, 4, G[3]);
    }
    c.ring(10, 10, 6, 6, g, 0, 3);
    c.ellipse(10, 10, 2, 2, "#34444c", INK);
  } else if (name === "flame") {
    c.poly(
      [
        [5, 17],
        [2, 12],
        [5, 7],
        [7, 11],
        [10, 1],
        [14, 6],
        [13, 10],
        [16, 7],
        [18, 13],
        [15, 18],
      ],
      "#bb6543",
      INK,
    );
    c.poly(
      [
        [7, 17],
        [5, 12],
        [9, 8],
        [11, 12],
        [14, 11],
        [15, 16],
      ],
      "#efb76a",
    );
    c.poly(
      [
        [9, 17],
        [8, 14],
        [11, 12],
        [12, 17],
      ],
      "#ffe9a1",
    );
  } else if (name === "tide") {
    for (let i = 0; i < 3; i++) {
      c.line(2, 5 + i * 5, 6, 3 + i * 5, "#8fbbcb", 2);
      c.line(6, 3 + i * 5, 12, 6 + i * 5, "#b5d6ce", 2);
      c.line(12, 6 + i * 5, 18, 4 + i * 5, "#7199bc", 2);
    }
  } else if (name === "dash" || name === "arrow") {
    c.poly(
      [
        [5, 2],
        [16, 10],
        [5, 18],
        [8, 10],
      ],
      g,
      INK,
    );
    c.line(2, 6, 5, 8, m);
    c.line(1, 10, 4, 10, m);
    c.line(2, 14, 5, 12, m);
  } else if (name === "food") {
    c.ellipse(10, 11, 8, 5, "#be8b4b", INK);
    c.ellipse(10, 9, 8, 5, "#e5b96e", INK);
    for (const x of [6, 10, 14]) c.line(x, 6, x - 2, 10, "#99633b", 2);
    c.line(5, 13, 15, 13, "#f3d49a");
  } else if (name === "water") {
    c.poly(
      [
        [10, 1],
        [17, 11],
        [17, 15],
        [13, 18],
        [7, 18],
        [3, 14],
        [4, 10],
      ],
      "#609fb3",
      INK,
    );
    c.line(8, 7, 6, 12, "#c4e8de", 2);
    c.line(8, 16, 13, 16, "#94cbc8");
  } else if (name === "leaf") {
    c.poly(
      [
        [3, 16],
        [3, 9],
        [8, 3],
        [17, 2],
        [16, 12],
        [10, 17],
      ],
      "#71996b",
      INK,
    );
    c.line(3, 18, 14, 5, "#c7d59a", 2);
    c.line(9, 10, 8, 6, "#a6bc83");
  } else if (name === "thread") {
    c.ellipse(10, 5, 6, 3, g, INK);
    c.rect(6, 5, 8, 10, "#b17a87");
    for (let j = 0; j < 4; j++) c.line(6, 7 + j * 2, 14, 8 + j * 2, "#ecd0ad");
    c.ellipse(10, 16, 6, 2, g, INK);
  } else if (name === "coat") {
    c.poly(
      [
        [6, 3],
        [9, 5],
        [12, 3],
        [17, 8],
        [15, 12],
        [13, 10],
        [14, 18],
        [5, 18],
        [6, 10],
        [3, 12],
        [1, 8],
      ],
      "#806a87",
      INK,
    );
    c.line(9, 6, 9, 17, "#d9bca1", 2);
    c.line(5, 16, 14, 16, "#ac8b91");
  } else if (name === "pot") {
    c.ellipse(10, 13, 7, 5, "#536067", INK);
    c.ellipse(10, 9, 8, 4, g, INK);
    c.ellipse(10, 9, 6, 2, "#c08d56");
    c.line(7, 5, 6, 1, "#d5d9b3");
    c.line(12, 5, 13, 2, "#c1caa6");
  } else if (name === "cup") {
    c.rect(4, 8, 10, 9, "#9f7550");
    c.ellipse(9, 8, 5, 2, "#dbba81", INK);
    c.ring(15, 11, 3, 4, g);
    c.line(6, 4, 7, 1, "#c2d2b0");
    c.line(11, 5, 12, 2, "#d9dfbc");
  } else if (name === "skull") {
    c.ellipse(10, 8, 6, 6, s, INK);
    c.rect(6, 9, 8, 7, s);
    c.rect(5, 7, 4, 4, INK);
    c.rect(12, 7, 3, 4, INK);
    c.pixel(10, 12, INK);
    for (let i = 0; i < 3; i++) c.line(7 + i * 3, 15, 7 + i * 3, 17, INK);
  } else {
    c.gem(10, 10, 7, g, h);
  }
  return c;
}
const GLYPHS = {
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
};
export function logo() {
  const c = new PixelCanvas(248, 57),
    word = "VESPERA",
    scale = 5,
    start = 20;
  for (let j = 0; j < word.length; j++) {
    const glyph = GLYPHS[word[j]],
      xx = start + j * 30;
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 5; x++)
        if (glyph[y][x] === "1") {
          c.rect(
            xx + x * scale - 1,
            15 + y * scale - 1,
            scale + 2,
            scale + 3,
            INK,
          );
          c.rect(xx + x * scale + 1, 15 + y * scale + 3, scale, scale, G[1]);
        }
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 5; x++)
        if (glyph[y][x] === "1") {
          c.rect(
            xx + x * scale,
            15 + y * scale,
            scale,
            scale,
            [G[6], G[6], G[5], G[5], G[4], G[4], G[3]][y],
          );
          c.pixel(xx + x * scale, 15 + y * scale, G[6]);
        }
  }
  c.line(52, 10, 59, 5, G[5], 3);
  c.line(53, 9, 59, 5, G[6]);
  c.line(17, 53, 228, 53, G[2]);
  c.line(28, 54, 219, 54, G[4]);
  c.gem(123, 53, 3, G[5]);
  return c;
}
