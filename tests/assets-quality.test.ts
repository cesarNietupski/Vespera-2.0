import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
// @ts-expect-error The code-native artwork renderer is intentionally authored in JavaScript.
import { heroFrame } from "../scripts/art/pixel-actors.mjs";

type ActionSet = Record<string,number>;
interface NativeCanvas {data:Uint8Array; width:number; height:number}
interface AtlasFrame { frame:{x:number;y:number;w:number;h:number};pivot:{x:number;y:number};sourceSize:{w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number} }
const animation=JSON.parse(readFileSync("src/data/animations.json","utf8")) as Record<"npc"|"enemy"|"boss",ActionSet>;
const manifest=JSON.parse(readFileSync("public/assets/manifest.json","utf8")) as {assets:{name:string;metadata?:string}[]};
const residents=["salvia","orren","nim","lume","caio","iria"];
const artisans=["lume","caio","iria"];
const hash=(canvas:NativeCanvas)=>createHash("sha256").update(canvas.data).digest("hex");

describe("Contratos de arte e exportação",()=>{
  it("seis NPCs, oito inimigos e quatro chefes têm todas as ações e direções exportadas",()=>{
    const sets:[string,ActionSet,number][]=[];
    for(const name of residents)sets.push([name,animation.npc,8]);
    for(const name of ["swordsman","archer","guardian","hound","summoner","automaton","wraith","elite"])sets.push([name,animation.enemy,8]);
    for(let i=0;i<4;i++)sets.push([`boss${i}`,animation.boss,1]);
    for(const[name,actions,directions]of sets){
      const {frames}=JSON.parse(readFileSync(`public/assets/${name}.json`,"utf8"));
      let expected=0;
      for(const[state,count]of Object.entries(actions))for(let dir=0;dir<directions;dir++)for(let f=0;f<count;f++){
        expect(frames[`${state}/${dir}/${f}`],`${name}:${state}/${dir}/${f}`).toBeDefined();expected++;
      }
      expect(Object.keys(frames).length,name).toBe(expected);
    }
  });

  it("pivôs ficam dentro do quadro e atlas retangulares preservam largura e altura de origem",()=>{
    for(const asset of manifest.assets.filter(a=>a.metadata)){
      const atlas=JSON.parse(readFileSync(`public/assets/${asset.metadata}`,"utf8")) as {frames:Record<string,AtlasFrame>};
      for(const[key,f]of Object.entries(atlas.frames)){
        expect(f.pivot.x,`${asset.name}:${key}`).toBeGreaterThanOrEqual(0);
        expect(f.pivot.x).toBeLessThanOrEqual(1);
        expect(f.pivot.y).toBeGreaterThanOrEqual(0);
        expect(f.pivot.y).toBeLessThanOrEqual(1);
        expect(f.sourceSize).toEqual({w:f.frame.w,h:f.frame.h});
        expect(f.spriteSourceSize).toEqual({x:0,y:0,w:f.frame.w,h:f.frame.h});
      }
      if(asset.name==="village")for(const f of Object.values(atlas.frames)){
        expect(f.frame.w).toBe(384);expect(f.frame.h).toBe(352);expect(f.pivot).toEqual({x:.5,y:121/176});
      }
    }
  });

  it("utensílios e poses dos moradores não dependem da arma de Eira",()=>{
    for(const npc of residents)for(const[state,count]of Object.entries(animation.npc))for(let dir=0;dir<8;dir++)for(const f of[0,Math.floor(count/2)]){
      const reference=hash(heroFrame(state,f,count,dir,"blade",npc));
      expect(hash(heroFrame(state,f,count,dir,"bow",npc)),`${npc}:${state}:${dir}:${f}`).toBe(reference);
      expect(hash(heroFrame(state,f,count,dir,"scythe",npc))).toBe(reference);
    }
  });

  it("cozinha, bebidas e costura não herdam o brilho da lâmina e têm gesto próprio na conversa",()=>{
    const bladeHighlight=[240,255,216];
    for(const npc of artisans){
      for(const[state,count]of Object.entries(animation.npc))for(let dir=0;dir<8;dir++)for(let f=0;f<count;f++){
        const c=heroFrame(state,f,count,dir,"blade",npc);let accidentalBlade=0;
        for(let i=0;i<c.data.length;i+=4)if(c.data[i+3]&&bladeHighlight.every((v,k)=>c.data[i+k]===v))accidentalBlade++;
        expect(accidentalBlade,`${npc}:${state}:${dir}:${f}`).toBe(0);
      }
      expect(hash(heroFrame("interact",2,8,0,"blade",npc))).not.toBe(hash(heroFrame("idle",2,8,0,"blade",npc)));
    }
  });

  it("os três atlas refinados preservam RGBA e blocos exatos de pixels 2×",async()=>{
    for(const npc of artisans){
      const {data,info}=await sharp(`public/assets/${npc}.png`).raw().toBuffer({resolveWithObject:true});
      let mismatches=0,accidentalBlade=0;
      for(let i=0;i<data.length;i+=4)if(data[i+3]&&data[i]===240&&data[i+1]===255&&data[i+2]===216)accidentalBlade++;
      for(let y=0;y<info.height;y+=2)for(let x=0;x<info.width;x+=2){
        const index=(y*info.width+x)*4;
        for(const delta of[4,info.width*4,info.width*4+4])for(let k=0;k<4;k++)if(data[index+k]!==data[index+delta+k])mismatches++;
      }
      expect(info.channels).toBe(4);expect(mismatches,npc).toBe(0);expect(accidentalBlade,`${npc}: lâmina antiga no PNG exportado`).toBe(0);
    }
  });
});
