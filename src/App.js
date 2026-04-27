import { useState, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5F2BbLININmowaIZs_EIyGLKIMM5USe0",
  authDomain: "gestor-tc.firebaseapp.com",
  projectId: "gestor-tc",
  storageBucket: "gestor-tc.firebasestorage.app",
  messagingSenderId: "956769523283",
  appId: "1:956769523283:web:3ba930eb79c88f69c898a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PALETTE   = ["#6EE7C0","#7EB8F7","#F7C97E","#F77EB8","#B87EF7","#F7977E","#7EF7B8","#A8D8EA"];
const CATS      = ["Supermercado","Combustible","Restaurante","Salud","Ropa","Tecnología","Entretenimiento","Servicios","Otro"];
const bg0="#08100d", bg1="#0c1810", bg2="#0e1e13";
const bdr="1px solid #152b1f";
const fmt  = n => "$" + Math.round(n).toLocaleString("es-CL");
const daysTo = d => Math.ceil((new Date(d) - new Date()) / 86400000);

const INIT_PERSONAS = [
  { id:"yo", label:"Yo",        color:"#6EE7C0" },
  { id:"p2", label:"Persona 2", color:"#7EB8F7" },
  { id:"p3", label:"Persona 3", color:"#F7C97E" },
];

// Datos normalizados según estado de cuenta CMR 19/04/2026
// cp = cuotas pagadas al momento de cargar
// mt = Monto Total a Pagar (con intereses, según EC)
const INIT_GASTOS = [
  // Cuotas con historial
  { id:1,  desc:"Falabella.com",             monto:148607, cuotas:6,  cp:5, personas:["yo"], cat:"Tecnología",     fecha:"2025-10-08", post:false, mt:148607 },
  { id:3,  desc:"Merpago*Alipaysingapo",      monto:74882,  cuotas:6,  cp:5, personas:["yo"], cat:"Otro",           fecha:"2025-10-08", post:false, mt:74882  },
  { id:4,  desc:"Healthy Fitness School",     monto:484800, cuotas:12, cp:4, personas:["yo"], cat:"Salud",          fecha:"2025-11-11", post:false, mt:484800 },
  { id:5,  desc:"Mp *Mercado Libre",          monto:101775, cuotas:6,  cp:3, personas:["yo"], cat:"Tecnología",     fecha:"2026-01-07", post:false, mt:101775 },
  { id:6,  desc:"Hip Líder Copiapó",          monto:132356, cuotas:3,  cp:2, personas:["yo"], cat:"Supermercado",   fecha:"2026-01-09", post:false, mt:132356 },
  { id:7,  desc:"Unimarc Caldera",            monto:106250, cuotas:3,  cp:1, personas:["yo"], cat:"Supermercado",   fecha:"2026-02-21", post:false, mt:106250 },
  { id:8,  desc:"Corralero Plaza",            monto:34651,  cuotas:3,  cp:1, personas:["yo"], cat:"Otro",           fecha:"2026-02-21", post:false, mt:34651  },
  // Ciclo actual (primer cargo may-2026, 0 pagadas)
  { id:2,  desc:"Sodimac HC Copiapó (S/I)",  monto:22990,  cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-03-28", post:false, mt:22990  },
  { id:9,  desc:"DI*Google YouTube",          monto:790,    cuotas:1,  cp:0, personas:["yo"], cat:"Entretenimiento",fecha:"2026-03-19", post:false, mt:790    },
  { id:10, desc:"Unimarc Caldera",            monto:78074,  cuotas:1,  cp:0, personas:["yo"], cat:"Supermercado",   fecha:"2026-03-21", post:false, mt:78074  },
  { id:11, desc:"DI*Google YouTube (anual)",  monto:5500,   cuotas:1,  cp:0, personas:["yo"], cat:"Entretenimiento",fecha:"2026-03-23", post:false, mt:5500   },
  { id:12, desc:"Mp *Mercado Libre",          monto:71800,  cuotas:6,  cp:0, personas:["yo"], cat:"Tecnología",     fecha:"2026-03-28", post:false, mt:71800  },
  { id:13, desc:"Sodimac Homecenter Copiapó", monto:27180,  cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-03-28", post:false, mt:27180  },
  { id:14, desc:"Ebenezer Ltda",              monto:40000,  cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-03-31", post:false, mt:40000  },
  { id:15, desc:"Hiper Copiapó",              monto:153622, cuotas:3,  cp:0, personas:["yo"], cat:"Supermercado",   fecha:"2026-04-02", post:false, mt:153622 },
  { id:16, desc:"Copiapó 3",                  monto:23980,  cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-04-12", post:false, mt:23980  },
  { id:17, desc:"Merpago*Melimas",            monto:2990,   cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-04-13", post:false, mt:2990   },
  { id:19, desc:"Seg Desgravamen 72437",      monto:3116,   cuotas:1,  cp:0, personas:["yo"], cat:"Servicios",      fecha:"2026-04-17", post:false, mt:3116   },
  { id:20, desc:"Seg Cesantía 76369",         monto:4115,   cuotas:1,  cp:0, personas:["yo"], cat:"Servicios",      fecha:"2026-04-17", post:false, mt:4115   },
  { id:21, desc:"Impuesto Dte (IVA)",         monto:4284,   cuotas:1,  cp:0, personas:["yo"], cat:"Servicios",      fecha:"2026-04-19", post:false, mt:4284   },
  { id:22, desc:"Servicio Administración",    monto:13990,  cuotas:1,  cp:0, personas:["yo"], cat:"Servicios",      fecha:"2026-04-19", post:false, mt:13990  },
  // Post-facturación (ciclo 20/04–19/05, primer cargo jun-2026)
  { id:18, desc:"Entel Ventas de Equipo",     monto:758074, cuotas:24, cp:0, personas:["yo"], cat:"Tecnología",     fecha:"2026-04-11", post:true,  mt:758074 },
  { id:23, desc:"Google Play",                monto:5500,   cuotas:1,  cp:0, personas:["yo"], cat:"Entretenimiento",fecha:"2026-04-23", post:true,  mt:5500   },
  { id:24, desc:"Compra Lorrayne",            monto:30135,  cuotas:1,  cp:0, personas:["yo"], cat:"Otro",           fecha:"2026-04-20", post:true,  mt:30135  },
  { id:25, desc:"Jumbo Super PV Copiapó",     monto:19990,  cuotas:1,  cp:0, personas:["yo"], cat:"Supermercado",   fecha:"2026-04-19", post:true,  mt:19990  },
];

const EMPTY_F = { desc:"", monto:"", cuotas:"1", cp:"0", personas:["yo"], cat:"Otro", post:false };

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [loaded, setLoaded] = useState(false);

useEffect(() => {
  async function load() {
    const d = await getDoc(doc(db, "datos", "cmr-v2"));
    if (d.exists() && d.data().gastos && d.data().gastos.length > 0) {
      setGastos(d.data().gastos);
      if (d.data().personas) setPersonas(d.data().personas);
    } else {
      setGastos(INIT_GASTOS);
    }
    setLoaded(true);
  }
  load();
}, []);
  const [personas, setPersonas] = useState(INIT_PERSONAS);
  const [vista,    setVista]    = useState("dashboard");
  const [filtroP,  setFiltroP]  = useState("todos");
  const [nextId,   setNextId]   = useState(100);

  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_F);
  const [editId,   setEditId]   = useState(null);
  const [ef,       setEf]       = useState(null);
  const [showBill, setShowBill] = useState(false);

  const [totalOverride, setTotalOverride] = useState(null);
  const [editingTotal,  setEditingTotal]  = useState(false);
  const [totalInput,    setTotalInput]    = useState("");

  const [fechaPago,   setFechaPago]   = useState("2026-05-05");
  const [cupoCompras, setCupoCompras] = useState(3540000);
  const [cupoUsado,   setCupoUsado]   = useState(1998000);

  const [editPId,  setEditPId]  = useState(null);
  const [pLabel,   setPLabel]   = useState("");
  const [pColor,   setPColor]   = useState(PALETTE[0]);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[3]);
  useEffect(() => {
  if (!loaded) {
    console.log('⏳ Todavía no cargado, no guardo');
    return;
  }
  console.log('💾 Guardando en Firebase...', { gastos: gastos.length, personas: personas.length });
  setDoc(doc(db, "datos", "cmr-v2"), { gastos, personas }, { merge: true })
    .then(() => console.log('✅ Guardado exitoso'))
    .catch(e => console.error('❌ Error al guardar:', e));
}, [gastos, personas, loaded]);
  // ── Métricas ─────────────────────────────────────────────────────────────────
  const diasPagar    = daysTo(fechaPago);
  const conCuotas    = gastos.filter(g => g.cuotas > 1 && g.cp < g.cuotas);
  const cuotaMensual = conCuotas.reduce((a,g) => a + g.monto/g.cuotas, 0);
  const pObj         = id => personas.find(p => p.id === id);

  const totalCalculado = useMemo(() =>
    gastos.filter(g => !g.post && g.cp < g.cuotas).reduce((a,g) => a + g.monto/g.cuotas, 0)
  , [gastos]);

  const totalFacturado = totalOverride !== null ? totalOverride : totalCalculado;

  const porPersona = personas.map(p => ({
    ...p,
    total: gastos
      .filter(g => !g.post && g.cp < g.cuotas && g.personas.includes(p.id))
      .reduce((a,g) => a + (g.monto/g.cuotas)/g.personas.length, 0),
    totalDetalle: gastos
      .filter(g => !g.post && g.cp < g.cuotas && g.personas.includes(p.id))
      .map(g => ({ desc:g.desc, monto:(g.monto/g.cuotas)/g.personas.length, cuotas:g.cuotas, cp:g.cp })),
    count: gastos.filter(g => g.personas.includes(p.id)).length,
  }));

  const gastosFilt = filtroP === "todos"
    ? gastos
    : gastos.filter(g => g.personas.includes(filtroP));

  const toggleP = (id, arr) =>
    arr.includes(id) ? (arr.length > 1 ? arr.filter(x=>x!==id) : arr) : [...arr, id];

  // ── Acciones gastos ──────────────────────────────────────────────────────────
  function addGasto() {
    if (!form.desc.trim() || !form.monto) return;
    const monto  = parseFloat(form.monto);
    const cuotas = Math.max(1, parseInt(form.cuotas)||1);
    const cp     = Math.min(Math.max(0, parseInt(form.cp)||0), cuotas);
    setGastos([...gastos, {
      id:nextId, desc:form.desc.trim(), monto, cuotas, cp,
      personas:[...form.personas], cat:form.cat,
      fecha:new Date().toISOString().split("T")[0],
      post:form.post, mt:monto,
    }]);
    setNextId(n=>n+1);
    setForm(EMPTY_F);
    setShowForm(false);
  }

  function startEdit(g) {
    setEditId(g.id);
    setEf({ desc:g.desc, monto:String(g.monto), cuotas:String(g.cuotas),
             cp:String(g.cp), personas:[...g.personas], cat:g.cat, post:g.post });
  }
  function cancelEdit() { setEditId(null); setEf(null); }
  function saveEdit() {
    const cuotas = Math.max(1, parseInt(ef.cuotas)||1);
    const cp     = Math.min(Math.max(0, parseInt(ef.cp)||0), cuotas);
    setGastos(gastos.map(g => g.id!==editId ? g : {
      ...g, desc:ef.desc.trim(), monto:parseFloat(ef.monto)||0,
      cuotas, cp, personas:[...ef.personas], cat:ef.cat, post:ef.post,
      mt:parseFloat(ef.monto)||0,
    }));
    cancelEdit();
  }

  function pagarCuota(id)  { setGastos(gastos.map(g => g.id===id && g.cp<g.cuotas ? {...g,cp:g.cp+1} : g)); }
  function quitarCuota(id) { setGastos(gastos.map(g => g.id===id && g.cp>0       ? {...g,cp:g.cp-1} : g)); }
  function eliminar(id)    { setGastos(gastos.filter(g=>g.id!==id)); }

  // ── Facturar período ─────────────────────────────────────────────────────────
  function facturar() {
    setGastos(prev =>
      prev.map(g => {
        if (g.post) return {...g, post:false};
        if (g.cp < g.cuotas) return {...g, cp:g.cp+1};
        return g;
      }).filter(g => !(g.cuotas===1 && g.cp>=g.cuotas))
    );
    setTotalOverride(null);
    setShowBill(false);
  }

  // ── Personas ──────────────────────────────────────────────────────────────────
  function addPersona() {
    if (!newLabel.trim()) return;
    setPersonas([...personas, { id:"p_"+Date.now(), label:newLabel.trim(), color:newColor }]);
    setNewLabel(""); setNewColor(PALETTE[3]);
  }
  function startEditP(p) { setEditPId(p.id); setPLabel(p.label); setPColor(p.color); }
  function savePersona(id) {
    setPersonas(personas.map(p => p.id!==id ? p : { ...p, label:pLabel||p.label, color:pColor }));
    setEditPId(null); setPLabel(""); setPColor(PALETTE[0]);
  }
  function delPersona(id) {
    if (gastos.some(g=>g.personas.includes(id))) {
      alert("Esta persona tiene compras asignadas. Edítalas primero."); return;
    }
    setPersonas(personas.filter(p=>p.id!==id));
  }

  // ── Estilos ───────────────────────────────────────────────────────────────────
  const lbl = { fontSize:9, color:"#2e6650", marginBottom:4, letterSpacing:"0.1em" };
  const iSt = {
    background:bg0, border:bdr, borderRadius:6, padding:"8px 10px",
    color:"#e8f5ee", fontSize:11, fontFamily:"inherit", outline:"none",
    width:"100%", boxSizing:"border-box",
  };

  // ── Sub-componentes ───────────────────────────────────────────────────────────
  function CuotaDots({ cuotas, cp, sz=8 }) {
    return (
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
        {Array.from({length:Math.min(cuotas,24)}).map((_,i) => (
          <div key={i} style={{
            width:sz, height:sz, borderRadius:"50%",
            background:i<cp?"#6EE7C0":"#152b1f",
            border:`1px solid ${i<cp?"#6EE7C0":"#1a3828"}`,
          }}/>
        ))}
        {cuotas>24 && <span style={{fontSize:8,color:"#2e6650"}}>+{cuotas-24}</span>}
      </div>
    );
  }

  function PersonasPicker({ value, onChange }) {
    return (
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
        {personas.map(p => {
          const sel = value.includes(p.id);
          return (
            <button key={p.id} onClick={()=>onChange(toggleP(p.id, value))} style={{
              padding:"5px 12px", borderRadius:6, cursor:"pointer", fontFamily:"inherit",
              fontSize:10, border:`1px solid ${sel?p.color:"#1a3828"}`,
              background:sel?p.color+"22":"transparent", color:sel?p.color:"#2e6650",
            }}>
              {p.label}{sel && value.length>1 && <span style={{fontSize:8,opacity:0.6}}> {Math.round(100/value.length)}%</span>}
            </button>
          );
        })}
      </div>
    );
  }

  function Toggle({ val, onToggle, label }) {
    return (
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onToggle} style={{
          width:36, height:19, borderRadius:99, border:"none", cursor:"pointer",
          position:"relative", background:val?"#F7C97E":"#152b1f",
        }}>
          <div style={{position:"absolute",top:2,width:15,height:15,borderRadius:"50%",
            background:val?bg0:"#2e6650",left:val?19:2,transition:"left 0.2s"}}/>
        </button>
        <span style={{fontSize:10,color:val?"#F7C97E":"#2e6650"}}>{label}</span>
      </div>
    );
  }

  function PersonasChips({ g }) {
    const cuotaT = g.monto/g.cuotas;
    return (
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:5}}>
        {g.personas.map(pid => {
          const p = pObj(pid); if (!p) return null;
          return (
            <span key={pid} style={{fontSize:9,color:p.color,
              border:`1px solid ${p.color}35`,borderRadius:4,padding:"2px 6px",background:p.color+"10"}}>
              {p.label} · {fmt(cuotaT/g.personas.length)}/mes
            </span>
          );
        })}
      </div>
    );
  }

  function GastoForm({ f, setF, onSave, onCancel, saveLabel="REGISTRAR", accent="#6EE7C0" }) {
    const cuotas = parseInt(f.cuotas)||1;
    const monto  = parseFloat(f.monto)||0;
    const n      = f.personas.length||1;
    return (
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{gridColumn:"1/-1"}}>
            <div style={lbl}>DESCRIPCIÓN</div>
            <input value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}
              placeholder="Ej: Supermercado" style={iSt}/>
          </div>
          <div>
            <div style={lbl}>MONTO ($)</div>
            <input value={f.monto} type="number" onChange={e=>setF({...f,monto:e.target.value})}
              placeholder="0" style={iSt}/>
          </div>
          <div>
            <div style={lbl}>CUOTAS TOTALES</div>
            <input value={f.cuotas} type="number" min={1} max={48}
              onChange={e=>setF({...f,cuotas:e.target.value})} style={iSt}/>
          </div>
          <div>
            <div style={lbl}>YA PAGADAS</div>
            <input value={f.cp} type="number" min={0}
              onChange={e=>setF({...f,cp:e.target.value})} style={iSt}/>
          </div>
          <div>
            <div style={lbl}>CATEGORÍA</div>
            <select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} style={iSt}>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={lbl}>PERSONAS (toca para asignar)</div>
          <PersonasPicker value={f.personas} onChange={v=>setF({...f,personas:v})}/>
        </div>
        <Toggle val={f.post} onToggle={()=>setF({...f,post:!f.post})} label="Post-facturación (próximo ciclo)"/>
        {monto>0 && (
          <div style={{background:bg0,borderRadius:6,padding:"8px 10px",fontSize:10,color:"#6EE7C0",lineHeight:1.7}}>
            {cuotas>1
              ? <>{cuotas} cuotas · <b>{fmt(monto/cuotas)}/mes</b>{n>1&&<> → {n} personas · <b>{fmt(monto/cuotas/n)}</b>/persona</>}</>
              : <>Pago único <b>{fmt(monto)}</b>{n>1&&<> → <b>{fmt(monto/n)}</b>/persona</>}</>
            }
          </div>
        )}
        <div style={{display:"flex",gap:7}}>
          <button onClick={onSave} style={{flex:1,padding:"9px",borderRadius:7,border:"none",cursor:"pointer",
            background:accent,color:bg0,fontFamily:"inherit",fontSize:11,fontWeight:700}}>{saveLabel}</button>
          {onCancel&&<button onClick={onCancel} style={{padding:"9px 14px",borderRadius:7,border:bdr,
            background:"transparent",color:"#2e6650",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>CANCELAR</button>}
        </div>
      </div>
    );
  }

  const nav = [
    {id:"dashboard",   label:"RESUMEN"},
    {id:"gastos",      label:"GASTOS"},
    {id:"cuotas",      label:"CUOTAS"},
    {id:"personas",    label:"PERSONAS"},
    {id:"config",      label:"CONFIG"},
  ];

  return (
    <div style={{minHeight:"100vh",background:bg0,color:"#e8f5ee",fontFamily:"'DM Mono','Courier New',monospace"}}>
      <div style={{position:"fixed",inset:0,opacity:0.025,pointerEvents:"none",
        backgroundImage:"linear-gradient(#6EE7C0 1px,transparent 1px),linear-gradient(90deg,#6EE7C0 1px,transparent 1px)",
        backgroundSize:"36px 36px"}}/>

      <header style={{borderBottom:bdr,padding:"12px 16px",display:"flex",alignItems:"center",
        justifyContent:"space-between",background:bg0,position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#6EE7C0,#1a7a56)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💳</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#6EE7C0",letterSpacing:"0.07em"}}>CMR TRACKER</div>
            <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.12em"}}>FALABELLA ELITE</div>
          </div>
        </div>
        <nav style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {nav.map(v=>(
            <button key={v.id} onClick={()=>{setVista(v.id);if(v.id!=="gastos")setShowForm(false);}} style={{
              padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",
              fontSize:9,letterSpacing:"0.07em",fontFamily:"inherit",
              background:vista===v.id?"#6EE7C0":bg1,
              color:vista===v.id?bg0:"#2e6650",transition:"all 0.15s"}}>
              {v.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{padding:"16px",maxWidth:940,margin:"0 auto"}}>

        {/* ══ RESUMEN ══ */}
        {vista==="dashboard" && (()=>{
          const postItems = gastos.filter(g=>g.post);
          return (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              <div style={{background:"linear-gradient(135deg,#0c2318,#0d1a10)",border:"1px solid #1a4a30",
                borderRadius:16,padding:"20px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                <div>
                  <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.14em",marginBottom:4}}>PAGAR ANTES DEL</div>
                  <div style={{fontSize:22,fontWeight:700,color:diasPagar<=7?"#F7C97E":"#6EE7C0"}}>{diasPagar}d</div>
                  <div style={{fontSize:9,color:"#2e6650",marginTop:2}}>{fechaPago}</div>
                </div>
                <div style={{borderLeft:bdr,paddingLeft:14}}>
                  <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.14em",marginBottom:4}}>TOTAL A PAGAR</div>
                  {editingTotal ? (
                    <div>
                      <input autoFocus value={totalInput}
                        onChange={e=>setTotalInput(e.target.value)} type="number"
                        style={{...iSt,fontSize:14,fontWeight:700,padding:"4px 6px"}}
                        onKeyDown={e=>{
                          if(e.key==="Enter"){const v=parseFloat(totalInput);setTotalOverride(!isNaN(v)?v:null);setEditingTotal(false);}
                          if(e.key==="Escape"){setEditingTotal(false);}
                        }}/>
                      <div style={{fontSize:8,color:"#2e6650",marginTop:2}}>Enter para guardar · Esc cancelar</div>
                    </div>
                  ):(
                    <div onClick={()=>{setEditingTotal(true);setTotalInput(String(Math.round(totalFacturado)));}} style={{cursor:"pointer"}}>
                      <div style={{fontSize:18,fontWeight:700,color:"#e8f5ee"}}>{fmt(totalFacturado)}</div>
                      <div style={{fontSize:8,color:"#2e6650",marginTop:2}}>
                        {totalOverride!==null?"✏ editado":"≈ calculado"} · toca para cambiar
                      </div>
                    </div>
                  )}
                </div>
                <div style={{borderLeft:bdr,paddingLeft:14}}>
                  <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.14em",marginBottom:4}}>CUOTAS/MES</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#7EB8F7"}}>{fmt(cuotaMensual)}</div>
                  <div style={{fontSize:9,color:"#2e6650",marginTop:2}}>{conCuotas.length} activas</div>
                </div>
              </div>

              <div style={{background:bg1,border:bdr,borderRadius:12,padding:"14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.12em"}}>CUPO UTILIZADO</div>
                    <div style={{fontSize:17,fontWeight:700,color:"#e8f5ee",marginTop:2}}>{fmt(cupoUsado)}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.12em"}}>CUPO COMPRAS</div>
                    <div style={{fontSize:17,fontWeight:700,color:"#2e6650",marginTop:2}}>{fmt(cupoCompras)}</div>
                  </div>
                </div>
                <div style={{height:6,background:bg0,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:99,background:"#6EE7C0",
                    width:`${Math.min(cupoUsado/cupoCompras*100,100).toFixed(1)}%`}}/>
                </div>
                <div style={{fontSize:8,color:"#2e6650",marginTop:4,textAlign:"right"}}>
                  {(cupoUsado/cupoCompras*100).toFixed(1)}% · disponible {fmt(cupoCompras-cupoUsado)}
                </div>
              </div>

              <button onClick={()=>setShowBill(true)} style={{
                padding:"11px",borderRadius:10,border:"1px solid #F7C97E44",cursor:"pointer",
                background:"linear-gradient(135deg,#1a1206,#140f03)",color:"#F7C97E",
                fontFamily:"inherit",fontSize:11,fontWeight:700,
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                ⚡ FACTURAR PERÍODO — avanzar cuotas automáticamente
              </button>

              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(personas.length,4)},1fr)`,gap:10}}>
                {porPersona.map(p=>(
                  <div key={p.id} style={{background:p.color+"14",border:`1px solid ${p.color}20`,borderRadius:11,padding:"12px"}}>
                    <div style={{fontSize:8,color:p.color,letterSpacing:"0.1em",marginBottom:4,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.label.toUpperCase()}</div>
                    <div style={{fontSize:16,fontWeight:700,color:p.color}}>{fmt(p.total)}</div>
                    <div style={{fontSize:8,color:"#2e6650",marginTop:2}}>{p.count} compras</div>
                  </div>
                ))}
              </div>

              <div style={{background:bg1,border:bdr,borderRadius:12,padding:"14px"}}>
                <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.12em",marginBottom:10}}>CUOTAS VIGENTES</div>
                {conCuotas.slice(0,6).map(g=>{
                  const pend=g.cuotas-g.cp;
                  return(
                    <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #0d1812"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,color:"#e8f5ee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.desc}</div>
                        <div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>
                          {g.personas.map(pid=>{const p=pObj(pid);return p?<span key={pid} style={{fontSize:8,color:p.color}}>{p.label}</span>:null})}
                          <span style={{fontSize:8,color:"#2e6650"}}>· {pend} restantes</span>
                        </div>
                      </div>
                      <CuotaDots cuotas={g.cuotas} cp={g.cp} sz={5}/>
                      <div style={{fontSize:10,fontWeight:700,color:"#6EE7C0",whiteSpace:"nowrap"}}>{fmt(g.monto/g.cuotas)}/m</div>
                    </div>
                  );
                })}
                {conCuotas.length>6&&<div style={{fontSize:9,color:"#2e6650",marginTop:7,textAlign:"center"}}>+{conCuotas.length-6} más en CUOTAS</div>}
              </div>

              {postItems.length>0&&(
                <div style={{background:"#140f03",border:"1px solid #F7C97E18",borderRadius:12,padding:"13px"}}>
                  <div style={{fontSize:8,color:"#F7C97E",letterSpacing:"0.12em",marginBottom:9}}>⚡ PRÓXIMO CICLO</div>
                  {postItems.map(g=>(
                    <div key={g.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #251b07"}}>
                      <div>
                        <div style={{fontSize:11,color:"#e8f5ee"}}>{g.desc}</div>
                        <div style={{display:"flex",gap:4,marginTop:2}}>
                          {g.personas.map(pid=>{const p=pObj(pid);return p?<span key={pid} style={{fontSize:8,color:p.color}}>{p.label}</span>:null})}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#F7C97E",fontWeight:700}}>{fmt(g.monto/g.cuotas)}/mes</div>
                        <div style={{fontSize:8,color:"#4a3a10"}}>{g.cuotas} cuota{g.cuotas>1?"s":""}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:8,display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:8,color:"#4a3a10"}}>ACUMULADO PRÓXIMO CICLO</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#F7C97E"}}>
                      {fmt(postItems.reduce((a,g)=>a+g.monto/g.cuotas,0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ══ GASTOS ══ */}
        {vista==="gastos"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {[{id:"todos",label:"TODOS"},...personas.map(p=>({id:p.id,label:p.label.toUpperCase()}))].map(f=>(
                <button key={f.id} onClick={()=>setFiltroP(f.id)} style={{
                  padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",
                  fontSize:9,fontFamily:"inherit",
                  background:filtroP===f.id?"#6EE7C0":bg1,
                  color:filtroP===f.id?bg0:"#2e6650"}}>
                  {f.label}
                </button>
              ))}
            </div>

            <button onClick={()=>setShowForm(!showForm)} style={{
              padding:"11px",borderRadius:11,border:`2px dashed ${showForm?"#1a4a30":"#152b1f"}`,
              background:showForm?bg2:"transparent",cursor:"pointer",
              color:"#6EE7C0",fontSize:11,fontFamily:"inherit"}}>
              {showForm?"✕ Cancelar":"+ NUEVO GASTO"}
            </button>

            {showForm&&(
              <div style={{background:bg1,border:"1px solid #1a4a30",borderRadius:12,padding:"16px"}}>
                <div style={{fontSize:9,color:"#6EE7C0",letterSpacing:"0.1em",marginBottom:12}}>NUEVA COMPRA</div>
                <GastoForm f={form} setF={setForm} onSave={addGasto}
                  onCancel={()=>{setShowForm(false);setForm(EMPTY_F);}}/>
              </div>
            )}

            {gastosFilt.map(g=>{
              const pend=g.cuotas-g.cp;
              const isE=editId===g.id;
              return(
                <div key={g.id} style={{background:g.post?"#140f03":bg1,
                  border:`1px solid ${g.post?"#F7C97E22":"#152b1f"}`,borderRadius:11,padding:"14px"}}>
                  {isE?(
                    <div>
                      <div style={{fontSize:9,color:"#F7C97E",letterSpacing:"0.1em",marginBottom:12}}>✏ EDITANDO</div>
                      <GastoForm f={ef} setF={setEf} onSave={saveEdit} onCancel={cancelEdit}
                        saveLabel="GUARDAR CAMBIOS" accent="#F7C97E"/>
                    </div>
                  ):(
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:2}}>
                            <span style={{fontSize:13,color:"#e8f5ee",fontWeight:600}}>{g.desc}</span>
                            {g.post&&<span style={{fontSize:8,color:"#F7C97E",border:"1px solid #F7C97E40",borderRadius:3,padding:"1px 4px"}}>POST</span>}
                          </div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <span style={{fontSize:9,color:"#2e6650"}}>{g.cat}</span>
                            <span style={{fontSize:9,color:"#1a3828"}}>· {g.fecha}</span>
                          </div>
                          <PersonasChips g={g}/>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:"#e8f5ee"}}>{fmt(g.mt||g.monto)}</div>
                          {g.cuotas>1&&<div style={{fontSize:9,color:"#6EE7C0"}}>{fmt(g.monto/g.cuotas)}/cuota</div>}
                        </div>
                      </div>
                      {g.cuotas>1&&(
                        <div style={{marginTop:10}}>
                          <CuotaDots cuotas={g.cuotas} cp={g.cp} sz={g.cuotas>12?6:8}/>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,flexWrap:"wrap",gap:5}}>
                            <span style={{fontSize:9,color:"#2e6650"}}>{g.cp}/{g.cuotas} · saldo {fmt((g.monto/g.cuotas)*pend)}</span>
                            <div style={{display:"flex",gap:5}}>
                              {g.cp>0&&<button onClick={()=>quitarCuota(g.id)} style={{
                                padding:"3px 8px",borderRadius:4,border:"1px solid #2e6650",
                                background:"transparent",color:"#2e6650",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>−</button>}
                              {pend>0&&<button onClick={()=>pagarCuota(g.id)} style={{
                                padding:"3px 9px",borderRadius:4,border:"1px solid #6EE7C0",
                                background:"transparent",color:"#6EE7C0",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>
                                + C.{g.cp+1}
                              </button>}
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid #0d1812",
                        display:"flex",justifyContent:"flex-end",gap:6}}>
                        <button onClick={()=>startEdit(g)} style={{
                          padding:"5px 13px",borderRadius:5,border:"1px solid #1a4a30",
                          background:bg2,color:"#6EE7C0",cursor:"pointer",fontSize:9,fontFamily:"inherit",fontWeight:600}}>
                          ✏ Editar
                        </button>
                        <button onClick={()=>eliminar(g.id)} style={{
                          padding:"5px 13px",borderRadius:5,border:"1px solid #1a2018",
                          background:"transparent",color:"#2e3830",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CUOTAS ══ */}
        {vista==="cuotas"&&(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div style={{background:"linear-gradient(135deg,#0c2318,#0c1810)",border:"1px solid #1a4a30",
              borderRadius:13,padding:"18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:8,color:"#2e6650",letterSpacing:"0.12em",marginBottom:5}}>CARGO MENSUAL EN CUOTAS</div>
                <div style={{fontSize:24,fontWeight:700,color:"#6EE7C0"}}>{fmt(cuotaMensual)}</div>
              </div>
              <div style={{fontSize:9,color:"#2e6650"}}>{conCuotas.length} activas</div>
            </div>
            {conCuotas.map(g=>{
              const pend=g.cuotas-g.cp;
              const prog=(g.cp/g.cuotas)*100;
              const cv=g.monto/g.cuotas;
              return(
                <div key={g.id} style={{background:bg1,border:bdr,borderRadius:12,padding:"15px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:"#e8f5ee"}}>{g.desc}</div>
                      <PersonasChips g={g}/>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:8,color:"#2e6650"}}>Total compra</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#e8f5ee"}}>{fmt(g.mt||g.monto)}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
                    {[
                      {l:"CUOTA/MES", v:fmt(cv),              c:"#6EE7C0"},
                      {l:"PAGADAS",   v:`${g.cp}/${g.cuotas}`,c:"#e8f5ee"},
                      {l:"SALDO",     v:fmt(cv*pend),         c:pend>0?"#F7C97E":"#6EE7C0"},
                    ].map(s=>(
                      <div key={s.l} style={{background:bg0,borderRadius:6,padding:"8px"}}>
                        <div style={{fontSize:7,color:"#2e6650"}}>{s.l}</div>
                        <div style={{fontSize:12,fontWeight:700,color:s.c,marginTop:3}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {g.personas.length>1&&(
                    <div style={{background:bg0,borderRadius:6,padding:"8px",marginBottom:10}}>
                      <div style={{fontSize:7,color:"#2e6650",marginBottom:5}}>DIVISIÓN</div>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                        {g.personas.map(pid=>{
                          const p=pObj(pid); if(!p) return null;
                          return(
                            <div key={pid} style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:p.color}}/>
                              <span style={{fontSize:10,color:p.color}}>{p.label}:</span>
                              <span style={{fontSize:10,color:"#e8f5ee",fontWeight:600}}>{fmt(cv/g.personas.length)}/mes</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{height:5,background:bg0,borderRadius:99,overflow:"hidden",marginBottom:7}}>
                    <div style={{height:"100%",borderRadius:99,
                      background:prog===100?"#6EE7C0":"linear-gradient(90deg,#6EE7C0,#7EB8F7)",
                      width:`${prog}%`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                    <CuotaDots cuotas={g.cuotas} cp={g.cp} sz={g.cuotas>12?7:9}/>
                    <div style={{display:"flex",gap:5}}>
                      {g.cp>0&&<button onClick={()=>quitarCuota(g.id)} style={{
                        padding:"4px 10px",borderRadius:5,border:"1px solid #2e6650",
                        background:"transparent",color:"#2e6650",cursor:"pointer",fontSize:9,fontFamily:"inherit"}}>− Quitar</button>}
                      {pend>0
                        ?<button onClick={()=>pagarCuota(g.id)} style={{
                          padding:"5px 12px",borderRadius:6,border:"none",
                          background:"#6EE7C0",color:bg0,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"inherit"}}>
                          ✓ PAGAR C.{g.cp+1}
                        </button>
                        :<span style={{fontSize:9,color:"#6EE7C0"}}>✓ Completado</span>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PERSONAS ══ */}
        {vista==="personas"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{fontSize:9,color:"#2e6650",letterSpacing:"0.12em"}}>GESTIÓN DE PERSONAS</div>
            {personas.map(p=>(
              <div key={p.id} style={{background:bg1,border:`1px solid ${p.color}25`,borderRadius:12,padding:"14px"}}>
                {editPId===p.id?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{fontSize:9,color:"#F7C97E",letterSpacing:"0.1em",marginBottom:2}}>✏ EDITANDO — {p.label}</div>
                    <div>
                      <div style={lbl}>NOMBRE</div>
                      <input value={pLabel} onChange={e=>setPLabel(e.target.value)} placeholder={p.label} style={iSt}/>
                    </div>
                    <div>
                      <div style={{...lbl,marginBottom:7}}>COLOR</div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {PALETTE.map(c=>(
                          <button key={c} onClick={()=>setPColor(c)} style={{
                            width:28,height:28,borderRadius:"50%",cursor:"pointer",padding:0,
                            border:`3px solid ${pColor===c?"#fff":"transparent"}`,background:c}}/>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:7}}>
                      <button onClick={()=>savePersona(p.id)} style={{flex:1,padding:"9px",borderRadius:7,
                        border:"none",cursor:"pointer",background:"#6EE7C0",color:bg0,fontFamily:"inherit",fontSize:11,fontWeight:700}}>
                        GUARDAR
                      </button>
                      <button onClick={()=>{setEditPId(null);setPLabel("");}} style={{padding:"9px 14px",borderRadius:7,
                        border:bdr,background:"transparent",color:"#2e6650",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
                        CANCELAR
                      </button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,color:p.color,fontWeight:700}}>{p.label}</div>
                        <div style={{fontSize:9,color:"#2e6650",marginTop:2}}>
                          {gastos.filter(g=>g.personas.includes(p.id)).length} compras
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>startEditP(p)} style={{
                          padding:"6px 14px",borderRadius:6,border:"1px solid #1a4a30",
                          background:bg2,color:"#6EE7C0",cursor:"pointer",fontSize:10,fontFamily:"inherit",fontWeight:600}}>
                          ✏ Editar
                        </button>
                        <button onClick={()=>delPersona(p.id)} style={{
                          padding:"6px 10px",borderRadius:6,border:"1px solid #1a2018",
                          background:"transparent",color:"#2e3830",cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>
                          🗑
                        </button>
                      </div>
                    </div>
                    {(()=>{
                      const pp=porPersona.find(x=>x.id===p.id);
                      if(!pp||pp.total===0) return null;
                      return(
                        <div style={{background:bg0,borderRadius:9,padding:"12px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <span style={{fontSize:9,color:"#2e6650",letterSpacing:"0.1em"}}>PRÓXIMA FACTURACIÓN</span>
                            <span style={{fontSize:16,fontWeight:700,color:p.color}}>{fmt(pp.total)}</span>
                          </div>
                          {pp.totalDetalle.map((d,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",
                              padding:"5px 0",borderTop:"1px solid #0d1812"}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:10,color:"#e8f5ee",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.desc}</div>
                                <div style={{fontSize:8,color:"#2e6650",marginTop:1}}>cuota {d.cp+1}/{d.cuotas}</div>
                              </div>
                              <div style={{fontSize:11,fontWeight:600,color:p.color,marginLeft:10,whiteSpace:"nowrap"}}>{fmt(d.monto)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
            <div style={{background:bg2,border:"1px solid #1a4a30",borderRadius:13,padding:"18px",display:"flex",flexDirection:"column",gap:11}}>
              <div style={{fontSize:10,color:"#6EE7C0",fontWeight:700,letterSpacing:"0.1em"}}>+ AGREGAR NUEVA PERSONA</div>
              <div>
                <div style={lbl}>NOMBRE</div>
                <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
                  placeholder="Ej: Mamá, Pareja, Jorge..." style={iSt}
                  onKeyDown={e=>{ if(e.key==="Enter") addPersona(); }}/>
              </div>
              <div>
                <div style={{...lbl,marginBottom:7}}>COLOR</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {PALETTE.map(c=>(
                    <button key={c} onClick={()=>setNewColor(c)} style={{
                      width:28,height:28,borderRadius:"50%",cursor:"pointer",padding:0,
                      border:`3px solid ${newColor===c?"#fff":"transparent"}`,background:c}}/>
                  ))}
                </div>
              </div>
              {newLabel.trim()&&(
                <div style={{background:bg0,borderRadius:6,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:newColor}}/>
                  <span style={{fontSize:11,color:newColor,fontWeight:600}}>{newLabel}</span>
                </div>
              )}
              <button onClick={addPersona} style={{padding:"10px",borderRadius:8,border:"none",cursor:"pointer",
                background:"#6EE7C0",color:bg0,fontFamily:"inherit",fontSize:12,fontWeight:700}}>
                AGREGAR PERSONA
              </button>
            </div>
          </div>
        )}

        {/* ══ CONFIG ══ */}
        {vista==="config"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{fontSize:9,color:"#2e6650",letterSpacing:"0.12em"}}>CONFIGURACIÓN</div>
            <div style={{background:bg1,border:bdr,borderRadius:12,padding:"18px",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontSize:9,color:"#6EE7C0",letterSpacing:"0.1em",marginBottom:4}}>DATOS TARJETA</div>
              <div>
                <div style={lbl}>FECHA LÍMITE DE PAGO</div>
                <input value={fechaPago} onChange={e=>setFechaPago(e.target.value)} type="date" style={iSt}/>
              </div>
              <div>
                <div style={lbl}>CUPO COMPRAS ($)</div>
                <input value={cupoCompras} type="number" onChange={e=>setCupoCompras(parseInt(e.target.value)||0)} style={iSt}/>
              </div>
              <div>
                <div style={lbl}>CUPO UTILIZADO ($)</div>
                <input value={cupoUsado} type="number" onChange={e=>setCupoUsado(parseInt(e.target.value)||0)} style={iSt}/>
              </div>
            </div>
            <div style={{background:bg1,border:bdr,borderRadius:12,padding:"18px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{fontSize:9,color:"#6EE7C0",letterSpacing:"0.1em",marginBottom:4}}>TOTAL FACTURADO</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setTotalOverride(null)} style={{
                  flex:1,padding:"9px",borderRadius:7,border:`1px solid ${totalOverride===null?"#6EE7C0":"#1a3828"}`,
                  background:totalOverride===null?bg2:"transparent",
                  color:totalOverride===null?"#6EE7C0":"#2e6650",cursor:"pointer",fontFamily:"inherit",fontSize:10}}>
                  AUTO ({fmt(totalCalculado)})
                </button>
                <button onClick={()=>{setTotalOverride(totalFacturado);setEditingTotal(true);setTotalInput(String(Math.round(totalFacturado)));}} style={{
                  flex:1,padding:"9px",borderRadius:7,border:`1px solid ${totalOverride!==null?"#F7C97E":"#1a3828"}`,
                  background:totalOverride!==null?bg2:"transparent",
                  color:totalOverride!==null?"#F7C97E":"#2e6650",cursor:"pointer",fontFamily:"inherit",fontSize:10}}>
                  MANUAL ({fmt(totalOverride??totalCalculado)})
                </button>
              </div>
              {totalOverride!==null&&(
                <div>
                  <div style={lbl}>MONTO MANUAL ($)</div>
                  <input value={totalInput||String(totalOverride)} type="number"
                    onChange={e=>{setTotalInput(e.target.value);const v=parseFloat(e.target.value);if(!isNaN(v))setTotalOverride(v);}}
                    style={iSt}/>
                </div>
              )}
              <div style={{fontSize:9,color:"#2e6650",lineHeight:1.6}}>
                AUTO suma todas las cuotas del ciclo actual.<br/>
                MANUAL usa el valor exacto del estado de cuenta CMR.
              </div>
            </div>
            <div style={{background:bg1,border:bdr,borderRadius:12,padding:"16px"}}>
              <div style={{fontSize:9,color:"#6EE7C0",letterSpacing:"0.1em",marginBottom:12}}>DATOS ESTADO DE CUENTA</div>
              {[
                {l:"Titular",          v:"Alonso A. Villalobos Torres"},
                {l:"Tarjeta",          v:"CMR Elite · ****2918"},
                {l:"Fecha facturación",v:"19/04/2026"},
                {l:"Período actual",   v:"20/04 – 19/05/2026"},
                {l:"Tasa cuotas",      v:"4,27%"},
                {l:"CAE prepago",      v:"41,15%"},
                {l:"CMR Puntos",       v:"6.193"},
              ].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #0d1812"}}>
                  <span style={{fontSize:9,color:"#2e6650"}}>{r.l}</span>
                  <span style={{fontSize:9,color:"#e8f5ee",fontWeight:600}}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {vista!=="gastos"&&(
        <button onClick={()=>{setVista("gastos");setShowForm(true);}} style={{
          position:"fixed",bottom:22,right:22,width:50,height:50,borderRadius:"50%",border:"none",
          background:"linear-gradient(135deg,#6EE7C0,#1a7a56)",color:bg0,fontSize:22,cursor:"pointer",
          boxShadow:"0 0 18px #6EE7C040",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      )}

      {/* MODAL FACTURAR */}
      {showBill&&(
        <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:200,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:bg1,border:"1px solid #F7C97E44",borderRadius:16,padding:"26px",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#F7C97E",marginBottom:14}}>⚡ Facturar período</div>
            {[
              "Todas las cuotas activas avanzan 1 (cuota del mes marcada como cobrada)",
              "Las compras de 1 cuota pagadas desaparecen",
              "Los gastos post-facturación pasan al ciclo actual",
              "El total facturado vuelve a calcularse automáticamente",
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"#6EE7C0",flexShrink:0}}>✓</span>
                <span style={{fontSize:10,color:"#a0c8b0",lineHeight:1.5}}>{t}</span>
              </div>
            ))}
            <div style={{background:"#140f03",border:"1px solid #F7C97E22",borderRadius:8,padding:"9px",marginTop:6,marginBottom:16}}>
              <span style={{fontSize:9,color:"#F7C97E"}}>⚠ Confirma solo después de haber pagado el período.</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={facturar} style={{flex:1,padding:"10px",borderRadius:8,border:"none",
                cursor:"pointer",background:"#F7C97E",color:bg0,fontFamily:"inherit",fontSize:11,fontWeight:700}}>
                CONFIRMAR
              </button>
              <button onClick={()=>setShowBill(false)} style={{padding:"10px 16px",borderRadius:8,border:bdr,
                background:"transparent",color:"#2e6650",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
