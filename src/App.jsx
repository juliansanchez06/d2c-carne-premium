import { useState, useEffect, useCallback, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'

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
const auth = getAuth(firebaseApp)
const DOC_REF = doc(db, 'd2c-carne', 'config')

const DEFAULTS = {
  b1_ternero:1316000,b1_supl:105000,b1_racion:385000,b1_sanidad:18000,b1_personal:28000,
  peso_vivo:450,rinde_gancho:58,rinde_carnicero:84.5,animales_semana:3,
  vacas_madre:100,tasa_destete:77,
  b2_flete1:25000,b2_faena:40000,b2_flete2:60000,b2_guias:6000,b2_recupero:15000,b2_iibb:8000,b2_contingencia:25000,
  b3_alquiler:600000,b3_luz:320000,b3_sueldo1:900000,b3_sueldo2:550000,b3_insumos:200000,b3_amort:220000,b3_mant:90000,b3_seguros:150000,b3_obra:250000,
  b4_pack:4000,b4_pedidos:60,b4_delivery:2000,b4_mp:5.99,b4_mkt:200000,b4_web:50000,b4_ventas:400000,
  precio_venta:20000,
  s_dia:500,s_meses:7,s_anim:144,s_gdp:0.65,s_gdpsin:0.25,s_pnov:4400,
  inq_animales:80,inq_kg:5.5,inq_precio:4400,inq_precio_t:6580,inq_meses:12,
  cj_inversion:5000000,cj_ramp1:30,cj_ramp2:55,cj_ramp3:75,cj_ramp4:90,
  fz_modalidad:'canje',
  fz_precio_nopremium:8000,
  fz_costo_servicio:100000,
  fz_flete_premium:35000,
  pinned:{},
  // Despiece real de novillo 450kg → res al gancho 261kg. kg = por animal (media res ×2).
  // premium:true = lo vendés vos D2C · premium:false = lo comercializa Frideza
  mix:[
    {nombre:'Lomo',kg:4.7,precio:35000,premium:true},
    {nombre:'Bife de chorizo (angosto)',kg:11.7,precio:30000,premium:true},
    {nombre:'Bife ancho (ojo de bife)',kg:10.4,precio:28000,premium:true},
    {nombre:'Cuadril',kg:11.0,precio:27000,premium:true},
    {nombre:'Colita de cuadril',kg:3.4,precio:28000,premium:true},
    {nombre:'Vacío',kg:9.4,precio:29000,premium:true},
    {nombre:'Entraña',kg:2.3,precio:32000,premium:true},
    {nombre:'Nalga',kg:15.1,precio:22000,premium:false},
    {nombre:'Bola de lomo',kg:9.4,precio:20000,premium:false},
    {nombre:'Cuadrada',kg:8.4,precio:19000,premium:false},
    {nombre:'Peceto',kg:6.0,precio:23000,premium:false},
    {nombre:'Tapa de nalga',kg:5.0,precio:19000,premium:false},
    {nombre:'Matambre',kg:5.5,precio:21000,premium:false},
    {nombre:'Tapa de asado',kg:6.8,precio:18000,premium:false},
    {nombre:'Asado de tira',kg:30.0,precio:18500,premium:false},
    {nombre:'Falda',kg:8.4,precio:12000,premium:false},
    {nombre:'Paleta',kg:19.1,precio:17500,premium:false},
    {nombre:'Tortuguita',kg:5.0,precio:17000,premium:false},
    {nombre:'Roast beef',kg:9.4,precio:18000,premium:false},
    {nombre:'Marucha / aguja',kg:8.1,precio:16000,premium:false},
    {nombre:'Osobuco',kg:9.4,precio:14000,premium:false},
    {nombre:'Picada / recortes',kg:22.2,precio:12000,premium:false},
  ]
}


const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR')
const fmtPct = (n) => (Math.round(n*10)/10).toFixed(1)+'%'
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// Colors
const C = {
  bg:'#F2EDE8',surface:'#FAF7F4',surface2:'#EDE8E2',border:'#DDD6CF',border2:'#C5BCB4',
  text:'#1A202C',text2:'#4A5568',text3:'#94A3B8',
  green:'#16A34A',greenBg:'#F0FDF4',greenBorder:'#86EFAC',greenDark:'#14532D',
  amber:'#D97706',amberBg:'#FFFBEB',amberBorder:'#FCD34D',
  red:'#DC2626',redBg:'#FEF2F2',redBorder:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBorder:'#93C5FD',
  indigo:'#4F46E5',indigoBg:'#EEF2FF',
  navy:'#6B1E1E',
}
const sh = '0 1px 3px rgba(0,0,0,0.08)'
const shMd = '0 4px 6px rgba(0,0,0,0.07)'

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};color:${C.text};font-family:'Inter',system-ui,-apple-system,sans-serif;font-size:13px;letter-spacing:-0.01em;}
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
    <div style={{fontFamily:"'Inter',sans-serif",fontSize:large?28:22,color:vs.vc,lineHeight:1,fontWeight:600}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:vs.lc,marginTop:4,opacity:.8}}>{sub}</div>}
  </div>
}

function NavBtn({active,onClick,icon,label}){
  return <button onClick={onClick} className="nbtn" style={{padding:'9px 16px',fontSize:12,fontWeight:active?600:500,cursor:'pointer',border:'none',borderRadius:8,background:active?C.navy:'transparent',color:active?'#FFF':C.text2,display:'flex',alignItems:'center',gap:7,transition:'all .15s',whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif"}}><span>{icon}</span>{label}</button>
}

function Tab({active,onClick,label}){
  return <button onClick={onClick} className="tbtn" style={{padding:'7px 16px',fontSize:11,fontWeight:active?600:400,cursor:'pointer',border:'none',borderBottom:active?`2px solid ${C.indigo}`:'2px solid transparent',background:'transparent',color:active?C.indigo:C.text3,transition:'all .12s',whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif"}}>{label}</button>
}

function SaveBtn({onSave,saved}){
  return <button onClick={onSave} className="sbtn" style={{padding:'8px 20px',fontSize:12,fontWeight:600,cursor:'pointer',border:'none',borderRadius:8,background:saved?C.greenBg:C.navy,color:saved?C.green:'#FFF',display:'flex',alignItems:'center',gap:7,fontFamily:"'Inter',sans-serif",boxShadow:sh,transition:'all .15s'}}>{saved?'✓ Guardado':'💾 Guardar'}</button>
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
        <span style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:C.text,fontWeight:600}}>{title}</span>
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
      <input type="number" value={value} onChange={e=>onChange(e.target.value)} disabled={pinned} style={{width:'100%',background:pinned?C.surface2:C.surface,border:`1px solid ${pinned?C.indigo:C.border2}`,borderRadius:7,padding:'5px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:pinned?C.indigo:C.text,textAlign:'right',outline:'none',cursor:pinned?'not-allowed':'text'}}/>
      <span style={{fontSize:10,color:C.text3,whiteSpace:'nowrap',minWidth:26}}>{unit}</span>
    </div>
    <div style={{textAlign:'right',fontSize:12,color:resultColor||C.text2,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,paddingRight:8}}>{result}</div>
    {onPin?<PinBtn pinned={pinned} onPin={onPin}/>:<div/>}
  </div>
}

function Bar({label,value,max,color}){
  const pct=max>0?Math.min(100,(value/max)*100):0
  return <div style={{marginBottom:9}}>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
      <span style={{color:C.text2}}>{label}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",color:C.text,fontWeight:500}}>{fmt(value)}/kg</span>
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
    <div style={{fontFamily:"'Inter',sans-serif",fontSize:18,color:c,fontWeight:600,lineHeight:1}}>{value}</div>
  </div>
}
const Div=()=><div style={{width:1,height:30,background:C.border}}/>



// ── LOGO SVG ─────────────────────────────────────────────────
function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      {/* Fondo crema */}
      <rect width="500" height="500" fill="#F2EDE8" rx="60"/>
      {/* Círculo exterior */}
      <circle cx="250" cy="210" r="175" fill="none" stroke="#1a1a1a" strokeWidth="10"/>
      {/* Silueta vaca (cuerpo) */}
      <ellipse cx="255" cy="195" rx="85" ry="55" fill="#1a1a1a"/>
      {/* Cabeza */}
      <ellipse cx="330" cy="165" rx="38" ry="30" fill="#1a1a1a"/>
      {/* Hocico */}
      <ellipse cx="362" cy="170" rx="18" ry="14" fill="#3a1a1a"/>
      {/* Cuerno */}
      <path d="M335 142 Q345 120 358 128" fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round"/>
      {/* Pata delantera izq */}
      <rect x="185" y="240" width="18" height="50" rx="6" fill="#1a1a1a"/>
      {/* Pata delantera der */}
      <rect x="220" y="240" width="18" height="50" rx="6" fill="#1a1a1a"/>
      {/* Pata trasera izq */}
      <rect x="275" y="240" width="18" height="50" rx="6" fill="#1a1a1a"/>
      {/* Pata trasera der */}
      <rect x="310" y="240" width="18" height="50" rx="6" fill="#1a1a1a"/>
      {/* Cola */}
      <path d="M172 200 Q148 185 152 210 Q148 230 162 235" fill="none" stroke="#1a1a1a" strokeWidth="7" strokeLinecap="round"/>
      {/* Ubre */}
      <ellipse cx="230" cy="248" rx="25" ry="12" fill="#8B4A4A"/>
      {/* Árbol (izquierda) */}
      <rect x="108" y="230" width="10" height="45" fill="#2d4a1a"/>
      <ellipse cx="113" cy="215" rx="22" ry="28" fill="#2d4a1a"/>
      {/* Líneas campo (pasto) */}
      <path d="M90 278 Q250 255 410 270" fill="none" stroke="#2d4a1a" strokeWidth="4"/>
      {/* Banner rojo */}
      <rect x="60" y="300" width="380" height="75" rx="8" fill="#6B1E1E"/>
      <rect x="60" y="300" width="380" height="75" rx="8" fill="none" stroke="#1a1a1a" strokeWidth="3"/>
      {/* Remaches */}
      <circle cx="85" cy="315" r="5" fill="#c8a060"/>
      <circle cx="415" cy="315" r="5" fill="#c8a060"/>
      <circle cx="85" cy="360" r="5" fill="#c8a060"/>
      <circle cx="415" cy="360" r="5" fill="#c8a060"/>
      {/* Texto EL RETIRO */}
      <text x="250" y="354" fontFamily="'Arial Black',sans-serif" fontSize="46" fontWeight="900" fill="#F2EDE8" textAnchor="middle" letterSpacing="4">EL RETIRO</text>
      {/* Subtítulo */}
      <text x="250" y="415" fontFamily="'Arial',sans-serif" fontSize="18" fontWeight="400" fill="#1a1a1a" textAnchor="middle" letterSpacing="3">DE NUESTRO CAMPO</text>
      <text x="250" y="438" fontFamily="'Arial',sans-serif" fontSize="18" fontWeight="400" fill="#1a1a1a" textAnchor="middle" letterSpacing="3">A TU MESA</text>
      {/* Líneas decorativas */}
      <line x1="80" y1="415" x2="155" y2="415" stroke="#1a1a1a" strokeWidth="2"/>
      <line x1="345" y1="415" x2="420" y2="415" stroke="#1a1a1a" strokeWidth="2"/>
    </svg>
  )
}

// ── LOGIN SCREEN ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Completá usuario y contraseña.'); return }
    setLoading(true); setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onLogin()
    } catch (err) {
      const msgs = {
        'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
        'auth/invalid-email': 'El formato del email no es válido.',
      }
      setError(msgs[err.code] || 'Error al iniciar sesión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F2EDE8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LogoMark size={180}/>
        </div>

        {/* CARD */}
        <div style={{
          background: '#FAF7F4', borderRadius: 20,
          border: '1px solid #DDD6CF',
          boxShadow: '0 4px 24px rgba(107,30,30,0.08)',
          padding: '32px 28px',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6B1E1E', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Acceso interno
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              Plataforma de gestión D2C · El Retiro
            </div>
          </div>

          <form onSubmit={handleLogin}>
            {/* EMAIL */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: `1px solid ${error ? '#FCA5A5' : '#DDD6CF'}`,
                  fontSize: 14, color: '#1A202C', background: '#FAF7F4',
                  outline: 'none', fontFamily: "'Inter', sans-serif",
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#6B1E1E'}
                onBlur={e => e.target.style.borderColor = error ? '#FCA5A5' : '#DDD6CF'}
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10,
                    border: `1px solid ${error ? '#FCA5A5' : '#DDD6CF'}`,
                    fontSize: 14, color: '#1A202C', background: '#FAF7F4',
                    outline: 'none', fontFamily: "'Inter', sans-serif",
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#6B1E1E'}
                  onBlur={e => e.target.style.borderColor = error ? '#FCA5A5' : '#DDD6CF'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
                    color: '#94A3B8', padding: 0,
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8,
                padding: '10px 14px', fontSize: 12, color: '#DC2626', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: loading ? '#C5BCB4' : '#6B1E1E',
                color: '#FAF7F4', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em',
                transition: 'all .15s',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(107,30,30,0.25)',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#94A3B8' }}>
          El Retiro · Sol de Julio → Río Cuarto · Acceso restringido
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null)
  const [authLoading,setAuthLoading]=useState(true)
  const [mod,setMod]=useState('fin')
  const [finTab,setFinTab]=useState('costos')
  const [prodTab,setProdTab]=useState('gantt')
  const [auditTab,setAuditTab]=useState('riesgos')
  const [cajaTab,setCajaTab]=useState('mensual')
  const [saveStatus,setSaveStatus]=useState('cargando...')
  const [savedAnim,setSavedAnim]=useState(false)
  const [vals,setVals]=useState(DEFAULTS)
  const debRef=useRef(null)

  // Auth state listener
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  },[])

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
    setVals(p=>{const m=p.mix.map((c,idx)=>idx===i?{...c,[field]:field==='premium'?val:(parseFloat(val)||0)}:c);const n={...p,mix:m};autoSave(n);return n})
  },[autoSave])

  const resetAll=useCallback(()=>{
    if(!window.confirm('¿Restablecer todos los valores a los defaults de mayo 2026?'))return
    const n={...DEFAULTS,pinned:{}};setVals(n);setDoc(DOC_REF,n,{merge:true}).then(()=>setSaveStatus('restablecido'))
  },[])

  const v=vals
  const pin=k=>!!(v.pinned?.[k])

  // ── Calculations · MODELO DOS CANALES (El Retiro premium + Frideza no-premium) ──
  const kgG=v.peso_vivo*(v.rinde_gancho/100)
  const kgN=kgG*(v.rinde_carnicero/100)           // carne neta total / animal
  const anim=v.animales_semana

  // ── CINTA PRODUCTIVA · todo derivado de animales_semana (fuente de verdad) ──
  const faenaMes = Math.round(anim*4.33)            // animales faenados/mes
  const faenaAnio = Math.round(anim*52)             // animales faenados/año
  const terneroPropios = Math.round(v.vacas_madre*(v.tasa_destete/100))  // destete propio/año
  const comprasAnio = Math.max(0, faenaAnio-terneroPropios)              // a comprar/año
  const comprasMes = Math.round(comprasAnio/12)
  const propiosMes = Math.round(terneroPropios/12)

  // Separar premium (vos) vs no-premium (Frideza)
  const kgPremium  = v.mix.filter(c=>c.premium).reduce((a,c)=>a+c.kg,0)   // kg premium/animal
  const kgNoPrem   = v.mix.filter(c=>!c.premium).reduce((a,c)=>a+c.kg,0)  // kg Frideza/animal
  const kgPremiumS = kgPremium*anim                                       // kg premium/semana
  const kgNoPremS  = kgNoPrem*anim

  // Valor de mercado del no-premium en gancho (lo que vale la carne que entregás)
  const valorNoPremium  = kgNoPrem*v.fz_precio_nopremium       // $/animal en gancho
  const valorNoPremiumS = valorNoPremium*anim

  // Bloque 1 — costo del animal en campo
  const b1=v.b1_ternero+v.b1_supl+v.b1_racion+v.b1_sanidad+v.b1_personal
  const b1S=b1*anim

  // Bloque 2 — logística. Frideza cubre faena+desposte+ENVASADO vía canje.
  // Vos solo pagás los fletes (hacienda→Frideza y premium envasado→Río Cuarto) + guías.
  const b2r = v.fz_modalidad==='canje'
    ? (v.b2_flete1 + v.fz_flete_premium + v.b2_guias)
    : (v.b2_flete1+v.b2_faena+v.b2_flete2+v.b2_guias+v.b2_iibb+v.b2_contingencia-v.b2_recupero)
  const b2S=b2r*anim

  // ── CANJE PURO ──
  // Frideza se queda TODO el no-premium como pago único por faena+desposte+envasado.
  // El servicio (fz_costo_servicio) se PAGA CON la carne no-premium, no aparte.
  // Si el no-premium vale más que el servicio, Frideza te liquida la diferencia en plata.
  // Neto que recibís del no-premium = valor en gancho − costo del servicio que prestó Frideza
  const costoServicio = v.fz_modalidad==='canje' ? v.fz_costo_servicio : 0
  const netoNoPremium = valorNoPremium - costoServicio       // lo que te queda (puede liquidarse en $)
  const netoNoPremiumS = netoNoPremium*anim

  // MÉTODO 2: el neto del no-premium reduce el costo del animal asignado a premium
  const costoNetoAnimal = (b1 + b2r) - netoNoPremium
  const costoNetoAnimalS = costoNetoAnimal*anim

  // Bloque 3 — operativo local. Con Frideza envasando, solo necesitás depósito chico.
  const b3m=v.b3_alquiler+v.b3_luz+v.b3_sueldo1+v.b3_sueldo2+v.b3_insumos+v.b3_amort+v.b3_mant+v.b3_seguros+v.b3_obra
  const b3S=b3m/4.33

  // Bloque 4 — comercialización D2C (igual)
  const mktS=(v.b4_mkt+v.b4_web+v.b4_ventas)/4.33
  const packS=v.b4_pack*v.b4_pedidos
  const delS=v.b4_delivery*v.b4_pedidos

  // Mix premium: ingreso real basado en cortes premium
  const mixTotKg=v.mix.reduce((a,c)=>a+c.kg,0)                            // todos los kg
  const ingPremiumS = v.mix.filter(c=>c.premium).reduce((a,c)=>a+c.kg*c.precio*anim,0)
  const mixPrecioPrem = kgPremium>0 ? ingPremiumS/kgPremium/anim : 0      // $/kg ponderado premium
  const precioVentaPrem = mixPrecioPrem                                   // precio efectivo premium

  // Ingreso y comisión MP sobre ingreso premium real (FIX bug #2)
  const ingB = ingPremiumS
  const mpS  = ingB*(v.b4_mp/100)

  // Costos: variables (animal neto + pack + del) y fijos (b3 + mkt) — FIX bug #1
  const cvS = costoNetoAnimalS + packS + delS
  const cfS = b3S + mktS
  const totS = cvS + cfS + mpS

  // Costo por kg PREMIUM (lo único que vendés)
  const costoKg = kgPremiumS>0 ? totS/kgPremiumS : 0
  const margenKg = precioVentaPrem - costoKg
  const margenPct = precioVentaPrem>0 ? (margenKg/precioVentaPrem)*100 : 0
  const resSem = ingB-totS, resMes=resSem*4.33

  // Breakdown costo/kg premium
  const b1kg=kgPremiumS>0?costoNetoAnimalS/kgPremiumS:0
  const b3kg=kgPremiumS>0?b3S/kgPremiumS:0
  const b4kg=kgPremiumS>0?(packS+delS+mktS+mpS)/kgPremiumS:0
  const maxKg=Math.max(b1kg,b3kg,b4kg,1)

  // compat con UI vieja del módulo Mix
  const kgNS=kgPremiumS
  const mixTotIng=ingPremiumS
  const mixPrecio=mixPrecioPrem
  const b2kg=0
  const b4S=packS+delS+mktS+mpS
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
    <div/><div style={{textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:'#92400E',fontWeight:700,paddingRight:8}}>{fmt(val)}</div><div/>
  </div>

  // Auth gate
  if (authLoading) return (
    <div style={{minHeight:'100vh',background:'#F2EDE8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter',sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <LogoMark size={120}/>
        <div style={{fontSize:12,color:'#94A3B8'}}>Cargando...</div>
      </div>
    </div>
  )
  if (!user) return <LoginScreen onLogin={()=>{}}/>

  return <div style={{background:C.bg,minHeight:'100vh'}}>
    <style>{GS}</style>

    {/* HEADER */}
    <div style={{background:C.navy,padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:54,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <LogoMark size={36}/>
        <div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:'#FFF',fontWeight:800,letterSpacing:'-0.02em',lineHeight:1}}>EL RETIRO</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',letterSpacing:'0.06em',marginTop:1}}>DE NUESTRO CAMPO A TU MESA</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:10,color:'#93C5FD',fontFamily:"'JetBrains Mono',monospace"}}>{saveStatus}</span>
        <SaveBtn onSave={handleSave} saved={savedAnim}/>
        <button onClick={resetAll} style={{padding:'7px 14px',fontSize:11,fontWeight:500,cursor:'pointer',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,background:'transparent',color:'#CBD5E1',fontFamily:"'Inter',sans-serif"}}>↺ Restablecer</button>
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
        <SI label="Kg premium/sem" value={Math.round(kgPremiumS)+' kg'} variant="green"/>
        <Div/><SI label="Costo/kg premium" value={fmt(costoKg)} variant="amber"/>
        <Div/><SI label="Precio premium/kg" value={fmt(precioVentaPrem)}/>
        <Div/><SI label="Margen bruto" value={fmtPct(margenPct)} variant={mv}/>
        <Div/><SI label="Resultado/mes" value={fmt(resMes)} variant={rv}/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['costos','Campo'],['frideza','Frideza'],['local','Local'],['comercial','Comercial'],['resumen','Resultado']].map(([id,label])=>(
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
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,color:C.amber,fontWeight:600,lineHeight:1}}>{item[1]}</div>
                  <div style={{fontSize:10,color:C.text3,marginTop:2}}>por animal</div>
                </div>:<div key={i} style={{textAlign:'center',fontSize:11,color:C.amber,lineHeight:1.5}}>{i===1?'× 58%\ngancho\n→':'× 75%\ncarn.\n→'}</div>
              )}
            </div>
            <div style={{marginTop:12,fontSize:11,color:'#92400E',background:'#FEF3C7',borderRadius:8,padding:'8px 12px'}}>
              💡 Con valores actuales: <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmt(b1)} ÷ {Math.round(kgN)} kg netos = <span style={{color:C.red}}>{fmt(kgN>0?b1/kgN:0)}/kg</span> solo de campo</strong>
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

          {finTab==='frideza'&&<>
            <Card title="Acuerdo con Frideza" badge="Modelo dos canales" badgeColor="blue">
              <div style={{padding:'4px 0'}}>
                {IR('Flete campo → Frideza (~180 km)','b2_flete1','$/cab','Hacienda en pie al frigorífico',true)}
                {IR('Flete premium envasados → Río Cuarto','fz_flete_premium','$/cab','Solo los cortes premium ya envasados al vacío',true)}
                {IR('Guías, DT electrónico, certificados','b2_guias','$/cab',null,false)}
                {IR('Servicio Frideza: faena + desposte + envasado al vacío','fz_costo_servicio','$/cab','Se paga con la carne no-premium, no en efectivo',false)}
                {IR('Precio del no-premium en gancho','fz_precio_nopremium','$/kg','Valor de la carne que le dejás a Frideza',false)}
              </div>
            </Card>
            <Card title="Reparto de la res" badge="Premium vs No-Premium" badgeColor="green">
              <div style={{padding:'16px 20px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
                  <div style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:12,padding:'14px 16px'}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.green,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>EL RETIRO (vos)</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:700,color:C.greenDark}}>{kgPremium.toFixed(0)} kg</div>
                    <div style={{fontSize:11,color:C.text3,marginTop:2}}>{kgN>0?Math.round(kgPremium/kgN*100):0}% de la carne · {v.mix.filter(c=>c.premium).length} cortes premium</div>
                    <div style={{marginTop:8,fontSize:12,color:C.text2}}>Ingreso/sem: <strong style={{color:C.green}}>{fmt(ingPremiumS)}</strong></div>
                  </div>
                  <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 16px'}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.text2,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>FRIDEZA</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,fontWeight:700,color:C.text}}>{kgNoPrem.toFixed(0)} kg</div>
                    <div style={{fontSize:11,color:C.text3,marginTop:2}}>{kgN>0?Math.round(kgNoPrem/kgN*100):0}% de la carne · {v.mix.filter(c=>!c.premium).length} cortes</div>
                    <div style={{marginTop:8,fontSize:12,color:C.text2}}>Valor canje/sem: <strong>{fmt(valorNoPremiumS)}</strong></div>
                  </div>
                </div>
                <div style={{background:C.blueBg,border:`1px solid ${C.blueBorder}`,borderRadius:10,padding:'12px 16px'}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.blue,marginBottom:8}}>💡 Canje puro — Frideza envasa y se queda el no-premium</div>
                  <div style={{fontSize:12,color:C.text2,lineHeight:1.9}}>
                    Valor no-premium en gancho ({kgNoPrem.toFixed(0)} kg): <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmt(valorNoPremium)}</strong><br/>
                    − Servicio Frideza (faena+desposte+<strong>envasado</strong>): <strong style={{fontFamily:"'JetBrains Mono',monospace",color:C.red}}>−{fmt(costoServicio)}</strong><br/>
                    <span style={{display:'block',marginTop:4,paddingTop:4,borderTop:`1px solid ${C.blueBorder}`}}>
                    = Neto que recibís del no-premium: <strong style={{fontFamily:"'JetBrains Mono',monospace",color:C.green}}>{fmt(netoNoPremium)}/animal</strong>
                    {netoNoPremium>=0 ? ' (Frideza te liquida la diferencia)' : ' (no alcanza a cubrir el servicio)'}</span>
                  </div>
                  <div style={{fontSize:12,color:C.text2,lineHeight:1.9,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.blueBorder}`}}>
                    Costo animal (campo + fletes): <strong style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmt(b1+b2r)}</strong><br/>
                    − Neto del no-premium: <strong style={{fontFamily:"'JetBrains Mono',monospace",color:C.green}}>−{fmt(netoNoPremium)}</strong><br/>
                    <span style={{borderTop:`1px solid ${C.blueBorder}`,display:'block',marginTop:6,paddingTop:6}}>
                    = Costo NETO asignado a premium: <strong style={{fontFamily:"'JetBrains Mono',monospace",color:C.navy,fontSize:14}}>{fmt(costoNetoAnimal)}/animal</strong></span>
                    <span style={{display:'block',marginTop:4}}>Sobre {kgPremium.toFixed(0)} kg premium = <strong style={{color:C.navy}}>{fmt(kgPremium>0?costoNetoAnimal/kgPremium:0)}/kg</strong> solo de animal</span>
                  </div>
                  <div style={{fontSize:11,color:C.text3,lineHeight:1.6,marginTop:10,background:C.surface2,borderRadius:8,padding:'8px 12px'}}>
                    ✓ El envasado de tus cortes premium <strong>no te cuesta plata aparte</strong>: lo pagás con la carne no-premium que le dejás a Frideza. Eso ya está ponderado en el costo del servicio.
                  </div>
                </div>
              </div>
            </Card>
          </>}

          {finTab==='local'&&<Card title="Costo operativo — Depósito Río Cuarto" badge="Bloque 3" badgeColor="amber">
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
              <Card title="Composición del costo por kg premium" badge="Desglose" badgeColor="blue">
                <div style={{padding:20}}>
                  <Bar label="Animal neto (post-canje Frideza)" value={b1kg} max={maxKg} color={C.green}/>
                  <Bar label="Depósito + operativo Río Cuarto" value={b3kg} max={maxKg} color={C.blue}/>
                  <Bar label="Comercialización D2C" value={b4kg} max={maxKg} color={C.red}/>
                  <div style={{marginTop:14,padding:12,background:C.greenBg,borderRadius:10,border:`1px solid ${C.greenBorder}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.green,marginBottom:3}}>PRECIO MÍNIMO DE EQUILIBRIO (premium)</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:24,color:C.greenDark,fontWeight:600}}>{fmt(costoKg)}/kg</div>
                    <div style={{fontSize:11,color:C.text3,marginTop:3}}>Precio premium actual: <strong style={{color:C.green}}>{fmt(precioVentaPrem)}/kg</strong> · margen {fmtPct(margenPct)}</div>
                  </div>
                </div>
              </Card>
              <Card title="Escenarios de venta de premium" badge="KPI crítico" badgeColor="red">
                <div style={{padding:20}}>
                  {[100,90,80,70,60,50].map(pct=>{
                    const kgV=kgPremiumS*(pct/100)
                    const ingV=precioVentaPrem*kgV
                    const res2=ingV-((costoNetoAnimalS+packS+delS)*(pct/100)+cfS+ingV*(v.b4_mp/100))
                    const ok=res2>=0
                    return <div key={pct} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',marginBottom:6,borderRadius:8,background:pct===60?(ok?C.greenBg:C.redBg):C.surface2,border:`${pct===60?2:1}px solid ${pct===60?(ok?C.greenBorder:C.redBorder):C.border}`}}>
                      <span style={{fontSize:12,fontWeight:pct===60?700:400,color:C.text2}}>{pct}% premium vendido</span>
                      <span style={{fontSize:11,color:C.text3,fontFamily:"'JetBrains Mono',monospace"}}>{Math.round(kgV)} kg</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,color:ok?C.green:C.red}}>{fmt(res2)}</span>
                    </div>
                  })}
                  <div style={{marginTop:8,fontSize:11,color:C.text3,background:C.surface2,borderRadius:8,padding:'8px 12px'}}>✓ Como Frideza absorbe el no-premium, tu riesgo baja: solo necesitás colocar los cortes premium. El punto de equilibrio ahora es mucho más alcanzable.</div>
                </div>
              </Card>
            </div>
            <Card title="Por qué el modelo dos canales mejora el negocio" badge="Análisis" badgeColor="green">
              <div style={{padding:20}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Concepto','Modelo viejo (toda la res)','Modelo Frideza (solo premium)','Efecto'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${C.border}`,letterSpacing:'.05em'}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[['Kg a vender/animal','196 kg (toda la res)',kgPremium.toFixed(0)+' kg (solo premium)','green'],
                      ['Inversión inicial','$20M – $31M','$3M – $5M','green'],
                      ['Centro de procesamiento','Propio (caro)','Frideza lo hace','green'],
                      ['Riesgo comercial','Vender el 100%','Solo el '+(kgN>0?Math.round(kgPremium/kgN*100):0)+'%','green'],
                      ['Costo neto animal/kg premium',fmt(3500),fmt(kgPremium>0?costoNetoAnimal/kgPremium:0),'green'],
                    ].map(([label,v1,v2])=>(
                      <tr key={label} style={{borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:'10px 12px',fontSize:12,color:C.text}}>{label}</td>
                        <td style={{padding:'10px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text3}}>{v1}</td>
                        <td style={{padding:'10px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green,fontWeight:700}}>{v2}</td>
                        <td style={{padding:'10px 12px'}}><span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:20,background:C.greenBg,color:C.green}}>✓ Mejora</span></td>
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
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:C.navy,fontWeight:600,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>📊 Tablero en tiempo real</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:14}}>
            <Kpi label="Kg premium / semana" value={Math.round(kgPremiumS)+' kg'} sub={v.animales_semana+' novillos · solo premium'} variant="green" full/>
            <Kpi label="Costo / semana" value={fmt(totS)} variant="amber"/>
            <Kpi label="Costo / kg premium" value={fmt(costoKg)} sub="entregado D2C" variant="amber"/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Desglose costo/kg premium</div>
            <Bar label="Animal neto (post-Frideza)" value={b1kg} max={maxKg} color={C.green}/>
            <Bar label="Depósito + operativo" value={b3kg} max={maxKg} color={C.blue}/>
            <Bar label="Comercialización D2C" value={b4kg} max={maxKg} color={C.red}/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>Precio premium ponderado/kg</div>
            <div style={{display:'flex',alignItems:'center',gap:5,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:10,padding:'9px 11px',marginBottom:5}}>
              <span style={{color:C.text3,fontSize:13}}>$</span>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:20,color:C.navy,width:'100%',textAlign:'right',fontWeight:600}}>{Math.round(precioVentaPrem).toLocaleString('es-AR')}</span>
              <span style={{color:C.text3,fontSize:11}}>/kg</span>
            </div>
            <div style={{fontSize:9,color:C.text3,textAlign:'center',marginBottom:5}}>(promedio ponderado de los cortes premium — editá en módulo Mix)</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
              <div style={{padding:'8px 10px',background:mv==='green'?C.greenBg:mv==='amber'?C.amberBg:C.redBg,borderRadius:8,border:`1px solid ${mv==='green'?C.greenBorder:mv==='amber'?C.amberBorder:C.redBorder}`}}>
                <div style={{fontSize:9,color:C.text3,marginBottom:2}}>Margen/kg</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:mv==='green'?C.green:mv==='amber'?C.amber:C.red}}>{fmt(margenKg)}</div>
              </div>
              <div style={{padding:'8px 10px',background:mv==='green'?C.greenBg:mv==='amber'?C.amberBg:C.redBg,borderRadius:8,border:`1px solid ${mv==='green'?C.greenBorder:mv==='amber'?C.amberBorder:C.redBorder}`}}>
                <div style={{fontSize:9,color:C.text3,marginBottom:2}}>Margen %</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:mv==='green'?C.green:mv==='amber'?C.amber:C.red}}>{fmtPct(margenPct)}</div>
              </div>
            </div>
          </div>
          <div style={{background:rv==='green'?C.greenBg:C.redBg,border:`1px solid ${rv==='green'?C.greenBorder:C.redBorder}`,borderRadius:12,padding:12}}>
            <div style={{fontSize:9,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Proyección semanal</div>
            {[['Ingresos brutos',fmt(ingB)],['Costos variables',fmt(cvS)],['Costos fijos sem.',fmt(cfS)]].map(([l,val])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0'}}>
                <span style={{color:C.text2}}>{l}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",color:C.text}}>{val}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${rv==='green'?C.greenBorder:C.redBorder}`,marginTop:8,paddingTop:8}}>
              {[['Resultado semana',fmt(resSem)],['Resultado mes',fmt(resMes)]].map(([l,val])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.text}}>{l}</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:600,color:rv==='green'?C.green:C.red}}>{val}</span>
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
        <SI label="Precio premium ponderado" value={fmt(mixPrecioPrem)+'/kg'} variant="green"/>
        <Div/><SI label="Ingreso premium/sem" value={fmt(ingPremiumS)}/>
        <Div/><SI label="Margen premium" value={fmt(ingPremiumS-totS)} variant={ingPremiumS-totS>=0?'green':'red'}/>
        <Div/><SI label="Resultado mensual" value={fmt((ingPremiumS-totS)*4.33)} variant={(ingPremiumS-totS)*4.33>=0?'green':'red'}/>
      </div>
      <div style={{padding:'24px'}}>
        <Alert type="info" icon="🥩" title="Modelo dos canales — clic en el botón para reasignar un corte"
          body={`Vos comercializás los cortes PREMIUM (${v.mix.filter(c=>c.premium).length} cortes, ${kgPremium.toFixed(0)} kg/animal). Frideza comercializa el resto (${v.mix.filter(c=>!c.premium).length} cortes, ${kgNoPrem.toFixed(0)} kg/animal) y se cobra con ellos vía canje. El precio premium ponderado es lo que determina tu margen real.`}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:20}}>
          <Card title="Distribución de cortes por res" badge="Premium = vos · Frideza = resto" badgeColor="green">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>
                {['Canal','Corte','Kg/res','Precio $/kg','Ingreso/sem','%'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:h!=='Corte'&&h!=='Canal'?'right':'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {v.mix.map((c,i)=>{
                  const ing=c.kg*c.precio*v.animales_semana
                  const pct=ingPremiumS>0&&c.premium?(ing/ingPremiumS*100):0
                  return <tr key={i} className="rh" style={{borderBottom:`1px solid ${C.border}`,opacity:c.premium?1:0.55}}>
                    <td style={{padding:'7px 14px'}}>
                      <button onClick={()=>setMix(i,'premium',!c.premium)} style={{fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:20,border:'none',cursor:'pointer',background:c.premium?C.greenBg:C.surface2,color:c.premium?C.green:C.text3,letterSpacing:'.04em'}}>
                        {c.premium?'★ PREMIUM':'FRIDEZA'}
                      </button>
                    </td>
                    <td style={{padding:'7px 14px',fontSize:12,color:C.text,fontWeight:500}}>{c.nombre}</td>
                    <td style={{padding:'7px 14px',textAlign:'right'}}>
                      <input type="number" step="0.1" value={c.kg} onChange={e=>setMix(i,'kg',e.target.value)} style={{width:55,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:6,padding:'3px 7px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text,textAlign:'right',outline:'none'}}/>
                    </td>
                    <td style={{padding:'7px 14px',textAlign:'right'}}>
                      <input type="number" value={c.precio} onChange={e=>setMix(i,'precio',e.target.value)} style={{width:80,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:6,padding:'3px 7px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.text,textAlign:'right',outline:'none'}}/>
                    </td>
                    <td style={{padding:'7px 14px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:c.premium?C.green:C.text3}}>{fmt(ing)}</td>
                    <td style={{padding:'7px 14px',textAlign:'right',fontSize:11,color:C.text3}}>{c.premium?pct.toFixed(1)+'%':'—'}</td>
                  </tr>
                })}
                <tr style={{background:C.surface2,borderTop:`2px solid ${C.border2}`}}>
                  <td style={{padding:'9px 14px',fontSize:11,fontWeight:700,color:C.green}}>PREMIUM</td>
                  <td style={{padding:'9px 14px',fontSize:12,fontWeight:700,color:C.text}}>{v.mix.filter(c=>c.premium).length} cortes</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.green}}>{kgPremium.toFixed(0)} kg</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.amber}}>{fmt(mixPrecioPrem)}/kg</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.green}}>{fmt(ingPremiumS)}</td>
                  <td style={{padding:'9px 14px',textAlign:'right',fontSize:11,color:C.text3}}>100%</td>
                </tr>
              </tbody>
            </table>
            <div style={{padding:'10px 20px',background:C.surface2,fontSize:10,color:C.text3}}>Clic en el botón de canal para mover un corte entre Premium (vos) y Frideza.</div>
          </Card>
          <div>
            <Kpi label="Precio premium ponderado" value={fmt(mixPrecioPrem)+'/kg'} variant="green"/>
            <div style={{height:10}}/>
            <Kpi label="Margen premium" value={fmt(ingPremiumS-totS)} variant={ingPremiumS-totS>=0?'green':'red'}/>
            <div style={{height:10}}/>
            <Kpi label="Resultado mensual" value={fmt((ingPremiumS-totS)*4.33)} variant={(ingPremiumS-totS)*4.33>=0?'green':'red'}/>
            <div style={{height:16}}/>
            <Card title="Reparto de la res" badge="Dos canales" badgeColor="green">
              <div style={{padding:14}}>
                {[['🥩 El Retiro (premium)',ingPremiumS,kgPremium,C.green],
                  ['🏭 Frideza (no-premium)',valorNoPremiumS,kgNoPrem,C.text3],
                ].map(([label,val,kg,color])=>{
                  const totalVal=ingPremiumS+valorNoPremiumS
                  return <div key={label} style={{marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                      <span style={{color:C.text2}}>{label}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",color:C.text,fontWeight:500}}>{kg.toFixed(0)} kg</span>
                    </div>
                    <div style={{height:6,background:C.surface2,borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:totalVal>0?`${(val/totalVal)*100}%`:'0%',background:color,borderRadius:3,transition:'width .4s'}}/>
                    </div>
                    <div style={{fontSize:9,color:C.text3,marginTop:2}}>{totalVal>0?((val/totalVal)*100).toFixed(0):0}% del valor total de la res</div>
                  </div>
                })}
                <div style={{marginTop:10,padding:'10px 12px',background:C.greenBg,borderRadius:8,border:`1px solid ${C.greenBorder}`,fontSize:11,color:C.greenDark,lineHeight:1.6}}>
                  Vendés el <strong>{kgN>0?Math.round(kgPremium/kgN*100):0}%</strong> de la carne pero ese porcentaje concentra el <strong>{(ingPremiumS+valorNoPremiumS)>0?Math.round(ingPremiumS/(ingPremiumS+valorNoPremiumS)*100):0}%</strong> del valor.
                </div>
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
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} style={{background:'transparent',border:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:90,outline:'none',textAlign:'right'}}/>
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
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.text2}}>{Math.round(kgNS*(pct/100)*4.33)} kg</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.text}}>{fmt(ing)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.text}}>{fmt(cv2)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.text}}>{fmt(costoFM)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:res>=0?C.green:C.red}}>{fmt(res)}</td>
                    <td style={{padding:'9px 12px',textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:ac>=0?C.green:C.red}}>{fmt(ac)}</td>
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
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:C.amber}}>{val}</span>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0'}}>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>TOTAL ESTIMADO</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:18,fontWeight:600,color:C.red}}>$20M – $31M</span>
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
        <SI label="Vacas madre" value={v.vacas_madre}/>
        <Div/><SI label={`Destete ${v.tasa_destete}%`} value={terneroPropios+'/año'} variant="green"/>
        <Div/><SI label="Compras" value={comprasAnio+'/año'} variant="amber"/>
        <Div/><SI label="Ciclo propio" value="27–28 meses" variant="amber"/>
        <Div/><SI label="Faena" value={anim+'/sem · '+faenaMes+'/mes'} variant="green"/>
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['gantt','Flujo anual'],['compras','Compras'],['inquilino','Inquilino'],['supl','Suplementación']].map(([id,label])=>(
            <Tab key={id} active={prodTab===id} onClick={()=>setProdTab(id)} label={label}/>
          ))}
        </div>
      </div>
      <div style={{padding:'24px'}}>
        {prodTab==='gantt'&&<>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20,padding:18,background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,boxShadow:sh}}>
            {[['Vacas madre','vacas_madre','cab','1'],['Tasa de destete','tasa_destete','%','1'],['Animales a faenar/semana','animales_semana','cab/sem','1']].map(([label,key,unit,step])=>(
              <div key={key}>
                <div style={{fontSize:10,fontWeight:600,color:C.text3,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>{label}</div>
                <div style={{display:'flex',alignItems:'center',gap:6,background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:8,padding:'6px 10px'}}>
                  <input type="number" step={step} value={v[key]} onChange={e=>set(key,e.target.value)} style={{background:'transparent',border:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:70,outline:'none',textAlign:'right'}}/>
                  <span style={{fontSize:11,color:C.text3}}>{unit}</span>
                </div>
              </div>
            ))}
            <div style={{flex:1,minWidth:240,display:'flex',alignItems:'flex-end'}}>
              <div style={{background:C.greenBg,border:`1px solid ${C.greenBorder}`,borderRadius:10,padding:'10px 14px',width:'100%',fontSize:11,color:C.greenDark,lineHeight:1.6}}>
                <strong>{anim}/semana</strong> = {faenaMes} animales/mes = <strong>{faenaAnio}/año</strong>.<br/>
                Con {v.vacas_madre} vacas al {v.tasa_destete}% destete: <strong>{terneroPropios} propios/año</strong> + <strong style={{color:comprasAnio>0?C.amber:C.green}}>{comprasAnio} comprados/año</strong>.
              </div>
            </div>
          </div>
          <Alert type="info" icon="📅" title="Gestación 9 meses correctamente modelada"
            body="Servicio ene–abr → gestación 9 meses → parición oct–ene → destete 7 meses → may–ago → recría 10–11 meses → 350 kg en mar–jul año N+2 → feedlot 100 días → faena. Ciclo total: 27–28 meses por animal propio. El primer año operativo del D2C es 100% animales comprados."/>
          <Card title="Flujo mensual — Estado estacionario (año N+2 en adelante)" badge="Cinta transportadora" badgeColor="green">
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:C.surface2}}>
                {['Período','Propios al feedlot','Compras necesarias','Total feedlot','Origen faena','Estado margen'].map(h=><th key={h} style={{fontSize:10,fontWeight:600,color:C.text3,padding:'9px 14px',textAlign:'left',borderBottom:`1px solid ${C.border}`,textTransform:'uppercase',letterSpacing:'.05em'}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {(()=>{
                  // Distribución estacional de propios al feedlot (suma = 12 meses).
                  // Pico may-sep (cabeza+cuerpo parición), valle dic-feb.
                  const dist=[
                    ['Ene–Feb',0.0,'100% comprados','Costo máximo','red'],
                    ['Mar–Abr',0.18,'Mix (cabeza parición)','Propios empiezan','amber'],
                    ['May–Jun',0.30,'100% propios','★ Mejor margen','green'],
                    ['Jul–Sep',0.32,'Mayoría propios','Margen alto','green'],
                    ['Oct–Nov',0.14,'Mix','Compras parcial','amber'],
                    ['Dic',0.06,'100% comprados','Margen bajo','red'],
                  ]
                  const mesesPeriodo=[2,2,2,3,2,1]  // cantidad de meses por período
                  return dist.map(([per,frac,origen,estado,variant],idx)=>{
                    const mp=mesesPeriodo[idx]
                    const feedlotPeriodo=faenaMes*mp
                    const propiosPeriodo=Math.round(terneroPropios*frac)
                    const comprasPeriodo=Math.max(0,feedlotPeriodo-propiosPeriodo)
                    return <tr key={per} className="rh" style={{borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:'10px 14px',fontSize:12,fontWeight:600,color:C.text}}>{per}</td>
                      <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green,fontWeight:600}}>{propiosPeriodo}</td>
                      <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.amber,fontWeight:600}}>{comprasPeriodo}</td>
                      <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:C.navy,fontWeight:700}}>{feedlotPeriodo}</td>
                      <td style={{padding:'10px 14px',fontSize:11,color:C.text2}}>{origen}</td>
                      <td style={{padding:'10px 14px'}}><span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:variant==='green'?C.greenBg:variant==='amber'?C.amberBg:C.redBg,color:variant==='green'?C.green:variant==='amber'?C.amber:C.red}}>{estado}</span></td>
                    </tr>
                  })
                })()}
                <tr style={{background:C.surface2,borderTop:`2px solid ${C.border2}`}}>
                  <td style={{padding:'10px 14px',fontSize:12,fontWeight:700,color:C.text}}>TOTAL AÑO</td>
                  <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green,fontWeight:700}}>{terneroPropios}</td>
                  <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.amber,fontWeight:700}}>{comprasAnio}</td>
                  <td style={{padding:'10px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:C.navy,fontWeight:700}}>{faenaAnio}</td>
                  <td style={{padding:'10px 14px',fontSize:11,color:C.text2}}>—</td>
                  <td style={{padding:'10px 14px'}}></td>
                </tr>
              </tbody>
            </table>
          </Card>
        </>}
        {prodTab==='compras'&&<>
          <Alert type="info" icon="📊" title="Precio real ternero destete · Mayo 2026"
            body="CACG abril 2026: $6.580/kg promedio → animal 200 kg = $1.316.000. El modelo original usaba $180.000. Diferencia: $1.136.000/cabeza."/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{title:`Ventana ene–mar (${Math.round(comprasAnio*0.4)} animales)`,sub:'Mejor precio relativo del año',rows:[['Precio estimado','$6.200–6.800/kg vivo','amber'],['Costo por animal','$1.240.000–1.360.000','amber'],['Suplementación adicional','$105.000/cab (7 meses)','red'],['Riesgo','Bajo — control total','green']]},
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
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} step={key==='inq_kg'?'.1':'1'} style={{background:'transparent',border:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:90,outline:'none',textAlign:'right'}}/>
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
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:15,color:C.text,fontWeight:600}}>{card.title}</span>
                    <span style={{fontSize:11,color:C.text3,marginLeft:10}}>{card.sub}</span>
                  </div>
                  {card.rec&&<span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20,background:C.greenBg,border:`1px solid ${C.greenBorder}`,color:C.green}}>Recomendado</span>}
                </div>
                <div style={{padding:'12px 20px'}}>
                  {card.rows.map(([label,val,variant])=>(
                    <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:12,color:C.text2}}>{label}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:variant==='green'?C.green:variant==='red'?C.red:variant==='amber'?C.amber:C.text}}>{val}</span>
                    </div>
                  ))}
                  <div style={{marginTop:14,padding:12,background:card.rec?C.greenBg:C.amberBg,borderRadius:10,border:`1px solid ${card.rec?C.greenBorder:C.amberBorder}`}}>
                    <div style={{fontSize:10,color:C.text3,marginBottom:2}}>{card.foot[0]}</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:22,color:card.foot[2]==='green'?C.green:C.amber,fontWeight:600}}>{card.foot[1]}</div>
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
                  <input type="number" value={v[key]} onChange={e=>set(key,e.target.value)} step={step} style={{background:'transparent',border:'none',fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:600,color:C.navy,width:80,outline:'none',textAlign:'right'}}/>
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
                    <td style={{padding:'9px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:v==='green'?C.green:v==='amber'?C.amber:C.text}}>{precio}</td>
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
                    <td style={{padding:'9px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:corte==='Promedio ponderado'?C.amber:C.text}}>{precio}</td>
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
                  <td style={{padding:'10px 14px',fontFamily:"'Inter',sans-serif",fontSize:16,fontWeight:600,color:C.navy}}>{num}</td>
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
