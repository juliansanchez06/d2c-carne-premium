import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChzGFeNj350hf0zP6_g1BdqlwHo0i1uRM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "modelod2d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "modelod2d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "modelod2d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "80737345531",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:80737345531:web:185d1f7df87c53dd5d755e"
}
const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)
const DOC_REF = doc(db, 'd2c-carne', 'config')

const DEFAULTS = {
  b1_ternero:1316000,b1_supl:105000,b1_racion:385000,b1_sanidad:18000,b1_personal:28000,
  peso_vivo:450,rinde_gancho:58,rinde_carnicero:75,animales_semana:3,
  b2_flete1:25000,b2_faena:40000,b2_flete2:60000,b2_guias:6000,b2_recupero:15000,b2_iibb:8000,b2_contingencia:25000,
  b3_alquiler:600000,b3_luz:320000,b3_sueldo1:900000,b3_sueldo2:550000,b3_insumos:200000,b3_amort:220000,b3_mant:90000,b3_seguros:150000,b3_obra:250000,
  b4_pack:4000,b4_pedidos:60,b4_delivery:2000,b4_mp:5.99,b4_mkt:200000,b4_web:50000,b4_ventas:400000,
  precio_venta:20000,
  s_dia:500,s_meses:7,s_anim:144,s_gdp:0.65,s_gdpsin:0.25,s_pnov:4400,
  inq_animales:80,inq_kg:5.5,inq_precio:4400,inq_precio_t:6580,inq_meses:12,
  cj_inversion:15000000,cj_ramp1:30,cj_ramp2:55,cj_ramp3:75,cj_ramp4:90,
  pinned:{},
  mix:[
    {nombre:'Lomo',kg:8,precio:28000},{nombre:'Bife de chorizo',kg:12,precio:22000},
    {nombre:'Cuadril',kg:18,precio:22000},{nombre:'Vacío',kg:15,precio:23000},
    {nombre:'Nalga',kg:16,precio:22000},{nombre:'Peceto',kg:7,precio:24000},
    {nombre:'Tapa de asado',kg:8,precio:18000},{nombre:'Matambre',kg:6,precio:19000},
    {nombre:'Bola de lomo',kg:8,precio:20000},{nombre:'Asado de tira',kg:35,precio:18500},
    {nombre:'Paleta',kg:18,precio:17500},{nombre:'Tortuguita',kg:10,precio:17000},
    {nombre:'Picada / recortes',kg:15,precio:12000},{nombre:'Falda',kg:10,precio:12000},
  ]
}

const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR')
const fmtPct = (n) => (Math.round(n*10)/10).toFixed(1)+'%'
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// Colors
const C = {
  bg:'#F7F8FA',surface:'#FFFFFF',surface2:'#F0F4F8',border:'#E2E8F0',border2:'#CBD5E1',
  text:'#1A202C',text2:'#4A5568',text3:'#94A3B8',
  green:'#16A34A',greenBg:'#F0FDF4',greenBorder:'#86EFAC',greenDark:'#14532D',
  amber:'#D97706',amberBg:'#FFFBEB',amberBorder:'#FCD34D',
  red:'#DC2626',redBg:'#FEF2F2',redBorder:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBorder:'#93C5FD',
  indigo:'#4F46E5',indigoBg:'#EEF2FF',
  navy:'#1E3A5F',
}
const sh = '0 1px 3px rgba(0,0,0,0.08)'
const shMd = '0 4px 6px rgba(0,0,0,0.07)'

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;font-size:13px;}
  input[type=number]{-moz-appearance:textfield;}
  input[type=number]::-webkit-inner-spin-button{display:none;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px;}
  .rh:hover{background:${C.surface2}!important;}
  .nbtn:hover{background:${C.surface2};}
  .tbtn:hover{color:${C.indigo}!important;}
  .sbtn:hover{transform:translateY(-1px);box-shadow:${shMd};}
  .pbtn:hover{background:${C.indigoBg}!important;border-color:${C.indigo}!important;}
`

// ── UI Primitives ──────────────────────────────────────────────
function Alert({type='warning',icon,title,body}){
  const t={warning:{bg:C.amberBg,border:C.amberBorder,tc:'#92400E',bc:'#78350F',ib:'#FEF3C7'},error:{bg:C.redBg,border:C.redBorder,tc:C.red,bc:'#7F1D1D',ib:'#FEE2E2'},info:{bg:C.blueBg,border:C.blueBorder,tc:C.blue,bc:'#1E40AF',ib:'#DBEAFE'},success:{bg:C.greenBg,border:C.greenBorder,tc:C.green,bc:C.greenDark,ib:'#DCFCE7'}}[type]
  return <div style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',gap:12}}>
    <div style={{width:32,height:32,borderRadius:8,background:t.ib,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{icon}</div>
    <div><div style={{fontSize:12,fontWeight:600,color:t.tc,marginBottom:3}}>{title}</div><div style={{fontSize:11,color:t.bc,lineHeight:1.6}}>{body}</div></div>
  </div>
}

function Kpi({label,value,sub,variant='default',full,large}){
  const vs={default:{bg:C.surface,border:C.border,lc:C.text3,vc:C.text},green:{bg:C.greenBg,border:C.greenBorder,lc:C.green,vc:C.greenDark},amber:{bg:C.amberBg,border:C.amberBorder,lc:C.amber,vc:'#92400E'},red:{bg:C.redBg,border:C.redBorder,lc:C.red,vc:'#7F1D1D'},blue:{bg:C.blueBg,border:C.blueBorder,lc:C.blue,vc:'#1E40AF'},navy:{bg:C.navy,border:C.navy,lc:'#93C5FD',vc:'#FFF'}}[variant]
  return <div style={{background:vs.bg,border:`1px solid ${vs.border}`,borderRadius:12,padding:'14px 16px',boxShadow:sh,gridColumn:full?'1/-1':undefined}}>
    <div style={{fontSize:10,fontWeight:600,color:vs.lc,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>{label}</div>
    <div style={{fontFamily:"'Fraunces',serif",fontSize:large?28:22,color:vs.vc,lineHeight:1,fontWeight:600}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:vs.lc,marginTop:4,opacity:.8}}>{sub}</div>}
  </div>
}

function NavBtn({active,onClick,icon,label}){
  return <button onClick={onClick} className="nbtn" style={{padding:'9px 16px',fontSize:12,fontWeight:active?600:500,cursor:'pointer',border:'none',borderRadius:8,background:active?C.navy:'transparent',color:active?'#FFF':C.text2,display:'flex',alignItems:'center',gap:7,transition:'all .15s',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}><span>{icon}</span>{label}</button>
}

function Tab({active,onClick,label}){
  return <button onClick={onClick} className="tbtn" style={{padding:'7px 16px',fontSize:11,fontWeight:active?600:400,cursor:'pointer',border:'none',borderBottom:active?`2px solid ${C.indigo}`:'2px solid transparent',background:'transparent',color:active?C.indigo:C.text3,transition:'all .12s',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>{label}</button>
}

function SaveBtn({onSave,saved}){
  return <button onClick={onSave} className="sbtn" style={{padding:'8px 20px',fontSize:12,fontWeight:600,cursor:'pointer',border:'none',borderRadius:8,background:saved?C.greenBg:C.navy,color:saved?C.green:'#FFF',display:'flex',alignItems:'center',gap:7,fontFamily:"'DM Sans',sans-serif",boxShadow:sh,transition:'all .15s'}}>{saved?'✓ Guardado':'💾 Guardar'}</button>
}

function PinBtn({pinned,onPin}){
  return <button onClick={onPin} className="pbtn" title={pinned?'Fijado — clic para liberar':'Fijar valor de referencia'} style={{width:28,height:28,borderRadius:6,border:`1px solid ${pinned?C.indigo:C.border2}`,background:pinned?C.indigoBg:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,transition:'all .12s'}}>{pinned?'📌':'📍'}</button>
}

function Card({title,subtitle,badge,badgeColor,children}){
  const bc={green:{bg:C.greenBg,c:C.green,b:C.greenBorder},amber:{bg:C.amberBg,c:C.amber,b:C.amberBorder},red:{bg:C.redBg,c:C.red,b:C.redBorder},blue:{bg:C.blueBg,c:C.blue,b:C.blueBorder}}[badgeColor]||{bg:C.blueBg,c:C.blue,b:C.blueBorder}
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden',marginBottom:20,boxShadow:sh}}>
    <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:C.surface2}}>
      <div>
        {badge&&<span style={{fontSize:10,fontWeight:600,color:bc.c,background:bc.bg,border:`1px solid ${bc.b}`,padding:'2px 8px',borderRadius:20,marginRight:10,letterSpacing:'.05em'}}>{badge}</span>}
        <span style={{fontFamily:"'Fraunces',serif",fontSize:15,color:C.text,fontWeight:600}}>{title}</span>
        {subtitle&&<span style={{fontSize:11,color:C.text3,marginLeft:10}}>{subtitle}</span>}
      </div>
    </div>
    {children}
  </div>
}

function IRow({label,sub,value,onChange,unit,result,resultColor,updated,pinned,onPin}){
  return <div className="rh" style={{display:'grid',gridTemplateColumns:'1fr 160px 105px 36px',alignItems:'center',borderBottom:`1px solid ${C.border}`,padding:'0 20px',minHeight:44,background:pinned?'#FAFAFF':'transparent',borderLeft:updated?`3px solid ${C.amber}`:'3px solid transparent'}}>
    <div style={{fontSize:12,color:C.text2,padding:'6px 0 6px 4px',lineHeight:1.3}}>
      {updated&&<span style={{fontSize:9,fontWeight:700,color:C.amber,marginRight:6,letterSpacing:'.05em'}}>MAY-26</span>}
      {label}
      {sub&&<span style={{display:'block',fontSize:10,color:C.text3,marginTop:1}}>{sub}</span>}
    </div>
    <div style={{display:'flex',alignItems:'center',gap:5,padding:'0 8px'}}>
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} disabled={pinned} style={{width:'100%',background:pinned?C.surface2:C.surface,border:`1px solid ${pinned?C.indigo:C.border2}`,borderRadius:7,padding:'5px 8px',fontFamily:"'DM Mono',monospace",fontSize:12,color:pinned?C.indigo:C.text,textAlign:'right',outline:'none',cursor:pinned?'not-allowed':'text'}}/>
      <span style={{fontSize:10,color:C.text3,whiteSpace:'nowrap',minWidth:26}}>{unit}</span>
    </div>
    <div style={{textAlign:'right',fontSize:12,color:resultColor||C.text2,fontFamily:"'DM Mono',monospace",fontWeight:500,paddingRight:8}}>{result}</div>
    {onPin?<PinBtn pinned={pinned} onPin={onPin}/>:<div/>}
  </div>
}

function Bar({label,value,max,color}){
  const pct=max>0?Math.min(100,(value/max)*100):0
  return <div style={{marginBottom:9}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
      <span style={{color:C.text2}}>{label}</span>
      <span style={{fontFamily:"'DM Mono',monospace",color:C.text,fontWeight:500}}>{fmt(value)}/kg</span>
    </div>
    <div style={{height:6,background:C.surface2,borderRadius:3,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width .4s'}}/>
    </div>
  </div>
}

function SI({label,value,variant}){
  const c={green:C.green,amber:C.amber,red:C.red,default:C.text}[variant]||C.text
  return <div>
    <div style={{fontSize:9,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:2}}>{label}</div>
    <div style={{fontFamily:"'Fraunces',serif",fontSize:18,color:c,fontWeight:600,lineHeight:1}}>{value}</div>
  </div>
}
const Div=()=><div style={{width:1,height:30,background:C.border}}/>

// ── MAIN ──────────────────────────────────────────────────────
export default function App(){
  const [mod,setMod]=useState('fin')
  const [finTab,setFinTab]=useState('costos')
  const [prodTab,setProdTab]=useState('gantt')
  const [auditTab,setAuditTab]=useState('riesgos')
  const [cajaTab,setCajaTab]=useState('mensual')
  const [saveStatus,setSaveStatus]=useState('cargando...')
  const [savedAnim,setSavedAnim]=useState(false)
  const [vals,setVals]=useState(DEFAULTS)
  const debRef=useRef(null)

  useEffect(()=>{
    getDoc(DOC_REF).then(snap=>{
      if(snap.exists()){const d=snap.data();setVals(p=>({...p,...d,mix:d.mix||p.mix,pinned:d.pinned||{}}));setSaveStatus('sincronizado')}
      else setSaveStatus('nuevo')
    }).catch(()=>setSaveStatus('sin conexión'))
  },[])

  const handleSave=useCallback(()=>{
    setDoc(DOC_REF,vals,{merge:true}).then(()=>{setSavedAnim(true);setSaveStatus('guardado');setTimeout(()=>setSavedAnim(false),2000)}).catch(()=>setSaveStatus('error'))
  },[vals])

  const autoSave=useCallback((nv)=>{
    if(debRef.current)clearTimeout(debRef.current)
    setSaveStatus('editando...')
    debRef.current=setTimeout(()=>{setDoc(DOC_REF,nv,{merge:true}).then(()=>setSaveStatus('auto-guardado ✓')).catch(()=>setSaveStatus('error'))},1500)
  },[])

  const set=useCallback((key,val)=>{
    setVals(p=>{if(p.pinned?.[key])return p;const n={...p,[key]:parseFloat(val)||0};autoSave(n);return n})
  },[autoSave])

  const togglePin=useCallback((key)=>{
    setVals(p=>{const pinned={...(p.pinned||{})};if(pinned[key])delete pinned[key];else pinned[key]=p[key];const n={...p,pinned};autoSave(n);return n})
  },[autoSave])

  const setMix=useCallback((i,field,val)=>{
    setVals(p=>{const m=p.mix.map((c,idx)=>idx===i?{...c,[field]:parseFloat(val)||0}:c);const n={...p,mix:m};autoSave(n);return n})
  },[autoSave])

  const resetAll=useCallback(()=>{
    if(!window.confirm('¿Restablecer todos los valores a los defaults de mayo 2026?'))return
    const n={...DEFAULTS,pinned:{}};setVals(n);setDoc(DOC_REF,n,{merge:true}).then(()=>setSaveStatus('restablecido'))
  },[])

  const v=vals
  const pin=k=>!!(v.pinned?.[k])

  // Calculations
  const kgG=v.peso_vivo*(v.rinde_gancho/100)
  const kgN=kgG*(v.rinde_carnicero/100)
  const kgNS=kgN*v.animales_semana
  const b1=v.b1_ternero+v.b1_supl+v.b1_racion+v.b1_sanidad+v.b1_personal
  const b1S=b1*v.animales_semana
  const b2r=v.b2_flete1+v.b2_faena+v.b2_flete2+v.b2_guias+v.b2_iibb+v.b2_contingencia-v.b2_recupero
  const b2S=b2r*v.animales_semana
  const b3m=v.b3_alquiler+v.b3_luz+v.b3_sueldo1+v.b3_sueldo2+v.b3_insumos+v.b3_amort+v.b3_mant+v.b3_seguros+v.b3_obra
  const b3S=b3m/4.33
  const mktS=(v.b4_mkt+v.b4_web+v.b4_ventas)/4.33
  const packS=v.b4_pack*v.b4_pedidos
  const delS=v.b4_delivery*v.b4_pedidos
  const ingB=v.precio_venta*kgNS
  const mpS=ingB*(v.b4_mp/100)
  const b4S=packS+delS+mktS+mpS
  const cvS=(b1+b2r)*v.animales_semana
  const cfS=b3S+mktS+packS+delS
  const totS=cvS+cfS+mpS
  const costoKg=kgNS>0?totS/kgNS:0
  const margenKg=v.precio_venta-costoKg
  const margenPct=v.precio_venta>0?(margenKg/v.precio_venta)*100:0
  const resSem=ingB-totS, resMes=resSem*4.33
  const b1kg=kgNS>0?b1S/kgNS:0, b2kg=kgNS>0?b2S/kgNS:0
  const b3kg=kgNS>0?b3S/kgNS:0, b4kg=kgNS>0?b4S/kgNS:0
  const maxKg=Math.max(b1kg,b2kg,b3kg,b4kg,1)
  const mixTotKg=v.mix.reduce((a,c)=>a+c.kg,0)
  const mixTotIng=v.mix.reduce((a,c)=>a+c.kg*c.precio*v.animales_semana,0)
  const mixPrecio=mixTotKg>0?mixTotIng/mixTotKg/v.animales_semana:0
  const sDias=v.s_meses*30, sCostoA=v.s_dia*sDias
  const sKgEx=(v.s_gdp-v.s_gdpsin)*sDias, sValEx=sKgEx*v.s_pnov
  const sRes=sValEx+(v.s_gdpsin>0?sKgEx/v.s_gdpsin:0)*80-sCostoA
  const inqIngA=v.inq_animales*v.inq_kg*v.inq_precio*v.inq_meses
  const inqT=Math.round(inqIngA/(200*v.inq_precio_t))
  const rampMap=m=>m<=1?v.cj_ramp1:m<=3?v.cj_ramp2:m<=6?v.cj_ramp3:v.cj_ramp4
  const ingMF=ingB*4.33, costoVM=cvS*4.33, costoFM=cfS*4.33+mpS*4.33
  let acum=-v.cj_inversion, beMonth=-1
  const cajaRows=MESES.map((mes,i)=>{const pct=rampMap(i+1);const ing=ingMF*(pct/100);const cv2=costoVM*(pct/100);const res=ing-cv2-costoFM;acum+=res;if(acum>=0&&beMonth<0)beMonth=i+1;return{mes,pct,ing,cv2,res,acum}})
  const mv=margenPct>=30?'green':margenPct>=15?'amber':'red'
  const rv=resMes>=0?'green':'red'

  const IR=(label,key,unit,sub,upd)=><IRow key={key} label={label} sub={sub} value={v[key]} onChange={val=>set(key,val)} unit={unit} result={fmt(v[key])} updated={upd} pinned={pin(key)} onPin={()=>togglePin(key)}/>

  const totalRow=(label,val)=><div style={{padding:'10px 20px',background:C.amberBg,display:'grid',gridTemplateColumns:'1fr 160px 105px 36px',alignItems:'center'}}>
    <div style={{fontSize:11,fontWeight:700,color:'#92400E'}}>{label}</div>
    <div/><div style={{textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:14,color:'#92400E',fontWeight:700,paddingRight:8}}>{fmt(val)}</div><div/>
  </div>

  return <div style={{background:C.bg,minHeight:'100vh'}}>
    <style>{GS}</style>

    {/* HEADER */}
    <div style={{background:C.navy,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:54,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <span style={{fontFamily:"'Fraunces',serif",fontSize:18,color:'#FFF',fontWeight:600}}>🥩 D2C Carne Premium</span>
        <span style={{fontSize:11,color:'#93C5FD',opacity:.8}}>Sol de Julio → Río Cuarto · Mayo 2026</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:10,color:'#93C5FD',fontFamily:"'DM Mono',monospace"}}>{saveStatus}</span>
        <SaveBtn onSave={handleSave} saved={savedAnim}/>
        <button onClick={resetAll} style={{padding:'7px 14px',fontSize:11,fontWeight:500,cursor:'pointer',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,background:'transparent',color:'#CBD5E1',fontFamily:"'DM Sans',sans-serif"}}>↺ Restablecer</button>
      </div>
    </div>

    {/* NAV */}
    <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'8px 24px',display:'flex',gap:4,flexWrap:'wrap',boxShadow:sh}}>
      {[['fin','◎','Financiero'],['mix','⊞','Mix de Cortes'],['caja','📊','Flujo de Caja'],['prod','🐄','Cinta Productiva'],['audit','⚑','Auditoría']].map(([id,icon,label])=>(
        <NavBtn key={id} active={mod===id} onClick={()=>setMod(id)} icon={icon} label={label}/>
      ))}
    </div>

    {/* ══ FINANCIERO ══ */}
    {mod==='fin'&&<>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
        <SI label="Kg netos/sem" value={Math.round(kgNS)+' kg'} variant="green"/>
        <Div/><SI label="Costo/kg" value={fmt(costoKg)} variant="amber"/>
        <Div/><SI label="Precio venta/kg" value={fmt(v.precio_venta)}/>
        <Div/><SI label="Margen bruto" value={fmtPct(margenPct)} variant={mv}/>
        <Div/><SI label="Resultado/mes" value={fmt(resMes)} variant={rv}/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['costos','Campo'],['faena','Faena'],['local','Local'],['comercial','Comercial'],['resumen','Resultado']].map(([id,label])=>(
            <Tab key={id} active={finTab===id} onClick={()=>setFinTab(id)} label={label}/>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 330px',minHeight:'calc(100vh - 172px)'}}>
        <div style={{padding:'20px 24px',overflowY:'auto'}}>

          {/* Rendimiento */}
          <div style={{background:'#FFFBEB',border:`1px solid ${C.amberBorder}`,borderRadius:14,padding:18,marginBottom:20,boxShadow:sh}}>
            <div style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12}}>Cadena de rendimiento · Factor compuesto 0.435</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr auto 1fr',gap:10,alignItems:'center'}}>
              {[['Peso vivo',Math.round(v.peso_vivo)+' kg'],null,['Media res',Math.round(kgG)+' kg'],null,['Carne neta',Math.round(kgN)+' kg']].map((item,i)=>
                item?<div key={i} style={{background:C.surface,border:`1px solid ${C.amberBorder}`,borderRadius:10,padding:'10px 14px',textAlign:'center',boxShadow:sh}}>
                  <div style={{fontSize:10,color:C.text3,marginBottom:3}}>{item[0]}</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:24,color:C.amber,fontWeight:600,lineHeight:1}}>{item[1]}</div>
                  <div style={{fontSize:10,color:C.text3,marginTop:2}}>por animal</div>
                </div>:<div key={i} style={{textAlign:'center',fontSize:11,color:C.amber,lineHeight:1.5}}>{i===1?'× 58%\ngancho\n→':'× 75%\ncarn.\n→'}</div>
              )}
            </div>
            <div style={{marginTop:12,fontSize:11,color:'#92400E',background:'#FEF3C7',borderRadius:8,padding:'8px 12px'}}>
              💡 Con valores actuales: <strong style={{fontFamily:"'DM Mono',monospace"}}>{fmt(b1)} ÷ {Math.round(kgN)} kg netos = <span style={{color:C.red}}>{fmt(kgN>0?b1/kgN:0)}/kg</span> solo de campo</strong>
            </div>
          </div>

          {finTab==='costos'&&<>
            <Card title="Costo de producción en campo" badge="Bloque 1" badgeColor="amber">
              {IR('Ternero de destete (180–200 kg)','b1_ternero','$/cab','CACG abr-2026: $6.580/kg prom → 200 kg = $1.316.000',true)}
              {IR('Suplementación invernal (210 días × $500/día)','b1_supl','$/cab','Mayo–noviembre · 7 meses confirmados',true)}
              {IR('Ración feedlot 100 días','b1_racion','$/cab','10–12 kg/día × $350/kg ración maíz/expeler',true)}
              {IR('Sanidad integral (vacunas, antiparas., veterinario)','b1_sanidad','$/cab',null,true)}
              {IR('Personal campo + infraestructura (prorrateado)','b1_personal','$/cab',null,true)}
              {totalRow('TOTAL BLOQUE 1 / semana',b1S)}
            </Card>
            <Card title="Rendimiento y escala" badge="Parámetros" badgeColor="blue">
              {IR('Rinde al gancho (% peso vivo)','rinde_gancho','%','Angus/Hereford bien terminado: 57–62%',false)}
              {IR('Rinde carnicero en desposte','rinde_carnicero','%','Sin hueso, sin grasa: 72–78%',false)}
              {IR('Peso vivo objetivo','peso_vivo','kg/cab',null,false)}
              {IR('Animales por semana','animales_semana','cab/sem',null,false)}
            </Card>
          </>}

          {finTab==='faena'&&<Card title="Faena y logística" badge="Bloque 2" badgeColor="amber">
            {IR('Flete campo → frigorífico origen (~180 km)','b2_flete1','$/cab','Vehículo propio o contratado',true)}
            {IR('Faena maquila (SENASA + pesaje + cámara 48h)','b2_faena','$/cab','Frigorífico norte de Córdoba o Frías',true)}
            {IR('Flete refrigerado → Río Cuarto (~500 km compartido)','b2_flete2','$/cab','Camión frío, carga compartida',true)}
            {IR('Guías, DT electrónico, certificados SENASA','b2_guias','$/cab',null,true)}
            <IRow label="Recupero menudencias (DESCUENTA el costo)" sub="Hígado, riñón, lengua, mondongo" value={v.b2_recupero} onChange={val=>set('b2_recupero',val)} unit="$/cab" result={'−'+fmt(v.b2_recupero)} resultColor={C.green} pinned={pin('b2_recupero')} onPin={()=>togglePin('b2_recupero')}/>
            {IR('IIBB + impuestos sobre faena','b2_iibb','$/cab',null,true)}
            {IR('Reserva contingencia DFD / pérdida de lote','b2_contingencia','$/cab','⚠ Nuevo — 1 animal con corte oscuro cada ~8 semanas',true)}
            {totalRow('TOTAL BLOQUE 2 / semana',b2S)}
          </Card>}

          {finTab==='local'&&<Card title="Costo operativo — Centro Río Cuarto" badge="Bloque 3" badgeColor="amber">
            {[['Alquiler del local','b3_alquiler','$/mes','Centro de procesamiento + pick-up',true],
              ['Electricidad (cámara + envasadora + iluminación)','b3_luz','$/mes','Tarifa comercial Río Cuarto',true],
              ['Despostador / maestro carnicero','b3_sueldo1','$/mes','Salario bruto + cargas sociales (~1.6×)',true],
              ['Operario envasado + armado pedidos','b3_sueldo2','$/mes','Part-time con cargas sociales',true],
              ['Insumos envasado al vacío','b3_insumos','$/mes','Bolsas premium D2C $800–1.200/unidad',true],
              ['Amortización maquinaria (5 años)','b3_amort','$/mes','Cámara + envasadora + sierra + balanza',true],
              ['Mantenimiento + limpieza + sanitización','b3_mant','$/mes',null,false],
              ['Seguros + habilitaciones + impuestos locales','b3_seguros','$/mes','Incluye gestión SENASA y RPPA',true],
              ['Adecuación edilicia SENASA (amort. 12 meses)','b3_obra','$/mes','⚠ Nuevo — trampa grasa, vestuario, piletas',true],
            ].map(([label,key,unit,sub,upd])=>(
              <IRow key={key} label={label} sub={sub} value={v[key]} onChange={val=>set(key,val)} unit={unit} result={fmt(v[key]/4.33)+'/sem'} updated={upd} pinned={pin(key)} onPin={()=>togglePin(key)}/>
            ))}
            {totalRow('TOTAL BLOQUE 3 / semana',b3S)}
          </Card>}

          {finTab==='comercial'&&<Card title="Costos de comercialización D2C" badge="Bloque 4" badgeColor="amber">
            {IR('Packaging por pedido','b4_pack','$/pedido','Bolsas premium D2C: $3.500–5.000/pedido real',true)}
            <IRow label="Pedidos promedio / semana" value={v.b4_pedidos} onChange={val=>set('b4_pedidos',val)} unit="pedidos" result={fmt(packS)+'/sem'} pinned={pin('b4_pedidos')} onPin={()=>togglePin('b4_pedidos')}/>
            {IR('Delivery última milla (costo/pedido)','b4_delivery','$/pedido','Moto con caja térmica',true)}
            <IRow label="Comisión pasarela de pago" value={v.b4_mp} onChange={val=>set('b4_mp',val)} unit="%" result={fmtPct(v.b4_mp)} pinned={pin('b4_mp')} onPin={()=>togglePin('b4_mp')}/>
            {IR('Marketing digital mensual','b4_mkt','$/mes','Pauta Meta + contenido + community manager',true)}
            {IR('Web + e-commerce + herramientas','b4_web','$/mes',null,false)}
            {IR('Responsable ventas / gestión digital','b4_ventas','$/mes','⚠ Nuevo — rol crítico para el canal D2C',true)}
            {totalRow('TOTAL BLOQUE 4 / semana',b4S)}
          </Card>}

          {finTab==='resumen'&&<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
              <Card title="Composición del costo por kg" badge="Desglose" badgeColor="blue">
                <div style={{padding:20}}>
                  <Bar label="B1 · Campo" value={b1kg} max={maxKg} color={C.green}/>
                  <Bar label="B2 · Faena y logística" value={b2kg} max={maxKg} color={C.amber}/>
                  <Bar label="B3 · Operativo local" value={b3kg} max={maxKg} color={C.blue}/>
                  <Bar label="B4 · Comercialización" value={b4kg} max={maxKg} color={C.red}/>
                  <div style={{marginTop:14,padding:12,background:C.greenBg,borderRadius:10,border:`1px solid ${C.greenBorder}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.green,marginBottom:3}}>PRECIO MÍNIMO DE EQUILIBRIO</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:24,color:C.greenDark,fontWeight:600}}>{fmt(costoKg)}/kg</div>
                    <div style={{fontSize:11,color:C.text3,marginTop:3}}>Para 30% de margen: <strong style={{color:C.green}}>{fmt(costoKg/0.7)}/kg</strong></div>
                  </div>
                </div>
              </Card>
              <Card title="Escenarios de venta parcial" badge="KPI crítico" badgeColor="red">
                <div style={{padding:20}}>
                  {[100,90,80,70,60,50].map(pct=>{
                    const kgV=kgNS*(pct/100)
                    const res2=v.precio_venta*kgV-(cvS*(pct/100)+cfS+mpS*(pct/100))
                    const ok=res2>=0
                    return <div key={pct} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',marginBottom:6,borderRadius:8,background:pct===70?(ok?C.greenBg:C.redBg):C.surface2,border:`${pct===70?2:1}px solid ${pct===70?(ok?C.greenBorder:C.redBorder):C.border}`}}>
                      <span style={{fontSize:12,fontWeight:pct===70?700:400,color:C.text2}}>{pct}% vendido</span>
                      <span style={{fontSize:11,color:C.text3,fontFamily:"'DM Mono',monospace"}}>{Math.round(kgV)} kg</span>
                      <span style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:700,color:ok?C.green:C.red}}>{fmt(res2)}</span>
                    </div>
                  })}
                  <div style={{marginTop:8,fontSize:11,color:C.text3,background:C.surface2,borderRadius:8,padding:'8px 12px'}}>⚠ El 70% es el KPI crítico: por debajo el modelo no es viable con precios de mayo 2026.</div>
                </div>
              </Card>
            </div>
            <Card title="Comparación v1 (original) vs v2 (mayo 2026)" badge="Auditoría de precios" badgeColor="red">
              <div style={{padding:20}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Concepto','V1 (original)','V2 (mayo 2026)','Diferencia'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${C.border}`,letterSpacing:'.05em'}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[['Costo ternero/cab','$180.000',fmt(v.b1_ternero),'red'],
                      ['Ración feedlot/cab','$90.000',fmt(v.b1_racion),'red'],
                      ['Packaging/pedido','$1.800',fmt(v.b4_pack),'red'],
                      ['Costo total/kg neto',fmt(3500),fmt(costoKg),'red'],
                      ['Precio necesario (30% margen)','~$10.000/kg',fmt(costoKg/0.7),'amber'],
                    ].map(([label,v1,v2,variant])=>(
                      <tr key={label} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:'10px 12px',fontSize:12,color:C.text}}>{label}</td>
                        <td style={{padding:'10px 12px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.green}}>{v1}</td>
                        <td style={{padding:'10px 12px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.red,fontWeight:700}}>{v2}</td>
                        <td style={{padding:'10px 12px'}}><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:20,background:variant==='red'?C.redBg:C.amberBg,color:variant==='red'?C.red:C.amber}}>▲ Subió</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>}
        </div>

        {/* RIGHT PANEL */}
        <div style={{background:C.surface,borderLeft:`1px solid ${C.border}`,padding:18,position:'sticky',top:0,maxHeight:'calc(100vh - 172px)',overflowY:'auto',boxShadow:'-2px 0 8px rgba(0,0,0,0.04)'}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:15,color:C.navy,fontWeight:600,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>📊 Tablero en tiempo real</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:14}}>
            <Kpi label="Kg netos / semana" value={Math.round(kgNS)+' kg'} sub={v.animales_semana+' novillos · ×0.435'} variant="green" full/>
            <Kpi label="Costo / semana" value={fmt(totS)} variant="amber"/>
            <Kpi label="Costo / kg neto" value={fmt(costoKg)} sub="envasado entregado" variant="amber"/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Desglose costo/kg</div>
            <Bar label="Campo" value={b1kg} max={maxKg} color={C.green}/>
            <Bar label="Faena + logística" value={b2kg} max={maxKg} color={C.amber}/>
            <Bar label="Operativo local" value={b3kg} max={maxKg} color={C.blue}/>
            <Bar label="Comercialización" value={b4kg} max={maxKg} color={C.red}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Precio de venta promedio/kg</div>
            <div style={{display:'flex',alignItems:'center',gap:5,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:10,padding:'7px 11px',marginBottom:5}}>
              <span style={{color:C.text3,fontSize:13}}>$</span>
              <input type="number" value={v.precio_venta} onChange={e=>set('precio_venta',e.target.value)} style={{background:'transparent',border:'none',fontFamily:"'Fraunces',serif",fontSize:20,color:C.navy,width:'100%',outline:'none',textAlign:'right',fontWeight:600}}/>
              <span style={{color:C.text3,fontSize:11}}>/kg</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
              <div style={{padding:'8px 10px',background:mv==='green'?C.greenBg:mv==='amber'?C.amberBg:C.redBg,borderRadius:8,border:`1px solid ${mv==='green'?C.greenBorder:mv==='amber'?C.amberBorder:C.redBorder}`}}>
                <div style={{fontSize:9,color:C.text3,marginBottom:2}}>Margen/kg</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:mv==='green'?C.green:mv==='amber'?C.amber:C.red}}>{fmt(margenKg)}</div>
              </div>
              <div style={{padding:'8px 10px',background:mv==='green'?C.greenBg:mv==='amber'?C.amberBg:C.redBg,borderRadius:8,border:`1px solid ${mv==='green'?C.greenBorder:mv==='amber'?C.amberBorder:C.redBorder}`}}>
                <div style={{fontSize:9,color:C.text3,marginBottom:2}}>Margen %</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:mv==='green'?C.green:mv==='amber'?C.amber:C.red}}>{fmtPct(margenPct)}</div>
              </div>
            </div>
          </div>
          <div style={{background:rv==='green'?C.greenBg:C.redBg,border:`1px solid ${rv==='green'?C.greenBorder:C.redBorder}`,borderRadius:12,padding:12}}>
            <div style={{fontSize:9,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Proyección semanal</div>
            {[['Ingresos brutos',fmt(ingB)],['Costos variables',fmt(cvS)],['Costos fijos sem.',fmt(cfS)]].map(([l,val])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0'}}>
                <span style={{color:C.text2}}>{l}</span>
                <span style={{fontFamily:"'DM Mono',monospace",color:C.text}}>{val}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${rv==='green'?C.greenBorder:C.redBorder}`,marginTop:8,paddingTop:8}}>
              {[['Resultado semana',fmt(resSem)],['Resultado mes',fmt(resMes)]].map(([l,val])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.text}}>{l}</span>
                  <span style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:600,color:rv==='green'?C.green:C.red}}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginTop:10,fontSize:10,color:C.text3,textAlign:'center',lineHeight:1.7}}>📌 = fijado · no editable<br/>Cambios se guardan automáticamente</div>
        </div>
      </div>
    </>}

    {/* ══ MIX DE CORTES ══ */}
    {mod==='mix'&&<>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',gap:16,alignItems:'center'}}>
        <SI label="Precio mix ponderado" value={fmt(mixPrecio)+'/kg'} variant="green"/>
        <Div/><SI label="Ingreso semanal" value={fmt(mixTotIng)}/>
        <Div/><SI label="Margen mix" value={fmt(mixTotIng-totS)} variant={mixTotIng-totS>=0?'green':'red'}/>
        <Div/><SI label="Resultado mensual" value={fmt((mixTotIng-totS)*4.33)} variant={(mixTotIng-totS)*4.33>=0?'green':'red'}/>
      </div>
      <div style={{padding:'24px'}}>
        <Alert type="warning" icon="⚠️" title="Punto ciego crítico — corregido en v2"
          body="El modelo original usaba $12.000/kg sin desglosar cortes. Los precios al consumidor en mayo 2026 van de $10.381 (picada) a $24.000 (lomo). El mix real determina la rentabilidad: la diferencia entre vender asado vs. cortes premium puede ser de $5.000–8.000/kg en el precio promedio ponderado."/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:20}}>
          <Card title="Distribución de cortes por res" badge="Editá kg y precio D2C" badgeColor="blue">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>
                {['Corte','Kg/res','Precio D2C $/kg','Ingreso/sem','%'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:h!=='Corte'?'right':'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {v.mix.map((c,i)=>{
                  const ing=c.kg*c.precio*v.animales_semana
                  const pct=mixTotIng>0?(ing/mixTotIng*100):0
                  const dot=i<=5?C.green:i<=8?C.amber:C.red
                  return <tr key={i} className="rh" style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'7px 14px',fontSize:12,color:C.text,fontWeight:500}}>
                      <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:dot,marginRight:8}}/>
                      {c.nombre}
                    </td>
                    <td style={{padding:'7px 14px',textAlign:'right'}}>
                      <input type="number" value={c.kg} onChange={e=>setMix(i,'kg',e.target.value)} style={{width:55,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:6,padding:'3px 7px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text,textAlign:'right',outline:'none'}}/>
                    </td>
                    <td style={{padding:'7px 14px',textAlign:'right'}}>
                      <input type="number" value={c.precio} onChange={e=>setMix(i,'precio',e.target.value)} style={{width:80,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:6,padding:'3px 7px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.text,textAlign:'right',outline:'none'}}/>
                    </td>
                    <td style={{padding:'7px 14px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:C.green}}>{fmt(ing)}</td>
                    <td style={{padding:'7px 14px',textAlign:'right',fontSize:11,color:C.text3}}>{pct.toFixed(1)}%</td>
                  </tr>
                })}
                <tr style={{background:C.surface2,borderTop:`2px solid ${C.border2}`}}>
                  <td style={{padding:'9px 14px',fontSize:12,fontWeight:700,color:C.text}}>TOTAL</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.green}}>{Math.round(mixTotKg)} kg</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.amber}}>{fmt(mixPrecio)}/kg</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontWeight:700,color:C.green}}>{fmt(mixTotIng)}</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontSize:11,color:C.text3}}>100%</td>
                </tr>
              </tbody>
            </table>
            <div style={{padding:'10px 20px',background:C.surface2,fontSize:10,color:C.text3}}>🟢 Premium (lomo, bifes, cuadril, vacío, nalga, peceto) · 🟡 Medios · 🔴 Económicos</div>
          </Card>
          <div>
            <Kpi label="Precio promedio ponderado" value={fmt(mixPrecio)+'/kg'} variant="green"/>
            <div style={{height:10}}/>
            <Kpi label="Margen bruto total" value={fmt(mixTotIng-totS)} variant={mixTotIng-totS>=0?'green':'red'}/>
            <div style={{height:10}}/>
            <Kpi label="Resultado mensual" value={fmt((mixTotIng-totS)*4.33)} variant={(mixTotIng-totS)*4.33>=0?'green':'red'}/>
            <div style={{height:16}}/>
            <Card title="Por segmento" badge="Ingresos" badgeColor="blue">
              <div style={{padding:14}}>
                {[['🟢 Premium',v.mix.slice(0,6).reduce((a,c)=>a+c.kg*c.precio*v.animales_semana,0),C.green],
                  ['🟡 Medios',v.mix.slice(6,9).reduce((a,c)=>a+c.kg*c.precio*v.animales_semana,0),C.amber],
                  ['🔴 Económicos',v.mix.slice(9).reduce((a,c)=>a+c.kg*c.precio*v.animales_semana,0),C.red],
                ].map(([label,ing,color])=>(
                  <div key={label} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                      <span style={{color:C.text2}}>{label}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",color:C.text,fontWeight:500}}>{mixTotIng>0?((ing/mixTotIng)*100).toFixed(0):0}%</span>
                    </div>
                    <div style={{height:6,background:C.surface2,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:mixTotIng>0?`${(ing/mixTotIng)*100}%`:'0%',background:color,borderRadius:3,transition:'width .4s'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>}

    {/* ══ FLUJO DE CAJA ══ */}
    {mod==='caja'&&<>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',gap:16,alignItems:'center'}}>
        <SI label="Capital trabajo inicial" value={fmt(cfS*4.33*3)} variant="amber"/>
        <Div/><SI label="Break-even" value={beMonth>0?'Mes '+beMonth:'> 12 meses'} variant={beMonth>0&&beMonth<=8?'green':'red'}/>
        <Div/><SI label="Inversión total" value={fmt(v.cj_inversion)} variant="red"/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          <Tab active={cajaTab==='mensual'} onClick={()=>setCajaTab('mensual')} label="Flujo mensual"/>
          <Tab active={cajaTab==='capital'} onClick={()=>setCajaTab('capital')} label="Capital de trabajo"/>
        </div>
      </div>
      <div style={{padding:'24px'}}>
        {cajaTab==='mensual'&&<>
          <Alert type="warning" icon="⚠️" title="Riesgo de liquidez no modelado en v1"
            body="El modelo anterior mostraba resultado semanal pero no el flujo de caja en el tiempo. Los primeros 3 meses son críticos: la habilitación SENASA tarda, la demanda arranca baja y los costos fijos corren desde el día 1."/>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
            {[['Inversión inicial','cj_inversion','$'],['% ventas mes 1','cj_ramp1','%'],['% ventas mes 2–3','cj_ramp2','%'],['% ventas mes 4–6','cj_ramp3','%'],['% ventas mes 7–12','cj_ramp4','%']].map(([label,key,unit])=>(
              <div key={key}>
                <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,background:C.surface,border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 10px',boxShadow:sh}}>
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} style={{background:'transparent',border:'none',fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:90,outline:'none',textAlign:'right'}}/>
                  <span style={{fontSize:11,color:C.text3}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <Card title="Proyección mes a mes — Primeros 12 meses" badge="Flujo de caja" badgeColor="blue">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>
                {['Mes','% Ventas','Kg vendidos','Ingresos','Costos var.','Costos fijos','Resultado','Acumulado'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 12px',textAlign:h!=='Mes'&&h!=='% Ventas'?'right':'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cajaRows.map(({mes,pct,ing,cv2,res,acum:ac},i)=>(
                  <tr key={i} className="rh" style={{borderBottom:`1px solid ${C.border}`,background:ac>=0?'rgba(22,163,74,.04)':'transparent'}}>
                    <td style={{padding:'9px 12px',fontSize:12,color:C.text,fontWeight:500}}>{mes}</td>
                    <td style={{padding:'9px 12px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:pct>=80?C.greenBg:pct>=60?C.amberBg:C.redBg,color:pct>=80?C.green:pct>=60?C.amber:C.red}}>{pct}%</span></td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text2}}>{Math.round(kgNS*(pct/100)*4.33)} kg</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text}}>{fmt(ing)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text}}>{fmt(cv2)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:11,color:C.text}}>{fmt(costoFM)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:res>=0?C.green:C.red}}>{fmt(res)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:ac>=0?C.green:C.red}}>{fmt(ac)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>}
        {cajaTab==='capital'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <Card title="Inversión inicial requerida" badge="Estimación" badgeColor="amber">
            <div style={{padding:20}}>
              {[['Cámara frigorífica (usada buen estado)','$6M – $8M'],['Envasadora al vacío doble cámara','$1.5M – $2.5M'],['Sierra + mesa acero inox.','$800k – $1.2M'],['Balanza + impresora etiquetas','$600k – $900k'],['Bolsas isotérmicas + equipo delivery','$400k – $600k'],['Adecuación edilicia SENASA','$2M – $5M'],['Habilitación + tramitación','$500k – $1M'],['Capital de trabajo (3 meses)','$8M – $12M']].map(([label,val])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.text2}}>{label}</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:C.amber}}>{val}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0'}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>TOTAL ESTIMADO</span>
                <span style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:600,color:C.red}}>$20M – $31M</span>
              </div>
            </div>
          </Card>
          <Card title="Puntos ciegos de liquidez" badge="⚑ Auditoría" badgeColor="red">
            <div style={{padding:20}}>
              {[['Ciclo productivo propio','Un ternero nacido en octubre no genera ingreso hasta septiembre del año +2. Son 23 meses de capital inmovilizado por animal.'],['IVA diferencial','En monotributo se pierde el 10.5% sobre ventas (~$400.000/semana). Definir situación impositiva antes de operar.'],['Habilitación SENASA','3–8 meses de proceso. Los costos fijos del local corren desde el día 1 sin ingresos operativos.'],['Primer año 100% compras','Los propios no completan su ciclo hasta el año +2. El costo del año 1 es el más alto de toda la operación.']].map(([title,body])=>(
                <div key={title} style={{marginBottom:12,padding:'10px 14px',background:C.redBg,borderRadius:10,border:`1px solid ${C.redBorder}`}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:3}}>⚑ {title}</div>
                  <div style={{fontSize:11,color:'#7F1D1D',lineHeight:1.6}}>{body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>}
      </div>
    </>}

    {/* ══ CINTA PRODUCTIVA ══ */}
    {mod==='prod'&&<>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
        <SI label="Vacas madre" value="100"/>
        <Div/><SI label="Destete 77%" value="77/año" variant="green"/>
        <Div/><SI label="Compras" value="67/año" variant="amber"/>
        <Div/><SI label="Ciclo propio" value="27–28 meses" variant="amber"/>
        <Div/><SI label="Faena" value="3/sem · 12/mes" variant="green"/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['gantt','Flujo anual'],['compras','Compras'],['inquilino','Inquilino'],['supl','Suplementación']].map(([id,label])=>(
            <Tab key={id} active={prodTab===id} onClick={()=>setProdTab(id)} label={label}/>
          ))}
        </div>
      </div>
      <div style={{padding:'24px'}}>
        {prodTab==='gantt'&&<>
          <Alert type="info" icon="📅" title="Gestación 9 meses correctamente modelada"
            body="Servicio ene–abr → gestación 9 meses → parición oct–ene → destete 7 meses → may–ago → recría 10–11 meses → 350 kg en mar–jul año N+2 → feedlot 100 días → faena. Ciclo total: 27–28 meses por animal propio. El primer año operativo del D2C es 100% animales comprados."/>
          <Card title="Flujo mensual — Estado estacionario (año N+2 en adelante)" badge="Cinta transportadora" badgeColor="green">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>
                {['Mes','Propios al feedlot','Compras necesarias','Total feedlot','Origen faena','Estado margen'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[['Ene–Feb','0','12/mes','12','100% comprados','Costo máximo','red'],['Mar–Abr','8–12','0–4','12','Mix (cabeza parición)','Propios empiezan','amber'],['May–Jun','15–20','0','12','100% propios','★ Mejor margen','green'],['Jul–Sep','10–15','0–2','12','Mayoría propios','Margen alto','green'],['Oct–Nov','3–5','7–9','12','Mix','Compras parcial','amber'],['Dic','0','12','12','100% comprados','Margen bajo','red']].map(([mes,propios,compras,feedlot,origen,estado,variant])=>(
                  <tr key={mes} className="rh" style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'10px 14px',fontSize:12,fontWeight:600,color:C.text}}>{mes}</td>
                    <td style={{padding:'10px 14px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.green,fontWeight:600}}>{propios}</td>
                    <td style={{padding:'10px 14px',fontFamily:"'DM Mono',monospace",fontSize:12,color:C.amber,fontWeight:600}}>{compras}</td>
                    <td style={{padding:'10px 14px',fontFamily:"'DM Mono',monospace",fontSize:13,color:C.navy,fontWeight:700}}>{feedlot}</td>
                    <td style={{padding:'10px 14px',fontSize:11,color:C.text2}}>{origen}</td>
                    <td style={{padding:'10px 14px'}}><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:variant==='green'?C.greenBg:variant==='amber'?C.amberBg:C.redBg,color:variant==='green'?C.green:variant==='amber'?C.amber:C.red}}>{estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>}
        {prodTab==='compras'&&<>
          <Alert type="info" icon="📊" title="Precio real ternero destete · Mayo 2026"
            body="CACG abril 2026: $6.580/kg promedio → animal 200 kg = $1.316.000. El modelo original usaba $180.000. Diferencia: $1.136.000/cabeza."/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{title:'Ventana ene–mar (27 animales)',sub:'Mejor precio relativo del año',rows:[['Precio estimado','$6.200–6.800/kg vivo','amber'],['Costo por animal','$1.240.000–1.360.000','amber'],['Suplementación adicional','$105.000/cab (7 meses)','red'],['Riesgo','Bajo — control total','green']]},
              {title:'⚠ Evitar agosto',sub:'Pico estacional garantizado',rows:[['Precio agosto','$7.200–8.000/kg vivo','red'],['Sobrecosto vs. enero','+$120.000–280.000/cab','red'],['Causa','Todos los invernadores comprando','red'],['Alternativa','Esperar → octubre','green']]},
              {title:'Opción sep (recriados 310 kg)',sub:'Sin suplementación · directo feedlot',rows:[['Precio estimado','~$1.581.000–1.674.000/cab','amber'],['Ahorro suplementación','$105.000/cab','green'],['Costo total campo','~$1.784.000/cab','green'],['Ventaja vs. ternero','$68.000 menos/animal','green']]},
              {title:'Regla de decisión',sub:'Con precios mayo 2026',rows:[['Precio ternero < $6.800/kg','Comprar + recría','green'],['Precio ternero > $7.200/kg','Evaluar recriado sep.','amber'],['Precio ternero > $8.000/kg','Esperar o reducir','red'],['NUNCA en agosto','Precio pico estacional','red']]},
            ].map(card=>(
              <Card key={card.title} title={card.title} subtitle={card.sub}>
                <div style={{padding:'12px 20px'}}>
                  {card.rows.map(([label,val,variant])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:12,color:C.text2}}>{label}</span>
                      <span style={{fontSize:12,fontWeight:600,color:variant==='green'?C.green:variant==='amber'?C.amber:C.red}}>{val}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>}
        {prodTab==='inquilino'&&<>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20,padding:18,background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:sh}}>
            {[['Animales inquilino','inq_animales','cab'],['Arrendamiento','inq_kg','kg/cab/mes'],['Precio novillo gordo','inq_precio','$/kg'],['Precio ternero destete','inq_precio_t','$/kg'],['Meses contrato','inq_meses','meses']].map(([label,key,unit])=>(
              <div key={key}>
                <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 10px'}}>
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} step={key==='inq_kg'?'.1':'1'} style={{background:'transparent',border:'none',fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:90,outline:'none',textAlign:'right'}}/>
                  <span style={{fontSize:11,color:C.text3}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{title:'Opción A — Cobro en dinero',sub:'Situación actual',rec:false,rows:[['Ingreso mensual',fmt(v.inq_animales*v.inq_kg*v.inq_precio),'default'],['Ingreso anual nominal',fmt(inqIngA),'default'],['Erosión inflacionaria','~30% en 6 meses','red'],['Poder real en dic-26',fmt(inqIngA*0.7),'amber'],['Aporte al flujo D2C','Ninguno','red']],foot:['Valor real anual',fmt(inqIngA*0.7),'amber']},
              {title:'Opción B — Cobro en terneros',sub:'✓ Recomendado',rec:true,rows:[['Terneros equiv. / año',inqT+' terneros de destete','green'],['Reducción compras ext.',Math.round((inqT/67)*100)+'% menos','green'],['Ahorro suplementación',fmt(inqT*105000),'green'],['Protección inflacionaria','Total — indexado al novillo','green'],['Aporte flujo mensual',(inqT/12).toFixed(1)+' animales/mes','green']],foot:['Impacto flujo mensual',(inqT/12).toFixed(1)+' animales/mes','green']},
            ].map(card=>(
              <div key={card.title} style={{background:C.surface,border:`1px solid ${card.rec?C.greenBorder:C.border}`,borderRadius:14,overflow:'hidden',boxShadow:sh}}>
                <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`,background:card.rec?C.greenBg:C.surface2,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span style={{fontFamily:"'Fraunces',serif",fontSize:15,color:C.text,fontWeight:600}}>{card.title}</span>
                    <span style={{fontSize:11,color:C.text3,marginLeft:10}}>{card.sub}</span>
                  </div>
                  {card.rec&&<span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:C.greenBg,border:`1px solid ${C.greenBorder}`,color:C.green}}>Recomendado</span>}
                </div>
                <div style={{padding:'12px 20px'}}>
                  {card.rows.map(([label,val,variant])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:12,color:C.text2}}>{label}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:variant==='green'?C.green:variant==='red'?C.red:variant==='amber'?C.amber:C.text}}>{val}</span>
                    </div>
                  ))}
                  <div style={{marginTop:14,padding:12,background:card.rec?C.greenBg:C.amberBg,borderRadius:10,border:`1px solid ${card.rec?C.greenBorder:C.amberBorder}`}}>
                    <div style={{fontSize:10,color:C.text3,marginBottom:2}}>{card.foot[0]}</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontSize:22,color:card.foot[2]==='green'?C.green:C.amber,fontWeight:600}}>{card.foot[1]}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}
        {prodTab==='supl'&&<>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20,padding:18,background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:sh}}>
            {[['Costo $/animal/día','s_dia','$/día','1'],['Meses suplementación','s_meses','meses','.5'],['Animales en recría','s_anim','cab','1'],['GDP con suplemento','s_gdp','kg/día','.05'],['GDP sin suplemento','s_gdpsin','kg/día','.05'],['Precio novillo gordo','s_pnov','$/kg','100']].map(([label,key,unit,step])=>(
              <div key={key}>
                <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 10px'}}>
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} step={step} style={{background:'transparent',border:'none',fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:80,outline:'none',textAlign:'right'}}/>
                  <span style={{fontSize:11,color:C.text3}}>{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            <Kpi label="Costo supl./animal" value={fmt(sCostoA)} sub="por temporada invernal" variant="amber"/>
            <Kpi label="Impacto en kg neto" value={fmt(sCostoA/((200+sKgEx)*0.435))} sub="$/kg adicional" variant="amber"/>
            <Kpi label="Kg extra ganados" value={sKgEx.toFixed(1)+' kg'} sub="vs. sin suplementar" variant="green"/>
            <Kpi label="Resultado neto/animal" value={(sRes>=0?'+':'')+fmt(sRes)} sub="beneficio económico" variant={sRes>=0?'green':'red'}/>
          </div>
          <Alert type={sRes>=0?'success':'warning'} icon={sRes>=0?'✅':'⚠️'}
            title={sRes>=0?'Suplementación económicamente justificada':'Revisar período de suplementación'}
            body={sRes>=0?`Cada animal genera +${fmt(sRes)} de resultado neto (${sKgEx.toFixed(0)} kg extra × $${v.s_pnov.toLocaleString('es-AR')}/kg). Sin suplementación los animales llegan al feedlot con 3–4 meses de retraso, rompiendo el flujo de la cinta y destruyendo el modelo D2C.`:'Con los parámetros actuales, concentrá la suplementación en julio–septiembre (máximo impacto) y evaluá reducir de 7 a 5 meses. Maíz propio vs. pellets puede bajar el costo diario 30–40%.'}/>
        </>}
      </div>
    </>}

    {/* ══ AUDITORÍA ══ */}
    {mod==='audit'&&<>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 24px',display:'flex',gap:16,alignItems:'center'}}>
        <SI label="Riesgos críticos" value="4" variant="red"/>
        <Div/><SI label="Riesgos medios" value="5" variant="amber"/>
        <Div/><SI label="Mejoras incorporadas" value="7" variant="green"/>
        <Div/><SI label="Viabilidad mayo 2026" value="Confirmada" variant="green"/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['riesgos','Riesgos'],['precios','Precios'],['checklist','Checklist']].map(([id,label])=>(
            <Tab key={id} active={auditTab===id} onClick={()=>setAuditTab(id)} label={label}/>
          ))}
        </div>
      </div>
      <div style={{padding:'24px'}}>
        {auditTab==='riesgos'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[{type:'error',icon:'🔴',title:'Habilitación SENASA / RPPA del local',body:'El proceso de habilitación como establecimiento elaborador en Córdoba toma 3–8 meses. Los costos fijos corren sin ingresos. Iniciar el trámite antes de firmar el contrato del local y contratar asesor bromatológico desde el día 0.'},
            {type:'error',icon:'🔴',title:'Capital inmovilizado en el ciclo productivo',body:'67 animales comprados × $1.316.000 = $88M inmovilizados. Los propios tardan 23 meses desde el nacimiento. Evaluar líneas ganaderas BNA/BICE o escalar gradualmente.'},
            {type:'error',icon:'🔴',title:'Corte oscuro (DFD) — pérdida de lote',body:'Con 500–600 km de viaje en verano, la probabilidad de DFD en 1 animal/mes es real. Un animal afectado = 33% de producción perdida. Protocolo: ayuno 12h + viaje nocturno + reserva de contingencia en B2.'},
            {type:'error',icon:'🔴',title:'Demanda insuficiente en el arranque',body:'Viable solo al 70%+ de venta semanal. Si el mes 1 vendés el 30%, el déficit es $8–10M. Pre-validar con 50 compradores comprometidos ANTES de invertir. Esa es la condición de inicio.'},
            {type:'warning',icon:'🟡',title:'IVA diferencial — trampa impositiva',body:'En monotributo no podés trasladar el IVA 10.5% sobre ventas = ~$400.000/semana perdidos. Definir situación impositiva antes de operar.'},
            {type:'warning',icon:'🟡',title:'Precio del ternero indexado al dólar',body:'Un salto cambiario del 20% sube el costo del animal en ~$260.000. Cláusula de ajuste trimestral de precios al consumidor ligada al MAG.'},
            {type:'warning',icon:'🟡',title:'Escasez de hacienda en 2026',body:'La faena cayó 8% interanual. El precio del ternero puede seguir subiendo. Contratos de compra forward con proveedores a precio fijo trimestral.'},
            {type:'warning',icon:'🟡',title:'Rol de ventas no presupuestado en v1',body:'El D2C sin gestor digital dedicado no escala. Incorporado en B4 como $400.000/mes. Sin este rol, el canal se apaga en pocas semanas.'},
            {type:'info',icon:'🔵',title:'Continuidad de la cadena de frío',body:'Falla del equipo de frío en el camión = pérdida del lote. Exigir seguro de carga + termógrafo certificado en cada viaje.'},
          ].map(r=><Alert key={r.title} type={r.type} icon={r.icon} title={r.title} body={r.body}/>)}
        </div>}
        {auditTab==='precios'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <Card title="Hacienda en pie — Remates feria abril 2026" badge="CACG" badgeColor="blue">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>{['Categoría','Peso','$/kg prom.'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {[['Terneros','180–200 kg','$6.580','amber'],['Novillitos','200–230 kg','$6.379','amber'],['Novillitos','260–300 kg','$5.337','default'],['Novillo gordo (SIO)','+430 kg','$4.297','green'],['Novillo gordo (MAG)','+430 kg','$4.375','green']].map(([cat,peso,precio,v])=>(
                  <tr key={cat+peso} className="rh" style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:'9px 14px',fontSize:12,color:C.text}}>{cat}</td>
                    <td style={{padding:'9px 14px',fontSize:12,color:C.text2}}>{peso}</td>
                    <td style={{padding:'9px 14px',fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:v==='green'?C.green:v==='amber'?C.amber:C.text}}>{precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Precios al consumidor — Carnicerías abril 2026" badge="IPCVA" badgeColor="blue">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>{['Corte','$/kg abr-26'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}</tr></thead>
              <tbody>
                {[['Picada común','$10.381'],['Asado de tira','$18.091'],['Nalga','$21.559'],['Vacío','$22.327'],['Cuadril','$21.357'],['Peceto','$23.391'],['Promedio ponderado','$18.559']].map(([corte,precio])=>(
                  <tr key={corte} className="rh" style={{borderBottom:`1px solid ${C.border}`,background:corte==='Promedio ponderado'?C.amberBg:'transparent'}}>
                    <td style={{padding:'9px 14px',fontSize:12,color:C.text,fontWeight:corte==='Promedio ponderado'?700:400}}>{corte}</td>
                    <td style={{padding:'9px 14px',fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:corte==='Promedio ponderado'?C.amber:C.text}}>{precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{padding:'10px 20px',fontSize:11,color:C.text3,background:C.surface2}}>La carne dejó de aumentar en abril 2026. Contexto favorable para D2C premium que no compite en precio sino en trazabilidad.</div>
          </Card>
        </div>}
        {auditTab==='checklist'&&<Card title="Checklist ejecutivo de lanzamiento" badge="12 pasos" badgeColor="blue">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:C.surface2}}>{['#','Acción','Horizonte','Bloquea','Responsable'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[['1','Consulta inicial SENASA + bromatólogo Río Cuarto','Semana 1','Todo','Productor','red'],['2','Validar 50 compradores comprometidos (pre-venta)','Semanas 1–4','Inversión','Productor','red'],['3','Definir situación impositiva (monotributo vs. RI)','Semana 2','Finanzas','Contador','amber'],['4','Acordar servicio de faena con frigorífico en ruta','Mes 1','Logística','Productor','amber'],['5','Firmar local + iniciar obra de adecuación SENASA','Mes 1–2','Operación','Productor','amber'],['6','Comprar equipos (cámara, envasadora, sierra)','Mes 2','Producción','Productor','amber'],['7','Contratar despostador + sistema de trazabilidad','Mes 2–3','Calidad','Productor','blue'],['8','Lanzar Instagram + WhatsApp Business','Mes 1','Ventas','Digital','blue'],['9','Contratar responsable ventas digital (part-time)','Mes 2','Demanda','Productor','blue'],['10','Primera faena piloto (1 novillo) + degustación chefs','Mes 3–4','Marca','Todo','green'],['11','Lanzamiento e-commerce + primer ciclo semanal','Mes 4–5','Escala','Todo','green'],['12','Negociar canje arriendo con inquilino en terneros','Antes nov-26','Costos','Productor','green']].map(([num,accion,horizonte,bloquea,resp,variant])=>(
                <tr key={num} className="rh" style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:'10px 14px',fontFamily:"'Fraunces',serif",fontSize:16,fontWeight:600,color:C.navy}}>{num}</td>
                  <td style={{padding:'10px 14px',fontSize:12,color:C.text}}>{accion}</td>
                  <td style={{padding:'10px 14px',fontSize:11,color:C.text2}}>{horizonte}</td>
                  <td style={{padding:'10px 14px'}}><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:variant==='red'?C.redBg:variant==='amber'?C.amberBg:variant==='green'?C.greenBg:C.blueBg,color:variant==='red'?C.red:variant==='amber'?C.amber:variant==='green'?C.green:C.blue}}>{bloquea}</span></td>
                  <td style={{padding:'10px 14px',fontSize:11,color:C.text3}}>{resp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'12px 20px',background:C.amberBg,fontSize:11,color:'#92400E'}}>⭐ El primer novillo de prueba (paso 10) es el hito más importante: valida la cadena completa y genera contenido real para redes. No saltear este paso.</div>
        </Card>}
      </div>
    </>}

    <div style={{padding:'12px 24px',borderTop:`1px solid ${C.border}`,fontSize:10,color:C.text3,textAlign:'center',background:C.surface}}>
      D2C Carne Premium v2.0 · Precios mayo 2026 · CACG / MAGYP / IPCVA · Sol de Julio → Río Cuarto · Firebase Firestore
    </div>
  </div>
}
