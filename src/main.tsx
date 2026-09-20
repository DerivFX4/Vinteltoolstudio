import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Template = { id:string; name:string; description:string; source:string; features:string[] };
type Site = { id:string; name:string; domain:string; template:string; status:string };
type Branding = { siteName:string; logo:string; favicon:string; primary:string; secondary:string; accent:string; success:string; danger:string; warning:string; font:string; theme:'light'|'dark'; showBrandName:boolean; browserTitle:string; footerBranding:string; customCss:string; titleSuffix:string; tabStyle:string; tabActiveColor:string; loginButtonColor:string; loginTextColor:string; loadBotColor:string; loadBotTextColor:string; botCardStyle:string };

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
const defaultBranding = (name:string):Branding => ({siteName:name,logo:'',favicon:'',primary:'#0B1F3A',secondary:'#0B1F3A',accent:'#00E5FF',success:'#16a34a',danger:'#dc2626',warning:'#f59e0b',font:'Inter',theme:'dark',showBrandName:true,browserTitle:name,footerBranding:name,customCss:'',titleSuffix:'Advanced Trading',tabStyle:'solid',tabActiveColor:'#00E5FF',loginButtonColor:'#0B1F3A',loginTextColor:'#ffffff',loadBotColor:'#0B1F3A',loadBotTextColor:'#ffffff',botCardStyle:'compact'});

function loadSites():Site[]{ try { const value=localStorage.getItem('vinteltool-studio-sites'); return value?JSON.parse(value):initialSites; } catch { return initialSites; } }
function loadBranding(sites:Site[]):Record<string,Branding>{ try { const value=localStorage.getItem('vinteltool-studio-branding'); if(value)return JSON.parse(value); } catch {} return Object.fromEntries(sites.map(s=>[s.id,defaultBranding(s.name)])); }
function saveFile(file:File,onDone:(data:string)=>void){ const reader=new FileReader(); reader.onload=()=>onDone(String(reader.result||'')); reader.readAsDataURL(file); }

function App(){
 const [section,setSection]=useState('dashboard');
 const [menuOpen,setMenuOpen]=useState(false);
 const [createStep,setCreateStep]=useState(0);
 const [selectedTemplate,setSelectedTemplate]=useState('core');
 const [siteName,setSiteName]=useState('');
 const [domain,setDomain]=useState('');
 const [platform,setPlatform]=useState('dbot');
 const [createDomain,setCreateDomain]=useState('');
 const [commissionAccepted,setCommissionAccepted]=useState(false);
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
   if(!createDomain.trim()){setMessage('Enter a public domain first.');setCreateStep(1);return;}
   if(!commissionAccepted){setMessage('Accept the commission and maintenance agreement to continue.');setCreateStep(1);return;}
   if(!siteName.trim())setSiteName(createDomain.trim().split('.')[0]||'VintelTool');
   const id=crypto.randomUUID();
   const finalName=siteName.trim()||createDomain.trim().split('.')[0]||'VintelTool';
   const newSite:Site={id,name:finalName,domain:createDomain.trim(),template:selectedTemplate,status:'Draft'};
   setSites(prev=>[...prev,newSite]);
   setBranding(prev=>({...prev,[id]:defaultBranding(newSite.name)}));
   setSelectedSiteId(id); setMessage('Site created as a draft.'); setSection('branding'); setCreateStep(0);
 };
 const checkConnections=async()=>{
   try{const[r1,r2]=await Promise.all([fetch('/api/github-check'),fetch('/api/vercel-check')]);setConnections({github:r1.ok,vercel:r2.ok});setMessage(r1.ok&&r2.ok?'GitHub and Vercel connections are working.':'One or more integrations need attention.');}catch{setMessage('Could not reach the Studio integration API.');}
 };
 const go=(id:string)=>{setSection(id);setMenuOpen(false);};
 const startCreate=()=>{setSection('editor');setCreateStep(0);setMenuOpen(false);setMessage('');};
 const steps=['Platform Type','Basic Information','Branding','Theme'];
 const canContinue=createStep===0||createStep===2||createStep===3||Boolean(createDomain.trim()&&commissionAccepted);
 const nextCreate=()=>{if(createStep===0){setCreateStep(1);return;}if(createStep===1){if(!createDomain.trim()){setMessage('Enter a public domain first.');return;}if(!commissionAccepted){setMessage('Accept the commission and maintenance agreement to continue.');return;}setCreateStep(2);return;}if(createStep<3)setCreateStep(v=>v+1);else createSite();};
 const previousCreate=()=>{if(createStep>0){setCreateStep(v=>v-1);setMessage('');}else go('dashboard');};
 const navGroups=[
  {title:'SITE MANAGEMENT',items:[['dashboard','Dashboard','▦'],['sites','Sites','◎'],['templates','Templates','▤'],['branding','Branding','◉'],['editor','Pages / Editor','□'],['features','Features','✣'],['preview','Preview','▣']]},
  {title:'DEPLOYMENT',items:[['github','GitHub','◌'],['vercel','Vercel','▲'],['domains','Domains','◎'],['deployments','Deployments','◇']]},
  {title:'SETTINGS',items:[['settings','Settings','⚙'],['help','Help & Support','?']]}
 ];

 return <div className="studio">
  <div className={menuOpen?'mobileScrim open':'mobileScrim'} onClick={()=>setMenuOpen(false)}/>
  <aside className={menuOpen?'sidebar open':'sidebar'}>
   <div className="brandRow"><div className="brand"><div className="brandMark">V</div><div><strong>Vintel<span>Tool</span></strong><small>Studio</small></div></div><button className="sidebarClose" onClick={()=>setMenuOpen(false)}>×</button></div>
   <nav className="sideNav">{navGroups.map(group=><div className="navGroup" key={group.title}><span className="navTitle">{group.title}</span>{group.items.map(([id,label,icon])=><button className={section===id?'navItem active':'navItem'} onClick={()=>go(id)} key={id}><i>{icon}</i><span>{label}</span></button>)}</div>)}</nav>
   <div className="sidebarBottom"><button className="navItem" onClick={()=>setMessage('Logout is ready for the authentication layer.') }><i>↪</i><span>Logout</span></button></div>
  </aside>

  <main className="main">
   <header className="topbar">
    <div className="topLeft"><button className="menuButton" onClick={()=>setMenuOpen(true)}>☰</button><div><span className="eyebrow">VINTELTOOL STUDIO</span><h1>{section==='editor'?'Create Site':section==='dashboard'?'Dashboard':section[0].toUpperCase()+section.slice(1)}</h1></div></div>
    <div className="topActions"><button className="primary createTop" onClick={startCreate}>＋ Create Site</button><button className="iconButton" title="Studio information">ⓘ</button><button className="avatar">V</button></div>
   </header>

   {section==='dashboard'&&<section className="dashboardPage">
    <div className="welcomeHero"><div><span className="welcomeEyebrow">Welcome back,</span><h2>VintelTool Studio 👋</h2><p>Create, configure and deploy your VintelTool sites — all from one powerful platform.</p></div><div className="heroLogo"><div className="heroV">V</div><strong>Vintel<span>Tool</span></strong><small>STUDIO</small></div></div>
    <div className="statsGrid">
      <article className="statCard"><div className="statIcon">◎</div><div><span>Total Sites</span><strong>{sites.length}</strong><small>{sites.filter(s=>s.status!=='Draft').length} active · {sites.filter(s=>s.status==='Draft').length} draft</small></div><b>›</b></article>
      <article className="statCard"><div className="statIcon">▤</div><div><span>Templates</span><strong>{TEMPLATES.length}</strong><small>VintelTool templates available</small></div><b>›</b></article>
      <article className="statCard"><div className="statIcon">☁</div><div><span>Total Deployments</span><strong>0</strong><small>Connect GitHub & Vercel to publish</small></div><b>›</b></article>
      <article className="statCard"><div className="statIcon">◎</div><div><span>Active Domains</span><strong>{sites.filter(s=>s.domain && s.domain!=='Not connected').length}</strong><small>{sites.filter(s=>s.domain && s.domain!=='Not connected').length} connected · pending setup</small></div><b>›</b></article>
    </div>
    <div className="contentCard"><div className="cardHeading"><div><span className="eyebrow">WORKSPACE</span><h2>Recent Sites</h2></div><button className="ghostButton" onClick={()=>go('sites')}>View All →</button></div><div className="siteTable"><div className="tableRow tableHead"><span>NAME</span><span>DOMAIN</span><span>STATUS</span><span>LAST UPDATED</span><span></span></div>{sites.slice(0,3).map((site,index)=><div className="tableRow" key={site.id}><span className="siteNameCell"><i className="siteMini">{site.name.charAt(0)}</i><strong>{site.name}</strong></span><span>{site.domain}</span><span><em className={site.status==='Draft'?'statusPill draft':'statusPill'}>{site.status}</em></span><span>{index===0?'Just now':index===1?'Today':'1 day ago'}</span><button className="rowMenu">⋮</button></div>)}</div><div className="tableFoot">Showing 1 to {Math.min(3,sites.length)} of {sites.length} sites.</div></div>
    <div className="contentCard quickCard"><div className="cardHeading"><div><span className="eyebrow">WORKSPACE TOOLS</span><h2>Quick Actions</h2></div></div><div className="quickGrid">{[['Create New Site','Start with a VintelTool template','＋'],['Manage Templates','Browse VintelTool templates','◉'],['Branding','Customize your site identity','✎'],['Deploy Site','Push to GitHub & Vercel','◇'],['Connect Domain','Add your custom domain','◎'],['View Tutorials','Learn & get support','▢']].map(([title,desc,icon],i)=><button className="quickAction" key={title} onClick={()=>i===0?startCreate():go(i===1?'templates':i===2?'branding':i===3?'deployments':i===4?'domains':'help')}><i>{icon}</i><div><strong>{title}</strong><span>{desc}</span></div><b>›</b></button>)}</div><div className="infoBanner"><span>✦</span><div><strong>Build powerful trading platforms with VintelTool</strong><small>Fast. Secure. Customizable. →</small></div></div></div>
   </section>}

   {section==='editor'&&<section className="createSitePage">
    <div className="createStepper">{steps.map((step,i)=><button key={step} className={createStep===i?'step active':createStep>i?'step done':'step'} onClick={()=>i<=createStep&&setCreateStep(i)}><span className="stepIcon">{i===0?'▣':i===1?'◎':i===2?'▧':'◌'}</span><strong>{step}</strong></button>)}</div>
    <div className="createPanel">
     {createStep===0&&<><div className="createIntro"><h2>Platform Type</h2><p>Choose the website platform you want to create.</p></div><div className="platformCards">
       <button className="platformCard selected" onClick={()=>setPlatform('dbot')}>
        <div className="platformImage"><img src="/dbot-builder-preview.svg" alt="VintelTool DBot visual bot builder with draggable blocks"/></div>
        <div className="platformInfo"><span className="platformIcon">♙</span><div><h3>DBot Platform</h3><p>Visual bot builder, free bots, analytics, copy trading, and SmartCharts in one branded website.</p></div><b className="selectCircle">⌄</b></div>
       </button>
     </div></>}
     {createStep===1&&<div className="createFormStep"><div className="createIntro"><h2>Basic Information</h2><p>Connect the domain that will be hosted and managed by VintelTool.</p></div><div className="formCard createBasicCard">
       <label>Domain *<input value={createDomain} onChange={e=>setCreateDomain(e.target.value)} placeholder="example.com"/></label>
       <p className="fieldHelp">Enter a public domain without a path, for example example.com. Connection type is selected automatically.</p>
       <div className="centralAppCard"><span className="appCheck">✓</span><div><strong>Centralized App ID</strong><p>An App ID will be assigned to this VintelTool platform by the administrator. It enables the platform's Deriv OAuth/API connection to be managed centrally.</p></div></div>
       <label className="agreementCard"><input type="checkbox" checked={commissionAccepted} onChange={e=>setCommissionAccepted(e.target.checked)}/><span><strong>Commission and maintenance agreement</strong><small>I agree to share 15% of the commission generated by this website with the developer to support ongoing website maintenance, hosting, and technical reliability. I understand that failure to pay the agreed share may result in the website being suspended. I receive the remaining 85% of all markup commission earned.</small></span></label>
       {message&&<p className="message">{message}</p>}
     </div></div>
     {createStep===2&&<div className="createFormStep"><div className="createIntro"><h2>Branding & Assets</h2><p>Upload your logo and customize your VintelTool platform identity.</p></div><div className="formCard brandingWizardCard">
       <label>Brand / Platform Name *<input value={siteName} onChange={e=>setSiteName(e.target.value)} placeholder="VintelTool"/></label>
       <p className="fieldHelp">Auto-generated from your domain, but you can customize it.</p>
       <label>Title Suffix *<input value={currentBrand.titleSuffix} onChange={e=>updateBrand({titleSuffix:e.target.value})} placeholder="Advanced Trading"/></label>
       <p className="fieldHelp">Full title: {siteName||'VintelTool'} - {currentBrand.titleSuffix||'Advanced Trading'}</p>
       <div className="browserMock"><div className="browserTop"><span>⌄</span><strong>{siteName||'VintelTool'} - {currentBrand.titleSuffix||'Advanced Trading'}</strong><span>＋</span></div><div className="browserAddress">‹ <span>{createDomain||'example.com'}</span></div><div className="browserSite"><b>{(siteName||'V').charAt(0).toUpperCase()}</b><strong>{siteName||'VintelTool'}</strong><em>powered by deriv</em></div></div>
       <div className="wizardUpload"><strong>Logo Upload</strong><label className="uploadButton">Choose logo<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){saveFile(f,data=>selectedSite&&updateBrand({logo:data}));}}}/></label><small>PNG, JPG, WebP, or SVG up to 5 MB</small></div>
       <div className="wizardUpload"><strong>Favicon Upload <span>(Optional)</span></strong><label className="uploadButton">Choose favicon<input type="file" accept="image/*,.ico" onChange={e=>{const f=e.target.files?.[0];if(f){saveFile(f,data=>selectedSite&&updateBrand({favicon:data}));}}}/></label><small>Square PNG, ICO, or SVG up to 1 MB</small></div>
     </div></div>
     {createStep===3&&<div className="createFormStep themeWizard"><div className="createIntro"><h2>Theme</h2><p>Configure navigation, colors and Free Bots presentation using VintelTool components.</p></div>
       <div className="themeSection"><h3>Tab Navigation</h3><p>Choose the navigation style and tab-specific colors.</p>
        {['solid','underline','pill','stacked'].map(style=><button key={style} className={currentBrand.tabStyle===style?'themePreview selected':'themePreview'} onClick={()=>updateBrand({tabStyle:style})}><div className={'navMock '+style}><span>⌂ Dashboard</span><span className="active">♙ Bot Builder</span><span>⌁ Charts</span></div><strong>{style==='solid'?'Solid active tab':style==='underline'?'Underline tabs':style==='pill'?'Pill buttons':'Stacked icon tabs'}</strong>{currentBrand.tabStyle===style&&<b>✓</b>}</button>)}
       </div>
       <div className="themeColors"><h3>VintelTool Colors</h3>{[['primary','Primary Color *'],['tabActiveColor','Tab Active Color'],['loginButtonColor','Login / Sign Up Button Color'],['loginTextColor','Login / Sign Up Text Color'],['loadBotColor','Load Bot Button Color'],['loadBotTextColor','Load Bot Button Text Color']].map(([key,label])=><label key={key}>{label}<div className="wizardColor"><input type="color" value={(currentBrand as any)[key]} onChange={e=>updateBrand({[key]:e.target.value} as any)}/><input value={(currentBrand as any)[key]} onChange={e=>updateBrand({[key]:e.target.value} as any)}/></div></label>)}</div>
       <div className="themeSection"><h3>Bot Card Style</h3><p>Choose how bots appear in the website's Free Bots library.</p>{['gradient','card','minimal','compact'].map(style=><button key={style} className={currentBrand.botCardStyle===style?'botStyle selected':'botStyle'} onClick={()=>updateBrand({botCardStyle:style})}><div className={'botMock '+style}><strong>1. Bi Trading Even Odd Bot</strong><span>Trading bot with built-in risk controls.</span><button type="button">Load Bot</button></div><strong>{style.charAt(0).toUpperCase()+style.slice(1)}</strong><small>{style==='gradient'?'Dark branded rows with strong contrast.':style==='card'?'Spacious cards with a premium presentation.':style==='minimal'?'Clean rows with subtle borders and no heavy shadow.':'Dense cards that display more bots at once.'}</small>{currentBrand.botCardStyle===style&&<b>✓</b>}</button>)}</div>
     </div>}

    </div>
    <div className="createFooter"><button className="backButton" onClick={previousCreate}>Back</button><button className="continueButton" disabled={!canContinue} onClick={nextCreate}>{createStep===3?'Create Site':'Continue'}</button></div>
   </section>}

   {section==='sites'&&<section><div className="sectionHead"><span className="eyebrow">WORKSPACE</span><h2>Your Sites</h2><p>Manage sites created from the VintelTool template system.</p></div><div className="grid">{sites.map(site=><article className="card" key={site.id}><div className="cardTop"><span className="icon">◈</span><span className={site.status==='Connected'?'status connected':'status'}>{site.status}</span></div><h3>{site.name}</h3><p>{site.domain}</p><div className="meta"><span>{TEMPLATES.find(t=>t.id===site.template)?.name}</span><button onClick={()=>{setSelectedSiteId(site.id);go('branding');}}>Branding</button></div></article>)}</div></section>}

   {section==='templates'&&<section><div className="sectionHead"><span className="eyebrow">TEMPLATE SYSTEM</span><h2>VintelTool Templates</h2><p>These are mapped to real areas of the existing VintelTool repository.</p></div><div className="templateGrid">{TEMPLATES.map(t=><article className="template" key={t.id} onClick={()=>{setSelectedTemplate(t.id);go('editor')}}><div className="templateIcon">▦</div><h3>{t.name}</h3><p>{t.description}</p><code>{t.source}</code><div className="chips">{t.features.map(f=><span key={f}>{f}</span>)}</div></article>)}</div></section>}

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
   {(section==='deployments'||section==='github'||section==='vercel'||section==='domains'||section==='preview'||section==='help')&&<Info title={section==='help'?'Help & Support':section[0].toUpperCase()+section.slice(1)} text="This Studio area is connected to the existing VintelTool template system and is ready for its corresponding management workflow."/>}
   {section==='settings'&&<section className="info"><span className="eyebrow">STUDIO</span><h2>Studio Settings</h2><p>GitHub source: DerivFX4/vinteltool. Studio: DerivFX4/Vinteltoolstudio. Credentials stay server-side and are never placed in browser code.</p><div className="integration"><div><b>GitHub</b><span>{connections.github===undefined?'Not checked':connections.github?'Connected':'Needs attention'}</span></div><div><b>Vercel</b><span>{connections.vercel===undefined?'Not checked':connections.vercel?'Connected':'Needs attention'}</span></div></div><button className="primary" style={{marginTop:18}} onClick={checkConnections}>Check Integrations</button>{message&&<p className="message">{message}</p>}</section>}
  </main>
  <button className="chatButton" title="Help">◔</button>
 </div>;
}
function Info({title,text}:{title:string;text:string}){return <section className="info"><span className="eyebrow">STUDIO</span><h2>{title}</h2><p>{text}</p><div className="integration"><div><b>GitHub</b><span>DerivFX4/vinteltool</span></div><div><b>Vercel</b><span>Ready for secure server integration</span></div></div></section>}

createRoot(document.getElementById('root')!).render(<App/>);
