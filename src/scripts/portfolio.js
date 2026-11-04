/*
 * Portfolio Maru Garcia: comportamiento del sitio.
 * Partes: scroll suave · ojo y paletas · copiar mail · tele "Sobre mí" · señal (líneas → barras de prueba)
 *
 * En WordPress GSAP y Lenis eran variables globales cargadas con <script>.
 * Acá se importan desde node_modules y Astro arma un solo archivo optimizado.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

(()=>{
const html=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile=()=>matchMedia('(max-width: 767px)').matches;
const hasGsap=true;
gsap.registerPlugin(ScrollTrigger);

// Si hay cortina de arranque pero esta página no tiene la señal (o hay movimiento reducido), se saca.
if(html.classList.contains('booting')&&(reduce||!hasGsap||!document.getElementById('signal')))html.classList.remove('booting');

/* ---------- ruido: grano analógico vivo ----------
   Un solo canvas fijo. Las texturas se generan una vez y se redibujan con posición al azar
   (~12 cuadros por segundo), así el grano "hierve" sin parecer una imagen pegada encima.
   Tres niveles: base · hover sobre las barras · glitch (cambio de canal, interferencia). */
const grain=(()=>{
  const c=document.createElement('canvas');
  c.id='grain';c.setAttribute('aria-hidden','true');
  document.body.appendChild(c);
  html.classList.add('has-grain');
  const g=c.getContext('2d');
  const T=192, tiles=[];
  for(let k=0;k<6;k++){
    const t=document.createElement('canvas');t.width=t.height=T;
    const tc=t.getContext('2d'), img=tc.createImageData(T,T), d=img.data;
    // zonas con más y menos grano (orgánico, no uniforme); distancias "envueltas" para que la textura empalme
    const blobs=Array.from({length:5},()=>[Math.random()*T,Math.random()*T,18+Math.random()*60]);
    for(let y=0;y<T;y++){
      const drop=Math.random()<.006?.15+Math.random()*.25:0; // alguna línea suelta, muy de vez en cuando
      for(let x=0;x<T;x++){
        let m=.45;
        for(const [bx,by,br] of blobs){
          const dx=Math.min(Math.abs(x-bx),T-Math.abs(x-bx)), dy=Math.min(Math.abs(y-by),T-Math.abs(y-by));
          m+=.25*Math.exp(-(dx*dx+dy*dy)/(br*br));
        }
        const i=(y*T+x)*4, light=Math.random()>.45;
        const a=Math.pow(Math.random(),2.6)*m+(drop&&Math.random()<.75?drop:0);
        d[i]=light?211:6; d[i+1]=light?206:8; d[i+2]=light?195:12; d[i+3]=Math.min(255,a*130);
      }
    }
    tc.putImageData(img,0,0);
    tiles.push(g.createPattern(t,'repeat'));
  }
  const S={base:.12,hover:0,signal:0,burstUntil:0};
  let w=0,h=0,last=0;
  const pick=()=>tiles[(Math.random()*tiles.length)|0];
  function draw(now){
    const burst=now<S.burstUntil;
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);
    g.setTransform(1,0,0,1,(Math.random()*T)|0,(Math.random()*T)|0);
    g.fillStyle=pick();g.fillRect(-T,-T,w+T*2,h+T*2);
    g.setTransform(1,0,0,1,0,0);
    if(burst||S.signal>.05){ // bandas horizontales estiradas y corridas (solo en glitch e interferencia)
      const n=burst?4:2;
      for(let k=0;k<n;k++){
        g.save();
        g.translate((Math.random()-.5)*w*.3,Math.random()*h);
        g.scale(1+Math.random()*4,1);
        g.globalAlpha=.35+Math.random()*.35;g.fillStyle=pick();
        g.fillRect(-w,0,w*3,1+Math.random()*h*(burst?.06:.02));
        g.restore();
      }
    }
    c.style.opacity=Math.min(1,S.base+S.hover*.06+S.signal*.15+(burst?.12:0)).toFixed(3);
    c.style.filter=burst?`contrast(${(1.2+Math.random()*.4).toFixed(2)})`:'';
  }
  function resize(){
    const s=isMobile()?2:1.5; // grano fino
    w=c.width=Math.ceil(innerWidth/s);h=c.height=Math.ceil(innerHeight/s);
    draw(performance.now());
  }
  function loop(now){
    const busy=now<S.burstUntil||S.hover>.02||S.signal>.02;
    if(now-last>(busy?33:83)){last=now;draw(now)}
    requestAnimationFrame(loop);
  }
  resize();addEventListener('resize',resize);
  if(!reduce)requestAnimationFrame(loop); // con movimiento reducido: grano quieto
  return{
    set(k,v){S[k]=v},
    burst(ms){if(!reduce)S.burstUntil=Math.max(S.burstUntil,performance.now()+ms)}
  };
})();

/* ---------- scroll suave (Lenis + ScrollTrigger en el mismo reloj) ---------- */
let lenis=null;
if(!reduce){
  lenis=new Lenis({lerp:.09});
  if(hasGsap){
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(t=>lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
  }else{(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now())}
}
const headerH=()=>document.querySelector('.header').offsetHeight;
document.querySelectorAll('a[href*="#"]').forEach(a=>{
  const url=new URL(a.href,location.href);
  if(!url.hash||url.pathname!==location.pathname)return; // links a otra página: navegación normal
  const id=url.hash, target=id==='#top'?document.body:document.querySelector(id);
  if(!target)return;
  a.addEventListener('click',e=>{
    e.preventDefault();
    const off=id==='#top'?0:-headerH();
    if(lenis)lenis.scrollTo(id==='#top'?0:target,{offset:off,duration:1.6});
    else window.scrollTo({top:id==='#top'?0:target.getBoundingClientRect().top+scrollY+off,behavior:reduce?'auto':'smooth'});
  });
});

/* ---------- ojo ---------- */
const eye=document.getElementById('eye');
if(!eye)return;
const pupil=document.getElementById('pupil'), tab=document.getElementById('click');
function look(x,y){
  const r=eye.getBoundingClientRect(), dx=x-(r.left+r.width/2), dy=y-(r.top+r.height/2), d=Math.hypot(dx,dy)||1;
  const k=Math.min(1,d/250)*12;
  pupil.style.transform=`translate(${(dx/d*k).toFixed(1)}px,${(dy/d*k).toFixed(1)}px)`;
}
addEventListener('pointermove',e=>look(e.clientX,e.clientY),{passive:true});
addEventListener('touchmove',e=>{const t=e.touches[0];if(t)look(t.clientX,t.clientY)},{passive:true});

// Paletas del ojo, en orden: negro → hueso → azul tinta → petróleo → óxido
// (matices de los colores de las barras, no los mismos)
const themes=['dark','bone','ink','petrol','oxide'];
let ti=0, tuneT, tabT;
try{const s=+localStorage.getItem('maru-theme');if(themes[s])ti=s}catch(e){}
const setTheme=()=>{html.classList.remove(...themes);html.classList.add(themes[ti])};
setTheme();
eye.addEventListener('click',()=>{
  ti=(ti+1)%themes.length;
  try{localStorage.setItem('maru-theme',ti)}catch(e){}
  if(!reduce){
    html.classList.remove('tuning');void html.offsetWidth;html.classList.add('tuning');
    clearTimeout(tuneT);tuneT=setTimeout(()=>html.classList.remove('tuning'),300);
    grain.burst(320);
  }
  setTheme();
  tab.textContent='ch 0'+(ti+1);tab.classList.add('show');
  clearTimeout(tabT);tabT=setTimeout(()=>{tab.classList.remove('show');setTimeout(()=>tab.textContent='change!',300)},1200);
});
if(matchMedia('(hover: none)').matches){setTimeout(()=>tab.classList.add('show'),900);setTimeout(()=>tab.classList.remove('show'),3400)}

/* ---------- copiar mail ---------- */
const copy=document.getElementById('copy');
if(copy)copy.addEventListener('click',()=>{
  const el=document.getElementById('email');
  const done=t=>{copy.textContent=t;setTimeout(()=>copy.textContent='Copiar',1800)};
  const sel=()=>{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);done('Seleccionado')};
  try{navigator.clipboard.writeText(el.textContent).then(()=>done('Copiado'),sel)}catch(e){sel()}
});

/* ---------- experiencia: la tele ---------- */
const tv=document.getElementById('tv');
if(tv){
  html.classList.add('has-tv');
  const jobs=[...tv.querySelectorAll('.job')], presets=[...tv.querySelectorAll('.ch')];
  const NJ=jobs.length;
  let ch=-1, st=null, staticT;
  const show=n=>{
    n=Math.max(0,Math.min(NJ-1,n));
    if(n===ch)return;
    const first=ch<0; ch=n;
    jobs.forEach((j,k)=>{j.classList.toggle('on',k===n);j.setAttribute('aria-hidden',k!==n)});
    presets.forEach((b,k)=>b.setAttribute('aria-pressed',k===n));
        if(!first&&!reduce){
      tv.classList.remove('static-on');void tv.offsetWidth;tv.classList.add('static-on');
      clearTimeout(staticT);staticT=setTimeout(()=>tv.classList.remove('static-on'),420);
      grain.burst(380);
    }
  };
  // con la tele fijada, los botones mueven el scroll para que scroll y canal coincidan
  const go=n=>{
    n=Math.max(0,Math.min(NJ-1,n));
    if(st&&st.isActive!==undefined&&st.end>st.start){
      const y=st.start+(st.end-st.start)*n/(NJ-1)+1;
      if(lenis)lenis.scrollTo(y,{duration:.8});else window.scrollTo({top:y,behavior:'smooth'});
    }
    show(n);
  };
  presets.forEach((b,k)=>b.addEventListener('click',()=>go(k)));
  document.getElementById('chprev').addEventListener('click',()=>go(ch-1));
  document.getElementById('chnext').addEventListener('click',()=>go(ch+1));
  show(0);
  if(hasGsap&&!reduce){
    const top=()=>headerH()+Math.max(16,(innerHeight-headerH()-tv.offsetHeight)/2);
    const fits=()=>tv.offsetHeight+headerH()+24<innerHeight;
    const setup=()=>{
      if(st){st.kill(true);st=null}
      if(!fits())return; // si la tele no entra en pantalla, solo botones
      st=ScrollTrigger.create({
        trigger:tv,pin:true,
        start:()=>'top '+top()+'px',
        end:()=>'+='+(NJ-1)*innerHeight*(isMobile()?.45:.55),
        onUpdate:s=>show(Math.round(s.progress*(NJ-1)))
      });
    };
    setup();
    let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{setup();ScrollTrigger.refresh()},250)});
  }
}

/* ---------- la señal: de las líneas a las barras ---------- */
if(reduce||!hasGsap||!document.getElementById('signal'))return;
html.classList.add('has-signal');

// Patrón de prueba en clave "CRT nocturna":
// blanco envejecido · mostaza · petróleo · verde profundo · magenta oscuro · óxido · azul apagado
const BARS=['#C5C0B3','#A78E35','#376B73','#2F6656','#824360','#A34E36','#293C83'];
const ROW2=['#293C83','#11141B','#824360','#11141B','#376B73','#11141B','#C5C0B3'];
const ROW3=['#1E2B5C','#C5C0B3','#3B2650','#11141B','#07080C','#1C2029','#11141B'];
const N=BARS.length;

const cv=document.getElementById('signal'), ctx=cv.getContext('2d');
const off=document.createElement('canvas'), o=off.getContext('2d');
const fx=document.createElement('canvas'), f=fx.getContext('2d'); // capa reutilizable para el desfase cromático
const slot=document.getElementById('slot'), heroText=document.querySelector('.hero-text');
let W=0,H=0,dpr=1,P=0,queued=false,mobile=isMobile();

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const inOut=gsap.parseEase('power2.inOut'), inCubic=gsap.parseEase('power3.in');
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};

function size(){
  mobile=isMobile();
  dpr=Math.min(window.devicePixelRatio||1,mobile?1.5:2);
  W=innerWidth;H=innerHeight;
  for(const c of [cv,off,fx]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);o.setTransform(dpr,0,0,dpr,0,0);
  queue();
}

function scene(p){
  o.clearRect(0,0,W,H);
  const r=slot.getBoundingClientRect();
  const sw=r.width/N, bw=W/N;
  const strip=seg(p,.45,.52);
  for(let i=0;i<N;i++){
    const e=inOut(seg(p,.04+i*.02,.36+i*.02)); // cada línea crece hasta ocupar su columna
    const lift=-(H+40)*inCubic(seg(p,.64+i*.025,.79+i*.025)); // revelación: cada barra se retira hacia arriba
    const x0=lerp(r.left+i*sw,i*bw,e), x1=lerp(r.left+(i+1)*sw,(i+1)*bw,e);
    const y0=lerp(r.top,-2,e)+lift, y1=lerp(r.bottom,H+2,e)+lift;
    o.fillStyle=BARS[i];o.fillRect(Math.floor(x0),y0,Math.ceil(x1)-Math.floor(x0),y1-y0);
    if(strip>0){ // franja inferior del patrón de prueba
      o.globalAlpha=strip;
      const a=Math.floor(i*bw), w=Math.ceil((i+1)*bw)-a;
      o.fillStyle=ROW2[i];o.fillRect(a,H*.67+lift,w,H*.08);
      o.fillStyle=ROW3[i];o.fillRect(a,H*.75+lift,w,H*.25+2);
      o.globalAlpha=1;
    }
  }
}

/* ---------- hover: las barras como señal viva ----------
   Solo con las barras en reposo (antes de que empiece el scroll). No toca el progreso de ScrollTrigger. */
const hv={E:0,target:0,x:.5,tx:.5,y:.5,ty:.5,g:null};
function overBars(x,y){
  const r=slot.getBoundingClientRect();
  return P<.02&&x>=r.left&&x<=r.right&&y>=r.top-24&&y<=r.bottom+24;
}
function aim(x,y){
  const r=slot.getBoundingClientRect();
  hv.tx=clamp((x-r.left)/r.width,0,1);hv.ty=clamp((y-r.top)/r.height,0,1);
}
addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  const on=overBars(e.clientX,e.clientY);
  if(on)aim(e.clientX,e.clientY);
  if(on!==(hv.target===1)){hv.target=on?1:0;queue()}
},{passive:true});
html.addEventListener('mouseleave',()=>{hv.target=0;queue()});
addEventListener('pointerdown',e=>{ // táctil: un toque es un pulso que se apaga solo
  if(e.pointerType!=='touch'||!overBars(e.clientX,e.clientY))return;
  aim(e.clientX,e.clientY);hv.x=hv.tx;hv.y=hv.ty;hv.E=1;hv.target=0;
  glitch(performance.now());queue();
},{passive:true});

function glitch(now){ // micro-interferencia: dura fracciones de segundo
  hv.g={until:now+70+Math.random()*130,type:(Math.random()*3)|0,y:Math.random()*.7,h:.12+Math.random()*.3,
        dx:(Math.random()<.5?-1:1)*(14+Math.random()*44),dy:(Math.random()-.5)*7};
  grain.burst(160);
}
function wave(yl,t){ // irregular a propósito: dos ondas desfasadas + saltos escalonados
  return .55*Math.sin(yl*.19+t*7.3)+.3*Math.sin(yl*.57-t*11.7)+.9*(hash(Math.floor(yl/5)*3.1+Math.floor(t*14))-.5);
}

function drawHover(now){
  const r=slot.getBoundingClientRect();
  if(r.bottom<0||r.top>H||r.width<1)return;
  const E=hv.E, t=now/1000;
  const cx=r.left+hv.x*r.width, R=Math.max(90,r.width*.2);
  const amp=Math.min(48,r.width*.04)*E;
  const segs=32, segW=r.width/segs, rowH=2;
  // onda localizada: cada tramo de 2px se corre según la distancia al cursor
  for(let y=r.top;y<r.bottom;y+=rowH){
    const yl=y-r.top, ey=.55+.45*Math.exp(-Math.pow(yl/r.height-hv.y,2)/.06);
    const wv=wave(yl,t)*ey;
    for(let j=0;j<segs;j++){
      const sx=r.left+j*segW, d=Math.abs(sx+segW/2-cx)/R;
      if(d>=1)continue;
      const wx=(1-d*d)*(1-d*d);
      ctx.drawImage(off,sx*dpr,y*dpr,segW*dpr,rowH*dpr,sx+amp*wx*wv,y,segW,rowH);
    }
  }
  // micro-glitch
  const g=hv.g;
  if(g&&now>g.until)hv.g=null;
  else if(g){
    if(g.type===0){ // una franja se corre
      const by=r.top+g.y*r.height, bh=g.h*r.height;
      ctx.drawImage(off,r.left*dpr,by*dpr,r.width*dpr,bh*dpr,r.left+g.dx,by,r.width,bh);
    }else if(g.type===1){ // colores desalineados
      ctx.globalAlpha=.55;
      ctx.drawImage(off,r.left*dpr,r.top*dpr,r.width*dpr,r.height*dpr,r.left+g.dx*.35,r.top,r.width,r.height);
      ctx.globalAlpha=1;
    }else{ // salto de imagen
      ctx.clearRect(r.left-2,r.top-10,r.width+4,r.height+20);
      ctx.drawImage(off,r.left*dpr,r.top*dpr,r.width*dpr,r.height*dpr,r.left+g.dx*.15,r.top+g.dy,r.width,r.height);
    }
  }
  // desfase cromático en la zona alterada (copia roja y copia cian, corridas)
  const x0=Math.max(r.left,cx-R), x1=Math.min(r.right,cx+R);
  if(!mobile&&E>.05&&x1>x0){
    const k=(2+6*E)*dpr;
    const bx=Math.max(0,Math.floor((x0-12)*dpr)), by=Math.max(0,Math.floor((r.top-10)*dpr));
    const bw=Math.min(cv.width-bx,Math.ceil((x1-x0+24)*dpr)), bh=Math.min(cv.height-by,Math.ceil((r.height+20)*dpr));
    if(bw>0&&bh>0)for(const [tint,shift] of [['#ff3b1f',-k],['#1fd2ff',k]]){
      f.globalCompositeOperation='copy';f.drawImage(cv,bx,by,bw,bh,0,0,bw,bh);
      f.globalCompositeOperation='multiply';f.fillStyle=tint;f.fillRect(0,0,bw,bh);
      f.globalCompositeOperation='destination-in';f.drawImage(cv,bx,by,bw,bh,0,0,bw,bh);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=.42*E;
      ctx.drawImage(fx,0,0,bw,bh,bx+shift,by,bw,bh);
      ctx.restore();
    }
  }
}

function render(now){
  queued=false;
  now=now||performance.now();
  // energía del hover: sube rápido, se apaga despacio; la posición sigue al cursor con suavizado
  if(P>=.02)hv.target=0;
  hv.E+=(hv.target-hv.E)*(hv.target>hv.E?.2:.06);
  if(hv.E<.003&&!hv.target)hv.E=0;
  hv.x+=(hv.tx-hv.x)*.16;hv.y+=(hv.ty-hv.y)*.16;
  if(hv.E>.35&&!hv.g&&Math.random()<.016)glitch(now);
  grain.set('hover',hv.E);

  heroText.style.opacity=(1-seg(P,.06,.22)*.85).toFixed(3);
  if(P>=.999){cv.style.visibility='hidden';grain.set('signal',0);return}
  cv.style.visibility='visible';
  scene(P);
  ctx.clearRect(0,0,W,H);
  const b=Math.sin(Math.PI*seg(P,.52,.63)); // interferencia: corta y controlada
  grain.set('signal',b<.02?0:b);
  if(b<.02){
    ctx.drawImage(off,0,0,W,H);
    if(hv.E>0||hv.g)drawHover(now);
    if(hv.E>0||hv.target||hv.g)queue(); // sigue animando mientras haya hover
    return;
  }
  const seed=Math.floor(P*420), rows=mobile?16:28, sh=H/rows, amp=W*.07*b;
  ctx.save();
  ctx.translate(0,(hash(seed)-.5)*6*b);
  for(let s=0;s<rows;s++){
    const shift=hash(s*7+seed)>.74?(hash(s*13+seed*3)-.5)*2*amp:0;
    ctx.drawImage(off,0,Math.floor(s*sh*dpr),off.width,Math.ceil(sh*dpr)+1,shift,s*sh,W,sh+1/dpr);
  }
  if(!mobile){ // desfase cromático
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.32*b;
    ctx.drawImage(off,-9*b,0,W,H);ctx.drawImage(off,9*b,0,W,H);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  ctx.restore();
}
function queue(){if(!queued){queued=true;requestAnimationFrame(render)}}

ScrollTrigger.create({
  trigger:'#portfolio',
  start:0,
  end:'top 30%',
  onUpdate:s=>{P=s.progress;queue()},
  onRefresh:s=>{P=s.progress;queue()}
});
addEventListener('resize',size);
size();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{ScrollTrigger.refresh();queue()});

/* ---------- arranque: la tele se enciende ----------
   1. Aparece la señal: una línea horizontal, como un CRT al encenderse.
   2. La línea es el párpado: se abre el ojo, mira para los costados, se marea, te encuentra y guiña.
   3. El ojo vuela a su lugar en el header y la señal se corta con un glitch:
      las barras de prueba caen a la franja del hero (la misma animación del scroll, al revés).
   Dura unos 3 s. Una vez por sesión. Se saltea con un clic, una tecla o la rueda del mouse. */
function boot(){
  if(!html.classList.contains('booting'))return;
  if(scrollY>40){html.classList.remove('booting');return} // la página se recargó a mitad de camino
  try{sessionStorage.setItem('mg-boot','1')}catch(e){}
  if(lenis)lenis.stop();

  const el=document.createElement('div');
  el.id='boot';el.setAttribute('aria-hidden','true');
  el.innerHTML='<canvas></canvas><div class="boot-eye"><div class="boot-pupil"></div></div>';
  document.body.appendChild(el);
  html.classList.add('boot-on');
  html.classList.remove('booting');

  const bc=el.querySelector('canvas'), b=bc.getContext('2d');
  const eyeEl=el.querySelector('.boot-eye'), pupil=el.querySelector('.boot-pupil');
  const headerEye=document.getElementById('eye');
  let w=0,h=0;
  const fit=()=>{const d=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;bc.width=w*d;bc.height=h*d;b.setTransform(d,0,0,d,0,0)};
  fit();addEventListener('resize',fit);

  const st={line:0,lineW:0,dark:1,bars:0,glitch:0,collapse:0};
  const size=eyeEl.offsetWidth, R=size*.3, roll={a:0};
  let pt=null;
  const track=e=>{pt=[e.clientX,e.clientY]};
  addEventListener('pointermove',track,{passive:true});

  function draw(){
    b.clearRect(0,0,w,h);
    if(st.dark>0){b.globalAlpha=st.dark;b.fillStyle='#11141B';b.fillRect(0,0,w,h);b.globalAlpha=1}
    el.style.setProperty('--boot-a',st.dark.toFixed(3));
    if(st.line>0){ // la línea de encendido
      const lw=st.lineW*w, th=1.5+st.line*1.5;
      b.save();b.globalAlpha=st.line;b.shadowColor='rgba(211,206,195,.85)';b.shadowBlur=20*st.line;
      b.fillStyle='#D3CEC3';b.fillRect(w/2-lw/2,h/2-th/2,lw,th);b.restore();
    }
    if(st.bars>0){ // las barras de prueba: de pantalla completa a la franja del hero
      const r=slot.getBoundingClientRect(), sw=r.width/N, bw=w/N;
      const seed=Math.floor(performance.now()/45), slices=st.glitch>0?16:1, sh=h/slices;
      const rects=[];
      for(let i=0;i<N;i++){
        const e=inOut(clamp((st.collapse-i*.05)/.7,0,1));
        rects.push([lerp(i*bw,r.left+i*sw,e),lerp((i+1)*bw,r.left+(i+1)*sw,e),lerp(0,r.top,e),lerp(h,r.bottom,e)]);
      }
      b.globalAlpha=st.bars;
      rects.forEach(([x0,x1,y0,y1],i)=>{
        b.fillStyle=BARS[i];
        if(st.glitch<=0){b.fillRect(Math.floor(x0),y0,Math.ceil(x1)-Math.floor(x0),y1-y0);return}
        for(let s=0;s<slices;s++){ // franjas corridas
          const sy=Math.max(y0,s*sh), ey=Math.min(y1,(s+1)*sh);
          if(ey<=sy)continue;
          const shift=hash(s*7+seed)>.62?(hash(s*13+seed*3)-.5)*w*.14*st.glitch:0;
          b.fillRect(Math.floor(x0+shift),sy,Math.ceil(x1-x0)+1,ey-sy);
        }
      });
      if(st.glitch>0){ // desfase cromático
        b.globalCompositeOperation='screen';b.globalAlpha=.3*st.glitch;
        rects.forEach(([x0,x1,y0,y1],i)=>{b.fillStyle=BARS[i];b.fillRect(x0-10*st.glitch,y0,x1-x0,y1-y0);b.fillRect(x0+10*st.glitch,y0,x1-x0,y1-y0)});
        b.globalCompositeOperation='source-over';
      }
      b.globalAlpha=1;
    }
  }

  // hacia dónde mirar cuando "te encuentra": el cursor si se movió, si no, de frente
  const aimAt=k=>{if(!pt)return 0;const dx=pt[0]-w/2, dy=pt[1]-h/2, d=Math.hypot(dx,dy)||1;return (k==='x'?dx:dy)/d*R*.7};
  // a dónde vuela: el ojo del header, con sus colores de la paleta actual
  const fly=()=>{
    const t=headerEye.getBoundingClientRect(), cs=getComputedStyle(headerEye), ps=getComputedStyle(headerEye.firstElementChild);
    return{x:t.left+t.width/2-w/2,y:t.top+t.height/2-h/2,s:t.width/size,bg:cs.backgroundColor,pb:ps.backgroundColor};
  };
  let to=null;
  const T=()=>to||(to=fly()); // se calcula al empezar el vuelo (también si se salteó la intro)

  gsap.set(eyeEl,{scaleY:.03});
  const tl=gsap.timeline({onUpdate:draw,onComplete:done});
  tl
    // 1. aparece la señal
    .to(st,{line:1,lineW:.55,duration:.28,ease:'power2.out'},.12)
    .to(st,{lineW:1,duration:.1,ease:'power1.in'})
    .to(st,{lineW:size/Math.max(w,1),duration:.22,ease:'power3.inOut'},'+=.06')
    // 2. la línea es el párpado: se abre el ojo
    .set(eyeEl,{autoAlpha:1})
    .to(st,{line:0,duration:.08})
    .to(eyeEl,{scaleY:1,duration:.32,ease:'back.out(2.4)'},'<')
    //    mira para todos lados y se marea
    .to(pupil,{x:-R,duration:.07,ease:'power3.out'},'+=.12')
    .to(pupil,{x:R,duration:.07,ease:'power3.out'},'+=.12')
    .to(roll,{a:Math.PI*2,duration:.38,ease:'power1.inOut',onUpdate(){gsap.set(pupil,{x:Math.cos(roll.a)*R,y:Math.sin(roll.a)*R*.85})}},'+=.04')
    //    te encuentra: te mira, se le dilata la pupila y guiña
    .to(pupil,{x:()=>aimAt('x'),y:()=>aimAt('y'),scale:1.6,duration:.14,ease:'back.out(3)'})
    .to(eyeEl,{scaleY:.06,duration:.06,yoyo:true,repeat:1,ease:'power2.in'},'+=.18')
    .to(pupil,{x:0,y:0,scale:1,duration:.14},'<')
    .addLabel('exit')
    // 3. vuela al header…
    .to(eyeEl,{x:()=>T().x,y:()=>T().y,scale:()=>T().s,backgroundColor:()=>T().bg,duration:.45,ease:'power3.inOut'})
    .to(pupil,{backgroundColor:()=>T().pb,duration:.45},'<')
    // …y la señal se corta: glitch y las barras caen a su lugar
    .add(()=>grain.burst(240),'-=.1')
    .to(st,{bars:1,glitch:1,duration:.05},'<')
    .to(st,{glitch:0,duration:.24,ease:'power2.out'},'+=.1')
    .to(st,{collapse:1,duration:.65,ease:'none'},'<')
    .to(st,{dark:0,duration:.4,ease:'power2.inOut'},'<.15')
    .to(eyeEl,{autoAlpha:0,duration:.1},'>-.1');

  // saltear
  const skip=()=>{if(tl.time()<tl.labels.exit)tl.seek('exit')};
  el.addEventListener('pointerdown',skip);
  addEventListener('keydown',skip);
  addEventListener('wheel',skip,{passive:true});
  addEventListener('touchmove',skip,{passive:true});

  function done(){
    removeEventListener('pointermove',track);removeEventListener('keydown',skip);
    removeEventListener('wheel',skip);removeEventListener('touchmove',skip);removeEventListener('resize',fit);
    el.remove();
    html.classList.remove('boot-on');
    if(lenis)lenis.start();
    queue();
  }
}
boot();
})();
