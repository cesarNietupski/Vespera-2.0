import { PixelCanvas, seeded } from "./pixel-raster.mjs";

export const SCENERY_THEMES = ["village", "gardens", "forges", "archive", "eclipse"];
export const SCENERY_PROPS = {
  village: ["tree", "bush", "rock", "fence"],
  gardens: ["pine", "shrub", "roots", "stone"],
  forges: ["rock", "pipes", "chimney", "scrap"],
  archive: ["reeds", "arch", "wall", "column"],
  eclipse: ["rock", "column", "arch", "obelisk"],
};
export const SCENERY_COLORS = {
  village: ["#273d30", "#3c5639", "#4c6b44", "#64804f", "#8e9f68"],
  gardens: ["#243c34", "#304c40", "#3d6050", "#58745b", "#87946b"],
  forges: ["#3d3735", "#51483f", "#67594b", "#83705b", "#a28b6c"],
  archive: ["#254c59", "#2e5b66", "#376c78", "#50838c", "#7babae"],
  eclipse: ["#3d414f", "#505463", "#626675", "#7b7f8c", "#a1a4ad"],
};

export function sceneryFrame(name) {
  const c = new PixelCanvas(96), r = seeded(`scenery-${name}`);
  if (name.startsWith("ground-")) {
    const [,theme,variationText] = name.split("-"), variation = Number(variationText);
    const p = SCENERY_COLORS[theme];
    // Only the top plane is painted. Its edges meet at TILE42's projected lattice;
    // no bevel, vertical face, dark outline or drop shadow is drawn under the floor.
    const inside = (x,y,margin=0) => Math.abs(x-47.5)/23.5+Math.abs(y-59)/12 < 1-margin;
    c.poly([[24,59],[48,47],[71,59],[48,71]],p[2]);
    const cluster = (x,y,w,h,color) => {
      for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)
        if(inside(x+xx,y+yy,.12))c.pixel(x+xx,y+yy,color);
    };
    if (theme === "archive") {
      // Paired horizontal ripples belong to one continuous water surface.
      for(let i=0;i<5;i++) {
        const x=29+Math.floor(r()*31),y=51+i*3;
        cluster(x,y,5+Math.floor(r()*7),1,p[3]);
        cluster(x+2,y+1,4+Math.floor(r()*4),1,p[1]);
      }
      if(variation===1){cluster(42,58,11,1,p[4]);cluster(46,62,5,1,p[3]);}
      if(variation===2){cluster(38,55,7,1,p[1]);cluster(44,64,10,1,p[3]);}
    } else {
      // Several restrained clusters, rather than full-surface random pixel noise.
      const centers=[[35,58],[45,53],[57,58],[46,65],[52,60],[39,62]];
      for(let i=0;i<centers.length;i++) {
        const [x,y]=centers[(i+variation*2)%centers.length];
        cluster(x+(variation===1?1:0),y,3+i%3,1,p[i%2?3:1]);
        if(i%2===0)cluster(x+1,y+1,2,1,p[3]);
      }
      if(theme==="village"||theme==="gardens") {
        const light=theme==="village"?"#7e965c":"#7b8f66";
        for(let i=0;i<5;i++) {
          const x=35+i*5,y=55+(i*3+variation*2)%9;
          cluster(x,y,1,2,p[3]);cluster(x-1,y,1,1,light);
        }
        if(variation===1){cluster(43,58,8,2,theme==="village"?"#65704b":"#555e47");cluster(45,60,5,1,p[3]);}
        if(variation===2){cluster(38,59,3,1,"#938661");cluster(54,62,4,1,"#8d845f");}
      } else if(theme==="forges") {
        if(variation===1){cluster(41,56,9,2,p[3]);cluster(48,61,7,1,p[1]);}
        if(variation===2){cluster(43,58,1,4,p[1]);cluster(44,61,4,1,p[1]);cluster(49,63,2,1,"#ab7d53");}
      } else if(theme==="eclipse") {
        if(variation===1) {
          for(let x=40;x<=55;x++) {
            const yy=Math.round(59+Math.sin((x-40)/15*Math.PI)*3);
            if(inside(x,yy,.2))c.pixel(x,yy,p[1]);
            if(inside(x,yy-1,.2))c.pixel(x,yy-1,p[3]);
          }
        }
        if(variation===2){cluster(43,56,8,1,p[3]);cluster(47,57,6,1,p[1]);cluster(54,62,4,1,p[4]);}
      }
    }
    return c;
  }

  const [theme,kind] = name.split("-"), p=SCENERY_COLORS[theme];
  const poly=(points,color,outline=p[0])=>c.poly(points,color,outline);
  const line=(a,b,color,width=1)=>c.line(...a,...b,color,width);
  const wood=["#3e3433","#66503b","#96724b","#b99665","#d0b17d"];
  const stone=theme==="archive"?["#314950","#4c686d","#708e8d","#9cb1a7","#c4d0b9"]:
    theme==="eclipse"?["#3e4354","#5e6477","#82899b","#adb1bb","#d0d0c9"]:
      ["#3d4847","#5b6660","#7e8976","#a1ab8c","#c1c5a5"];
  const rock=(cx,cy,scale=1,material=stone)=>{
    const q=(x,y)=>[cx+x*scale,cy+y*scale];
    poly([q(-21,-2),q(-18,-14),q(-4,-23),q(13,-18),q(23,-3),q(15,4),q(-5,8)],material[1]);
    poly([q(-18,-14),q(-4,-23),q(13,-18),q(4,-7),q(-7,-4)],material[2]);
    poly([q(4,-7),q(13,-18),q(23,-3),q(15,4)],material[0]);
    line(q(-16,-13),q(-4,-21),material[3]);
    line(q(-7,-4),q(4,-7),material[3]);
    line(q(-2,-17),q(-5,-10),material[1]);
    line(q(8,-4),q(11,2),material[1]);
  };
  const leaves=(x,y,rx,ry,colors=p)=>{
    c.ellipse(x,y,rx,ry,colors[0]);
    c.ellipse(x-1,y-2,rx-1,Math.max(2,ry-1),colors[2]);
    c.ellipse(x-rx*.3,y-ry*.4,rx*.65,ry*.45,colors[3]);
    for(let i=0;i<8;i++) {
      const xx=x-rx*.65+r()*rx*1.2,yy=y-ry*.6+r()*ry;
      c.rect(xx,yy,2+i%2,1,i%3?colors[3]:colors[1]);
    }
    c.rect(x-rx*.35,y-ry*.45,3,1,colors[4]);
  };
  const roots=(x,y,colors=wood)=>{
    for(const[a,b]of[[[-1,-12],[-17,1]],[[1,-9],[14,2]],[[0,-8],[3,5]],[[-1,-6],[-8,5]]]){
      line([x+a[0],y+a[1]],[x+b[0],y+b[1]],colors[0],5);
      line([x+a[0],y+a[1]-1],[x+b[0],y+b[1]-1],colors[2],2);
    }
  };
  const pillar=(x,y,height,width=10)=>{
    poly([[x-width,y],[x-width,y-height],[x,y-height-5],[x+width,y-height],[x+width,y],[x,y+5]],stone[1]);
    poly([[x-width,y-height],[x,y-height-5],[x+width,y-height],[x,y-height+5]],stone[3]);
    poly([[x,y-height+5],[x+width,y-height],[x+width,y],[x,y+5]],stone[0]);
    line([x-width+2,y-height+3],[x-width+2,y-3],stone[3]);
    for(let yy=y-height+13;yy<y;yy+=11){line([x-width+1,yy],[x,yy+4],stone[0]);line([x,yy+4],[x+width,yy],stone[0]);}
  };

  if(theme==="village"&&kind==="tree") {
    roots(48,84);
    line([48,82],[46,36],wood[0],10);line([46,80],[43,38],wood[2],4);
    line([45,54],[25,35],wood[1],5);line([46,56],[68,31],wood[1],5);
    leaves(28,36,15,12);leaves(67,33,16,13);leaves(47,24,21,15);
    leaves(43,43,20,12);leaves(69,46,12,10);leaves(23,49,11,9);
    line([48,67],[50,73],wood[0]);
    c.rect(49,58,2,4,wood[3]);
  } else if(theme==="village"&&kind==="bush") {
    for(const[x,y]of[[27,80],[46,81],[65,79]])line([x,y],[x-1,y-10],p[1],2);
    leaves(31,74,13,9);leaves(48,68,17,13);leaves(66,75,13,10);
    for(const[x,y]of[[31,71],[47,63],[61,71],[53,74]]){c.rect(x,y,2,2,"#b78370");c.pixel(x,y,"#d0a17c");}
  } else if(theme==="village"&&kind==="rock") {
    rock(49,78,.9);rock(28,84,.35);
    c.line(64,86,65,80,p[3],2);c.line(67,85,70,79,p[4]);
    c.rect(35,69,5,2,p[2]);c.rect(38,68,4,1,p[3]);
  } else if(theme==="village"&&kind==="fence") {
    for(const[x,y]of[[19,75],[48,84],[77,75]]){
      poly([[x-3,y],[x-3,y-24],[x,y-28],[x+3,y-24],[x+3,y],[x,y+2]],wood[1]);
      line([x-2,y-24],[x-2,y-2],wood[3]);
    }
    for(const y of[61,70]){
      line([20,y],[48,y+9],wood[0],5);line([20,y-1],[48,y+8],wood[2],3);
      line([48,y+9],[76,y],wood[0],5);line([48,y+8],[76,y-1],wood[2],3);
    }
    for(const[x,y]of[[21,61],[46,70],[51,69],[75,61]])c.pixel(x,y,stone[3]);
  } else if(theme==="gardens"&&kind==="pine") {
    roots(48,85);line([48,83],[48,23],wood[0],6);line([47,82],[47,25],wood[2],2);
    const levels=[[48,12,12,19],[48,25,19,23],[48,39,25,23],[48,51,29,24]];
    for(const[x,y,w,h]of levels){
      poly([[x,y],[x-w,y+h],[x-9,y+h-2],[x,y+h+5],[x+9,y+h-2],[x+w,y+h]],p[1]);
      poly([[x,y+2],[x-w+3,y+h-2],[x-3,y+h-3],[x,y+8]],p[3]);
      line([x-4,y+11],[x-10,y+19],p[4]);
      line([x+5,y+15],[x+12,y+21],p[2]);
    }
  } else if(theme==="gardens"&&kind==="shrub") {
    for(let i=0;i<7;i++){
      const a=-2.9+i*.44, x=48+Math.cos(a)*25,y=83+Math.sin(a)*27;
      line([48,84],[x,y],p[1],2);
      for(let n=1;n<5;n++){
        const t=n/5,xx=48+(x-48)*t,yy=84+(y-84)*t;
        line([xx,yy],[xx-5,yy-5],n%2?p[3]:p[4],2);
        line([xx,yy],[xx+5,yy-2],p[2],2);
      }
    }
    leaves(52,81,15,6);c.pixel(34,74,"#c3b781");
  } else if(theme==="gardens"&&kind==="roots") {
    roots(49,81);
    poly([[37,81],[35,53],[43,45],[57,46],[62,55],[60,81],[49,88]],wood[1]);
    poly([[36,53],[43,46],[57,47],[61,54],[49,61]],wood[3]);
    c.ellipse(48,53,8,4,wood[1]);c.ring(48,53,5,2,wood[2]);
    line([41,61],[40,79],wood[3],2);line([53,61],[55,79],wood[0],2);
    line([58,67],[69,71],wood[0],5);line([66,71],[79,83],wood[2],3);
    c.rect(35,62,7,2,p[3]);c.rect(51,77,6,2,p[2]);
    leaves(26,83,7,4);leaves(66,84,7,4);
  } else if(theme==="gardens"&&kind==="stone") {
    rock(50,78,1.05);rock(27,84,.32);
    c.poly([[31,66],[46,58],[59,64],[55,69],[42,67]],p[2]);
    line([35,64],[47,59],p[4]);c.rect(40,68,5,2,p[3]);
    for(const[x,y]of[[64,80],[68,84],[26,80]]){c.line(x,y,x-2,y-7,p[3]);c.pixel(x-3,y-5,p[4]);}
  } else if(theme==="forges"&&kind==="rock") {
    const basalt=["#3c393b","#565051","#75645c","#a48a6a"];
    rock(47,77,1.05,basalt);rock(72,83,.35,basalt);
    line([40,61],[45,68],"#b27d52");line([45,68],[42,77],"#84573e");
    line([57,70],[62,74],"#bc8b59");c.rect(31,82,4,2,"#927858");
  } else if(theme==="forges"&&kind==="pipes") {
    const metal=["#3d4548","#627071","#94a09a","#b7b99e"];
    for(const[x,y]of[[24,78],[66,85]]){
      poly([[x-8,y-3],[x,y-6],[x+9,y-2],[x+9,y+3],[x,y+6],[x-8,y+2]],p[1]);
    }
    for(const y of[54,67]){
      line([18,y],[73,y+15],metal[0],11);line([18,y-2],[73,y+13],metal[1],7);
      line([19,y-4],[72,y+10],metal[2],2);
      for(const x of[28,55]){const yy=y+(x-18)*15/55;c.line(x,yy-6,x-3,yy+3,metal[0],4);c.line(x-1,yy-6,x-4,yy+2,metal[2],1);}
      c.ellipse(74,y+14,5,6,metal[0],p[0]);c.ellipse(74,y+14,2,3,"#293a3e");
    }
    c.rect(35,71,3,2,"#ad7a50");
  } else if(theme==="forges"&&kind==="chimney") {
    poly([[32,84],[32,28],[47,21],[65,29],[65,84],[48,91]],p[1]);
    poly([[33,29],[47,23],[64,29],[48,36]],p[3]);
    poly([[49,36],[64,30],[64,83],[49,89]],p[0]);
    for(let y=38;y<84;y+=9){line([33,y],[48,y+5],p[0]);line([49,y+5],[63,y],p[0]);c.pixel(36,y-1,p[3]);}
    poly([[36,28],[36,17],[47,12],[61,18],[61,29],[48,34]],"#5d696a");
    poly([[36,17],[47,12],[61,18],[48,23]],"#a6aa96");
    c.ellipse(48,18,7,3,"#38484d");
    c.rect(39,57,7,14,"#3b4144");for(let i=0;i<4;i++)c.line(40,59+i*3,45,61+i*3,"#a5754b");
    line([57,43],[57,75],"#a19376",2);
  } else if(theme==="forges"&&kind==="scrap") {
    poly([[20,82],[39,67],[65,69],[79,82],[60,90],[34,88]],p[1]);
    c.ring(47,74,14,10,"#3e494d",0,4);c.ring(46,73,12,8,"#947451",0,2);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;c.rect(46+Math.cos(a)*13-2,73+Math.sin(a)*10-2,4,4,"#7f654c");}
    line([27,83],[65,61],"#3f4c51",6);line([26,81],[64,59],"#788a86",2);
    line([44,86],[74,79],"#ad875d",3);poly([[21,81],[28,69],[32,69],[30,83]],"#5d6a69");
  } else if(theme==="archive"&&kind==="reeds") {
    for(let i=0;i<8;i++){
      const x=29+i*5,h=20+(i*11)%24;
      line([x,86],[x-3,86-h],"#668a70",2);
      line([x,76],[x+7,65-(i%3)*4],"#8fae83");
      line([x-3,86-h],[x-4,79-h],"#ab9371",3);
      c.pixel(x-5,79-h,"#c3b58a");
    }
    for(const[x,y]of[[28,85],[57,85],[66,84]])c.ellipse(x,y,5,2,"#617f70");
  } else if(theme==="archive"&&kind==="arch") {
    pillar(25,83,43,8);pillar(71,83,43,8);
    poly([[17,43],[21,29],[34,17],[48,12],[63,18],[77,31],[79,44],[64,43],[60,31],[49,25],[36,31],[32,43]],stone[1]);
    for(const[a,b]of[[[23,28],[33,35]],[[34,18],[40,29]],[[48,13],[48,25]],[[63,19],[56,29]],[[75,32],[63,36]]]){line(a,b,stone[0],2);line([a[0]-1,a[1]-1],[b[0]-1,b[1]-1],stone[3]);}
    line([22,29],[35,18],stone[3]);
    line([27,57],[24,73],"#659280",2);line([72,48],[70,64],"#7da592",2);
    c.rect(19,77,4,2,"#8aa98a");
  } else if(theme==="archive"&&kind==="wall") {
    poly([[13,75],[13,53],[63,40],[82,49],[82,73],[33,87]],stone[1]);
    poly([[13,53],[63,40],[82,49],[33,66]],stone[3]);
    poly([[33,66],[82,49],[82,73],[33,87]],stone[0]);
    line([15,61],[32,68],stone[0]);line([15,70],[32,77],stone[0]);
    for(let i=0;i<4;i++){const x=37+i*11;line([x,65-i*3],[x,82-i*3],stone[1]);}
    line([35,73],[80,60],stone[1]);
    for(const[x,y]of[[21,56],[43,48],[68,46],[75,68]]){c.rect(x,y,5,2,"#719a85");c.pixel(x+1,y-1,"#a5ba9b");}
  } else if(theme==="archive"&&kind==="column") {
    pillar(46,83,49,13);
    poly([[31,35],[35,24],[43,28],[48,21],[54,28],[59,26],[60,36],[47,42]],stone[2]);
    line([41,42],[39,68],stone[0],2);line([39,68],[48,75],stone[0]);
    line([31,80],[44,87],stone[3]);
    c.rect(36,57,3,12,"#70988a");c.rect(38,67,5,3,"#70988a");rock(69,85,.3);
  } else if(theme==="eclipse"&&kind==="rock") {
    rock(49,78,1.12);rock(27,85,.3);
    c.ellipse(46,65,5,2,stone[0]);c.line(42,64,48,63,stone[3]);
    c.ellipse(33,74,3,2,stone[0]);c.pixel(32,72,stone[3]);
    c.pixel(56,63,"#d5c49d");c.rect(53,76,3,1,stone[3]);
  } else if(theme==="eclipse"&&kind==="column") {
    pillar(45,82,54,12);
    poly([[30,31],[35,19],[42,24],[51,17],[59,25],[61,33],[45,39]],stone[2]);
    line([47,38],[43,48],stone[0],2);line([43,48],[48,58],stone[0],2);line([48,58],[41,71],stone[0]);
    line([34,63],[41,66],"#b2a589",2);c.rect(36,45,3,6,"#a99b7e");
    rock(69,84,.32);rock(27,86,.24);
  } else if(theme==="eclipse"&&kind==="arch") {
    pillar(24,83,41,8);pillar(72,83,54,8);
    poly([[65,31],[64,20],[57,15],[49,11],[36,15],[25,26],[17,43],[31,43],[37,31],[48,24],[54,28],[56,35]],stone[1]);
    line([27,26],[37,17],stone[3]);line([37,17],[48,13],stone[3]);
    line([48,13],[48,24],stone[0],2);line([36,17],[39,29],stone[0],2);
    poly([[59,28],[65,19],[77,22],[80,30],[71,36]],stone[2]);
    line([67,21],[65,30],stone[0],2);rock(48,85,.35);
    c.pixel(73,44,"#c9b88d");
  } else if(theme==="eclipse"&&kind==="obelisk") {
    poly([[34,83],[36,33],[47,17],[59,30],[63,83],[48,91]],stone[1]);
    poly([[36,33],[47,17],[47,85],[35,81]],stone[2]);
    poly([[49,25],[56,33],[59,81],[49,87]],stone[0]);
    line([40,39],[40,69],"#b9ac89");line([40,47],[45,44],"#b9ac89");
    line([40,61],[45,64],"#b9ac89");
    line([46,32],[48,41],stone[0],2);line([48,41],[45,52],stone[0]);
    rock(25,84,.23);rock(71,85,.23);
  }
  return c;
}

export function sceneryEntries() {
  return SCENERY_THEMES.flatMap(theme => [
    ...Array.from({length:3},(_,n)=>[`ground-${theme}-${n}`,sceneryFrame(`ground-${theme}-${n}`)]),
    ...SCENERY_PROPS[theme].map(kind=>[`${theme}-${kind}`,sceneryFrame(`${theme}-${kind}`)]),
  ]);
}
