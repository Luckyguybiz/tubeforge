import { useState, createContext, useContext, useMemo } from 'react';

/* ═══ THEMES ═══ */
const dark = {
  bg: '#06060b',
  surface: '#0c0c14',
  card: '#111119',
  cardHover: '#17171f',
  border: '#1e1e2e',
  borderActive: '#2e2e44',
  accent: '#ff2d55',
  accentDim: 'rgba(255,45,85,.1)',
  blue: '#3a7bfd',
  green: '#2dd4a0',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  cyan: '#06b6d4',
  pink: '#ec4899',
  text: '#e8e8f0',
  sub: '#7c7c96',
  dim: '#44445a',
  overlay: 'rgba(0,0,0,.4)',
  overlayLight: 'rgba(0,0,0,.5)',
};
const light = {
  bg: '#f3f3f7',
  surface: '#ffffff',
  card: '#eeeef3',
  cardHover: '#e4e4ec',
  border: '#d4d4de',
  borderActive: '#c0c0ce',
  accent: '#e8243c',
  accentDim: 'rgba(232,36,60,.07)',
  blue: '#2563eb',
  green: '#16a34a',
  purple: '#7c3aed',
  orange: '#d97706',
  cyan: '#0891b2',
  pink: '#db2777',
  text: '#1a1a2e',
  sub: '#6b6b82',
  dim: '#9e9eb4',
  overlay: 'rgba(255,255,255,.7)',
  overlayLight: 'rgba(255,255,255,.8)',
};

const ThemeCtx = createContext(dark);
const useT = () => useContext(ThemeCtx);

const PK = ['accent', 'blue', 'purple', 'green', 'orange', 'cyan', 'pink'];
const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};
const uid = () => 'id_' + Math.random().toString(36).slice(2, 8);

const MODELS = [
  { id: 'turbo', name: 'Turbo', desc: 'Быстро', speed: '~10с', icon: '⚡' },
  {
    id: 'standard',
    name: 'Standard',
    desc: 'Баланс',
    speed: '~30с',
    icon: '◆',
  },
  { id: 'pro', name: 'Pro', desc: 'Макс. качество', speed: '~60с', icon: '✦' },
  {
    id: 'cinematic',
    name: 'Cinematic',
    desc: 'Кино-эффекты',
    speed: '~90с',
    icon: '🎬',
  },
];
const AVATARS = [
  '👨‍💻',
  '👩‍💻',
  '🤖',
  '👔',
  '👩‍🎨',
  '🧑‍🔬',
  '👨‍🚀',
  '🦸',
  '🧙',
  '👻',
  '🐱',
  '🎭',
];
const STATUS = {
  empty: { l: 'Пусто', c: 'dim' },
  editing: { l: 'Черновик', c: 'blue' },
  generating: { l: 'Генерация…', c: 'orange' },
  ready: { l: 'Готово', c: 'green' },
  error: { l: 'Ошибка', c: 'accent' },
};

/* ─── tiny components ─── */
function StatusDot({ status }) {
  const C = useT();
  const s = STATUS[status] || STATUS.empty;
  const col = C[s.c] || C.dim;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: col,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: col,
          animation: status === 'generating' ? 'pulse 1.4s infinite' : 'none',
        }}
      />
      {s.l}
    </span>
  );
}
function Toggle({ on, onChange, label, ck }) {
  const C = useT();
  const col = C[ck] || C.green;
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        padding: '5px 8px',
        borderRadius: 7,
        background: on ? `${col}12` : C.card,
        border: `1px solid ${on ? col + '33' : C.border}`,
      }}
    >
      <div
        style={{
          width: 26,
          height: 14,
          borderRadius: 7,
          background: on ? col : C.dim,
          position: 'relative',
          transition: 'background .2s',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: on ? 14 : 2,
            transition: 'left .15s',
          }}
        />
      </div>
      <span
        style={{ fontSize: 10, fontWeight: 600, color: on ? C.text : C.sub }}
      >
        {label}
      </span>
    </div>
  );
}
function FrameSlot({ label, has, onClick }) {
  const C = useT();
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        borderRadius: 8,
        border: `1.5px dashed ${has ? C.green + '55' : C.border}`,
        background: has ? `${C.green}08` : C.card,
        padding: '10px 6px',
        textAlign: 'center',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: C.sub,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
        }}
      >
        Optional
      </span>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: has ? `${C.green}20` : C.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: has ? C.green : C.dim,
        }}
      >
        🖼
      </div>
      <span style={{ fontSize: 9, color: has ? C.green : C.dim }}>
        {has ? 'Загружено' : label}
      </span>
    </div>
  );
}

const NAV = [
  { id: 'dashboard', icon: '◉', label: 'Дашборд' },
  { id: 'editor', icon: '▶', label: 'Редактор' },
  { id: 'metadata', icon: '✎', label: 'Метаданные' },
  { id: 'thumbnail', icon: '◫', label: 'Обложки' },
  { id: 'preview', icon: '◎', label: 'Превью' },
];

const STATS = [
  { label: 'Просмотры', value: '1.2M', change: '+12.4%', up: true },
  { label: 'Подписчики', value: '48.3K', change: '+2.1K', up: true },
  { label: 'Watch Time', value: '86.4K ч', change: '+8.7%', up: true },
  { label: 'CTR', value: '6.8%', change: '-0.3%', up: false },
];
const VIDEOS = [
  {
    title: 'Как ИИ изменит YouTube в 2026',
    views: '142K',
    ctr: '8.2%',
    st: 'live',
  },
  {
    title: 'Топ-10 нейросетей для контента',
    views: '89K',
    ctr: '7.1%',
    st: 'live',
  },
  { title: 'Секреты вирусных обложек', views: '—', ctr: '—', st: 'draft' },
];

/* ═══ PAGES ═══ */
function Dashboard() {
  const C = useT();
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
        Привет! Вот твоя статистика
      </h2>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>
        Канал: <span style={{ color: C.accent }}>@creative_studio</span> ·
        Последние 28 дней
      </p>
      <div
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}
      >
        {STATS.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '16px 18px',
              flex: 1,
              minWidth: 150,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg,${C.accent},transparent)`,
                opacity: 0.5,
              }}
            />
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: s.up ? C.green : C.accent,
                marginTop: 4,
              }}
            >
              {s.change}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            Мои видео
          </h3>
          <button
            style={{
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Новое видео
          </button>
        </div>
        {VIDEOS.map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 0',
              borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 80,
                height: 45,
                borderRadius: 7,
                background: C.surface,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: C.dim,
              }}
            >
              ▶
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{v.title}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                {v.views} · CTR {v.ctr}
              </div>
            </div>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                background: v.st === 'live' ? `${C.green}18` : `${C.orange}18`,
                color: v.st === 'live' ? C.green : C.orange,
              }}
            >
              {v.st === 'live' ? 'Опубликовано' : 'Черновик'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metadata() {
  const C = useT();
  const [title, setTitle] = useState('Как ИИ изменит YouTube в 2026 году');
  const [desc, setDesc] = useState(
    'В этом видео я расскажу о 5 ключевых изменениях, которые ИИ принесёт в мир YouTube-контента.'
  );
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
        Метаданные видео
      </h2>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>
        Заголовок, описание, теги — оптимизировано ИИ
      </p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>
                Название
              </label>
              <button
                style={{
                  background: 'none',
                  border: `1px solid ${C.accent}44`,
                  color: C.accent,
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✦ AI
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                color: C.text,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: title.length > 70 ? C.accent : C.dim,
                marginTop: 3,
                textAlign: 'right',
              }}
            >
              {title.length}/100
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <label style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>
                Описание
              </label>
              <button
                style={{
                  background: 'none',
                  border: `1px solid ${C.accent}44`,
                  color: C.accent,
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✦ AI
              </button>
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                color: C.text,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.sub,
                display: 'block',
                marginBottom: 6,
              }}
            >
              Теги
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {[
                'ИИ',
                'YouTube',
                'нейросети',
                'контент',
                'тренды 2026',
                'AI видео',
              ].map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '4px 12px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    fontSize: 11,
                    color: C.sub,
                    cursor: 'pointer',
                  }}
                >
                  {t} ×
                </span>
              ))}
              <span
                style={{
                  padding: '4px 12px',
                  border: `1px dashed ${C.border}`,
                  borderRadius: 16,
                  fontSize: 11,
                  color: C.dim,
                  cursor: 'pointer',
                }}
              >
                + добавить
              </span>
            </div>
          </div>
        </div>
        <div style={{ width: 300 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.sub,
              marginBottom: 8,
            }}
          >
            Как видят зрители
          </div>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                aspectRatio: '16/9',
                background: C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: C.dim,
              }}
            >
              Обложка видео
            </div>
            <div style={{ padding: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  marginBottom: 4,
                }}
              >
                {title || 'Название'}
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>
                @creative_studio · 142K · 2 дня назад
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.sub,
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {desc.slice(0, 100)}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThumbnailEditor(){
const C=useT();
const [step,setStep]=useState("editor");
const [tool,setTool]=useState("select");
const [els,setEls]=useState([
  {id:"t1",type:"text",x:80,y:100,w:400,h:60,text:"КАК ИИ ИЗМЕНИТ",font:"Instrument Sans",size:42,bold:true,italic:false,color:"#ffffff",shadow:"0 2px 12px rgba(0,0,0,.6)",opacity:1,bg:"rgba(255,45,85,.15)",borderR:4,rot:0},
  {id:"t2",type:"text",x:700,y:320,w:340,h:70,text:"YOUTUBE",font:"Instrument Sans",size:52,bold:true,italic:false,color:"#ff2d55",shadow:"0 2px 16px rgba(255,45,85,.4)",opacity:1,bg:"transparent",borderR:0,rot:0},
]);
const [selId,setSelId]=useState(null);
const [drag,setDrag]=useState(null);
const [resize,setResize]=useState(null);
const [canvasBg,setCanvasBg]=useState("#0c0c14");
const [drawing,setDrawing]=useState(false);
const [drawPts,setDrawPts]=useState([]);
const [drawColor,setDrawColor]=useState("#ff2d55");
const [drawSize,setDrawSize]=useState(3);
const [aiPrompt,setAiPrompt]=useState("");
const [aiResults,setAiResults]=useState([]);
const [aiLoading,setAiLoading]=useState(false);
const canvasW=1280,canvasH=720;
const canvasRef=useState(null);
const fileRef=useState(null);
const sel=els.find(e=>e.id===selId);

const addText=()=>{const ne={id:uid(),type:"text",x:100+Math.random()*200,y:100+Math.random()*200,w:300,h:50,text:"Новый текст",font:"Instrument Sans",size:32,bold:true,italic:false,color:"#ffffff",shadow:"none",opacity:1,bg:"transparent",borderR:0,rot:0};setEls(p=>[...p,ne]);setSelId(ne.id);setTool("select");};

const addRect=()=>{const ne={id:uid(),type:"rect",x:200+Math.random()*100,y:150+Math.random()*100,w:200,h:120,color:"#ff2d55",opacity:0.8,borderR:8,border:"none",rot:0};setEls(p=>[...p,ne]);setSelId(ne.id);setTool("select");};

const addCircle=()=>{const ne={id:uid(),type:"circle",x:300+Math.random()*100,y:200+Math.random()*100,w:120,h:120,color:"#3a7bfd",opacity:0.8,rot:0};setEls(p=>[...p,ne]);setSelId(ne.id);setTool("select");};

const addImage=(dataUrl)=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;const maxW=400;if(w>maxW){h=h*(maxW/w);w=maxW;}const ne={id:uid(),type:"image",x:100,y:100,w,h,src:dataUrl,opacity:1,borderR:0,rot:0};setEls(p=>[...p,ne]);setSelId(ne.id);setTool("select");};img.src=dataUrl;};

const upd=(id,p)=>setEls(v=>v.map(e=>e.id===id?{...e,...p}:e));
const del=(id)=>{setEls(v=>v.filter(e=>e.id!==id));if(selId===id)setSelId(null);};
const bringFront=(id)=>setEls(v=>{const el=v.find(e=>e.id===id);return[...v.filter(e=>e.id!==id),el];});
const sendBack=(id)=>setEls(v=>{const el=v.find(e=>e.id===id);return[el,...v.filter(e=>e.id!==id)];});


const onCanvasMouseDown=(e)=>{
  if(tool==="draw"){setDrawing(true);const rect=e.currentTarget.getBoundingClientRect();const sx=canvasW/rect.width;const x=(e.clientX-rect.left)*sx;const y=(e.clientY-rect.top)*sx;setDrawPts([{x,y}]);return;}
  if(tool!=="select")return;
  const rect=e.currentTarget.getBoundingClientRect();const sx=canvasW/rect.width;const x=(e.clientX-rect.left)*sx;const y=(e.clientY-rect.top)*sx;
  let clicked=null;
  for(let i=els.length-1;i>=0;i--){const el=els[i];if(x>=el.x&&x<=el.x+el.w&&y>=el.y&&y<=el.y+el.h){clicked=el;break;}}
  if(clicked){setSelId(clicked.id);setDrag({id:clicked.id,ox:x-clicked.x,oy:y-clicked.y});}
  else{setSelId(null);}
};

const onCanvasMouseMove=(e)=>{
  if(drawing&&tool==="draw"){const rect=e.currentTarget.getBoundingClientRect();const sx=canvasW/rect.width;const x=(e.clientX-rect.left)*sx;const y=(e.clientY-rect.top)*sx;setDrawPts(p=>[...p,{x,y}]);return;}
  if(resize){const rect=e.currentTarget.getBoundingClientRect();const sx=canvasW/rect.width;const x=(e.clientX-rect.left)*sx;const y=(e.clientY-rect.top)*sx;const el=els.find(e=>e.id===resize.id);if(!el)return;let nw=x-el.x;let nh=y-el.y;if(nw<20)nw=20;if(nh<20)nh=20;upd(resize.id,{w:Math.round(nw),h:Math.round(nh)});return;}
  if(!drag)return;
  const rect=e.currentTarget.getBoundingClientRect();const sx=canvasW/rect.width;const x=(e.clientX-rect.left)*sx;const y=(e.clientY-rect.top)*sx;
  upd(drag.id,{x:Math.round(x-drag.ox),y:Math.round(y-drag.oy)});
};

const onCanvasMouseUp=()=>{
  if(drawing&&drawPts.length>1){
    const path=drawPts.map((p,i)=>i===0?("M"+p.x+" "+p.y):("L"+p.x+" "+p.y)).join(" ");
    const ne={id:uid(),type:"path",x:0,y:0,w:canvasW,h:canvasH,path,color:drawColor,strokeW:drawSize,opacity:1,rot:0};
    setEls(p=>[...p,ne]);
  }
  setDrawing(false);setDrawPts([]);setDrag(null);setResize(null);
};

const onFileChange=(e)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=(ev)=>addImage(ev.target.result);reader.readAsDataURL(file);e.target.value="";};

const downloadCanvas=()=>{
  const canvas=document.createElement("canvas");canvas.width=canvasW;canvas.height=canvasH;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=canvasBg;ctx.fillRect(0,0,canvasW,canvasH);
  const promises=els.map(el=>{
    return new Promise(resolve=>{
      if(el.type==="rect"){ctx.globalAlpha=el.opacity;ctx.fillStyle=el.color;if(el.borderR>0){const r=el.borderR;ctx.beginPath();ctx.moveTo(el.x+r,el.y);ctx.lineTo(el.x+el.w-r,el.y);ctx.quadraticCurveTo(el.x+el.w,el.y,el.x+el.w,el.y+r);ctx.lineTo(el.x+el.w,el.y+el.h-r);ctx.quadraticCurveTo(el.x+el.w,el.y+el.h,el.x+el.w-r,el.y+el.h);ctx.lineTo(el.x+r,el.y+el.h);ctx.quadraticCurveTo(el.x,el.y+el.h,el.x,el.y+el.h-r);ctx.lineTo(el.x,el.y+r);ctx.quadraticCurveTo(el.x,el.y,el.x+r,el.y);ctx.closePath();ctx.fill();}else{ctx.fillRect(el.x,el.y,el.w,el.h);}ctx.globalAlpha=1;resolve();}
      else if(el.type==="circle"){ctx.globalAlpha=el.opacity;ctx.fillStyle=el.color;ctx.beginPath();ctx.ellipse(el.x+el.w/2,el.y+el.h/2,el.w/2,el.h/2,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;resolve();}
      else if(el.type==="text"){ctx.globalAlpha=el.opacity;ctx.fillStyle=el.color;ctx.font=(el.bold?"bold ":"")+(el.italic?"italic ":"")+el.size+"px "+el.font;if(el.shadow&&el.shadow!=="none"){const parts=el.shadow.match(/([\d.-]+)/g);if(parts&&parts.length>=3){ctx.shadowOffsetX=parseFloat(parts[0]);ctx.shadowOffsetY=parseFloat(parts[1]);ctx.shadowBlur=parseFloat(parts[2]);ctx.shadowColor=el.shadow.match(/rgba?\([^)]+\)/)?.[0]||"rgba(0,0,0,.5)";}}ctx.fillText(el.text,el.x+8,el.y+el.size);ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.shadowBlur=0;ctx.globalAlpha=1;resolve();}
      else if(el.type==="path"){ctx.globalAlpha=el.opacity;ctx.strokeStyle=el.color;ctx.lineWidth=el.strokeW;ctx.lineCap="round";ctx.lineJoin="round";const p2d=new Path2D(el.path);ctx.stroke(p2d);ctx.globalAlpha=1;resolve();}
      else if(el.type==="image"){const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{ctx.globalAlpha=el.opacity;ctx.drawImage(img,el.x,el.y,el.w,el.h);ctx.globalAlpha=1;resolve();};img.onerror=()=>resolve();img.src=el.src;}
      else resolve();
    });
  });
  Promise.all(promises).then(()=>{const link=document.createElement("a");link.download="thumbnail.png";link.href=canvas.toDataURL("image/png");link.click();});
};

const goToAI=()=>{setStep("ai");};
const goToEditor=()=>{setStep("editor");};
const generateAI=()=>{if(!aiPrompt.trim())return;setAiLoading(true);setTimeout(()=>{setAiResults([{id:uid(),label:"Вариант 1"},{id:uid(),label:"Вариант 2"},{id:uid(),label:"Вариант 3"},{id:uid(),label:"Вариант 4"}]);setAiLoading(false);},2500);};

const TOOLS=[
  {id:"select",icon:"🖱",label:"Выбрать"},
  {id:"text",icon:"T",label:"Текст",action:addText},
  {id:"rect",icon:"□",label:"Прямоуг."},
  {id:"circle",icon:"○",label:"Круг"},
  {id:"image",icon:"🖼",label:"Картинка"},
  {id:"draw",icon:"✎",label:"Рисовать"},
  {id:"bg",icon:"◐",label:"Фон"},
];

if(step==="ai") return <div>
  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
    <button onClick={goToEditor} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+C.border,background:"transparent",color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>← Назад к редактору</button>
    <div><h2 style={{fontSize:22,fontWeight:700,margin:0}}>✨ AI-генерация обложки</h2><p style={{color:C.sub,fontSize:12,margin:0}}>Сгенерируй обложку по референсу из редактора</p></div>
  </div>
  <div style={{display:"flex",gap:20}}>
    <div style={{flex:1}}>
      <div style={{fontSize:11,fontWeight:600,color:C.sub,marginBottom:6}}>Твой референс из редактора</div>
      <div style={{width:"100%",aspectRatio:"16/9",background:canvasBg,borderRadius:12,border:"1px solid "+C.border,position:"relative",overflow:"hidden",marginBottom:16}}>
        {els.map(el=>{
          if(el.type==="text")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",fontSize:el.size*(1/2)+"px",fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",fontFamily:el.font,color:el.color,textShadow:el.shadow!=="none"?el.shadow:"none",opacity:el.opacity,background:el.bg,borderRadius:el.borderR,padding:"2px 4px",whiteSpace:"nowrap"}}>{el.text}</div>;
          if(el.type==="rect")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",background:el.color,opacity:el.opacity,borderRadius:el.borderR}}/>;
          if(el.type==="circle")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",background:el.color,opacity:el.opacity,borderRadius:"50%"}}/>;
          if(el.type==="image")return <img key={el.id} src={el.src} alt="Canvas image" decoding="async" style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",opacity:el.opacity,borderRadius:el.borderR,objectFit:"cover"}}/>;
          if(el.type==="path")return <svg key={el.id} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox={"0 0 "+canvasW+" "+canvasH}><path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity}/></svg>;
          return null;
        })}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} placeholder="Яркая обложка в стиле MrBeast, кинематографично..." style={{flex:1,padding:"10px 14px",background:C.card,border:"1px solid "+C.border,borderRadius:8,color:C.text,fontSize:13,fontFamily:"inherit"}}/>
        <button onClick={generateAI} disabled={aiLoading} style={{padding:"10px 24px",borderRadius:8,border:"none",background:aiLoading?"transparent":"linear-gradient(135deg,"+C.accent+","+C.pink+")",color:aiLoading?C.sub:"#fff",fontSize:13,fontWeight:700,cursor:aiLoading?"wait":"pointer",fontFamily:"inherit",border:aiLoading?"1px solid "+C.border:"none"}}>{aiLoading?"Генерация...":"✨ Создать"}</button>
      </div>
      {aiResults.length>0&&<div>
        <div style={{fontSize:11,fontWeight:600,color:C.sub,marginBottom:8}}>Результаты</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {aiResults.map(r=><div key={r.id} style={{width:"calc(50% - 5px)",aspectRatio:"16/9",background:C.card,borderRadius:10,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,"+C.accent+"08,"+C.purple+"08)"}}/>
            <div style={{textAlign:"center",zIndex:1}}><div style={{fontSize:24,opacity:.3,marginBottom:4}}>✨</div><div style={{fontSize:11,color:C.sub}}>{r.label}</div></div>
            <button style={{position:"absolute",bottom:8,right:8,padding:"4px 10px",borderRadius:6,border:"none",background:C.accent,color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Выбрать</button>
          </div>)}
        </div>
      </div>}
    </div>
    <div style={{width:240}}>
      <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Настройки AI</div>
        <div style={{marginBottom:10}}><div style={{fontSize:10,color:C.sub,marginBottom:4}}>Стиль</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {["Реализм","Аниме","Кино","Минимализм","3D","Поп-арт"].map(s=><button key={s} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+C.border,background:C.surface,color:C.sub,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}
          </div>
        </div>
        <div style={{marginBottom:10}}><div style={{fontSize:10,color:C.sub,marginBottom:4}}>Кол-во вариантов</div>
          <div style={{display:"flex",gap:4}}>
            {[2,4,6].map(n=><button key={n} style={{flex:1,padding:"4px",borderRadius:6,border:"1px solid "+C.border,background:n===4?C.accentDim:C.surface,color:n===4?C.accent:C.sub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>)}
          </div>
        </div>
        <div><div style={{fontSize:10,color:C.sub,marginBottom:4}}>Сохранять текст</div>
          <div style={{display:"flex",gap:4}}>
            {["Да","Нет"].map((l,i)=><button key={l} style={{flex:1,padding:"4px",borderRadius:6,border:"1px solid "+C.border,background:i===0?C.accentDim:C.surface,color:i===0?C.accent:C.sub,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>)}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>;

return <div>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
    <div><h2 style={{fontSize:22,fontWeight:700,margin:"0 0 4px"}}>Редактор обложек</h2><p style={{color:C.sub,fontSize:13,margin:0}}>Создай обложку как в Canva или перейди к AI-генерации</p></div>
    <div style={{display:"flex",gap:8}}>
      <button onClick={downloadCanvas} style={{padding:"8px 16px",borderRadius:8,border:"1px solid "+C.border,background:C.card,color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>⬇ Скачать PNG</button>
      <button onClick={goToAI} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,"+C.accent+","+C.pink+")",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px "+C.accent+"33"}}>✨ AI-генерация →</button>
    </div>
  </div>

  <div style={{display:"flex",gap:12}}>
    {/* LEFT TOOLBAR */}
    <div style={{width:52,background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"8px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
      <input type="file" accept="image/*" style={{display:"none"}} id="thumb-file-input" onChange={onFileChange}/>
      {TOOLS.map(t=>{
        const active=tool===t.id;
        const onClick=()=>{
          if(t.id==="text"){addText();return;}
          if(t.id==="rect"){addRect();return;}
          if(t.id==="circle"){addCircle();return;}
          if(t.id==="image"){document.getElementById("thumb-file-input").click();return;}
          setTool(t.id);
        };
        return <div key={t.id} onClick={onClick} title={t.label} style={{width:38,height:38,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,fontSize:14,color:active?C.accent:C.sub,background:active?C.accentDim:"transparent",cursor:"pointer",transition:"all .15s"}}>
          <span style={{fontSize:t.id==="text"?16:14}}>{t.icon}</span>
          <span style={{fontSize:7,fontWeight:600}}>{t.label}</span>
        </div>;
      })}
      {tool==="draw"&&<div style={{padding:"6px 4px",borderTop:"1px solid "+C.border,marginTop:4,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <input type="color" value={drawColor} onChange={e=>setDrawColor(e.target.value)} style={{width:28,height:28,border:"none",background:"none",cursor:"pointer",padding:0}}/>
        <input type="range" min={1} max={12} value={drawSize} onChange={e=>setDrawSize(+e.target.value)} style={{width:36,accentColor:C.accent}} title={"Толщина: "+drawSize}/>
      </div>}
      {tool==="bg"&&<div style={{padding:"6px 4px",borderTop:"1px solid "+C.border,marginTop:4,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
        <input type="color" value={canvasBg} onChange={e=>setCanvasBg(e.target.value)} style={{width:28,height:28,border:"none",background:"none",cursor:"pointer",padding:0}}/>
        <span style={{fontSize:7,color:C.sub}}>Фон</span>
      </div>}
    </div>

    {/* CANVAS */}
    <div style={{flex:1,position:"relative"}}>
      <div style={{position:"absolute",top:8,right:8,background:C.overlay,borderRadius:6,padding:"3px 8px",fontSize:10,color:C.sub,zIndex:10,pointerEvents:"none"}}>1280 × 720</div>
      <div
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        style={{width:"100%",aspectRatio:"16/9",background:canvasBg,borderRadius:12,border:"1px solid "+C.border,position:"relative",overflow:"hidden",cursor:tool==="draw"?"crosshair":tool==="select"?"default":"crosshair",userSelect:"none"}}
      >
        {els.map(el=>{
          const isSel=el.id===selId;

          if(el.type==="text")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",minHeight:el.h/canvasH*100+"%",fontSize:"clamp(8px,"+el.size/canvasW*100+"vw,"+(el.size*0.8)+"px)",fontWeight:el.bold?"bold":"normal",fontStyle:el.italic?"italic":"normal",fontFamily:el.font,color:el.color,textShadow:el.shadow!=="none"?el.shadow:"none",opacity:el.opacity,background:el.bg,borderRadius:el.borderR,padding:"4px 8px",whiteSpace:"pre-wrap",wordBreak:"break-word",border:isSel?"2px dashed "+C.accent+"88":"2px solid transparent",cursor:"move",boxSizing:"border-box",outline:"none"}} contentEditable={isSel} suppressContentEditableWarning onBlur={e=>upd(el.id,{text:e.target.innerText})} onMouseDown={e=>{if(!isSel){e.stopPropagation();setSelId(el.id);}}}>{el.text}{isSel&&<div onMouseDown={e=>{e.stopPropagation();e.preventDefault();const rect=e.currentTarget.closest("[style]").parentElement.getBoundingClientRect();setResize({id:el.id});}} style={{position:"absolute",bottom:-4,right:-4,width:10,height:10,background:C.accent,borderRadius:2,cursor:"nwse-resize"}}/>}</div>;

          if(el.type==="rect")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",background:el.color,opacity:el.opacity,borderRadius:el.borderR,border:isSel?"2px dashed "+C.accent+"88":"none",cursor:"move",boxSizing:"border-box"}} onMouseDown={e=>{e.stopPropagation();setSelId(el.id);const rect=e.currentTarget.parentElement.getBoundingClientRect();const sx=canvasW/rect.width;setDrag({id:el.id,ox:(e.clientX-rect.left)*sx-el.x,oy:(e.clientY-rect.top)*sx-el.y});}}>{isSel&&<div onMouseDown={e=>{e.stopPropagation();e.preventDefault();setResize({id:el.id});}} style={{position:"absolute",bottom:-4,right:-4,width:10,height:10,background:C.accent,borderRadius:2,cursor:"nwse-resize"}}/>}</div>;

          if(el.type==="circle")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",background:el.color,opacity:el.opacity,borderRadius:"50%",border:isSel?"2px dashed "+C.accent+"88":"none",cursor:"move",boxSizing:"border-box"}} onMouseDown={e=>{e.stopPropagation();setSelId(el.id);const rect=e.currentTarget.parentElement.getBoundingClientRect();const sx=canvasW/rect.width;setDrag({id:el.id,ox:(e.clientX-rect.left)*sx-el.x,oy:(e.clientY-rect.top)*sx-el.y});}}>{isSel&&<div onMouseDown={e=>{e.stopPropagation();e.preventDefault();setResize({id:el.id});}} style={{position:"absolute",bottom:-4,right:-4,width:10,height:10,background:C.accent,borderRadius:2,cursor:"nwse-resize"}}/>}</div>;

          if(el.type==="image")return <div key={el.id} style={{position:"absolute",left:el.x/canvasW*100+"%",top:el.y/canvasH*100+"%",width:el.w/canvasW*100+"%",height:el.h/canvasH*100+"%",border:isSel?"2px dashed "+C.accent+"88":"none",cursor:"move",boxSizing:"border-box"}} onMouseDown={e=>{e.stopPropagation();setSelId(el.id);const rect=e.currentTarget.parentElement.getBoundingClientRect();const sx=canvasW/rect.width;setDrag({id:el.id,ox:(e.clientX-rect.left)*sx-el.x,oy:(e.clientY-rect.top)*sx-el.y});}}><img src={el.src} alt="Canvas image" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover",opacity:el.opacity,borderRadius:el.borderR,pointerEvents:"none"}}/>{isSel&&<div onMouseDown={e=>{e.stopPropagation();e.preventDefault();setResize({id:el.id});}} style={{position:"absolute",bottom:-4,right:-4,width:10,height:10,background:C.accent,borderRadius:2,cursor:"nwse-resize"}}/>}</div>;

          if(el.type==="path")return <svg key={el.id} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox={"0 0 "+canvasW+" "+canvasH}><path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity}/></svg>;
          return null;
        })}
        {drawing&&drawPts.length>1&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox={"0 0 "+canvasW+" "+canvasH}><path d={drawPts.map((p,i)=>i===0?("M"+p.x+" "+p.y):("L"+p.x+" "+p.y)).join(" ")} fill="none" stroke={drawColor} strokeWidth={drawSize} strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
    </div>

    {/* RIGHT PANEL - PROPERTIES */}
    <div style={{width:200,background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:12,flexShrink:0,overflow:"auto",maxHeight:480}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Свойства</div>
      {!sel&&<div style={{color:C.dim,fontSize:11,textAlign:"center",padding:"20px 0"}}>Выбери элемент<br/>на холсте</div>}
      {sel&&sel.type==="text"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Текст</div><input value={sel.text} onChange={e=>upd(sel.id,{text:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Шрифт</div><select value={sel.font} onChange={e=>upd(sel.id,{font:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",boxSizing:"border-box"}}>
          <option value="Instrument Sans">Instrument Sans</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Impact">Impact</option>
          <option value="Courier New">Courier New</option>
          <option value="Verdana">Verdana</option>
        </select></div>
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Размер</div><input type="number" value={sel.size} onChange={e=>upd(sel.id,{size:+e.target.value})} min={8} max={200} style={{width:"100%",padding:"6px 8px",background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
          <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Цвет</div><input type="color" value={sel.color} onChange={e=>upd(sel.id,{color:e.target.value})} style={{width:32,height:30,border:"1px solid "+C.border,borderRadius:6,padding:1,cursor:"pointer",background:C.surface}}/></div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>upd(sel.id,{bold:!sel.bold})} style={{flex:1,padding:"5px",borderRadius:5,border:"1px solid "+(sel.bold?C.accent+"55":C.border),background:sel.bold?C.accentDim:"transparent",color:sel.bold?C.accent:C.sub,fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"serif"}}>B</button>
          <button onClick={()=>upd(sel.id,{italic:!sel.italic})} style={{flex:1,padding:"5px",borderRadius:5,border:"1px solid "+(sel.italic?C.accent+"55":C.border),background:sel.italic?C.accentDim:"transparent",color:sel.italic?C.accent:C.sub,fontSize:11,fontStyle:"italic",cursor:"pointer",fontFamily:"serif"}}>I</button>
        </div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Тень</div><select value={sel.shadow} onChange={e=>upd(sel.id,{shadow:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.surface,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontSize:11,fontFamily:"inherit",boxSizing:"border-box"}}>
          <option value="none">Нет</option>
          <option value="0 2px 8px rgba(0,0,0,.5)">Лёгкая</option>
          <option value="0 2px 12px rgba(0,0,0,.6)">Средняя</option>
          <option value="0 4px 20px rgba(0,0,0,.8)">Сильная</option>
          <option value="0 2px 16px rgba(255,45,85,.4)">Красная</option>
          <option value="0 2px 16px rgba(58,123,253,.4)">Синяя</option>
        </select></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Прозрачность</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={1} step={0.05} value={sel.opacity} onChange={e=>upd(sel.id,{opacity:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:24,textAlign:"right"}}>{Math.round(sel.opacity*100)}%</span></div></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Фон текста</div><div style={{display:"flex",gap:4}}>
          {["transparent","rgba(0,0,0,.5)","rgba(255,45,85,.15)","rgba(58,123,253,.15)","rgba(255,255,255,.15)"].map(bg=><div key={bg} onClick={()=>upd(sel.id,{bg})} style={{width:22,height:22,borderRadius:4,background:bg==="transparent"?"repeating-conic-gradient(#888 0% 25%, #555 0% 50%) 0 0 / 8px 8px":bg,border:"2px solid "+(sel.bg===bg?C.accent:C.border),cursor:"pointer"}}/>)}
        </div></div>
        <div style={{display:"flex",gap:4,borderTop:"1px solid "+C.border,paddingTop:6}}>
          <button onClick={()=>bringFront(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▲ Вперёд</button>
          <button onClick={()=>sendBack(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▼ Назад</button>
        </div>
        <button onClick={()=>del(sel.id)} style={{width:"100%",padding:"5px",borderRadius:5,border:"1px solid "+C.accent+"33",background:"transparent",color:C.accent,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:.6}}>✕ Удалить</button>
      </div>}

      {sel&&(sel.type==="rect"||sel.type==="circle")&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Цвет</div><input type="color" value={sel.color} onChange={e=>upd(sel.id,{color:e.target.value})} style={{width:"100%",height:32,border:"1px solid "+C.border,borderRadius:6,padding:2,cursor:"pointer",background:C.surface}}/></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Прозрачность</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={1} step={0.05} value={sel.opacity} onChange={e=>upd(sel.id,{opacity:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:24,textAlign:"right"}}>{Math.round(sel.opacity*100)}%</span></div></div>
        {sel.type==="rect"&&<div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Скругление</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={60} value={sel.borderR} onChange={e=>upd(sel.id,{borderR:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:20,textAlign:"right"}}>{sel.borderR}</span></div></div>}
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Ширина</div><input type="number" value={sel.w} onChange={e=>upd(sel.id,{w:+e.target.value})} style={{width:"100%",padding:"5px 7px",background:C.surface,border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:10,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
          <div style={{flex:1}}><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Высота</div><input type="number" value={sel.h} onChange={e=>upd(sel.id,{h:+e.target.value})} style={{width:"100%",padding:"5px 7px",background:C.surface,border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:10,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
        </div>
        <div style={{display:"flex",gap:4,borderTop:"1px solid "+C.border,paddingTop:6}}>
          <button onClick={()=>bringFront(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▲ Вперёд</button>
          <button onClick={()=>sendBack(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▼ Назад</button>
        </div>
        <button onClick={()=>del(sel.id)} style={{width:"100%",padding:"5px",borderRadius:5,border:"1px solid "+C.accent+"33",background:"transparent",color:C.accent,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:.6}}>✕ Удалить</button>
      </div>}

      {sel&&sel.type==="image"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{width:"100%",aspectRatio:"16/9",background:C.surface,borderRadius:6,overflow:"hidden",border:"1px solid "+C.border}}><img src={sel.src} alt="Selected image preview" decoding="async" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Прозрачность</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={1} step={0.05} value={sel.opacity} onChange={e=>upd(sel.id,{opacity:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:24,textAlign:"right"}}>{Math.round(sel.opacity*100)}%</span></div></div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Скругление</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={60} value={sel.borderR} onChange={e=>upd(sel.id,{borderR:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:20,textAlign:"right"}}>{sel.borderR}</span></div></div>
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Ширина</div><input type="number" value={sel.w} onChange={e=>upd(sel.id,{w:+e.target.value})} style={{width:"100%",padding:"5px 7px",background:C.surface,border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:10,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
          <div style={{flex:1}}><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Высота</div><input type="number" value={sel.h} onChange={e=>upd(sel.id,{h:+e.target.value})} style={{width:"100%",padding:"5px 7px",background:C.surface,border:"1px solid "+C.border,borderRadius:5,color:C.text,fontSize:10,fontFamily:"inherit",boxSizing:"border-box"}}/></div>
        </div>
        <div style={{display:"flex",gap:4,borderTop:"1px solid "+C.border,paddingTop:6}}>
          <button onClick={()=>bringFront(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▲ Вперёд</button>
          <button onClick={()=>sendBack(sel.id)} style={{flex:1,padding:"4px",borderRadius:5,border:"1px solid "+C.border,background:"transparent",color:C.sub,fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>▼ Назад</button>
        </div>
        <button onClick={()=>del(sel.id)} style={{width:"100%",padding:"5px",borderRadius:5,border:"1px solid "+C.accent+"33",background:"transparent",color:C.accent,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:.6}}>✕ Удалить</button>
      </div>}

      {sel&&sel.type==="path"&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{fontSize:10,color:C.sub}}>Нарисованный элемент</div>
        <div><div style={{fontSize:9,color:C.sub,marginBottom:3,fontWeight:600}}>Прозрачность</div><div style={{display:"flex",alignItems:"center",gap:4}}><input type="range" min={0} max={1} step={0.05} value={sel.opacity} onChange={e=>upd(sel.id,{opacity:+e.target.value})} style={{flex:1,accentColor:C.accent}}/><span style={{fontSize:9,color:C.dim,minWidth:24,textAlign:"right"}}>{Math.round(sel.opacity*100)}%</span></div></div>
        <button onClick={()=>del(sel.id)} style={{width:"100%",padding:"5px",borderRadius:5,border:"1px solid "+C.accent+"33",background:"transparent",color:C.accent,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:.6}}>✕ Удалить</button>
      </div>}

      {/* LAYERS */}
      <div style={{borderTop:"1px solid "+C.border,marginTop:10,paddingTop:8}}>
        <div style={{fontSize:10,fontWeight:600,color:C.sub,marginBottom:6}}>Слои ({els.length})</div>
        {[...els].reverse().map(el=><div key={el.id} onClick={()=>setSelId(el.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 6px",borderRadius:5,marginBottom:2,background:el.id===selId?C.accentDim:C.surface,border:"1px solid "+(el.id===selId?C.accent+"44":C.border),cursor:"pointer"}}>
          <span style={{fontSize:10,width:16,textAlign:"center"}}>{el.type==="text"?"T":el.type==="rect"?"□":el.type==="circle"?"○":el.type==="image"?"🖼":el.type==="path"?"✎":"?"}</span>
          <span style={{flex:1,fontSize:9,color:el.id===selId?C.text:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{el.type==="text"?el.text.slice(0,20):el.type==="image"?"Картинка":el.type==="rect"?"Прямоуг.":el.type==="circle"?"Круг":"Рисунок"}</span>
          <button onClick={e=>{e.stopPropagation();del(el.id);}} style={{background:"none",border:"none",color:C.dim,fontSize:8,cursor:"pointer",padding:"0 2px"}}>✕</button>
        </div>)}
      </div>
    </div>
  </div>
</div>;
}

function PreviewSave() {
  const C = useT();
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
        Финальный превью
      </h2>
      <p style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>
        Посмотри как всё выглядит и сохрани
      </p>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                aspectRatio: '16/9',
                background: C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 48, opacity: 0.2 }}>▶</div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  background: C.overlay,
                  borderRadius: 5,
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                0:29
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Как ИИ изменит YouTube в 2026 году
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>
                @creative_studio · 0 просмотров · только что
              </div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                В этом видео я расскажу о 5 ключевых изменениях, которые ИИ
                принесёт в мир YouTube-контента.
              </div>
            </div>
          </div>
        </div>
        <div style={{ width: 260 }}>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Чеклист
            </div>
            {[
              { l: 'Видео готово', d: true },
              { l: 'Обложка выбрана', d: true },
              { l: 'Название', d: true },
              { l: 'Описание', d: true },
              { l: 'Теги', d: false },
            ].map((it, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderTop: i ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `2px solid ${it.d ? C.green : C.border}`,
                    background: it.d ? `${C.green}20` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: C.green,
                  }}
                >
                  {it.d ? '✓' : ''}
                </div>
                <span style={{ fontSize: 12, color: it.d ? C.text : C.sub }}>
                  {it.l}
                </span>
              </div>
            ))}
          </div>
          <button
            style={{
              width: '100%',
              padding: '12px 0',
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: `0 4px 20px ${C.accent}33`,
              marginBottom: 8,
            }}
          >
            Сохранить в кабинет
          </button>
          <button
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'transparent',
              color: C.sub,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Опубликовать на YouTube
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ EDITOR (full) ═══ */
function EditorPage() {
  const C = useT();
  const [format, setFormat] = useState('16:9');
  const [scenes, setScenes] = useState([
    {
      id: 's1',
      label: 'Сцена 1',
      prompt: 'Алекс сидит за компьютером поздно ночью',
      duration: 8,
      status: 'ready',
      ck: 'blue',
      chars: ['c1'],
      model: 'standard',
      sf: null,
      ef: null,
      enh: true,
      snd: true,
    },
    {
      id: 's2',
      label: 'Сцена 2',
      prompt: 'Мия появляется как голограмма из экрана',
      duration: 12,
      status: 'ready',
      ck: 'purple',
      chars: ['c1', 'c2'],
      model: 'pro',
      sf: null,
      ef: null,
      enh: true,
      snd: true,
    },
    {
      id: 's3',
      label: 'Сцена 3',
      prompt: 'Камера отъезжает — весь город будущего',
      duration: 10,
      status: 'generating',
      ck: 'green',
      chars: [],
      model: 'cinematic',
      sf: null,
      ef: null,
      enh: false,
      snd: true,
    },
  ]);
  const [chars, setChars] = useState([
    {
      id: 'c1',
      name: 'Алекс',
      role: 'Главный герой',
      avatar: '👨‍💻',
      ck: 'blue',
      desc: 'Молодой разработчик, тёмные волосы, очки',
    },
    {
      id: 'c2',
      name: 'Мия',
      role: 'AI-ассистент',
      avatar: '🤖',
      ck: 'purple',
      desc: 'Голограмма с голубым свечением',
    },
  ]);
  const [selId, setSelId] = useState('s1');
  const [rpanel, setRpanel] = useState('scene');
  const [editCh, setEditCh] = useState(null);
  const [chForm, setChForm] = useState({
    name: '',
    role: '',
    avatar: '👨‍💻',
    ck: 'blue',
    desc: '',
  });
  const [genIn, setGenIn] = useState('');
  const [chPick, setChPick] = useState(false);
  const [modPick, setModPick] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOv, setDragOv] = useState(null);

  const sel = scenes.find((s) => s.id === selId);
  const totalDur = scenes.reduce((a, s) => a + s.duration, 0);
  const gc = (k) => C[k] || C.accent;
  const scChars = sel ? chars.filter((c) => sel.chars.includes(c.id)) : [];
  const selMod = sel
    ? MODELS.find((m) => m.id === sel.model) || MODELS[1]
    : MODELS[1];

  const upd = (id, p) =>
    setScenes((v) => v.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addSc = (aid) => {
    const ns = {
      id: uid(),
      label: `Сцена ${scenes.length + 1}`,
      prompt: '',
      duration: 5,
      status: 'empty',
      ck: PK[scenes.length % PK.length],
      chars: [],
      model: 'standard',
      sf: null,
      ef: null,
      enh: true,
      snd: true,
    };
    setScenes((p) => {
      if (!aid) return [...p, ns];
      const i = p.findIndex((s) => s.id === aid);
      const n = [...p];
      n.splice(i + 1, 0, ns);
      return n;
    });
    setSelId(ns.id);
  };
  const delSc = (id) => {
    setScenes((p) => {
      const n = p.filter((s) => s.id !== id);
      if (selId === id) setSelId(n[0]?.id || null);
      return n;
    });
  };
  const dupSc = (id) => {
    setScenes((p) => {
      const i = p.findIndex((s) => s.id === id);
      const c = {
        ...p[i],
        id: uid(),
        label: p[i].label + ' (копия)',
        status: 'editing',
      };
      const n = [...p];
      n.splice(i + 1, 0, c);
      return n;
    });
  };
  const splitSc = (id) => {
    setScenes((p) => {
      const i = p.findIndex((s) => s.id === id);
      const sc = p[i];
      const h = Math.ceil(sc.duration / 2);
      const a = { ...sc, id: uid(), label: sc.label + ' — A', duration: h };
      const b = {
        ...sc,
        id: uid(),
        label: sc.label + ' — B',
        duration: sc.duration - h,
        prompt: '',
        status: 'editing',
        sf: null,
        ef: null,
      };
      const n = [...p];
      n.splice(i, 1, a, b);
      return n;
    });
  };
  const regenSc = (id, np) => {
    if (np) upd(id, { prompt: np });
    upd(id, { status: 'generating' });
    setTimeout(() => upd(id, { status: 'ready' }), 2000 + Math.random() * 2000);
  };
  const togCh = (sId, cId) => {
    setScenes((p) =>
      p.map((s) =>
        s.id !== sId
          ? s
          : {
              ...s,
              chars: s.chars.includes(cId)
                ? s.chars.filter((c) => c !== cId)
                : [...s.chars, cId],
            }
      )
    );
  };
  const saveCh = () => {
    if (!chForm.name.trim()) return;
    if (editCh === 'new') setChars((p) => [...p, { id: uid(), ...chForm }]);
    else
      setChars((p) =>
        p.map((c) => (c.id === editCh ? { ...c, ...chForm } : c))
      );
    setEditCh(null);
  };
  const delCh = (cid) => {
    setChars((p) => p.filter((c) => c.id !== cid));
    setScenes((p) =>
      p.map((s) => ({ ...s, chars: s.chars.filter((c) => c !== cid) }))
    );
    setEditCh(null);
  };
  const onDS = (id) => setDragId(id);
  const onDE = (id) => {
    if (dragId && id !== dragId) setDragOv(id);
  };
  const onDEnd = () => {
    if (dragId && dragOv) {
      setScenes((p) => {
        const n = [...p];
        const fi = n.findIndex((s) => s.id === dragId);
        const ti = n.findIndex((s) => s.id === dragOv);
        const [m] = n.splice(fi, 1);
        n.splice(ti, 0, m);
        return n;
      });
    }
    setDragId(null);
    setDragOv(null);
  };

  const aspect =
    format === '9:16'
      ? '9/16'
      : format === '1:1'
      ? '1/1'
      : format === '4:5'
      ? '4/5'
      : '16/9';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* LEFT */}
      <div
        style={{
          width: 268,
          borderRight: `1px solid ${C.border}`,
          background: C.surface,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '8px 10px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 2 }}>
            {['16:9', '9:16', '1:1', '4:5'].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  padding: '3px 7px',
                  borderRadius: 5,
                  border: `1px solid ${
                    format === f ? C.accent + '55' : C.border
                  }`,
                  background: format === f ? C.accentDim : 'transparent',
                  color: format === f ? C.accent : C.sub,
                  fontSize: 9,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono',monospace",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => addSc()}
            style={{
              background: C.accentDim,
              border: `1px solid ${C.accent}33`,
              color: C.accent,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            +
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 5px' }}>
          {scenes.map((sc, idx) => {
            const active = sc.id === selId;
            const col = gc(sc.ck);
            const scC = chars.filter((c) => sc.chars.includes(c.id));
            const mod = MODELS.find((m) => m.id === sc.model);
            return (
              <div
                key={sc.id}
                draggable
                onDragStart={() => onDS(sc.id)}
                onDragEnter={() => onDE(sc.id)}
                onDragEnd={onDEnd}
                onDragOver={(e) => e.preventDefault()}
                className="sc-row"
                onClick={() => {
                  setSelId(sc.id);
                  setRpanel('scene');
                  setModPick(false);
                  setChPick(false);
                }}
                style={{
                  padding: '7px 9px',
                  borderRadius: 8,
                  marginBottom: 2,
                  border: `1px solid ${
                    active
                      ? col + '44'
                      : dragOv === sc.id
                      ? C.blue + '55'
                      : C.border
                  }`,
                  background: active ? col + '08' : C.card,
                  cursor: 'grab',
                  opacity: dragId === sc.id ? 0.4 : 1,
                  position: 'relative',
                  transition: 'all .12s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    bottom: 4,
                    width: 2.5,
                    borderRadius: 3,
                    background: col,
                    opacity: active ? 1 : 0.2,
                  }}
                />
                <div style={{ paddingLeft: 6 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        color: C.dim,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        flex: 1,
                        color: active ? C.text : C.sub,
                      }}
                    >
                      {sc.label}
                    </span>
                    <StatusDot status={sc.status} />
                  </div>
                  {sc.prompt && (
                    <div
                      style={{
                        fontSize: 9,
                        color: C.dim,
                        lineHeight: 1.3,
                        marginBottom: 3,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {sc.prompt}
                    </div>
                  )}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: col,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {fmtTime(sc.duration)}
                    </span>
                    {mod && (
                      <span
                        style={{
                          fontSize: 7,
                          color: C.dim,
                          background: C.surface,
                          padding: '1px 4px',
                          borderRadius: 3,
                        }}
                      >
                        {mod.icon}
                      </span>
                    )}
                    {scC.length > 0 && (
                      <div style={{ display: 'flex', gap: 1, marginLeft: 2 }}>
                        {scC.map((ch) => (
                          <span
                            key={ch.id}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              background: `${gc(ch.ck)}20`,
                              border: `1px solid ${gc(ch.ck)}33`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 7,
                            }}
                          >
                            {ch.avatar}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        regenSc(sc.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.sub,
                        fontSize: 10,
                        cursor: 'pointer',
                        padding: '1px 2px',
                      }}
                    >
                      ↻
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        splitSc(sc.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.sub,
                        fontSize: 9,
                        cursor: 'pointer',
                        padding: '1px 2px',
                      }}
                    >
                      ✂
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        delSc(sc.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.dim,
                        fontSize: 9,
                        cursor: 'pointer',
                        padding: '1px 2px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            padding: '6px 8px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            gap: 4,
          }}
        >
          <input
            value={genIn}
            onChange={(e) => setGenIn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && genIn.trim()) {
                const ns = {
                  id: uid(),
                  label: `Сцена ${scenes.length + 1}`,
                  prompt: genIn.trim(),
                  duration: 5,
                  status: 'generating',
                  ck: PK[scenes.length % PK.length],
                  chars: [],
                  model: 'standard',
                  sf: null,
                  ef: null,
                  enh: true,
                  snd: true,
                };
                setScenes((p) => [...p, ns]);
                setSelId(ns.id);
                setGenIn('');
                setTimeout(() => upd(ns.id, { status: 'ready' }), 2500);
              }
            }}
            placeholder="Промпт → ✦"
            style={{
              flex: 1,
              padding: '5px 8px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              color: C.text,
              fontSize: 10,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => {
              if (genIn.trim()) {
                const ns = {
                  id: uid(),
                  label: `Сцена ${scenes.length + 1}`,
                  prompt: genIn.trim(),
                  duration: 5,
                  status: 'generating',
                  ck: PK[scenes.length % PK.length],
                  chars: [],
                  model: 'standard',
                  sf: null,
                  ef: null,
                  enh: true,
                  snd: true,
                };
                setScenes((p) => [...p, ns]);
                setSelId(ns.id);
                setGenIn('');
                setTimeout(() => upd(ns.id, { status: 'ready' }), 2500);
              }
            }}
            style={{
              padding: '0 9px',
              borderRadius: 5,
              border: 'none',
              background: C.accent,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✦
          </button>
        </div>
      </div>

      {/* CENTER */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
          }}
        >
          {sel ? (
            (() => {
              const col = gc(sel.ck);
              return (
                <div
                  style={{
                    width: format === '9:16' ? 'auto' : '100%',
                    height: format === '9:16' ? '100%' : 'auto',
                    aspectRatio: aspect,
                    maxWidth:
                      format === '9:16'
                        ? 190
                        : format === '1:1'
                        ? 280
                        : format === '4:5'
                        ? 245
                        : 500,
                    maxHeight:
                      format === '9:16'
                        ? 340
                        : format === '1:1'
                        ? 280
                        : format === '4:5'
                        ? 306
                        : 282,
                    background: `radial-gradient(ellipse at 30% 40%,${col}08,${C.surface})`,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all .3s ease',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      right: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: col,
                          background: `${col}18`,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {sel.label}
                      </span>
                      <span
                        style={{
                          fontSize: 7,
                          color: C.sub,
                          background: C.overlay,
                          padding: '1px 4px',
                          borderRadius: 3,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {selMod.icon} {selMod.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 8,
                        color: C.sub,
                        background: C.overlay,
                        borderRadius: 4,
                        padding: '2px 4px',
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {fmtTime(sel.duration)}
                    </span>
                  </div>
                  {scChars.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        display: 'flex',
                        gap: 2,
                      }}
                    >
                      {scChars.map((ch) => (
                        <div
                          key={ch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            background: C.overlayLight,
                            borderRadius: 4,
                            padding: '2px 5px 2px 2px',
                            border: `1px solid ${gc(ch.ck)}33`,
                          }}
                        >
                          <span style={{ fontSize: 10 }}>{ch.avatar}</span>
                          <span
                            style={{
                              fontSize: 7,
                              fontWeight: 600,
                              color: gc(ch.ck),
                            }}
                          >
                            {ch.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sel.status === 'generating' ? (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        className="gen-shimmer"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          margin: '0 auto 8px',
                        }}
                      />
                      <div style={{ fontSize: 11, fontWeight: 600 }}>
                        Генерация…
                      </div>
                    </div>
                  ) : sel.status === 'error' ? (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, color: C.accent }}>⚠</div>
                    </div>
                  ) : sel.status === 'empty' ? (
                    <div style={{ color: C.dim, fontSize: 10 }}>
                      ✦ Добавь промпт
                    </div>
                  ) : (
                    <div style={{ fontSize: 28, opacity: 0.12 }}>▶</div>
                  )}
                </div>
              );
            })()
          ) : (
            <div style={{ color: C.dim, fontSize: 12 }}>Выбери сцену</div>
          )}
        </div>
        <div
          style={{
            height: 44,
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            overflow: 'auto',
          }}
        >
          {scenes.map((sc) => {
            const w = Math.max((sc.duration / (totalDur || 1)) * 100, 5);
            const active = sc.id === selId;
            const col = gc(sc.ck);
            return (
              <div
                key={sc.id}
                onClick={() => setSelId(sc.id)}
                style={{
                  flex: `${w} 0 0`,
                  minWidth: 30,
                  height: 28,
                  borderRadius: 5,
                  background: active ? `${col}18` : `${col}06`,
                  border: `1.5px solid ${active ? col : col + '22'}`,
                  padding: '2px 4px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {sc.status === 'generating' && (
                  <div
                    className="gen-shimmer"
                    style={{ position: 'absolute', inset: 0, opacity: 0.1 }}
                  />
                )}
                <div
                  style={{
                    fontSize: 7,
                    fontWeight: 600,
                    color: active ? col : C.dim,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sc.label}
                </div>
                <div
                  style={{
                    fontSize: 6,
                    color: C.dim,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {fmtTime(sc.duration)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
      <div
        style={{
          width: 300,
          borderLeft: `1px solid ${C.border}`,
          background: C.surface,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: 'scene', l: 'Сцена' },
            { id: 'chars', l: `Персонажи (${chars.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setRpanel(t.id);
                setModPick(false);
                setChPick(false);
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${
                  rpanel === t.id ? C.accent : 'transparent'
                }`,
                color: rpanel === t.id ? C.text : C.sub,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
          {rpanel === 'scene' &&
            sel &&
            (() => {
              const col = gc(sel.ck);
              return (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <input
                    value={sel.label}
                    onChange={(e) => upd(sel.id, { label: e.target.value })}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: C.text,
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                  />

                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        display: 'block',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      Модель
                    </label>
                    <div
                      onClick={() => setModPick(!modPick)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 7,
                        background: C.card,
                        border: `1px solid ${
                          modPick ? C.accent + '44' : C.border
                        }`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{selMod.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600 }}>
                          {selMod.name}
                        </div>
                        <div style={{ fontSize: 8, color: C.dim }}>
                          {selMod.desc}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 8,
                          color: C.sub,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                      >
                        {selMod.speed}
                      </span>
                      <span
                        style={{
                          fontSize: 8,
                          color: C.dim,
                          transform: modPick ? 'rotate(180deg)' : 'none',
                          transition: 'transform .15s',
                        }}
                      >
                        ▼
                      </span>
                    </div>
                    {modPick && (
                      <div
                        style={{
                          marginTop: 3,
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                          overflow: 'hidden',
                        }}
                      >
                        {MODELS.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              upd(sel.id, { model: m.id });
                              setModPick(false);
                            }}
                            style={{
                              padding: '6px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                              background:
                                sel.model === m.id ? `${C.accent}0c` : C.card,
                              borderBottom: `1px solid ${C.border}`,
                            }}
                          >
                            <span style={{ fontSize: 12 }}>{m.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color: sel.model === m.id ? C.accent : C.text,
                                }}
                              >
                                {m.name}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 8,
                                color: C.sub,
                                fontFamily: "'JetBrains Mono',monospace",
                              }}
                            >
                              {m.speed}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        display: 'block',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      Кадры
                    </label>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <FrameSlot
                        label="Start"
                        has={sel.sf}
                        onClick={() => upd(sel.id, { sf: !sel.sf })}
                      />
                      <FrameSlot
                        label="End"
                        has={sel.ef}
                        onClick={() => upd(sel.id, { ef: !sel.ef })}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: C.sub,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                        }}
                      >
                        Персонажи
                      </label>
                      <button
                        onClick={() => setChPick(!chPick)}
                        style={{
                          background: C.accentDim,
                          border: `1px solid ${C.accent}33`,
                          color: C.accent,
                          borderRadius: 5,
                          padding: '1px 6px',
                          fontSize: 8,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {chPick ? 'OK' : '+'}
                      </button>
                    </div>
                    {scChars.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 3,
                          marginBottom: 3,
                        }}
                      >
                        {scChars.map((ch) => (
                          <div
                            key={ch.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                              background: `${gc(ch.ck)}15`,
                              border: `1px solid ${gc(ch.ck)}33`,
                              borderRadius: 5,
                              padding: '2px 5px 2px 2px',
                              position: 'relative',
                            }}
                          >
                            <span style={{ fontSize: 12 }}>{ch.avatar}</span>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: gc(ch.ck),
                              }}
                            >
                              {ch.name}
                            </span>
                            <button
                              onClick={() => togCh(sel.id, ch.id)}
                              style={{
                                position: 'absolute',
                                top: -3,
                                right: -3,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: C.accent,
                                border: 'none',
                                color: '#fff',
                                fontSize: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {chPick && (
                      <div
                        style={{
                          padding: 4,
                          background: C.card,
                          borderRadius: 6,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {chars.map((ch) => {
                          const inS = sel.chars.includes(ch.id);
                          return (
                            <div
                              key={ch.id}
                              onClick={() => togCh(sel.id, ch.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 4px',
                                borderRadius: 4,
                                background: inS
                                  ? `${gc(ch.ck)}10`
                                  : 'transparent',
                                cursor: 'pointer',
                                marginBottom: 1,
                              }}
                            >
                              <span style={{ fontSize: 13 }}>{ch.avatar}</span>
                              <span
                                style={{
                                  flex: 1,
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              >
                                {ch.name}
                              </span>
                              <div
                                style={{
                                  width: 13,
                                  height: 13,
                                  borderRadius: 3,
                                  border: `2px solid ${
                                    inS ? gc(ch.ck) : C.border
                                  }`,
                                  background: inS ? gc(ch.ck) : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 7,
                                  color: '#fff',
                                }}
                              >
                                {inS ? '✓' : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        display: 'block',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      Промпт
                    </label>
                    <textarea
                      value={sel.prompt}
                      onChange={(e) =>
                        upd(sel.id, {
                          prompt: e.target.value,
                          status:
                            sel.status === 'empty' ? 'editing' : sel.status,
                        })
                      }
                      rows={3}
                      placeholder="Опиши сцену…"
                      style={{
                        width: '100%',
                        padding: '7px 9px',
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.text,
                        fontSize: 11,
                        lineHeight: 1.5,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: C.sub,
                        display: 'block',
                        marginBottom: 3,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      Длительность
                    </label>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <input
                        type="range"
                        min={1}
                        max={180}
                        value={sel.duration}
                        onChange={(e) =>
                          upd(sel.id, { duration: +e.target.value })
                        }
                        style={{ flex: 1, accentColor: col }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: col,
                          fontFamily: "'JetBrains Mono',monospace",
                          minWidth: 32,
                          textAlign: 'right',
                        }}
                      >
                        {fmtTime(sel.duration)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <Toggle
                      on={sel.enh}
                      onChange={() => upd(sel.id, { enh: !sel.enh })}
                      label="✦ Enhance"
                      ck="purple"
                    />
                    <Toggle
                      on={sel.snd}
                      onChange={() => upd(sel.id, { snd: !sel.snd })}
                      label="🔊 Звук"
                      ck="cyan"
                    />
                  </div>

                  <div style={{ height: 1, background: C.border }} />
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                  >
                    <button
                      onClick={() => splitSc(sel.id)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: 'transparent',
                        color: C.text,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      ✂ Разделить
                    </button>
                    <button
                      onClick={() => dupSc(sel.id)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: 'transparent',
                        color: C.text,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      ⧉ Дублировать
                    </button>
                    <button
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: 'transparent',
                        color: C.text,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      ✦ Inpaint
                    </button>
                  </div>
                  <button
                    onClick={() => delSc(sel.id)}
                    style={{
                      width: '100%',
                      padding: '5px',
                      borderRadius: 5,
                      border: `1px solid ${C.accent}22`,
                      background: 'transparent',
                      color: C.accent,
                      fontSize: 9,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      opacity: 0.4,
                    }}
                  >
                    ✕ Удалить
                  </button>
                </div>
              );
            })()}

          {rpanel === 'chars' && !editCh && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => {
                  setEditCh('new');
                  setChForm({
                    name: '',
                    role: '',
                    avatar: '👨‍💻',
                    ck: PK[chars.length % PK.length],
                    desc: '',
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: `1px dashed ${C.accent}44`,
                  background: C.accentDim,
                  color: C.accent,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginBottom: 3,
                }}
              >
                + Новый персонаж
              </button>
              {chars.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    setEditCh(ch.id);
                    setChForm({
                      name: ch.name,
                      role: ch.role,
                      avatar: ch.avatar,
                      ck: ch.ck,
                      desc: ch.desc,
                    });
                  }}
                  style={{
                    padding: 8,
                    borderRadius: 7,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      marginBottom: 3,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: `${gc(ch.ck)}20`,
                        border: `2px solid ${gc(ch.ck)}44`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                      }}
                    >
                      {ch.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>
                        {ch.name}
                      </div>
                      <div style={{ fontSize: 8, color: gc(ch.ck) }}>
                        {ch.role}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: C.sub, lineHeight: 1.3 }}>
                    {ch.desc}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rpanel === 'chars' && editCh && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  onClick={() => setEditCh(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.sub,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  ←
                </button>
                <span style={{ fontSize: 11, fontWeight: 700 }}>
                  {editCh === 'new' ? 'Новый' : 'Редактирование'}
                </span>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Аватар
                </label>
                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {AVATARS.map((a) => (
                    <div
                      key={a}
                      onClick={() => setChForm((p) => ({ ...p, avatar: a }))}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        background:
                          chForm.avatar === a ? `${gc(chForm.ck)}25` : C.card,
                        border: `1px solid ${
                          chForm.avatar === a ? gc(chForm.ck) : C.border
                        }`,
                        cursor: 'pointer',
                      }}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  📷 Фото
                </label>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: `1.5px dashed ${C.border}`,
                    background: C.card,
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 16, opacity: 0.4 }}>📷</div>
                  <div style={{ fontSize: 9, color: C.sub }}>Загрузи фото</div>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Имя
                </label>
                <input
                  value={chForm.name}
                  onChange={(e) =>
                    setChForm((p) => ({ ...p, name: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    color: C.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Роль
                </label>
                <input
                  value={chForm.role}
                  onChange={(e) =>
                    setChForm((p) => ({ ...p, role: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    color: C.text,
                    fontSize: 10,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Описание
                </label>
                <textarea
                  value={chForm.desc}
                  onChange={(e) =>
                    setChForm((p) => ({ ...p, desc: e.target.value }))
                  }
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '5px 7px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 5,
                    color: C.text,
                    fontSize: 10,
                    lineHeight: 1.4,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: C.sub,
                    display: 'block',
                    marginBottom: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Цвет
                </label>
                <div style={{ display: 'flex', gap: 3 }}>
                  {PK.map((k) => (
                    <div
                      key={k}
                      onClick={() => setChForm((p) => ({ ...p, ck: k }))}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: C[k],
                        cursor: 'pointer',
                        border:
                          chForm.ck === k
                            ? '2px solid #fff'
                            : '2px solid transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={saveCh}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: 6,
                  border: 'none',
                  background: C.accent,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {editCh === 'new' ? 'Создать' : 'Сохранить'}
              </button>
              {editCh !== 'new' && (
                <button
                  onClick={() => delCh(editCh)}
                  style={{
                    width: '100%',
                    padding: '5px',
                    borderRadius: 5,
                    border: `1px solid ${C.accent}33`,
                    background: 'transparent',
                    color: C.accent,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    opacity: 0.5,
                  }}
                >
                  Удалить
                </button>
              )}
            </div>
          )}
        </div>

        {rpanel === 'scene' && sel && (
          <div
            style={{ padding: '7px 10px', borderTop: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => regenSc(sel.id)}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                background: `linear-gradient(135deg,${C.accent},${C.pink})`,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: `0 4px 18px ${C.accent}33`,
              }}
            >
              Сгенерировать ✦
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ APP SHELL ═══ */
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const C = isDark ? dark : light;
  const [page, setPage] = useState('dashboard');

  const PAGES = {
    dashboard: Dashboard,
    editor: EditorPage,
    metadata: Metadata,
    thumbnail: ThumbnailEditor,
    preview: PreviewSave,
  };
  const PageComp = PAGES[page];

  return (
    <ThemeCtx.Provider value={C}>
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .sc-row{transition:all .12s}.sc-row:hover{background:${C.cardHover}!important}
        .gen-shimmer{background:linear-gradient(90deg,${C.card},${C.borderActive},${C.card});background-size:200% 100%;animation:shimmer 1.8s linear infinite}
        textarea:focus,input:focus{outline:none;border-color:${C.borderActive}!important}
      `}</style>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: C.bg,
          fontFamily: "'Instrument Sans',sans-serif",
          color: C.text,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* SIDEBAR */}
        <div
          style={{
            width: page === 'editor' ? 0 : 200,
            borderRight: page === 'editor' ? 'none' : `1px solid ${C.border}`,
            background: C.surface,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width .25s ease',
          }}
        >
          <div
            style={{
              padding: '14px 14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: `linear-gradient(135deg,${C.accent},${C.pink})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              Y
            </div>
            <span
              style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-.02em' }}
            >
              TubeForge
            </span>
          </div>
          <div style={{ flex: 1, padding: '0 8px' }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: page === n.id ? C.accentDim : 'transparent',
                  color: page === n.id ? C.accent : C.sub,
                  fontSize: 13,
                  fontWeight: page === n.id ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 2,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>
                  {n.icon}
                </span>
                {n.label}
              </button>
            ))}
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `linear-gradient(135deg,${C.blue},${C.purple})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              CS
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                Creative Studio
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>Pro план</div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* top bar */}
          <div
            style={{
              height: 44,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              gap: 8,
              background: C.surface,
              flexShrink: 0,
            }}
          >
            {page === 'editor' && (
              <button
                onClick={() => setPage('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.sub,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ← Назад
              </button>
            )}
            {page === 'editor' && (
              <div style={{ height: 16, width: 1, background: C.border }} />
            )}
            {page === 'editor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: `linear-gradient(135deg,${C.accent},${C.pink})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                  }}
                >
                  Y
                </div>
                <span style={{ fontWeight: 700, fontSize: 12 }}>Студия</span>
              </div>
            )}
            {page !== 'editor' && (
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {NAV.find((n) => n.id === page)?.label}
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.sub,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {page === 'editor' ? (
            <EditorPage />
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
              <PageComp />
            </div>
          )}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
