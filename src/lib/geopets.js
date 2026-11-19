// Geopets generator: pure functions, no DOM. Shared by the build (static SVGs) and the browser.
export const W=13,H=9,OX=4,OY=6;
// keys are english (used in file names); name is the character name shown in every language
export const SHAPES={
  // 9×9 cube on 2 legs, so it doesn't read as a wide 4-legged Clawd
  cube:{name:"Cubo",color:"#EF5B5B",legs:2,shade:true,fn:(x,y)=>x>=2&&x<=10},
  triangle:{name:"Tri",color:"#56CCF2",shade:true,fn:(x,y)=>Math.abs(x-6)<=Math.round(y*6/8)},
  circle:{name:"Bola",color:"#9B8CFF",shade:true,fn:(x,y)=>((x-6)/6.5)**2+((y-4)/4.6)**2<=1},
  diamond:{name:"Rombi",color:"#6FCF97",shade:true,fn:(x,y)=>Math.abs(x-6)/6.6+Math.abs(y-4)/4.6<=1},
  hexagon:{name:"Hexa",color:"#F2C94C",shade:true,fn:(x,y)=>Math.abs(x-6)<=6-Math.max(0,Math.abs(y-4)-1)}
};
export const STATE_KEYS=["idle","happy","sad","angry","love","sleeping","surprised","typing","thinking","dizzy","waving",
  "celebrating","idea","music","coffee","loading","error"];
// HTTP states: a sign with the code + the body language of an existing state
export const HTTP={200:{title:"OK",base:"happy"},201:{title:"Created",base:"celebrating"},204:{title:"No Content",base:"idle"},
  301:{title:"Moved Permanently",base:"waving"},400:{title:"Bad Request",base:"sad"},401:{title:"Unauthorized",base:"surprised"},
  403:{title:"Forbidden",base:"angry"},404:{title:"Not Found",base:"thinking"},418:{title:"I'm a teapot",base:"coffee"},
  429:{title:"Too Many Requests",base:"dizzy"},500:{title:"Internal Server Error",base:"error"},503:{title:"Service Unavailable",base:"sleeping"}};
export const ALL_STATES=[...STATE_KEYS,...Object.keys(HTTP)];
const EYES={
  normal:[[0,0],[0,1]], happy:[[-1,1],[0,0],[1,1]], closed:[[-1,1],[0,1],[1,1]],
  angry:[[-1,0],[0,1],[0,2]], big:[[-1,0],[0,0],[-1,1],[0,1]],
  x:[[-1,0],[1,0],[0,1],[-1,2],[1,2]], down:[[0,1]], up:[[1,0]], sad:[[1,0],[0,1],[0,2]]
};
const STATE_EYES={idle:"normal",happy:"happy",sad:"sad",angry:"angry",love:"happy",sleeping:"closed",
  surprised:"big",typing:"down",thinking:"up",dizzy:"x",waving:"happy",
  celebrating:"happy",idea:"big",music:"closed",coffee:"normal",loading:"up",error:"x"};
const MIRROR=new Set(["angry","big","sad","happy","closed","normal","x","down"]); // "up" looks the same way with both eyes
const DIG={0:"111101101101111",1:"010110010010111",2:"111001111100111",3:"111001111001111",4:"101101111001001",
  5:"111100111001111",8:"111101111101111",9:"111101111001111"};
export const maskFrom=fn=>Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>fn(x,y)?1:0));

export function layout(m,nLegs=4){
  const has=(x,y)=>y>=0&&y<H&&x>=0&&x<W&&!!m[y][x];
  let n=0,sx=0,top=H,bot=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(m[y][x]){n++;sx+=x;top=Math.min(top,y);bot=Math.max(bot,y)}
  if(!n)return null;
  const cx=Math.round(sx/n);
  const firstY=d=>{for(let y=top;y<bot;y++)if([y,y+1].every(r=>has(cx-d,r)&&has(cx+d,r))&&has(cx-d-1,y)&&has(cx+d+1,y))return y;return -1};
  const y3=firstY(3),y2=firstY(2),y1=firstY(1);
  let d,y;
  // wide eyes only if they don't push the face below the middle (keeps the triangle's face high)
  if(y3>=0&&(y2<0||(y3<=y2+1&&y3<=(top+bot)/2-1))){d=3;y=y3}else if(y2>=0){d=2;y=y2}else if(y1>=0){d=1;y=y1}else{d=0;y=top}
  const ey=(has(cx-d,y+2)&&has(cx+d,y+2))?y+1:y;
  // legs: columns whose bottom is near the lowest row
  const bottom=c=>{for(let r=H-1;r>=0;r--)if(has(c,r))return r;return -1};
  let legs=(nLegs===2?[cx-2,cx+2]:[cx-4,cx-2,cx+2,cx+4]).filter(c=>bottom(c)>=bot-1);
  if(legs.length<2)legs=[cx-1,cx+1].filter(c=>bottom(c)>=0);
  if(!legs.length)legs=[cx];
  const armY=Math.min(ey+2,bot);
  const rows=[armY,armY+1].filter(r=>r<=bot);
  const left=Math.min(...rows.map(r=>m[r].indexOf(1)).filter(v=>v>=0));
  const right=Math.max(...rows.map(r=>m[r].lastIndexOf(1)));
  return {cx,d,ey,top,bot,legs:legs.map(c=>({c,b:bottom(c)})),armY,armH:rows.length,left,right};
}


const px=(pts,ox,oy,extra="")=>pts.map(([x,y])=>`<rect x="${ox+x}" y="${oy+y}" width="1" height="1"${extra}/>`).join("");
// Santa hat, relative to the head's top-center pixel (0,0 = first body row): red cone drooping right, white band and pompom
const HAT_RED=[[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[-1,-3],[0,-3],[1,-3],[2,-3],[1,-4],[2,-4],[3,-4]];
const HAT_WHITE=[[-3,-1],[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[3,-1],[4,-5],[5,-5],[4,-4],[5,-4]];
const HEART=[[0,0],[2,0],[0,1],[1,1],[2,1],[1,2]], ZED=[[0,0],[1,0],[2,0],[3,0],[2,1],[1,2],[0,3],[1,3],[2,3],[3,3]];
const NOTE=[[1,0],[2,0],[1,1],[1,2],[0,3],[1,3]], BULB=[[1,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], CROSS=[[0,0],[2,0],[1,1],[0,2],[2,2]];
const CONFETTI=["#FF5D8F","#FFC93C","#56CCF2","#6FCF97","#9B8CFF"];

let uid=0;
export function svgPet(m,{color,eye="#1E1B2E",state="idle",legs:nLegs=4,shade=false,hat=false,emptyLabel="empty"},p){
  p=p||("g"+(++uid)+"-");
  const L=layout(m,nLegs);
  const hc=HTTP[state]?state:null, base=hc?HTTP[hc].base:state;
  // viewBox starts at y=-4 to leave headroom for the HTTP sign
  const head=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -4 21 23" width="210" height="230" shape-rendering="crispEdges" class="${p}r">`;
  if(!L)return head+`<text x="10.5" y="8" font-size="2" text-anchor="middle" fill="#888" font-family="monospace">${emptyLabel}</text></svg>`;
  const ax=x=>OX+x, ay=y=>OY+y, hx=ax(L.cx)+.5, hy=ay(L.top), floor=ay(L.bot)+3;
  const css=[], fx=[];
  let bodyAnim="", eyesCls="", armCls="", inner=""; // inner: props that move with the body
  const kf=(name,frames)=>css.push(`@keyframes ${p}${name}{${frames}}`);
  const anim=(cls,rule)=>css.push(`.${p}${cls}{${rule}}`);
  // body
  let body="";
  for(let y=0;y<H;y++){let x=0;while(x<W){if(m[y][x]){const s=x;while(x<W&&m[y][x])x++;body+=`<rect x="${ax(s)}" y="${ay(y)}" width="${x-s}" height="1"/>`}else x++}}
  // 3D look: darken each row's rightmost pixel and the bottom row
  let shading="";
  if(shade){for(let y=0;y<H;y++){const r=m[y].lastIndexOf(1);if(r>=0&&y!==L.bot)shading+=`<rect x="${ax(r)}" y="${ay(y)}" width="1" height="1"/>`}
    const b=m[L.bot],l=b.indexOf(1);shading+=`<rect x="${ax(l)}" y="${ay(L.bot)}" width="${b.lastIndexOf(1)-l+1}" height="1"/>`;shading=`<g fill="#000" opacity=".2">${shading}</g>`}
  const legs=L.legs.map(({c,b})=>`<rect x="${ax(c)}" y="${ay(b)+1}" width="1" height="${L.bot-b+2}"/>`).join("");
  const armL=`<rect x="${ax(L.left)-2}" y="${ay(L.armY)}" width="2" height="${L.armH}"/>`;
  const armR=`<rect x="${ax(L.right)+1}" y="${ay(L.armY)}" width="2" height="${L.armH}"/>`;
  // eyes
  const ek=STATE_EYES[base], pat=EYES[ek];
  const exL=ax(L.cx-L.d), exR=ax(L.cx+L.d), eyY=ay(L.ey);
  const patR=MIRROR.has(ek)?pat.map(([x,y])=>[-x,y]):pat;
  let eyes=px(pat,exL,eyY)+px(patR,exR,eyY);
  let blush="";
  if(base==="love"||base==="happy"){const by=L.ey+2;[L.cx-L.d-1,L.cx+L.d+1].forEach(c=>{if(m[by]&&m[by][c])blush+=`<rect x="${ax(c)}" y="${ay(by)}" width="1" height="1" fill="#FF7AA8" opacity=".8"/>`})}
  const shadowW=Math.max(5,L.legs.length?(L.legs[L.legs.length-1].c-L.legs[0].c+3):5);
  let shadowCls="";
  const o=`style="transform-origin:${hx}px ${floor}px"`;
  switch(base){
    case "idle":
      kf("bob","0%,100%{transform:translateY(0)}50%{transform:translateY(-.5px)}");
      kf("blink","0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}");
      bodyAnim=`animation:${p}bob 1.8s ease-in-out infinite`; eyesCls="eyes";
      anim("eyes",`transform-box:fill-box;transform-origin:center;animation:${p}blink 3.5s infinite`);break;
    case "happy":
      kf("jump","0%,100%{transform:translateY(0)}40%{transform:translateY(-3px)}60%{transform:translateY(-3px)}");
      kf("sh","0%,100%{transform:scaleX(1);opacity:.25}50%{transform:scaleX(.6);opacity:.12}");
      bodyAnim=`animation:${p}jump .7s ease-in-out infinite`; shadowCls="sh";
      anim("sh",`transform-box:fill-box;transform-origin:center;animation:${p}sh .7s ease-in-out infinite`);break;
    case "sad":
      kf("sink","0%,100%{transform:translateY(0)}50%{transform:translateY(.5px)}");
      kf("tear","0%{transform:translateY(0);opacity:1}80%{opacity:1}100%{transform:translateY(4px);opacity:0}");
      bodyAnim=`animation:${p}sink 3s ease-in-out infinite`;
      eyes+=`<rect class="${p}tear" x="${exL}" y="${eyY+3}" width="1" height="1" fill="#4DB8FF"/>`;
      anim("tear",`animation:${p}tear 1.6s ease-in infinite`);break;
    case "angry":
      kf("shake","0%{transform:translateX(-.4px)}100%{transform:translateX(.4px)}");
      kf("steam","0%{transform:translateY(0);opacity:.8}100%{transform:translateY(-4px);opacity:0}");
      bodyAnim=`animation:${p}shake .12s infinite alternate`;
      [[hx-6,0],[hx+4,.5]].forEach(([x,dl])=>fx.push(`<g fill="#FF5A5A" style="animation:${p}steam 1s ease-out ${dl}s infinite"><rect x="${Math.round(x)}" y="${hy-2}" width="1" height="2"/><rect x="${Math.round(x)+1}" y="${hy-3}" width="1" height="1"/></g>`));break;
    case "love":
      kf("bob","0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}");
      kf("float","0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-5px);opacity:0}");
      bodyAnim=`animation:${p}bob 1.2s ease-in-out infinite`;
      [[hx+3,hy-1,0],[hx-6,hy,.9]].forEach(([x,y,dl])=>fx.push(`<g fill="#FF5D8F" style="animation:${p}float 1.8s ease-out ${dl}s infinite">${px(HEART,Math.round(x),y-2)}</g>`));break;
    case "sleeping":
      kf("breath","0%,100%{transform:scaleY(1)}50%{transform:scaleY(.93)}");
      kf("z","0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(3px,-4px);opacity:0}");
      bodyAnim=`animation:${p}breath 3s ease-in-out infinite`;
      [[0],[1.25]].forEach(([dl])=>fx.push(`<g fill="#7A8CFF" style="animation:${p}z 2.5s linear ${dl}s infinite">${px(ZED,Math.round(hx)+2,hy-4)}</g>`));break;
    case "surprised":
      kf("pop","0%,40%,100%{transform:translateY(0)}10%{transform:translateY(-3px)}20%{transform:translateY(0)}");
      kf("bang","0%,40%{opacity:1}50%,60%{opacity:0}70%,100%{opacity:1}");
      bodyAnim=`animation:${p}pop 1.6s ease-out infinite`;
      fx.push(`<g fill="#FFB020" style="animation:${p}bang 1.6s steps(1) infinite"><rect x="${Math.round(hx)}" y="${hy-5}" width="1" height="2"/><rect x="${Math.round(hx)}" y="${hy-2}" width="1" height="1"/></g>`);break;
    case "typing":{
      kf("tap","0%,100%{transform:translateY(0)}50%{transform:translateY(-.4px)}");
      kf("key","0%,100%{opacity:.35}50%{opacity:1}");
      bodyAnim=`animation:${p}tap .25s ease-in-out infinite`;
      const kx=Math.round(hx)-6, ky=floor-3;
      let keys="";for(let i=0;i<6;i++)keys+=`<rect x="${kx+1+i*2}" y="${ky+1}" width="1" height="1" fill="#C9D1E3" style="animation:${p}key .5s steps(1) ${(i*0.13).toFixed(2)}s infinite"/>`;
      fx.push(`<rect x="${kx}" y="${ky}" width="13" height="3" fill="#3D4250"/>${keys}`);break;}
    case "thinking":
      kf("dot","0%,100%{opacity:0}30%,80%{opacity:1}");
      bodyAnim="";
      [[2,-1,1,0],[4,-3,1,.3],[6,-5,2,.6]].forEach(([dx,dy,s,dl])=>fx.push(`<rect x="${Math.round(hx)+dx}" y="${hy+dy}" width="${s}" height="${s}" fill="#A8A3C2" style="animation:${p}dot 1.8s ${dl}s infinite"/>`));break;
    case "dizzy":
      kf("wob","0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}");
      kf("orbit","0%{transform:rotate(0)}100%{transform:rotate(360deg)}");
      bodyAnim=`animation:${p}wob .8s ease-in-out infinite alternate`;
      fx.push(`<g fill="#FFC93C" style="transform-origin:${hx}px ${hy-2}px;animation:${p}orbit 1.4s linear infinite"><rect x="${Math.round(hx)-5}" y="${hy-2}" width="1" height="1"/><rect x="${Math.round(hx)+4}" y="${hy-2}" width="1" height="1"/><rect x="${Math.round(hx)}" y="${hy-5}" width="1" height="1"/></g>`);break;
    case "waving":
      kf("wave","0%{transform:rotate(0)}100%{transform:rotate(-55deg)}");
      kf("bob","0%,100%{transform:translateY(0)}50%{transform:translateY(-.5px)}");
      bodyAnim=`animation:${p}bob 1s ease-in-out infinite`; armCls="arm";
      anim("arm",`transform-origin:${ax(L.right)+1}px ${ay(L.armY)+L.armH}px;animation:${p}wave .35s ease-in-out infinite alternate`);break;
    case "celebrating":
      kf("jump","0%,100%{transform:translateY(0)}45%,55%{transform:translateY(-2px)}");
      kf("fall","0%{transform:translateY(0);opacity:0}10%{opacity:1}100%{transform:translateY(9px);opacity:0}");
      bodyAnim=`animation:${p}jump .6s ease-in-out infinite`;
      [-7,-4,-1,2,5,7].forEach((dx,i)=>fx.push(`<rect x="${Math.round(hx)+dx}" y="${hy-5+(i%2)}" width="1" height="1" fill="${CONFETTI[i%5]}" style="animation:${p}fall 1.4s linear ${(i*0.23).toFixed(2)}s infinite"/>`));break;
    case "idea":{
      kf("glow","0%,20%{opacity:.25}25%{opacity:1}30%{opacity:.4}35%,100%{opacity:1}");
      kf("pop","0%,20%{transform:translateY(0)}28%{transform:translateY(-1px)}36%,100%{transform:translateY(0)}");
      bodyAnim=`animation:${p}pop 2s ease-out infinite`;
      const bx=Math.round(hx)-1,by=hy-6;
      fx.push(`<g style="animation:${p}glow 2s steps(1) infinite"><g fill="#FFD84D">${px(BULB,bx,by)}</g><rect x="${bx-1}" y="${by+1}" width="1" height="1" fill="#FFD84D" opacity=".5"/><rect x="${bx+3}" y="${by+1}" width="1" height="1" fill="#FFD84D" opacity=".5"/></g><rect x="${bx}" y="${by+3}" width="3" height="1" fill="#8A8FA3"/>`);break;}
    case "music":
      kf("sway","0%{transform:rotate(-5deg)}100%{transform:rotate(5deg)}");
      kf("float","0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(2px,-5px);opacity:0}");
      bodyAnim=`animation:${p}sway .6s ease-in-out infinite alternate`;
      [[hx+3,hy-1,0],[hx-6,hy,1]].forEach(([x,y,dl])=>fx.push(`<g fill="#7A8CFF" style="animation:${p}float 2s ease-out ${dl}s infinite">${px(NOTE,Math.round(x),y-3)}</g>`));break;
    case "coffee":{
      kf("bob","0%,100%{transform:translateY(0)}50%{transform:translateY(-.5px)}");
      kf("steam","0%{transform:translateY(0);opacity:.7}100%{transform:translateY(-3px);opacity:0}");
      bodyAnim=`animation:${p}bob 2.2s ease-in-out infinite`;
      const mx=ax(L.right)+1,my=ay(L.armY)-1;
      inner+=`<rect x="${mx}" y="${my}" width="3" height="3" fill="#3D4250"/><rect x="${mx}" y="${my}" width="3" height="1" fill="#A0673A"/><rect x="${mx+3}" y="${my+1}" width="1" height="1" fill="#3D4250"/>`+
        [0,.7].map((dl,i)=>`<rect x="${mx+i+.5}" y="${my-2}" width="1" height="1" fill="#A8A3C2" style="animation:${p}steam 1.4s ease-out ${dl}s infinite"/>`).join("");break;}
    case "loading":{
      kf("load","0%{transform:scaleX(0)}90%,100%{transform:scaleX(1)}");
      const bx=Math.round(hx)-4,by=hy-3;
      fx.push(`<rect x="${bx-1}" y="${by-1}" width="11" height="3" fill="#3D4250"/><rect x="${bx}" y="${by}" width="9" height="1" fill="#6FCF97" style="transform-origin:${bx}px ${by}px;animation:${p}load 2s steps(9) infinite"/>`);break;}
    case "error":
      kf("glitch","0%,86%,100%{transform:translateX(0)}88%{transform:translateX(1px)}91%{transform:translateX(-1px)}94%{transform:translateX(1px)}");
      kf("blink","0%,49%{opacity:1}50%,100%{opacity:0}");
      bodyAnim=`animation:${p}glitch 1.5s steps(1) infinite`;
      fx.push(`<g fill="#FF4D4D" style="animation:${p}blink .8s steps(1) infinite">${px(CROSS,Math.round(hx)-1,hy-4)}</g>`);break;
  }
  // drawn before the HTTP sign so the sign covers the hat's tip
  if(hat)inner+=`<g class="${p}hat"><g fill="#E23B3B">${px(HAT_RED,Math.round(hx),hy)}</g><g fill="#EDEDED">${px(HAT_WHITE,Math.round(hx),hy)}</g></g>`;
  if(hc){
    fx.length=0; // the sign takes the space above the head
    const sx=Math.round(hx)-6, sy=hy-10, sc={2:"#6FCF97",3:"#56CCF2",4:"#FFC93C",5:"#FF6B6B"}[hc[0]];
    let dg="";[...hc].forEach((d,i)=>{for(let j=0;j<15;j++)if(DIG[d][j]==="1")dg+=`<rect x="${sx+1+i*4+j%3}" y="${sy+1+Math.floor(j/3)}" width="1" height="1"/>`});
    inner+=`<rect x="${Math.round(hx)}" y="${sy+7}" width="1" height="${hy-sy-7}" fill="#8A8FA3"/><rect x="${sx}" y="${sy}" width="13" height="7" fill="${sc}"/><g fill="#1E1B2E">${dg}</g>`;
  }
  css.push(`@media (prefers-reduced-motion: reduce){.${p}r *{animation:none!important}}`);
  const armRG=armCls?`<g class="${p}${armCls}">${armR}</g>`:armR;
  return head+`<style>${css.join("")}</style>`+
    `<rect class="${shadowCls?p+shadowCls:""}" x="${Math.round(hx-shadowW/2)}" y="${floor}" width="${shadowW}" height="1" fill="#000" opacity=".25"/>`+
    `<g ${o}><g style="transform-origin:${hx}px ${floor}px;${bodyAnim}">`+
      `<g fill="${color}">${legs}${body}${armL}${armRG}</g>${shading}`+
      `<g fill="${eye}"${eyesCls?` class="${p}${eyesCls}"`:""}>${eyes}</g>${blush}${inner}`+
    `</g></g>`+fx.join("")+`</svg>`;
}



export function standalone(m,o){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Geopets by Adiezdev (https://adiez.dev) · CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ -->\n`+svgPet(m,o,"gp-");
}
export const fileName=(who,state,ext)=>`geopet-${who}-${state}.${ext}`;
export function slugify(name){
  return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||"geopet";
}
