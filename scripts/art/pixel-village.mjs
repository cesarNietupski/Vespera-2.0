import { PixelCanvas, seeded, INK } from "./pixel-raster.mjs";
import { propFrame } from "./pixel-world.mjs";

export const VILLAGE_RESIDENTS = ["salvia", "orren", "nim", "lume", "caio", "iria"];
const WOOD = ["#382d31", "#624335", "#956741", "#c1935e", "#e4bc80"];
const STONE = ["#263640", "#435455", "#6b7970", "#9ba48c", "#cad0af"];
const THEMES = {
  salvia: { wall: ["#45575b", "#7b9183", "#aab49a"], roof: ["#233c43", "#3d6366", "#678d83", "#a4b4a0"], floor: ["#526660", "#64776b", "#758475"] },
  orren: { wall: ["#4c4443", "#7b7062", "#a89979"], roof: ["#3e2e35", "#79503e", "#a9784b", "#d7aa6c"], floor: ["#465053", "#5b625e", "#697069"] },
  nim: { wall: ["#4b434c", "#8d7e78", "#c2ac8c"], roof: ["#30334d", "#4d5c79", "#7c8ea1", "#b8bfae"], floor: ["#76553d", "#936d47", "#a87e50"] },
  lume: { wall: ["#615040", "#9e8a67", "#d1b98b"], roof: ["#4b3035", "#94513f", "#c77e51", "#e8b16b"], floor: ["#8b7555", "#a18b64", "#b6a076"] },
  caio: { wall: ["#38545a", "#6c9292", "#a0bab0"], roof: ["#293f4a", "#3b737c", "#6c9d9c", "#acd0bd"], floor: ["#4d7176", "#71918b", "#92aaa0"] },
  iria: { wall: ["#5c4857", "#9f8190", "#ccb4af"], roof: ["#3f2e48", "#73516f", "#a47c96", "#d7b4bc"], floor: ["#75604f", "#947758", "#aa8c67"] },
};

// Floor is exactly five by four 42px world tiles, with its centre at (96,121).
const P = (u, v, z = 0) => [96 + ((u - 2.5) - (v - 2)) * 19.74, 121 + ((u - 2.5) + (v - 2)) * 10.08 - z];
export function villageFrame(kind) {
  const c = new PixelCanvas(192, 176);
  const poly = (points, color, outline = INK) => c.poly(points, color, outline);
  const line = (a, b, color, width = 1) => c.line(...a, ...b, color, width);
  if (kind === "lighthouse") {
    c.ellipse(96, 123, 36, 13, "#22333a", INK);
    c.ellipse(96, 119, 32, 11, STONE[2], INK);
    c.ellipse(96, 117, 27, 8, STONE[3]);
    poly([[76,116],[80,50],[84,45],[107,45],[112,51],[116,116],[97,124]],STONE[1]);
    poly([[78,112],[83,51],[95,48],[96,121]],STONE[2]);
    poly([[96,48],[107,49],[113,114],[97,121]],STONE[0]);
    for(let y=58;y<=113;y+=8) {
      line([82-(y-58)*.06,y],[111+(y-58)*.04,y+3],STONE[0]);
      line([82-(y-58)*.06,y-1],[95,y+1],STONE[3]);
      const x=y%16===10?88:96;
      line([x,y],[x,y+7],STONE[0]);
    }
    for(const y of [65,84]) { c.rect(92,y,6,11,"#122533");c.line(92,y,98,y,STONE[3]);c.rect(94,y+2,2,6,"#b89558"); }
    poly([[87,111],[88,99],[95,94],[102,100],[103,114]],"#1d2a32");
    poly([[89,110],[90,101],[95,98],[99,102],[100,112]],WOOD[1]);
    line([94,101],[95,111],WOOD[3]);
    c.pixel(98,107,"#efd38b");
    // Lantern gallery and glazed octagonal beacon.
    poly([[74,49],[95,41],[117,49],[117,55],[96,63],[74,55]],STONE[1]);
    poly([[74,49],[95,42],[117,49],[96,57]],STONE[4]);
    for(const x of [77,86,106,114]) line([x,48],[x,57],WOOD[1]);
    line([75,51],[96,59],WOOD[2],2);line([96,59],[116,51],WOOD[1],2);
    poly([[81,45],[82,26],[95,20],[109,26],[110,45],[96,51]],"#607961");
    poly([[84,42],[85,28],[94,25],[94,47]],"#d7bb72");
    poly([[97,25],[106,29],[107,43],[97,47]],"#916c3d");
    for(const x of [83,95,108]) line([x,26],[x,47],WOOD[1],2);
    c.gem(96,35,7,"#f0bf5e","#fff3b8");
    c.ellipse(96,35,3,5,"#fff3b8");
    poly([[78,26],[83,18],[95,12],[108,18],[113,26],[96,31]],"#966d46");
    line([81,25],[95,15],"#d5ac65",2);line([95,15],[109,24],WOOD[1],2);
    line([95,12],[95,6],"#e2bf78",2);c.gem(95,7,2,"#ffe6a1");
    c.poly([[109,30],[180,18],[178,31],[110,39]],"#efd18735");
    c.poly([[82,32],[20,24],[22,33],[82,40]],"#efd18725");
    for(const [x,y]of[[72,111],[115,120],[73,122]]){c.rect(x,y,3,2,"#697d64");c.pixel(x+2,y-1,"#9baf86");}
    return c;
  }
  const roof = kind.startsWith("roof-");
  const id = kind.replace(/^(house|roof)-/, "");
  const theme = THEMES[id] ?? THEMES.salvia;
  const r = seeded(`village-${id}`);
  if (roof) {
    const e00=P(-.1,-.1,59), e50=P(5.1,-.1,59), e54=P(5.1,4.1,59), e04=P(-.1,4.1,59);
    const ridge0=P(0,2,85), ridge5=P(5,2,85);
    poly([ridge5,e50,e54],theme.wall[0]);
    line(e50,ridge5,WOOD[1],2);line(ridge5,e54,WOOD[1],2);
    const gableMiddle=[(e50[0]+e54[0])/2,(e50[1]+e54[1])/2];
    line(ridge5,gableMiddle,WOOD[1],2);
    poly([e00,e50,[e50[0],e50[1]+6],[e00[0],e00[1]+6]],WOOD[1]);
    poly([ridge0,ridge5,e50,e00],theme.roof[1]);
    poly([ridge0,ridge5,e54,e04],theme.roof[1]);
    const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    for(let row=0;row<8;row++) {
      const t0=row/8,t1=(row+1)/8;
      const left0=mix(ridge0,e04,t0),right0=mix(ridge5,e54,t0);
      const left1=mix(ridge0,e04,t1),right1=mix(ridge5,e54,t1);
      for(let col=0;col<10;col++) {
        const q0=mix(left0,right0,col/10),q1=mix(left0,right0,(col+1)/10);
        const q2=mix(left1,right1,(col+1)/10),q3=mix(left1,right1,col/10);
        poly([q0,q1,q2,q3],theme.roof[1+((row+col)%3===0?1:0)],theme.roof[0]);
        if ((row+col)%4===0) line(q0,q1,theme.roof[2]);
      }
    }
    line(ridge0,ridge5,theme.roof[3],3);
    line(e04,e54,WOOD[1],3);line(e54,e50,WOOD[0],3);
    for (let n=0;n<3;n++) { const p=mix(e04,e54,.16+n*.3); c.rect(p[0],p[1],3,4,WOOD[2]); }
    // Distinct roof ornaments make every trade legible from the square.
    const ornament=P(3.8,.7,70);
    if (id === "orren" || id === "lume") {
      const [x,y]=ornament;
      poly([[x-7,y],[x-7,y-24],[x+4,y-29],[x+11,y-24],[x+11,y],[x+2,y+5]],STONE[1]);
      poly([[x-7,y-24],[x+3,y-29],[x+11,y-24],[x+1,y-19]],STONE[3]);
      for(let i=0;i<3;i++)line([x-6,y-18+i*7],[x+10,y-18+i*7],STONE[0]);
      c.ellipse(x+2,y-25,5,2,"#1a2830");
    } else if (id === "salvia") { const p=P(1.5,2,88);c.gem(...p,5,"#76b7a1","#d9e3b4"); }
    else if (id === "caio") { const p=P(2,2,87);c.line(p[0],p[1],p[0],p[1]-8,WOOD[2],2);c.poly([[p[0],p[1]-8],[p[0]+9,p[1]-5],[p[0],p[1]-2]],"#99cac1"); }
    else if (id === "nim") { const p=P(2.5,2,89);c.line(p[0],p[1],p[0],p[1]-8,WOOD[2],2);c.ring(p[0],p[1]-11,4,4,"#c7b57c",0,1); }
    else { const p=P(2,2,87);c.line(p[0],p[1],p[0],p[1]-7,WOOD[2],2);c.poly([[p[0]-5,p[1]-8],[p[0]+6,p[1]-8],[p[0]+3,p[1]-3]],"#c7a0b6",INK); }
    return c;
  }
  const corners=[P(0,0),P(5,0),P(5,4),P(0,4)];
  poly([corners[1],corners[2],corners[3],P(0,4,-6),P(5,4,-6),P(5,0,-6)],STONE[0]);
  for(let u=0;u<5;u++)for(let v=0;v<4;v++) {
    poly([P(u,v),P(u+1,v),P(u+1,v+1),P(u,v+1)],theme.floor[(u+v)%3],id==="nim"||id==="iria"?WOOD[1]:STONE[1]);
    const q=P(u+.3,v+.4);c.pixel(q[0],q[1],theme.floor[2]);
  }
  // Back and lateral walls only; the whole front quarter stays open for actors.
  poly([P(0,0),P(0,4),P(0,4,62),P(0,0,62)],theme.wall[1]);
  poly([P(0,0),P(5,0),P(5,0,62),P(0,0,62)],theme.wall[0]);
  for(const p of [[0,0],[0,4],[5,0]])line(P(...p),P(...p,62),WOOD[1],4);
  line(P(0,0,62),P(0,4,62),WOOD[2],4);line(P(0,0,62),P(5,0,62),WOOD[1],4);
  line(P(0,0,4),P(0,4,4),WOOD[2],3);line(P(0,0,4),P(5,0,4),WOOD[1],3);
  for(let v=1;v<4;v++)line(P(0,v,8),P(0,v,59),WOOD[1],2);
  for(let u=1;u<5;u++)line(P(u,0,8),P(u,0,59),WOOD[1],2);
  // Windows, mullions, carved lintels and native wood grain.
  const window=(u,v,axis)=>{
    const q=(t,z)=>P(u+(axis? t:0),v+(axis?0:t),z);
    poly([q(0,23),q(.85,23),q(.85,45),q(0,45)],WOOD[0]);
    poly([q(.1,25),q(.75,25),q(.75,43),q(.1,43)],id==="caio"?"#75a9ae":"#adc1ac");
    line(q(.42,24),q(.42,44),WOOD[1],2);line(q(.05,34),q(.8,34),WOOD[1],2);
    line(q(-.1,23),q(.95,23),WOOD[3],3);
  };
  window(0,2.3,false);window(3.5,0,true);
  for(let i=0;i<28;i++){const p=P(r()*4.6,.02,12+r()*43);c.pixel(p[0],p[1],theme.wall[1]);}
  // The doorstep follows centre+(1,1), matching the walkable door in the village.
  poly([P(3.1,2.8),P(3.9,2.8),P(4.9,3.8),P(4.1,3.8)],id==="iria"?"#926783":id==="caio"?"#82b4af":"#bc9a69",WOOD[1]);
  for(let i=0;i<3;i++)line(P(3.15+i*.4,2.85+i*.4),P(3.8+i*.4,2.85+i*.4),"#d8bf8c");
  const prop=(kind,u,v,scale=.48)=>{
    const canvas=propFrame(kind),a=P(u,v),left=Math.round(a[0]-48*scale),top=Math.round(a[1]-86*scale);
    const w=Math.ceil(96*scale),h=Math.ceil(96*scale);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      const sx=Math.min(95,Math.floor(x/scale)),sy=Math.min(95,Math.floor(y/scale));
      const si=(sy*96+sx)*4,dx=left+x,dy=top+y,di=(dy*192+dx)*4;
      if(canvas.data[si+3]&&dx>=0&&dy>=0&&dx<192&&dy<176)for(let n=0;n<4;n++)c.data[di+n]=canvas.data[si+n];
    }
  };
  const table=(u,v,w=1.5,d=.8)=>{
    for(const [x,y]of[[u,v],[u+w,v],[u,v+d],[u+w,v+d]])line(P(x,y,2),P(x,y,12),WOOD[0],2);
    poly([P(u,v,13),P(u+w,v,13),P(u+w,v+d,13),P(u,v+d,13)],WOOD[2]);
    line(P(u,v+d,13),P(u+w,v+d,13),WOOD[3],2);
  };
  if(id==="salvia") {
    prop("upgrade-altar",1.6,.55,.56);prop("crystal",.55,2.25,.44);prop("planter",.55,3.45,.4);
    c.ring(...P(2.2,1.65),16,8,"#7b9b8350",0,1);
    table(3.4,.35,1.1,.6);const p=P(3.8,.6,17);c.gem(...p,4,"#8ac4ad");
  } else if(id==="orren") {
    prop("forge",1,.6,.64);prop("crate",.6,3.25,.4);
    const p=P(3.7,.8);poly([[p[0]-10,p[1]-8],[p[0]+10,p[1]-8],[p[0]+8,p[1]-3],[p[0]-7,p[1]-3]],STONE[3]);
    line([p[0],p[1]-4],[p[0],p[1]+3],STONE[1],5);line([p[0]-7,p[1]+4],[p[0]+7,p[1]+4],STONE[1],3);
    for(let i=0;i<3;i++){line(P(.05,.8+i*.3,43),P(.05,.8+i*.3,21),"#c4c9b4",2);line(P(0,.7+i*.3,24),P(0,1+i*.3,24),WOOD[3],2);}
    const coal=P(1.5,1.2);c.ellipse(...coal,8,4,"#302e32");c.pixel(coal[0],coal[1]-1,"#c38a4f");
  } else if(id==="nim") {
    prop("shelf",1.4,.25,.6);prop("shelf",.3,2,.52);table(3.2,.4,1.4,.8);
    poly([P(3.35,.52,14),P(4.3,.52,14),P(4.3,1.02,14),P(3.35,1.02,14)],"#dfd1a5",WOOD[3]);
    line(P(3.5,.6,15),P(4.15,.9,15),"#7b8e81");line(P(3.5,.9,15),P(4.1,.7,15),"#806148");
    prop("barrel",.6,3.3,.34);
  } else if(id==="lume") {
    prop("cookpot",1.7,.55,.6);prop("forge",.35,1.65,.5);table(3.4,.45,1.2,.7);
    const p=P(3.8,.8,16);c.ellipse(...p,7,3,"#ceb578",WOOD[1]);for(let i=0;i<3;i++)c.rect(p[0]-5+i*4,p[1]-2,2,2,"#9cb06c");
    prop("planter",.5,3.1,.55);prop("barrel",4.4,.4,.35);
  } else if(id==="caio") {
    prop("cistern",1.7,.5,.64);prop("well",.6,2.8,.43);table(3.5,.5,1,.6);
    for(let i=0;i<3;i++){const p=P(3.65+i*.3,.7,16);c.ellipse(...p,3,4,i%2?"#bdac89":"#61999c",WOOD[1]);}
    for(let i=0;i<3;i++)line(P(1+i*.15,2.8),P(1.5+i*.15,3.3),"#8bbdb4");
  } else if(id==="iria") {
    prop("loom",1.6,.5,.64);table(3.5,.5,1,.7);prop("crate",.6,3.1,.35);
    const p=P(.6,2);line([p[0],p[1]-3],[p[0],p[1]-28],WOOD[1],2);c.ellipse(p[0],p[1]-30,3,3,"#baa886",WOOD[1]);
    poly([[p[0]-6,p[1]-24],[p[0]+6,p[1]-24],[p[0]+4,p[1]-11],[p[0]-4,p[1]-11]],"#9d718e");
    line([p[0]-4,p[1]-1],[p[0]+5,p[1]-1],WOOD[2],2);
    for(let i=0;i<3;i++)poly([P(3.6,.6+i*.12,15+i*2),P(4.25,.6+i*.12,15+i*2),P(4.25,.95+i*.12,15+i*2),P(3.6,.95+i*.12,15+i*2)],["#be9e90","#8c718e","#b7a67a"][i]);
  }
  // Two low posts frame the open threshold without concealing the resident.
  for(const [u,v]of[[4.8,3.8],[3.6,3.8]]) { const p=P(u,v);c.rect(p[0]-2,p[1]-7,4,8,WOOD[1]);c.rect(p[0]-2,p[1]-8,4,2,WOOD[3]); }
  return c;
}
