import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Template = { id:string; name:string; description:string; source:string; features:string[] };
type Site = { id:string; name:string; domain:string; template:string; status:string };
type Branding = { siteName:string; logo:string; favicon:string; primary:string; secondary:string; accent:string; success:string; danger:string; warning:string; font:string; theme:'light'|'dark'; showBrandName:boolean; browserTitle:string; footerBranding:string; customCss:string };

const TEMPLATES:Template[] = [
{id:'core',name:'VintelTool Core',description:'Base VintelTool application shell and shared platform components.',source:'DerivFX4/vinteltool',features:['Dashboard','Navigation','Branding']},
{id:'trading-dashboard',name:'Trading Dashboard',description:'Dashboard template built from the existing VintelTool dashboard card system.',source:'src/pages/dashboard',features:['Local','Bot Builder','Quick Bot Builder','Dashboard cards']},
{id:'bot-builder',name:'Bot Builder',description:'Blockly trading workspace already implemented in VintelTool.',source:'src/pages/bot-builder',features:['Blockly','Trading blocks','Workspace','Bot execution']},
{id:'quick-strategy',name:'Quick Strategy',description:'Configuration-driven strategy studio with visible trading parameter blocks.',source:'src/pages/bot-builder/quick-strategy',features:['Trade Parameters','Analysis','Entry Conditions','Sell Conditions','Money Management']},
{id:'analysis',name:'Analysis Tool',description:'VintelTool analysis experience for market and trading workflows.',source:'src/pages/analysis-tool',features:['Analysis','Signals','Market data']},
{id:'charts',name:'Charts',description:'Existing VintelTool chart page and smartcharts integration.',source:'src/pages/chart',features:['Charts','Market view','Smartcharts']},
{id:'tutorials',name:'Tutorials / Course',description:'Existing learning pages that can be enabled per site.',source:'src/pages/tutorials + src/pages/deriv-course.tsx',features:['Tutorials','Deriv Course']}
];

const initialSites:Site[] = [{id:'vinteltool',name:'VintelTool',domain:'www.vinteltool.site',template:'core',status:'Connected'}];
const defaultBranding = (name:string):Branding => ({siteName:name,logo:'',favicon:'',primary:'#1f5eff',secondary:'#0f172a',accent:'#38bdf8',success:'#16a34a',danger:'#dc2626',warning:'#f59e0b',font:'Inter',theme:'light',showBrandName:true,browserTitle:name,footerBranding:name,customCss:''});

function loadSites():Site[]{ try { const value=localStorage.getItem('vinteltool-studio-sites'); return value?JSON.parse(value):initialSites; } catch { return initialSites; } }
function loadBranding(sites:Site[]):Record<string,Branding>{ try { const value=localStorage.getItem('vinteltool-studio-branding'); if(value)return JSON.parse(value); } catch {} return Object.fromEntries(sites.map(s=>[s.id,defaultBranding(s.name)])); }
function saveFile(file:File,onDone:(data:string)=>void){ const reader=new FileReader(); reader.onload=()=>onDone(String(reader.result||'')); reader.readAsDataURL(file); }

function App(){
 const [section,setSection]=useState('sites');
 const [selectedTemplate,setSelectedTemplate]=useState('core');
 const [siteName,setSiteName]=useState('');
 const [domain,setDomain]=useState('');
 const [sites,setSites]=useState<Site[]>(loadSites);
 const [selectedSiteId,setSelectedSiteId]=useState(sites[0]?.id||'');
 const [branding,setBranding]=useState<Record<string,Branding>>(()=>loadBranding(sites));
 const [message,setMessage]=useState('');
 const [connections,setConnections]=useState<{github?:boolean;vercel?:boolean}>({});
 const selectedSite=sites.find(s=>s.id===selectedSiteId)||sites[0];
 const currentBrand=selectedSite?branding[selectedSite.id]||defaultBranding(selectedSite.name):defaultBranding('');
 const template=useMemo(()=>TEMPLATES.find(t=>t.id===selectedTemplate)??TEMPLATES[0],[selectedTemplate]);

 useEffect(()=>{localStorage.setItem('vinteltool-studio-sites',JSON.stringify(sites));},[sites]);
 useEffect(()=>{localStorage.setItem('vinteltool-studio-branding',JSON.stringify(branding));},[branding]);

 const updateBrand=(patch:Partial<Branding>)=>{
   if(!selectedSite)return;
   setBranding(prev=>({...prev,[selectedSite.id]:{...currentBrand,...patch}}));
   if(patch.siteName!==undefined)setSites(prev=>prev.map(s=>s.id===selectedSite.id?{...s,name:patch.siteName}:s));
 };
 const createSite=()=>{
   if(!siteName.trim()){setMessage('Enter a site name first.');return;}
   const id=crypto.randomUUID();
   const newSite:Site={id,name:siteName.trim(),domain:domain.trim()||'Not connected',template:selectedTemplate,status:'Draft'};
   setSites(prev=>[...prev,newSite]);
   setBranding(prev=>({...prev,[id]:defaultBranding(newSite.name)}));
   setSelectedSiteId(id); setSiteName(''); setDomain(''); setMessage('Site created as a draft.'); setSection('branding');
 };
 const checkConnections=async()=>{
   try{const[r1,r2]=await Promise.all([fetch('/api/github-check'),fetch('/api/vercel-check')]);setConnections({github:r1.ok,vercel:r2.ok});setMessage(r1.ok&&r2.ok?'GitHub and Vercel connections are working.':'One or more integrations need attention.');}catch{setMessage('Could not reach the Studio integration API.');}
 };

 return <div className="studio">
  <aside className="sidebar">
   <div className="brand"><div className="brandMark">V</div><div><strong>VintelTool</strong><span>Studio</span></div></div>
   <nav>{[['sites','Sites'],['templates','Templates'],['editor','Site Editor'],['branding','Branding'],['features','Features'],['deployments','Deployments'],['settings','Settings']].map(([id,label])=><button className={section===id?'navItem active':'navItem'} onClick={()=>setSection(id)} key={id}>{label}</button>)}</nav>
   <div className="connection"><span className="dot"/> VintelTool source<small>DerivFX4/vinteltool</small></div>
  </aside>
  <main className="main">
   <header className="topbar"><div><span className="eyebrow">SITE BUILDER</span><h1>{section==='sites'?'Your sites':section[0].toUpperCase()+section.slice(1)}</h1></div><button className="primary" onClick={()=>setSection('editor')}>+ Create site</button></header>

   {section==='sites'&&<section>
    <div className="hero"><div><span className="eyebrow">VINTELTOOL TEMPLATE SYSTEM</span><h2>Build sites from the VintelTool platform.</h2><p>Choose a template, configure the identity, then connect publishing to GitHub and Vercel.</p></div><div className="heroStat"><strong>{sites.length}</strong><span>sites</span></div></div>
    <div className="grid">{sites.map(site=><article className="card" key={site.id}><div className="cardTop"><span className="icon">◈</span><span className={site.status==='Connected'?'status connected':'status'}>{site.status}</span></div><h3>{site.name}</h3><p>{site.domain}</p><div className="meta"><span>{TEMPLATES.find(t=>t.id===site.template)?.name}</span><button onClick={()=>{setSelectedSiteId(site.id);setSection('branding');}}>Branding</button></div></article>)}</div>
   </section>}

   {section==='templates'&&<section><div className="sectionHead"><h2>VintelTool templates</h2><p>Mapped to real areas of the existing repository.</p></div><div className="templateGrid">{TEMPLATES.map(t=><article className="template" key={t.id} onClick={()=>{setSelectedTemplate(t.id);setSection('editor')}}><div className="templateIcon">▦</div><h3>{t.name}</h3><p>{t.description}</p><code>{t.source}</code><div className="chips">{t.features.map(f=><span key={f}>{f}</span>)}</div></article>)}</div></section>}

   {section==='editor'&&<section className="editor"><div className="panel"><span className="eyebrow">CREATE / CONFIGURE</span><h2>New VintelTool site</h2><label>Site name<input value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="e.g. Advanced Trading Platform"/></label><label>Domain<input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="example.com"/></label><label>Template<select value={selectedTemplate} onChange={e=>setSelectedTemplate(e.target.value)}>{TEMPLATES.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label><button className="primary wide" onClick={createSite}>Create draft site</button>{message&&<p className="message">{message}</p>}</div><div className="preview"><div className="previewBar"><span>Live template preview</span><span className="pill">Draft</span></div><div className="previewBody"><span className="eyebrow">VINTELTOOL</span><h2>{template.name}</h2><p>{template.description}</p><div className="previewBlocks">{template.features.map((f,i)=><div key={f}><b>0{i+1}</b><span>{f}</span></div>)}</div><small>Source: {template.source}</small></div></div></section>}

   {section==='branding'&&<section className="brandingPage">
    <div className="sectionHead"><span className="eyebrow">SITE IDENTITY</span><h2>Branding</h2><p>Set the identity for each site. Upload images directly from your phone or computer.</p></div>
    {sites.length>0?<div className="brandingLayout">
      <div className="panel">
       <label>Site to edit<select value={selectedSite?.id||''} onChange={e=>setSelectedSiteId(e.target.value)}>{sites.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
       <label>Site name<input value={currentBrand.siteName} onChange={e=>updateBrand({siteName:e.target.value})} placeholder="VintelTool"/></label>
       <p className="hint">This is the public name visitors will see, for example <b>VintelTool</b> or <b>Advanced Trading Platform</b>.</p>
       <div className="uploadGrid">
        <div className="uploadCard"><div className="uploadPreview">{currentBrand.logo?<img src={currentBrand.logo} alt="Logo preview"/>:<span>LOGO</span>}</div><strong>Logo</strong><small>Upload from gallery • PNG, JPG, SVG</small><label className="uploadButton">Choose logo<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)saveFile(f,data=>updateBrand({logo:data}));}}/></label>{currentBrand.logo&&<button className="removeButton" onClick={()=>updateBrand({logo:''})}>Remove</button>}</div>
        <div className="uploadCard"><div className="faviconPreview">{currentBrand.favicon?<img src={currentBrand.favicon} alt="Favicon preview"/>:<span>F</span>}</div><strong>Favicon</strong><small>Upload from gallery • PNG, JPG, ICO</small><label className="uploadButton">Choose favicon<input type="file" accept="image/*,.ico" onChange={e=>{const f=e.target.files?.[0];if(f)saveFile(f,data=>updateBrand({favicon:data}));}}/></label>{currentBrand.favicon&&<button className="removeButton" onClick={()=>updateBrand({favicon:''})}>Remove</button>}</div>
       </div>
       <div className="brandControls">
        <h3>Solid colors</h3>
        <div className="colorGrid">
         <div className="colorField"><label>Primary color<div className="colorInput"><input type="color" value={currentBrand.primary} onChange={e=>updateBrand({primary:e.target.value})}/><input type="text" value={currentBrand.primary} onChange={e=>updateBrand({primary:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({primary:c})} aria-label={c}/>)}</div></label></div><div className="colorField"><label>Secondary color<div className="colorInput"><input type="color" value={currentBrand.secondary} onChange={e=>updateBrand({secondary:e.target.value})}/><input type="text" value={currentBrand.secondary} onChange={e=>updateBrand({secondary:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({secondary:c})} aria-label={c}/>)}</div></label></div><div className="colorField"><label>Accent color<div className="colorInput"><input type="color" value={currentBrand.accent} onChange={e=>updateBrand({accent:e.target.value})}/><input type="text" value={currentBrand.accent} onChange={e=>updateBrand({accent:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({accent:c})} aria-label={c}/>)}</div></label></div><div className="colorField"><label>Success color<div className="colorInput"><input type="color" value={currentBrand.success} onChange={e=>updateBrand({success:e.target.value})}/><input type="text" value={currentBrand.success} onChange={e=>updateBrand({success:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({success:c})} aria-label={c}/>)}</div></label></div><div className="colorField"><label>Danger color<div className="colorInput"><input type="color" value={currentBrand.danger} onChange={e=>updateBrand({danger:e.target.value})}/><input type="text" value={currentBrand.danger} onChange={e=>updateBrand({danger:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({danger:c})} aria-label={c}/>)}</div></label></div><div className="colorField"><label>Warning color<div className="colorInput"><input type="color" value={currentBrand.warning} onChange={e=>updateBrand({warning:e.target.value})}/><input type="text" value={currentBrand.warning} onChange={e=>updateBrand({warning:e.target.value})}/></div><div className="solidSwatches">{['#1f5eff','#0f172a','#38bdf8','#16a34a','#dc2626','#f59e0b','#ffffff','#000000'].map(c=><button key={c} style={{background:c}} onClick={()=>updateBrand({warning:c})} aria-label={c}/>)}</div></label></div>
        </div>
        <div className="row">
         <label>Font<select value={currentBrand.font} onChange={e=>updateBrand({font:e.target.value})}><option>Inter</option><option>Arial</option><option>Roboto</option><option>System UI</option><option>Georgia</option><option>Monospace</option></select></label>
         <label>Browser title<input value={currentBrand.browserTitle} onChange={e=>updateBrand({browserTitle:e.target.value})} placeholder="Advanced Trading Platform"/></label>
        </div>
        <div className="toggleRow"><span>Show brand name</span><label className="switch"><input type="checkbox" checked={currentBrand.showBrandName} onChange={e=>updateBrand({showBrandName:e.target.checked})}/><span className="slider"/></label></div>
        <label>Theme<div className="themeButtons"><button className={currentBrand.theme==='light'?'active':''} onClick={()=>updateBrand({theme:'light'})}>Light</button><button className={currentBrand.theme==='dark'?'active':''} onClick={()=>updateBrand({theme:'dark'})}>Dark</button></div></label>
        <label>Footer branding<input value={currentBrand.footerBranding} onChange={e=>updateBrand({footerBranding:e.target.value})} placeholder="Powered by VintelTool"/></label>
        <label>Custom CSS <span className="eyebrow">(advanced)</span><textarea className="cssArea" value={currentBrand.customCss} onChange={e=>updateBrand({customCss:e.target.value})} placeholder=".site-header { ... }"/></label>
       </div>
      </div>
      <div className="brandPreview"><div className="previewBar"><span>Live brand preview</span><span className="pill">Saved locally</span></div><div className="brandPreviewBody"><div className="brandIdentity">{currentBrand.logo?<img src={currentBrand.logo} alt="Site logo"/>:<div className="brandPlaceholder">V</div>}{currentBrand.showBrandName&&<div><strong>{currentBrand.siteName||'Your Site Name'}</strong><span>{currentBrand.browserTitle||currentBrand.siteName||'Browser title'}</span></div>}</div><div className="brandColorRow"><span style={{background:currentBrand.primary}}/><span style={{background:currentBrand.secondary}}/><span style={{background:currentBrand.accent}}/><span style={{background:currentBrand.success}}/><span style={{background:currentBrand.danger}}/><span style={{background:currentBrand.warning}}/></div><h3>Your site's identity</h3><p>Logo and favicon are stored with this Studio site's configuration. They are ready to be passed into the publishing/template layer.</p></div></div>
    </div>:<div className="info"><h2>No sites yet</h2><p>Create a site first, then configure its branding.</p></div>}
   </section>}

   {section==='features'&&<Info title="Features" text="Enable or disable existing VintelTool capabilities per site: Dashboard, Bot Builder, Quick Strategy, Analysis, Charts, Tutorials and Deriv Course."/>}
   {section==='deployments'&&<Info title="Deployments" text="The deployment layer is reserved for secure server-side GitHub and Vercel integrations. Tokens must never be shipped to browser code."/>}
   {section==='settings'&&<section className="info"><span className="eyebrow">STUDIO</span><h2>Studio settings</h2><p>GitHub source: DerivFX4/vinteltool. Studio: DerivFX4/Vinteltoolstudio. Credentials stay server-side and are never placed in browser code.</p><div className="integration"><div><b>GitHub</b><span>{connections.github===undefined?'Not checked':connections.github?'Connected':'Needs attention'}</span></div><div><b>Vercel</b><span>{connections.vercel===undefined?'Not checked':connections.vercel?'Connected':'Needs attention'}</span></div></div><button className="primary" style={{marginTop:18}} onClick={checkConnections}>Check integrations</button>{message&&<p className="message">{message}</p>}</section>}
  </main>
 </div>;
}

function Info({title,text}:{title:string;text:string}){return <section className="info"><span className="eyebrow">STUDIO</span><h2>{title}</h2><p>{text}</p><div className="integration"><div><b>GitHub</b><span>DerivFX4/vinteltool</span></div><div><b>Vercel</b><span>Ready for secure server integration</span></div></div></section>}

createRoot(document.getElementById('root')!).render(<App/>);
