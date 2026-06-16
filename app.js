// ========= 吃了吗 App 引擎（导航 + 转盘）=========
// 数据全在 data.js。这个文件一般不用改。

const MAX_SEG = 14;                 // 转盘最多显示几块；菜更多就每次随机抽这么多上盘
const COLORS = ["#ff7a59","#ffb454","#ffd56b","#7ed6a5","#5cc8ff","#9d8cff","#ff8fb1","#67e0c9"];
const app = document.getElementById("app");
let nav = ["home"];

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function sample(list){ const a=list.slice(); return a.length>MAX_SEG ? shuffle(a).slice(0,MAX_SEG) : a; }

function go(key){ nav.push(key); render(); }
function back(){ if(nav.length>1){ nav.pop(); render(); } }

function header(s){
  const h = document.createElement("div"); h.className="hdr";
  if(s.back){
    const b=document.createElement("button"); b.className="back"; b.textContent="‹ 返回"; b.onclick=back; h.appendChild(b);
  } else { const sp=document.createElement("span"); sp.style.width="64px"; h.appendChild(sp); }
  const t=document.createElement("div"); t.className="ttl"; t.textContent=(s.emoji?s.emoji+" ":"")+s.title; h.appendChild(t);
  const sp2=document.createElement("span"); sp2.style.width="64px"; h.appendChild(sp2);
  return h;
}

function render(){
  const s = SCREENS[nav[nav.length-1]];
  app.innerHTML = "";
  app.appendChild(header(s));
  if(s.type==="menu") renderMenu(s); else renderWheel(s);
}

function renderMenu(s){
  const box=document.createElement("div"); box.className="menu";
  s.items.forEach(it=>{
    const a=document.createElement("button"); a.className="mbtn"; a.textContent=it.label;
    a.style.background=it.color||"#ff7a59"; a.onclick=()=>go(it.go); box.appendChild(a);
  });
  app.appendChild(box);
}

function renderWheel(s){
  // ---- 顶部选择器（分类标签 / 省份下拉）----
  let items = [];
  const top=document.createElement("div"); top.className="top";

  if(s.type==="chips"){
    const cats=Object.keys(s.cats);
    let cur=cats[0];
    cats.forEach(c=>{
      const b=document.createElement("div"); b.className="chip"+(c===cur?" on":""); b.textContent=c;
      b.onclick=()=>{ if(spinning)return; cur=c; [...top.children].forEach(x=>x.classList.toggle("on",x.textContent===c)); setItems(s.cats[c]); };
      top.appendChild(b);
    });
    items=s.cats[cur];
  } else if(s.type==="region"){
    const sel=document.createElement("select"); sel.className="sel";
    Object.keys(s.regions).forEach(p=>{ const o=document.createElement("option"); o.value=p; o.textContent=p; sel.appendChild(o); });
    sel.onchange=()=>{ if(spinning){ sel.value=curRegion; return; } curRegion=sel.value; setItems(s.regions[sel.value]); };
    top.appendChild(sel);
    curRegion=Object.keys(s.regions)[0];
    items=s.regions[curRegion];
  } else {
    items=s.items;
  }
  if(top.children.length) app.appendChild(top);

  // ---- 转盘舞台 ----
  const stage=document.createElement("div"); stage.className="stage";
  stage.innerHTML='<div class="pointer"></div><canvas class="wheel" width="600" height="600"></canvas><div class="hub">开转</div>';
  app.appendChild(stage);

  const result=document.createElement("div"); result.className="result"; result.innerHTML="点中间开转 👇";
  app.appendChild(result);
  const again=document.createElement("button"); again.className="again"; again.textContent="再转一次";
  app.appendChild(again);

  // ---- 转盘逻辑 ----
  const cv=stage.querySelector(".wheel"), ctx=cv.getContext("2d");
  let cur=[], angle=0;
  const prefix=s.result||"今天吃：";

  function draw(){
    const N=cur.length, R=300, cx=300, cy=300, step=(Math.PI*2)/N;
    ctx.clearRect(0,0,600,600);
    for(let i=0;i<N;i++){
      const a0=-Math.PI/2+i*step, a1=a0+step;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a0,a1); ctx.closePath();
      ctx.fillStyle=COLORS[i%COLORS.length]; ctx.fill();
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0+step/2);
      ctx.fillStyle="#3a2a18"; ctx.textAlign="right"; ctx.textBaseline="middle";
      const fs=N>10?18:22; ctx.font="bold "+fs+"px -apple-system,'PingFang SC',sans-serif";
      ctx.fillText(cur[i], R-16, 0); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,R-1,0,Math.PI*2); ctx.lineWidth=6; ctx.strokeStyle="rgba(255,255,255,.25)"; ctx.stroke();
  }
  function setItems(list){ cur=sample(list); angle=0; stage.classList.remove("spinning"); cv.style.transform="rotate(0deg)"; result.innerHTML="点中间开转 👇"; draw(); }

  function spin(){
    if(spinning||!cur.length) return; spinning=true; result.innerHTML="转动中…";
    const N=cur.length, st=360/N, idx=Math.floor(Math.random()*N), center=idx*st+st/2;
    const turns=5+Math.floor(Math.random()*3);
    const target=angle+turns*360+(360-(((angle%360)+center)%360)); angle=target;
    stage.classList.add("spinning"); cv.style.transform="rotate("+target+"deg)";
    setTimeout(()=>{ spinning=false; result.innerHTML=prefix+"<span>"+cur[idx]+"</span>"; }, 4300);
  }
  stage.querySelector(".hub").onclick=spin; again.onclick=spin;
  setItems(items);
}

let spinning=false, curRegion="";
render();
