import { useState, useEffect, useCallback } from "react";
import { supabase, auth, db } from "./supabase";

/* ─── CDN loader XLSX ─── */
const loadXLSX = () => new Promise(res => {
  if (window.XLSX) return res(window.XLSX);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  s.onload = () => res(window.XLSX); document.head.appendChild(s);
});

/* ════════════════════════════════════════════════════════════
   LIBRERIA NORME DI DEFAULT
   (usata solo se il database è vuoto)
   ════════════════════════════════════════════════════════════ */
const DEFAULT_DISCIPLINES = {
  architettura: { label:"Architettura", icon:"🏛️", color:"#C8A96E", sections:[] },
  strutture:    { label:"Strutture",    icon:"⚙️",  color:"#7EB8C4", sections:[] },
  impianti:     { label:"Impianti",     icon:"⚡",  color:"#A8C97E", sections:[] },
  sicurezza:    { label:"Sicurezza Cantieri", icon:"🦺", color:"#F0C060", sections:[] },
  urbanistica:  { label:"Urbanistica",  icon:"🗺️",  color:"#9B8EC4", sections:[] },
};

const mkProject = (name, userId) => ({
  id:             String(Date.now()),
  userId,
  name:           name || "Nuovo Progetto",
  inspector:      "",
  selectedDisc:   null,
  activeSections: {},
  checklist:      {},
  notes:          {},
  remarks:        {},
  createdAt:      new Date().toISOString(),
  updatedAt:      new Date().toISOString(),
});

/* ════════════════════════════════════════════════
   EXPORT PDF
   ════════════════════════════════════════════════ */
function exportPDF(project, disciplines, mode) {
  const date = new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"long",year:"numeric"});
  const allAct = Object.entries(disciplines).flatMap(([dk,d])=>
    d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]));
  const total = allAct.reduce((a,s)=>a+s.items.length,0);
  const si = Object.values(project.checklist).filter(v=>v==="ok").length;
  const no = Object.values(project.checklist).filter(v=>v==="ko").length;
  const na = Object.values(project.checklist).filter(v=>v==="na").length;
  let rows="";
  Object.entries(disciplines).forEach(([dk,d])=>{
    const secs=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    if(!secs.length)return;
    let hasRows=false; let discRows="";
    secs.forEach(sec=>{
      let secRows="";
      sec.items.forEach(item=>{
        const key=`${dk}__${sec.title}__${item.text}`;
        const st=project.checklist[key]!==undefined?project.checklist[key]:(item.defaultAnswer||null);
        if(mode==="issues"&&st!=="ko")return;
        const lbl=st==="ok"?"✓ Sì":st==="ko"?"✗ No":st==="na"?"N/A":"—";
        const stColor=st==="ok"?"#22863a":st==="ko"?"#c0392b":st==="na"?"#7f8c8d":"#888";
        const bgRow=st==="ko"?"#fff5f5":st==="ok"?"#f5fff8":"#fff";
        secRows+=`<tr style="background:${bgRow}">
          <td style="padding:6px 10px;font-size:10px;width:30%;border-bottom:1px solid #eee">${item.text}</td>
          <td style="padding:6px 8px;font-size:9px;color:#8B6914;font-style:italic;width:18%;border-bottom:1px solid #eee">${item.ref||"—"}</td>
          <td style="padding:6px 8px;font-size:11px;font-weight:700;color:${stColor};width:8%;text-align:center;border-bottom:1px solid #eee">${lbl}</td>
          <td style="padding:6px 8px;font-size:9px;color:#555;width:22%;border-bottom:1px solid #eee">${project.notes[key]||""}</td>
          <td style="padding:6px 8px;font-size:9px;color:#8B6914;width:22%;border-bottom:1px solid #eee">${project.remarks?.[key]||""}</td>
        </tr>`; hasRows=true;
      });
      if(secRows)discRows+=`<tr><td colspan="5" style="padding:5px 10px;background:#f0f4f8;font-size:9px;font-weight:700;color:#2c3e50;border-bottom:1px solid #ddd">${sec.title}</td></tr>${secRows}`;
    });
    if(hasRows)rows+=`<tr><td colspan="5" style="padding:8px 10px;background:#2c3e50;font-size:11px;font-weight:800;color:#fff">${d.icon} ${d.label.toUpperCase()}</td></tr>${discRows}`;
  });
  const html=`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>${project.name}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff}
.header{background:#1a2a3a;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:16px;font-weight:800;color:#C8A96E}.header p{font-size:9px;color:#aaa;margin-top:3px}
.meta{display:flex;border-bottom:2px solid #C8A96E}
.meta-item{flex:1;padding:8px 12px;background:#f8f9fa;border-right:1px solid #dee2e6}
.meta-label{font-size:8px;color:#888;text-transform:uppercase;letter-spacing:1px}
.meta-value{font-size:12px;font-weight:700;color:#1a2a3a;margin-top:2px}
.stats{display:flex;border-bottom:1px solid #dee2e6}
.stat{flex:1;text-align:center;padding:10px;border-right:1px solid #dee2e6}
.stat-val{font-size:20px;font-weight:800}.stat-lbl{font-size:8px;color:#888;text-transform:uppercase;margin-top:2px}
table{width:100%;border-collapse:collapse}
th{background:#2c3e50;color:#fff;padding:6px 10px;font-size:9px;text-align:left;text-transform:uppercase}
.footer{padding:8px 20px;font-size:8px;color:#999;border-top:1px solid #eee;text-align:center;margin-top:8px}
@media print{@page{size:A4 landscape;margin:8mm}body{font-size:9px}.header,tr,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header"><div><h1>CheckList Verifiche Normative</h1><p>${mode==="full"?"Report Completo":"Solo Non Conformità"} — ${date}</p></div>
<div style="text-align:right"><div style="font-size:11px;color:#C8A96E;font-weight:700">${project.name}</div><div style="font-size:9px;color:#aaa;margin-top:2px">👤 ${project.inspector||"—"}</div></div></div>
<div class="meta">
  <div class="meta-item"><div class="meta-label">Progetto</div><div class="meta-value">${project.name}</div></div>
  <div class="meta-item"><div class="meta-label">Ispettore</div><div class="meta-value">${project.inspector||"—"}</div></div>
  <div class="meta-item"><div class="meta-label">Data</div><div class="meta-value">${date}</div></div>
  <div class="meta-item"><div class="meta-label">Tipo</div><div class="meta-value">${mode==="full"?"Completo":"Non Conformità"}</div></div>
</div>
<div class="stats">
  <div class="stat"><div class="stat-val" style="color:#888">${total}</div><div class="stat-lbl">Totale</div></div>
  <div class="stat"><div class="stat-val" style="color:#22863a">${si}</div><div class="stat-lbl">Sì ✓</div></div>
  <div class="stat"><div class="stat-val" style="color:#c0392b">${no}</div><div class="stat-lbl">No ✗</div></div>
  <div class="stat"><div class="stat-val" style="color:#7f8c8d">${na}</div><div class="stat-lbl">N/A</div></div>
  <div class="stat"><div class="stat-val" style="color:#C8A96E">${total?Math.round(si/total*100):0}%</div><div class="stat-lbl">Completamento</div></div>
</div>
<table><thead><tr><th style="width:30%">Voce</th><th style="width:18%">Rif.</th><th style="width:8%;text-align:center">Stato</th><th style="width:22%">Note</th><th style="width:22%">Rilievo</th></tr></thead>
<tbody>${rows||`<tr><td colspan="5" style="padding:20px;text-align:center;color:#888">Nessuna voce</td></tr>`}</tbody></table>
<div class="footer">Compilato da: ${project.inspector||"—"} · ${date}</div>
</body></html>`;
  const existing=document.getElementById("pdf-modal"); if(existing)existing.remove();
  const modal=document.createElement("div"); modal.id="pdf-modal";
  modal.style.cssText="position:fixed;inset:0;z-index:9999;background:white;overflow:auto;";
  const bar=document.createElement("div");
  bar.style.cssText="position:fixed;top:10px;right:10px;z-index:10000;display:flex;gap:8px;";
  const btnD=document.createElement("button");
  btnD.textContent="⬇️ Scarica HTML";
  btnD.style.cssText="background:#1a2a3a;color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-size:13px;";
  btnD.onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));a.download=`checklist_${project.name.replace(/\s+/g,"_")}_${mode}.html`;a.click();};
  const btnC=document.createElement("button");
  btnC.textContent="✕ Chiudi";
  btnC.style.cssText="background:#c0392b;color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:13px;";
  btnC.onclick=()=>modal.remove();
  bar.appendChild(btnD); bar.appendChild(btnC); modal.appendChild(bar);
  const content=document.createElement("div"); content.innerHTML=html;
  content.querySelectorAll("script").forEach(s=>s.remove()); modal.appendChild(content);
  document.body.appendChild(modal);
}

async function exportExcel(project, disciplines) {
  const XLSX=await loadXLSX(); const wb=XLSX.utils.book_new();
  const date=new Date().toLocaleDateString("it-IT");
  const sum=[["CHECKLIST NORME TECNICHE"],["Progetto:",project.name],["Ispettore:",project.inspector||"—"],["Data:",date],[""],
    ["DISCIPLINA","SEZIONI ATTIVE","TOTALE","SÌ","NO","N/A","DA VERIF.","% COMPLET."]];
  Object.entries(disciplines).forEach(([dk,d])=>{
    const act=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]);
    const tot=act.reduce((a,s)=>a+s.items.length,0);
    const si=act.reduce((a,s)=>a+s.items.filter(i=>(project.checklist[`${dk}__${s.title}__${i.text}`]||i.defaultAnswer)==="ok").length,0);
    const no=act.reduce((a,s)=>a+s.items.filter(i=>(project.checklist[`${dk}__${s.title}__${i.text}`]||i.defaultAnswer)==="ko").length,0);
    const na=act.reduce((a,s)=>a+s.items.filter(i=>(project.checklist[`${dk}__${s.title}__${i.text}`]||i.defaultAnswer)==="na").length,0);
    sum.push([d.label,act.length,tot,si,no,na,tot-si-no-na,`${tot?Math.round(si/tot*100):0}%`]);
  });
  const ws0=XLSX.utils.aoa_to_sheet(sum); ws0["!cols"]=[26,14,10,8,8,8,10,14].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws0,"Riepilogo");
  Object.entries(disciplines).forEach(([dk,d])=>{
    const act=d.sections.filter(s=>project.activeSections[`${dk}__${s.title}`]); if(!act.length)return;
    const rows=[[`${d.label.toUpperCase()} – CHECKLIST`],["Progetto:",project.name,"","Ispettore:",project.inspector||"—","Data:",date],[""],
      ["SEZIONE","VOCE","RIF.","STATO","NOTE","RILIEVO"]];
    act.forEach(sec=>sec.items.forEach(item=>{
      const key=`${dk}__${sec.title}__${item.text}`;
      const s=project.checklist[key]!==undefined?project.checklist[key]:(item.defaultAnswer||null);
      rows.push([sec.title,item.text,item.ref,s==="ok"?"✓ Sì":s==="ko"?"✗ No":s==="na"?"N/A":"—",project.notes[key]||"",project.remarks?.[key]||""]);
    }));
    const ws=XLSX.utils.aoa_to_sheet(rows); ws["!cols"]=[{wch:32},{wch:48},{wch:30},{wch:12},{wch:34},{wch:40}];
    XLSX.utils.book_append_sheet(wb,ws,d.label.slice(0,31));
  });
  XLSX.writeFile(wb,`checklist_${project.name.replace(/\s+/g,"_")}_${date.replace(/\//g,"-")}.xlsx`);
}

/* ════════════════════════════════════════════════
   COSTANTI UI
   ════════════════════════════════════════════════ */
const BD = "1px solid #1a2d3d";
const STEPS = [
  { id:"project",    label:"Progetto",      icon:"📁", desc:"Titolo del progetto" },
  { id:"inspector",  label:"Ispettore",      icon:"👤", desc:"Nome compilatore" },
  { id:"discipline", label:"Disciplina",     icon:"📚", desc:"Scegli la disciplina" },
  { id:"norms",      label:"Norme",          icon:"⚖️", desc:"Scegli le norme da analizzare" },
  { id:"checklist",  label:"Checklist",      icon:"✅", desc:"Compilazione verifiche" },
];
const SBtn = ({active,onClick,label,color}) => (
  <button onClick={onClick} style={{padding:"5px 14px",borderRadius:20,border:`2px solid ${color}`,background:active?color:"transparent",color:active?"white":color,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .15s"}}>{label}</button>
);

/* ════════════════════════════════════════════════
   LOGIN PAGE
   ════════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Inserisci email e password"); return; }
    setLoading(true); setError("");
    const { data, error } = await auth.signIn(email, password);
    if (error) { setError(error.message); setLoading(false); return; }
    onLogin(data.user);
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"#162230",borderRadius:16,border:"1px solid #C8A96E44",padding:40,width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:40,marginBottom:12}}>📋</div>
          <div style={{fontSize:9,color:"#C8A96E",letterSpacing:4,textTransform:"uppercase",marginBottom:6}}>Piattaforma</div>
          <div style={{fontSize:22,fontWeight:800,color:"#e8edf2"}}>Verifiche Normative</div>
          <div style={{fontSize:12,color:"#7a9ab0",marginTop:6}}>Accedi per continuare</div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{fontSize:11,color:"#7a9ab0",marginBottom:5}}>Email</div>
            <input value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="nome@esempio.com" type="email"
              style={{width:"100%",background:"#0f1923",border:BD,borderRadius:8,padding:"10px 14px",color:"#e8edf2",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#7a9ab0",marginBottom:5}}>Password</div>
            <input value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="••••••••" type="password"
              style={{width:"100%",background:"#0f1923",border:BD,borderRadius:8,padding:"10px 14px",color:"#e8edf2",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>

          {error && <div style={{color:"#ef5350",fontSize:12,textAlign:"center",padding:"8px",background:"#ef535011",borderRadius:8}}>{error}</div>}

          <button onClick={handleLogin} disabled={loading}
            style={{background:"linear-gradient(135deg,#C8A96E,#a07040)",border:"none",borderRadius:10,color:"white",fontWeight:800,fontSize:14,padding:"12px",cursor:loading?"wait":"pointer",opacity:loading?0.7:1,marginTop:4}}>
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"#3a5468"}}>
          Per registrare nuovi ispettori contatta l'amministratore
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ADMIN DASHBOARD
   ════════════════════════════════════════════════ */
function AdminDashboard({ currentUser, disciplines, onClose }) {
  const [allProjects, setAllProjects] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: projects }, { data: profiles }] = await Promise.all([
        db.getAllProjects(),
        db.getAllProfiles(),
      ]);
      setAllProjects(projects || []);
      setAllProfiles(profiles || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === "all" ? allProjects
    : allProjects.filter(p => p.user_id === filter);

  const getCompletion = p => {
    const act = Object.entries(disciplines).flatMap(([dk,d])=>
      d.sections.filter(s=>p.active_sections?.[`${dk}__${s.title}`]));
    const total = act.reduce((a,s)=>a+s.items.length,0);
    const si = Object.values(p.checklist||{}).filter(v=>v==="ok").length;
    return total ? Math.round(si/total*100) : 0;
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#0f1923",zIndex:5000,display:"flex",flexDirection:"column",fontFamily:"'Segoe UI',sans-serif"}}>

      {/* Header */}
      <div style={{padding:"16px 24px",borderBottom:BD,background:"linear-gradient(135deg,#0f1923,#1a2d3d)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <div style={{fontSize:10,color:"#C8A96E",letterSpacing:3,textTransform:"uppercase"}}>Pannello Admin</div>
          <div style={{fontSize:18,fontWeight:800,color:"#e8edf2"}}>Dashboard Ispettori</div>
        </div>
        <button onClick={onClose} style={{background:"#162230",border:BD,borderRadius:8,color:"#c8d8e8",padding:"8px 16px",cursor:"pointer",fontWeight:600,fontSize:13}}>
          ← Torna all'app
        </button>
      </div>

      {/* Stats globali */}
      <div style={{display:"flex",gap:0,borderBottom:BD,flexShrink:0}}>
        {[
          {label:"Ispettori",  val:allProfiles.filter(p=>p.role==="inspector").length, color:"#7EB8C4"},
          {label:"Progetti",   val:allProjects.length,  color:"#C8A96E"},
          {label:"Completati", val:allProjects.filter(p=>getCompletion(p)===100).length, color:"#22863a"},
          {label:"In corso",   val:allProjects.filter(p=>{ const c=getCompletion(p); return c>0&&c<100;}).length, color:"#F0C060"},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"14px 20px",borderRight:BD,background:"#162230"}}>
            <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#7a9ab0",marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtro per ispettore */}
      <div style={{padding:"12px 24px",borderBottom:BD,display:"flex",gap:8,flexWrap:"wrap",flexShrink:0}}>
        <button onClick={()=>setFilter("all")}
          style={{padding:"5px 14px",borderRadius:20,border:`2px solid ${filter==="all"?"#C8A96E":"#2a3f52"}`,background:filter==="all"?"#C8A96E22":"transparent",color:filter==="all"?"#C8A96E":"#7a9ab0",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          Tutti
        </button>
        {allProfiles.filter(p=>p.role==="inspector").map(p=>(
          <button key={p.id} onClick={()=>setFilter(p.id)}
            style={{padding:"5px 14px",borderRadius:20,border:`2px solid ${filter===p.id?"#7EB8C4":"#2a3f52"}`,background:filter===p.id?"#7EB8C422":"transparent",color:filter===p.id?"#7EB8C4":"#7a9ab0",fontSize:11,fontWeight:700,cursor:"pointer"}}>
            👤 {p.full_name||p.email}
          </button>
        ))}
      </div>

      {/* Lista progetti */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
        {loading ? (
          <div style={{textAlign:"center",color:"#3a5468",marginTop:40,fontSize:14}}>Caricamento…</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",color:"#3a5468",marginTop:40,fontSize:14}}>Nessun progetto</div>
        ) : filtered.map(p=>{
          const pct = getCompletion(p);
          const inspector = allProfiles.find(pr=>pr.id===p.user_id);
          return (
            <div key={p.id} style={{background:"#162230",borderRadius:12,border:BD,padding:"16px 20px",marginBottom:10,display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#e8edf2"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#7a9ab0",marginTop:3}}>
                  👤 {inspector?.full_name||inspector?.email||"—"}
                  {p.inspector&&p.inspector!==inspector?.full_name&&<span style={{marginLeft:8}}>· Ispettore: {p.inspector}</span>}
                </div>
                <div style={{fontSize:10,color:"#3a5468",marginTop:2}}>
                  Aggiornato: {new Date(p.updated_at).toLocaleDateString("it-IT")}
                </div>
              </div>
              <div style={{textAlign:"right",minWidth:80}}>
                <div style={{fontSize:22,fontWeight:800,color:pct===100?"#22863a":pct>0?"#C8A96E":"#3a5468"}}>{pct}%</div>
                <div style={{height:4,background:"#1a2d3d",borderRadius:2,marginTop:4,width:80}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct===100?"#22863a":"#C8A96E",borderRadius:2}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP COMPONENTS (invariati rispetto alla versione locale)
   ════════════════════════════════════════════════ */

function StepProject({ projects, activeId, onSelect, onCreate, onDelete, onRename }) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const create = () => { if(!newName.trim())return; onCreate(newName.trim()); setNewName(""); };
  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:16,fontWeight:700}}>Seleziona o crea progetto</div>
      <div style={{background:"#162230",borderRadius:12,border:BD,padding:"14px",marginBottom:20}}>
        <div style={{fontSize:11,color:"#7a9ab0",marginBottom:8}}>Nuovo progetto</div>
        <div style={{display:"flex",gap:8}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()} placeholder="Nome progetto…"
            style={{flex:1,background:"#0f1923",border:BD,borderRadius:8,padding:"8px 12px",color:"#e8edf2",fontSize:13,outline:"none"}}/>
          <button onClick={create} style={{background:"#C8A96E",border:"none",borderRadius:8,padding:"8px 16px",color:"#0a1520",fontWeight:800,fontSize:18,cursor:"pointer"}}>+</button>
        </div>
      </div>
      {projects.length===0&&<div style={{textAlign:"center",color:"#3a5468",fontSize:12,marginTop:16}}>Nessun progetto ancora</div>}
      {projects.map(p=>{
        const isAct=p.id===activeId;
        return (
          <div key={p.id} onClick={()=>onSelect(p.id)}
            style={{padding:"14px 16px",borderRadius:12,marginBottom:8,cursor:"pointer",background:isAct?"#1a2d3d":"#0f1923",border:`2px solid ${isAct?"#C8A96E44":BD.split(" ")[2]}`,transition:"all .15s"}}>
            {renaming===p.id?(
              <input autoFocus defaultValue={p.name}
                onBlur={e=>{onRename(p.id,e.target.value||p.name);setRenaming(null);}}
                onKeyDown={e=>e.key==="Enter"&&e.target.blur()} onClick={e=>e.stopPropagation()}
                style={{width:"100%",background:"#0f1923",border:"1px solid #C8A96E",borderRadius:6,padding:"4px 8px",color:"#e8edf2",fontSize:13,outline:"none"}}/>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:isAct?700:500,color:isAct?"#e8edf2":"#7a9ab0"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#3a5468",marginTop:2}}>{new Date(p.updatedAt||p.updated_at).toLocaleDateString("it-IT")}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={e=>{e.stopPropagation();setRenaming(p.id);}} style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:13,padding:"4px"}}>✏️</button>
                  <button onClick={e=>{e.stopPropagation();setConfirmDel(p);}} style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:13,padding:"4px"}}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#162230",borderRadius:14,border:"1px solid #ef535044",padding:28,maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>🗑️</div>
            <div style={{color:"#e8edf2",fontWeight:700,marginBottom:6}}>Eliminare il progetto?</div>
            <div style={{color:"#ef5350",fontSize:13,marginBottom:20,fontWeight:600}}>"{confirmDel.name}"</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{onDelete(confirmDel.id);setConfirmDel(null);}} style={{background:"#ef5350",color:"white",border:"none",borderRadius:10,padding:"9px 22px",fontWeight:800,cursor:"pointer"}}>Elimina</button>
              <button onClick={()=>setConfirmDel(null)} style={{background:"#1a2d3d",color:"#c8d8e8",border:BD,borderRadius:10,padding:"9px 18px",cursor:"pointer"}}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepInspector({ project, onUpdate }) {
  return (
    <div style={{padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:16,fontWeight:700}}>Nome Ispettore / Compilatore</div>
      <div style={{background:"#162230",borderRadius:12,border:BD,padding:"16px"}}>
        <div style={{fontSize:11,color:"#7a9ab0",marginBottom:8}}>Il nome apparirà nel report di verifica</div>
        <input value={project.inspector||""} onChange={e=>onUpdate(e.target.value)} placeholder="Nome e cognome ispettore…"
          style={{width:"100%",background:"#0f1923",border:"1px solid #2a3f52",borderRadius:8,padding:"10px 14px",color:"#C8A96E",fontSize:14,outline:"none",fontWeight:600,boxSizing:"border-box"}}/>
        {project.inspector&&(
          <div style={{marginTop:12,padding:"10px 14px",background:"#0f1923",borderRadius:8,border:"1px solid #C8A96E33"}}>
            <div style={{fontSize:10,color:"#7a9ab0",marginBottom:3}}>Ispettore impostato</div>
            <div style={{fontSize:15,fontWeight:700,color:"#C8A96E"}}>👤 {project.inspector}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepDiscipline({ disciplines, project, onSelectDisc }) {
  const selected = project.selectedDisc || null;
  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
      <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:6,fontWeight:700}}>Scegli la Disciplina</div>
      <div style={{fontSize:12,color:"#7a9ab0",marginBottom:18}}>Seleziona la disciplina da verificare.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Object.entries(disciplines).map(([dk,d])=>{
          const isAct=selected===dk;
          return (
            <div key={dk} onClick={()=>onSelectDisc(dk)}
              style={{display:"flex",alignItems:"center",gap:16,padding:"16px 18px",background:isAct?`${d.color}18`:"#162230",border:`2px solid ${isAct?d.color:"#1a2d3d"}`,borderRadius:14,cursor:"pointer",transition:"all .15s"}}>
              <div style={{width:44,height:44,borderRadius:12,background:isAct?`${d.color}33`:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{d.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:isAct?800:500,color:isAct?d.color:"#c8d8e8"}}>{d.label}</div>
                <div style={{fontSize:11,color:"#3a5468",marginTop:3}}>{d.sections.length>0?`${d.sections.length} sezioni disponibili`:"Nessuna norma — aggiungila dalla Libreria Norme"}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${isAct?d.color:"#3a5468"}`,background:isAct?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {isAct&&<span style={{color:"#0a1520",fontSize:13,fontWeight:900}}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepNorms({ disciplines, setDisciplines, project, onToggle, onGoChecklist }) {
  const dk=project?.selectedDisc||null; const d=dk?disciplines[dk]:null;
  const activeSections=project?.activeSections||{};
  const [selSec,setSelSec]=useState(0); const [editItem,setEditItem]=useState(null);
  const [editText,setEditText]=useState(""); const [editRef,setEditRef]=useState("");
  const [newSec,setNewSec]=useState(""); const [newText,setNewText]=useState(""); const [newRef,setNewRef]=useState("");
  const [confirmDel,setConfirmDel]=useState(null); const [newItemsState,setNewItemsState]=useState({});
  const [editDefault,setEditDefault]=useState(null); const [newDefault,setNewDefault]=useState(null);
  const sections=d?.sections||[]; const sec=sections[selSec];
  const upd=fn=>{const n=JSON.parse(JSON.stringify(disciplines));fn(n);setDisciplines(n);db.saveNorms(n);};
  const addSec=()=>{if(!newSec.trim())return;upd(n=>n[dk].sections.push({title:newSec.trim(),items:[]}));setSelSec(sections.length);setNewSec("");};
  const saveEdit=()=>{if(!editText.trim())return;upd(n=>{n[dk].sections[editItem.si].items[editItem.ii]={text:editText.trim(),ref:editRef.trim(),defaultAnswer:editDefault||null};});setEditItem(null);setEditDefault(null);};
  if(!dk||!d)return(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468",padding:20}}><div style={{fontSize:36}}>📚</div><div style={{fontSize:14,fontWeight:700,color:"#c8d8e8"}}>Seleziona prima una disciplina</div></div>);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"12px 20px",borderBottom:BD,background:`${d.color}10`,flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:26}}>{d.icon}</div>
        <div><div style={{fontSize:15,fontWeight:800,color:d.color}}>{d.label}</div>
        <div style={{fontSize:11,color:"#7a9ab0",marginTop:1}}>Sinistra: seleziona · Destra: gestisci libreria</div></div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Selezione */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",borderRight:BD}}>
          <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Seleziona norme da analizzare</div>
          {sections.length===0?(<div style={{textAlign:"center",color:"#3a5468",marginTop:40}}><div style={{fontSize:32,marginBottom:8}}>📂</div><div style={{fontSize:13,color:"#c8d8e8",fontWeight:700,marginBottom:4}}>Nessuna norma</div><div style={{fontSize:11}}>Aggiungi dalla colonna destra →</div></div>):(
            <>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                <button onClick={()=>sections.forEach(s=>onToggle(dk,s.title,true))} style={{background:`${d.color}22`,border:`1px solid ${d.color}44`,borderRadius:7,color:d.color,fontSize:11,fontWeight:700,padding:"5px 12px",cursor:"pointer"}}>✓ Tutte</button>
                <button onClick={()=>sections.forEach(s=>onToggle(dk,s.title,false))} style={{background:"#162230",border:BD,borderRadius:7,color:"#7a9ab0",fontSize:11,padding:"5px 12px",cursor:"pointer"}}>✕ Nessuna</button>
              </div>
              {sections.map((sec,si)=>{
                const secKey=`${dk}__${sec.title}`; const active=!!activeSections[secKey];
                const addText=newItemsState[si]?.text||""; const addRef=newItemsState[si]?.ref||"";
                const setAddText=v=>setNewItemsState(p=>({...p,[si]:{...p[si],text:v}}));
                const setAddRef=v=>setNewItemsState(p=>({...p,[si]:{...p[si],ref:v}}));
                return (
                  <div key={sec.title} style={{marginBottom:10,borderRadius:12,border:`2px solid ${active?d.color+"66":"#1a2d3d"}`,overflow:"hidden",background:active?`${d.color}0a`:"#0f1923"}}>
                    <div onClick={()=>onToggle(dk,sec.title,!active)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",cursor:"pointer",background:active?`${d.color}18`:"#162230"}}>
                      <div style={{width:24,height:24,borderRadius:6,border:`2px solid ${active?d.color:"#3a5468"}`,background:active?d.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {active&&<span style={{color:"#0a1520",fontSize:13,fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:active?700:400,color:active?"#e8edf2":"#7a9ab0"}}>{sec.title}</div>
                        <div style={{fontSize:10,color:"#3a5468",marginTop:2}}>{sec.items.length} voci</div>
                      </div>
                      {active&&<span style={{fontSize:10,color:d.color,fontWeight:700,background:`${d.color}22`,padding:"2px 9px",borderRadius:20}}>ATTIVA</span>}
                    </div>
                    {active&&(
                      <div style={{padding:"10px 14px",background:"#0a1520"}} onClick={e=>e.stopPropagation()}>
                        {sec.items.map((item,ii)=>(
                          <div key={ii} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 10px",background:"#162230",borderRadius:8,marginBottom:6,border:BD}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:11,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                              {item.ref&&<div style={{fontSize:9,color:"#C8A96E",fontStyle:"italic",marginTop:2}}>📌 {item.ref}</div>}
                            </div>
                            <button onClick={()=>setConfirmDel({msg:"Eliminare questa voce?",action:()=>{upd(n=>n[dk].sections[si].items.splice(ii,1));setConfirmDel(null);}})}
                              style={{background:"transparent",border:BD,borderRadius:5,color:"#ef5350",cursor:"pointer",fontSize:11,padding:"2px 7px",flexShrink:0}}>🗑</button>
                          </div>
                        ))}
                        {sec.items.length===0&&<div style={{color:"#3a5468",fontSize:10,fontStyle:"italic",marginBottom:8,textAlign:"center"}}>Nessuna voce</div>}
                        <div style={{marginTop:8,background:"#0d1f2d",borderRadius:8,border:"1px solid #C8A96E22",padding:10}}>
                          <div style={{fontSize:9,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>+ Aggiungi voce</div>
                          <textarea value={addText} onChange={e=>setAddText(e.target.value)} rows={2} placeholder="Descrizione voce…"
                            style={{width:"100%",background:"#0f1923",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                          <input value={addRef} onChange={e=>setAddRef(e.target.value)} placeholder="Rif. normativo (opzionale)"
                            style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                          <button onClick={()=>{if(!addText.trim())return;upd(n=>n[dk].sections[si].items.push({text:addText.trim(),ref:addRef.trim()}));setNewItemsState(p=>({...p,[si]:{text:"",ref:""}}));}}
                            style={{marginTop:6,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:800,fontSize:11,cursor:"pointer"}}>+ Aggiungi</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
        {/* Editor libreria */}
        <div style={{width:360,display:"flex",flexDirection:"column",background:"#0a1520",overflow:"hidden",flexShrink:0}}>
          <div style={{padding:"10px 14px",borderBottom:BD,background:"#0f1923",flexShrink:0}}>
            <div style={{fontSize:11,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>⚖️ Libreria — {d.label}</div>
          </div>
          <div style={{borderBottom:BD,maxHeight:170,overflowY:"auto",flexShrink:0}}>
            {sections.length===0&&<div style={{padding:"8px 14px",fontSize:11,color:"#3a5468",fontStyle:"italic"}}>Nessuna sezione</div>}
            {sections.map((s,si)=>(
              <div key={si} style={{display:"flex",alignItems:"center",background:selSec===si?"#162230":"transparent"}}>
                <button onClick={()=>{setSelSec(si);setEditItem(null);}} style={{flex:1,textAlign:"left",padding:"8px 14px",border:"none",background:"transparent",color:selSec===si?"#e8edf2":"#7a9ab0",cursor:"pointer",fontSize:11}}>
                  {s.title.length>30?s.title.slice(0,30)+"…":s.title} <span style={{fontSize:9,color:"#3a5468"}}>({s.items.length})</span>
                </button>
                <button onClick={()=>setConfirmDel({msg:`Eliminare "${s.title}"?`,action:()=>{upd(n=>n[dk].sections.splice(si,1));setSelSec(Math.max(0,si-1));setConfirmDel(null);}})}
                  style={{background:"transparent",border:"none",color:"#3a5468",cursor:"pointer",fontSize:12,padding:"0 10px 0 0"}}>🗑</button>
              </div>
            ))}
          </div>
          <div style={{padding:"8px 12px",borderBottom:BD,flexShrink:0}}>
            <div style={{display:"flex",gap:6}}>
              <input value={newSec} onChange={e=>setNewSec(e.target.value)} placeholder="Nuova sezione…" onKeyDown={e=>e.key==="Enter"&&addSec()}
                style={{flex:1,background:"#162230",border:BD,borderRadius:6,padding:"6px 8px",color:"#e8edf2",fontSize:11,outline:"none",boxSizing:"border-box"}}/>
              <button onClick={addSec} style={{background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:6,padding:"6px 12px",fontWeight:800,fontSize:13,cursor:"pointer"}}>+</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
            {!sec?(<div style={{color:"#3a5468",fontSize:11,textAlign:"center",marginTop:20}}>Seleziona una sezione</div>):(
              <>
                <div style={{fontSize:11,fontWeight:700,color:"#C8A96E",marginBottom:8,paddingBottom:6,borderBottom:BD}}>{sec.title} <span style={{fontSize:9,color:"#3a5468",fontWeight:400}}>({sec.items.length})</span></div>
                {sec.items.length===0&&<div style={{color:"#3a5468",fontSize:10,fontStyle:"italic",marginBottom:8}}>Nessuna voce</div>}
                {sec.items.map((item,ii)=>(
                  <div key={ii} style={{marginBottom:8,background:"#162230",borderRadius:9,border:BD,overflow:"hidden"}}>
                    {editItem?.si===selSec&&editItem?.ii===ii?(
                      <div style={{padding:10}}>
                        <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} style={{width:"100%",background:"#0f1923",border:"1px solid #C8A96E44",borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                        <input value={editRef} onChange={e=>setEditRef(e.target.value)} placeholder="Rif. normativo…" style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                        <div style={{marginTop:7}}><div style={{fontSize:9,color:"#7a9ab0",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Default</div>
                          <div style={{display:"flex",gap:5}}>
                            {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                              <button key={val} onClick={()=>setEditDefault(val===editDefault?null:val)} style={{padding:"3px 10px",borderRadius:20,border:`2px solid ${col}`,background:editDefault===val?col:"transparent",color:editDefault===val?"white":col,fontWeight:700,fontSize:10,cursor:"pointer"}}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5,marginTop:7}}>
                          <button onClick={saveEdit} style={{background:"#22863a",color:"white",border:"none",borderRadius:6,padding:"5px 14px",fontWeight:700,fontSize:11,cursor:"pointer"}}>✓ Salva</button>
                          <button onClick={()=>setEditItem(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:6,padding:"5px 10px",fontSize:11,cursor:"pointer"}}>Annulla</button>
                        </div>
                      </div>
                    ):(
                      <div style={{padding:"9px 11px"}}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:11,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                            <div style={{fontSize:9,color:"#C8A96E",fontStyle:"italic",marginTop:2}}>📌 {item.ref||<span style={{color:"#3a5468"}}>—</span>}</div>
                          </div>
                          <div style={{display:"flex",gap:2,flexShrink:0}}>
                            <button onClick={()=>{setEditItem({si:selSec,ii});setEditText(item.text);setEditRef(item.ref||"");setEditDefault(item.defaultAnswer||null);}} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>✏️</button>
                            <button onClick={()=>setConfirmDel({msg:"Eliminare questa voce?",action:()=>{upd(n=>n[dk].sections[selSec].items.splice(ii,1));setConfirmDel(null);}})} style={{background:"#1a2d3d",color:"#ef5350",border:BD,borderRadius:5,padding:"3px 7px",fontSize:10,cursor:"pointer"}}>🗑</button>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5,marginTop:6}}>
                          {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>{
                            const isSet=item.defaultAnswer===val;
                            return <button key={val} onClick={()=>upd(n=>{n[dk].sections[selSec].items[ii].defaultAnswer=isSet?null:val;})} style={{padding:"2px 9px",borderRadius:20,border:`2px solid ${col}`,background:isSet?col:"transparent",color:isSet?"white":col,fontWeight:700,fontSize:9,cursor:"pointer"}}>{lbl}</button>;
                          })}
                          {!item.defaultAnswer&&<span style={{fontSize:9,color:"#3a5468",alignSelf:"center"}}>nessun default</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{marginTop:10,background:"#0d1f2d",borderRadius:9,border:"1px solid #C8A96E22",padding:11}}>
                  <div style={{fontSize:9,color:"#C8A96E",letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>+ Nuova voce</div>
                  <textarea value={newText} onChange={e=>setNewText(e.target.value)} rows={2} placeholder="Descrizione voce…" style={{width:"100%",background:"#0f1923",border:BD,borderRadius:6,padding:"5px 8px",color:"#e8edf2",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  <input value={newRef} onChange={e=>setNewRef(e.target.value)} placeholder="Rif. normativo…" style={{width:"100%",marginTop:4,background:"#0f1923",border:"1px solid #C8A96E33",borderRadius:6,padding:"4px 8px",color:"#C8A96E",fontSize:10,outline:"none",boxSizing:"border-box"}}/>
                  <div style={{marginTop:7}}><div style={{fontSize:9,color:"#7a9ab0",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>Default</div>
                    <div style={{display:"flex",gap:5}}>
                      {[["ok","✓ Sì","#22863a"],["ko","✗ No","#cb2431"],["na","N/A","#6a737d"]].map(([val,lbl,col])=>(
                        <button key={val} onClick={()=>setNewDefault(newDefault===val?null:val)} style={{padding:"2px 9px",borderRadius:20,border:`2px solid ${col}`,background:newDefault===val?col:"transparent",color:newDefault===val?"white":col,fontWeight:700,fontSize:9,cursor:"pointer"}}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>{if(!newText.trim())return;upd(n=>n[dk].sections[selSec].items.push({text:newText.trim(),ref:newRef.trim(),defaultAnswer:newDefault||null}));setNewText("");setNewRef("");setNewDefault(null);}}
                    style={{marginTop:8,background:"#C8A96E",color:"#0a1520",border:"none",borderRadius:7,padding:"6px 16px",fontWeight:800,fontSize:12,cursor:"pointer"}}>+ Aggiungi voce</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#162230",borderRadius:12,border:"1px solid #ef535044",padding:22,maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:8}}>⚠️</div>
            <div style={{color:"#e8edf2",fontWeight:700,marginBottom:14,fontSize:13}}>{confirmDel.msg}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={confirmDel.action} style={{background:"#ef5350",color:"white",border:"none",borderRadius:8,padding:"7px 18px",fontWeight:700,cursor:"pointer"}}>Elimina</button>
              <button onClick={()=>setConfirmDel(null)} style={{background:"#1a2d3d",color:"#7a9ab0",border:BD,borderRadius:8,padding:"7px 14px",cursor:"pointer"}}>Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepChecklist({ project, disciplines, onSetStatus, onSetNote, onSetRemark }) {
  const [selDisc,setSelDisc]=useState(null); const [expandedSecs,setExpandedSecs]=useState({});
  const [showPDF,setShowPDF]=useState(false); const [pdfLoading,setPdfLoading]=useState(false);
  const activeSections=project.activeSections||{}; const selectedDisc=project.selectedDisc||null;
  const getActiveSecs=dk=>(disciplines[dk]?.sections||[]).filter(s=>activeSections[`${dk}__${s.title}`]);
  const activeDiscsKeys=Object.keys(disciplines).filter(dk=>getActiveSecs(dk).length>0);
  const preferredDisc=(selectedDisc&&activeDiscsKeys.includes(selectedDisc))?selectedDisc:(activeDiscsKeys[0]||null);
  const currentDisc=(selDisc&&activeDiscsKeys.includes(selDisc))?selDisc:preferredDisc;
  const getProgress=dk=>{const secs=getActiveSecs(dk);const total=secs.reduce((a,s)=>a+s.items.length,0);const done=secs.reduce((a,s)=>a+s.items.filter(i=>project.checklist[`${dk}__${s.title}__${i.text}`]).length,0);return{total,done,pct:total?Math.round(done/total*100):0};};
  const totalPct=()=>{const total=activeDiscsKeys.flatMap(dk=>getActiveSecs(dk)).reduce((a,s)=>a+s.items.length,0);const si=Object.values(project.checklist).filter(v=>v==="ok").length;return total?Math.round(si/total*100):0;};
  const noCount=Object.values(project.checklist).filter(v=>v==="ko").length;
  const disc=currentDisc?disciplines[currentDisc]:null; const currentSecs=currentDisc?getActiveSecs(currentDisc):[];
  if(activeDiscsKeys.length===0)return(<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468",padding:20}}><div style={{fontSize:40}}>📋</div><div style={{fontSize:15,fontWeight:700,color:"#c8d8e8",textAlign:"center"}}>Nessuna disciplina attiva</div><div style={{fontSize:12,textAlign:"center"}}>Vai al passo 4 per selezionare le norme</div></div>);
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"10px 16px",borderBottom:BD,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:20,fontWeight:800,color:"#C8A96E"}}>{totalPct()}%</div>
          <div style={{width:80,height:4,background:"#1a2d3d",borderRadius:2}}><div style={{height:"100%",width:`${totalPct()}%`,background:"#C8A96E",borderRadius:2,transition:"width .4s"}}/></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setShowPDF(true)} style={{background:"linear-gradient(135deg,#c0392b,#8b0000)",border:"none",color:"white",borderRadius:7,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            📕 PDF {noCount>0&&<span style={{background:"rgba(255,255,255,0.25)",borderRadius:8,padding:"0 5px",fontSize:10}}>{noCount}✗</span>}
          </button>
          <button onClick={()=>exportExcel(project,disciplines)} style={{background:"linear-gradient(135deg,#C8A96E,#a07040)",border:"none",color:"white",borderRadius:7,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer"}}>📊 Excel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:6,padding:"10px 16px",overflowX:"auto",borderBottom:BD,flexShrink:0}}>
        {activeDiscsKeys.map(dk=>{const{pct,done,total}=getProgress(dk);const d=disciplines[dk];const isAct=currentDisc===dk;return(<button key={dk} onClick={()=>setSelDisc(dk)} style={{flex:"0 0 auto",background:isAct?`${d.color}22`:"#162230",border:`2px solid ${isAct?d.color:"#243344"}`,borderRadius:10,padding:"9px 14px",cursor:"pointer",minWidth:130,textAlign:"left"}}><div style={{fontSize:17,marginBottom:1}}>{d.icon}</div><div style={{fontSize:12,fontWeight:700,color:isAct?d.color:"#c8d8e8"}}>{d.label}</div><div style={{fontSize:10,color:"#7a9ab0",marginTop:1}}>{done}/{total}</div><div style={{height:2,background:"#1a2d3d",borderRadius:2,marginTop:4}}><div style={{height:"100%",width:`${pct}%`,background:d.color,borderRadius:2,transition:"width .4s"}}/></div></button>);})}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 32px"}}>
        {currentSecs.map(sec=>{
          const isOpen=expandedSecs[sec.title]!==false;
          const secSi=sec.items.filter(i=>project.checklist[`${currentDisc}__${sec.title}__${i.text}`]==="ok").length;
          const secNo=sec.items.filter(i=>project.checklist[`${currentDisc}__${sec.title}__${i.text}`]==="ko").length;
          return (
            <div key={sec.title} style={{marginBottom:11,background:"#162230",borderRadius:12,border:BD,overflow:"hidden"}}>
              <div onClick={()=>setExpandedSecs(p=>({...p,[sec.title]:!isOpen}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 15px",cursor:"pointer",borderBottom:isOpen?BD:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                  <div style={{width:3,height:18,background:disc?.color||"#C8A96E",borderRadius:2,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#c8d8e8"}}>{sec.title}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:9,color:"#3a5468"}}>{secSi+secNo}/{sec.items.length}</span>
                  {secSi>0&&<span style={{background:"#22863a22",color:"#4caf50",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20}}>✓{secSi}</span>}
                  {secNo>0&&<span style={{background:"#cb243122",color:"#ef5350",fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20}}>✗{secNo}</span>}
                  <span style={{color:"#3a5468",fontSize:11}}>{isOpen?"▲":"▼"}</span>
                </div>
              </div>
              {isOpen&&sec.items.map(item=>{
                const key=`${currentDisc}__${sec.title}__${item.text}`;
                const status=project.checklist[key]!==undefined?project.checklist[key]:(item.defaultAnswer||undefined);
                const bgColor=status==="ko"?"#cb243108":status==="ok"?"#22863a08":status==="na"?"#ffffff05":"transparent";
                return (
                  <div key={item.text} style={{borderBottom:BD,padding:"10px 15px",background:bgColor}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:160}}>
                        <div style={{fontSize:12,color:"#c8d8e8",lineHeight:1.5}}>{item.text}</div>
                        {item.ref&&<div style={{fontSize:10,color:"#C8A96E",marginTop:2,fontStyle:"italic"}}>📌 {item.ref}</div>}
                        {item.defaultAnswer&&project.checklist[key]===undefined&&(
                          <div style={{fontSize:9,color:"#7a9ab0",marginTop:3,fontStyle:"italic"}}>default: {item.defaultAnswer==="ok"?"✓ Sì":item.defaultAnswer==="ko"?"✗ No":"N/A"}</div>
                        )}
                      </div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                        <SBtn active={status==="ok"} onClick={()=>onSetStatus(key,"ok")} label="✓ Sì" color="#22863a"/>
                        <SBtn active={status==="ko"} onClick={()=>onSetStatus(key,"ko")} label="✗ No" color="#cb2431"/>
                        <SBtn active={status==="na"} onClick={()=>onSetStatus(key,"na")} label="N/A" color="#6a737d"/>
                      </div>
                    </div>
                    <div style={{marginTop:8}}><input value={project.notes[key]||""} onChange={e=>onSetNote(key,e.target.value)} placeholder="Note tecniche…" style={{width:"100%",background:"#0f1923",border:BD,borderRadius:7,padding:"5px 10px",color:"#c8d8e8",fontSize:11,outline:"none",boxSizing:"border-box"}}/></div>
                    <div style={{marginTop:6}}>
                      <div style={{fontSize:9,color:"#C8A96E",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>📝 Rilievo ispettore</div>
                      <textarea value={project.remarks?.[key]||""} onChange={e=>onSetRemark(key,e.target.value)} placeholder="Rilievo in loco…" rows={2} style={{width:"100%",background:"#0d1f2d",border:"1px solid #C8A96E44",borderRadius:7,padding:"5px 10px",color:"#C8A96E",fontSize:11,outline:"none",resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {showPDF&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#0f1923",borderRadius:14,border:"1px solid #C8A96E44",width:"100%",maxWidth:420,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:BD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:800,color:"#e8edf2"}}>Genera PDF</div>
              <button onClick={()=>setShowPDF(false)} style={{background:"transparent",border:BD,borderRadius:7,color:"#7a9ab0",fontSize:14,padding:"3px 9px",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>{if(pdfLoading)return;setPdfLoading(true);try{exportPDF(project,disciplines,"full");}finally{setPdfLoading(false);setShowPDF(false);}}} style={{background:"#162230",border:"1px solid #C8A96E44",borderRadius:11,padding:"16px",cursor:pdfLoading?"wait":"pointer",opacity:pdfLoading?0.6:1,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>📄</div>
                <div><div style={{fontSize:13,fontWeight:800,color:"#e8edf2"}}>Report Completo</div><div style={{fontSize:11,color:"#7a9ab0",marginTop:2}}>Anteprima + scarica file HTML</div></div>
              </div>
              <div onClick={()=>{if(pdfLoading)return;setPdfLoading(true);try{exportPDF(project,disciplines,"issues");}finally{setPdfLoading(false);setShowPDF(false);}}} style={{background:"#1a0f0f",border:"1px solid #ef535044",borderRadius:11,padding:"16px",cursor:pdfLoading?"wait":"pointer",opacity:pdfLoading?0.6:1,display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:28}}>⚠️</div>
                <div><div style={{fontSize:13,fontWeight:800,color:"#ef5350"}}>Solo Non Conformità</div><div style={{fontSize:11,color:"#7a9ab0",marginTop:2}}>Voci NO <span style={{background:"#ef535022",color:"#ef5350",padding:"0 6px",borderRadius:8,fontWeight:700}}>{noCount}</span></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   APP PRINCIPALE con Supabase
   ════════════════════════════════════════════════ */
export default function App() {
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [disciplines, setDisciplines] = useState(DEFAULT_DISCIPLINES);
  const [projects,    setProjects]    = useState([]);
  const [activeId,    setActiveId]    = useState(null);
  const [activeStep,  setActiveStep]  = useState("project");
  const [showAdmin,   setShowAdmin]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  /* ── Auth listener ── */
  useEffect(() => {
    auth.getUser().then(({ data }) => {
      if (data.user) loadUserData(data.user);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = auth.onAuthChange((event, session) => {
      if (event === "SIGNED_IN"  && session?.user) loadUserData(session.user);
      if (event === "SIGNED_OUT") { setUser(null); setProfile(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    setUser(u);
    const [{ data: prof }, { data: norms }, { data: projs }] = await Promise.all([
      db.getProfile(u.id),
      db.getNorms(),
      db.getMyProjects(u.id),
    ]);
    if (prof) setProfile(prof);
    if (norms?.disciplines && Object.keys(norms.disciplines).length > 0)
      setDisciplines(norms.disciplines);
    if (projs) setProjects(projs.map(normalizeProject));
    setAuthLoading(false);
  };

  // Normalizza progetto dal DB al formato interno
  const normalizeProject = p => ({
    id:             p.id,
    userId:         p.user_id,
    name:           p.name,
    inspector:      p.inspector || "",
    selectedDisc:   p.selected_disc || null,
    activeSections: p.active_sections || {},
    checklist:      p.checklist || {},
    notes:          p.notes || {},
    remarks:        p.remarks || {},
    updatedAt:      p.updated_at,
    createdAt:      p.created_at,
  });

  const project = projects.find(p => p.id === activeId) || null;

  /* ── Salvataggio automatico su Supabase ── */
  const saveProject = useCallback(async (proj) => {
    if (!proj || !user) return;
    setSaving(true);
    await db.upsertProject({ ...proj, userId: user.id });
    setSaving(false);
  }, [user]);

  const updProj = useCallback(fn => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const updated = { ...fn({ ...p }), updatedAt: new Date().toISOString() };
      saveProject(updated);
      return updated;
    }));
  }, [activeId, saveProject]);

  const createProject = async name => {
    if (!user) return;
    const p = mkProject(name, user.id);
    const { data } = await db.upsertProject(p);
    if (data) {
      const normalized = normalizeProject(data);
      setProjects(prev => [normalized, ...prev]);
      setActiveId(normalized.id);
      setActiveStep("inspector");
    }
  };

  const renameProject = (id, name) => {
    setProjects(prev => prev.map(p => p.id===id ? {...p, name, updatedAt: new Date().toISOString()} : p));
    const proj = projects.find(p=>p.id===id);
    if (proj) saveProject({...proj, name});
  };

  const deleteProject = async id => {
    await db.deleteProject(id);
    setProjects(prev => prev.filter(p=>p.id!==id));
    if (activeId===id) { setActiveId(null); setActiveStep("project"); }
  };

  const setDisciplinesAndSave = useCallback(newDisc => {
    setDisciplines(newDisc);
    db.saveNorms(newDisc);
  }, []);

  const toggleSection = useCallback((dKey, secTitle, force) => {
    const key = `${dKey}__${secTitle}`;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const newVal = force !== undefined ? !!force : !p.activeSections?.[key];
      if (newVal) setActiveStep("checklist");
      const updated = { ...p, updatedAt: new Date().toISOString(), activeSections: { ...p.activeSections, [key]: newVal } };
      saveProject(updated);
      return updated;
    }));
  }, [activeId, saveProject]);

  const selectDisc = useCallback(dk => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeId) return p;
      const updated = { ...p, selectedDisc: dk, updatedAt: new Date().toISOString() };
      saveProject(updated);
      return updated;
    }));
  }, [activeId, saveProject]);

  const setStatus  = (key,val) => updProj(p=>({...p,checklist:{...p.checklist,[key]:p.checklist[key]===val?undefined:val}}));
  const setNote    = (key,val) => updProj(p=>({...p,notes:{...p.notes,[key]:val}}));
  const setRemark  = (key,val) => updProj(p=>({...p,remarks:{...(p.remarks||{}),[key]:val}}));

  const stepStatus = {
    project:    activeId?"done":"empty",
    inspector:  project?.inspector?"done":activeId?"pending":"empty",
    discipline: project?.selectedDisc?"done":activeId?"pending":"empty",
    norms:      project?.selectedDisc&&Object.values(project.activeSections||{}).some(Boolean)?"done":activeId?"pending":"empty",
    checklist:  "always",
  };
  const stepColor = s => s==="done"?"#22863a":s==="pending"?"#C8A96E":"#3a5468";
  const stepBadge = s => s==="done"?"✓":s==="pending"?"→":null;

  /* ── Loading / Login ── */
  if (authLoading) return (
    <div style={{minHeight:"100vh",background:"#0f1923",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",color:"#C8A96E"}}>
        <div style={{fontSize:40,marginBottom:16}}>📋</div>
        <div style={{fontSize:14,fontWeight:700}}>Caricamento…</div>
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={loadUserData}/>;

  return (
    <div style={{display:"flex",height:"100vh",background:"#0f1923",fontFamily:"'Segoe UI',sans-serif",color:"#e8edf2",overflow:"hidden"}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:220,background:"#0a1520",borderRight:BD,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"16px 16px 12px",borderBottom:BD}}>
          <div style={{fontSize:9,letterSpacing:3,color:"#C8A96E",textTransform:"uppercase",marginBottom:2}}>Piattaforma</div>
          <div style={{fontSize:14,fontWeight:800,color:"#e8edf2",lineHeight:1.2}}>Verifiche<br/>Normative</div>
        </div>

        {/* Utente loggato */}
        <div style={{padding:"10px 16px",borderBottom:BD,background:"#162230"}}>
          <div style={{fontSize:9,color:"#7a9ab0",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Connesso come</div>
          <div style={{fontSize:12,fontWeight:700,color:"#e8edf2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.full_name||user.email}</div>
          <div style={{fontSize:10,color:profile?.role==="admin"?"#C8A96E":"#7a9ab0",marginTop:1}}>{profile?.role==="admin"?"👑 Amministratore":"👤 Ispettore"}</div>
          {saving&&<div style={{fontSize:9,color:"#7a9ab0",marginTop:3}}>💾 Salvataggio…</div>}
        </div>

        {/* Progetto attivo */}
        {project&&(
          <div style={{padding:"10px 16px",borderBottom:BD,background:"#162230"}}>
            <div style={{fontSize:9,color:"#7a9ab0",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Progetto attivo</div>
            <div style={{fontSize:13,fontWeight:700,color:"#e8edf2",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</div>
            {project.inspector&&<div style={{fontSize:11,color:"#7a9ab0",marginTop:1}}>👤 {project.inspector}</div>}
          </div>
        )}

        {/* Steps */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
          {STEPS.map((step,idx)=>{
            const isAct=activeStep===step.id;
            const status=stepStatus[step.id];
            const disabled=step.id!=="project"&&!activeId;
            return (
              <button key={step.id} onClick={()=>!disabled&&setActiveStep(step.id)}
                style={{width:"100%",textAlign:"left",padding:"12px 16px",background:isAct?"#1a2d3d":"transparent",border:"none",borderLeft:`3px solid ${isAct?"#C8A96E":"transparent"}`,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,display:"flex",alignItems:"center",gap:12,transition:"all .15s"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:isAct?"#C8A96E22":status==="done"?"#22863a22":"#162230",border:`2px solid ${isAct?"#C8A96E":stepColor(status)}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {stepBadge(status)?<span style={{fontSize:11,fontWeight:800,color:stepColor(status)}}>{stepBadge(status)}</span>:<span style={{fontSize:14}}>{step.icon}</span>}
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:9,color:"#3a5468",fontWeight:600}}>{idx+1}.</span>
                    <span style={{fontSize:13,fontWeight:isAct?700:500,color:isAct?"#e8edf2":"#7a9ab0"}}>{step.label}</span>
                  </div>
                  <div style={{fontSize:10,color:"#3a5468",marginTop:1}}>{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer sidebar */}
        <div style={{padding:"10px 12px",borderTop:BD,display:"flex",flexDirection:"column",gap:6}}>
          {profile?.role==="admin"&&(
            <button onClick={()=>setShowAdmin(true)}
              style={{background:"#C8A96E14",border:"1px solid #C8A96E33",borderRadius:8,padding:"8px 12px",cursor:"pointer",textAlign:"left",color:"#C8A96E",fontSize:12,fontWeight:700}}>
              👑 Dashboard Admin
            </button>
          )}
          <button onClick={()=>auth.signOut()}
            style={{background:"#162230",border:BD,borderRadius:8,padding:"8px 12px",cursor:"pointer",color:"#7a9ab0",fontSize:12}}>
            🚪 Esci
          </button>
        </div>
      </div>

      {/* ── AREA CONTENUTO ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header step */}
        <div style={{padding:"14px 24px",borderBottom:BD,background:"linear-gradient(135deg,#0f1923,#162230)",flexShrink:0}}>
          {STEPS.map(s=>s.id===activeStep&&(
            <div key={s.id}>
              <div style={{fontSize:9,color:"#C8A96E",letterSpacing:3,textTransform:"uppercase"}}>{STEPS.findIndex(x=>x.id===s.id)+1} di {STEPS.length}</div>
              <div style={{fontSize:20,fontWeight:800,color:"#e8edf2"}}>{s.icon} {s.label}</div>
              <div style={{fontSize:12,color:"#7a9ab0",marginTop:2}}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Contenuto step */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {activeStep==="project"&&<StepProject projects={projects} activeId={activeId} onSelect={id=>{setActiveId(id);setActiveStep("inspector");}} onCreate={createProject} onDelete={deleteProject} onRename={renameProject}/>}
          {activeStep==="inspector"&&project&&<StepInspector project={project} onUpdate={val=>updProj(p=>({...p,inspector:val}))}/>}
          {activeStep==="discipline"&&project&&<StepDiscipline disciplines={disciplines} project={project} onSelectDisc={selectDisc}/>}
          {activeStep==="norms"&&project&&<StepNorms disciplines={disciplines} setDisciplines={setDisciplinesAndSave} project={project} onToggle={toggleSection} onGoChecklist={()=>setActiveStep("checklist")}/>}
          {activeStep==="checklist"&&project&&<StepChecklist project={project} disciplines={disciplines} onSetStatus={setStatus} onSetNote={setNote} onSetRemark={setRemark}/>}
          {(activeStep==="inspector"||activeStep==="discipline"||activeStep==="norms"||activeStep==="checklist")&&!project&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3a5468"}}>
              <div style={{fontSize:36}}>📁</div>
              <div style={{fontSize:14,fontWeight:700}}>Seleziona prima un progetto</div>
              <button onClick={()=>setActiveStep("project")} style={{background:"#C8A96E",border:"none",borderRadius:10,color:"#0a1520",fontWeight:800,fontSize:13,padding:"9px 22px",cursor:"pointer",marginTop:4}}>→ Vai a Progetto</button>
            </div>
          )}
        </div>

        {/* Pulsante Avanti */}
        {activeStep!=="checklist"&&activeId&&(
          <div style={{padding:"10px 16px",borderTop:BD,flexShrink:0}}>
            <button onClick={()=>{const idx=STEPS.findIndex(s=>s.id===activeStep);if(idx<STEPS.length-1)setActiveStep(STEPS[idx+1].id);}}
              style={{width:"100%",background:"linear-gradient(135deg,#C8A96E,#a07040)",border:"none",borderRadius:10,color:"white",fontWeight:800,fontSize:13,padding:"10px",cursor:"pointer"}}>
              Avanti →
            </button>
          </div>
        )}
      </div>

      {/* Admin Dashboard */}
      {showAdmin&&profile?.role==="admin"&&(
        <AdminDashboard currentUser={user} disciplines={disciplines} onClose={()=>setShowAdmin(false)}/>
      )}
    </div>
  );
}
