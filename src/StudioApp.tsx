import { useEffect, useState } from 'react';
import './studio-admin.css';

type Brand = { siteName:string; primary:string; secondary:string; accent:string; success:string; danger:string; warning:string; font:string; theme:'light'|'dark'; showBrandName:boolean; browserTitle:string; footerBranding:string; customCss:string };
type Section = 'overview'|'branding'|'users'|'bots'|'settings'|'deployments'|'integrations';
const initial:Brand = {siteName:'VintelTool',primary:'#0B1B3A',secondary:'#020817',accent:'#00AEEF',success:'#10B981',danger:'#FF444F',warning:'#F59E0B',font:'Georgia',theme:'dark',showBrandName:true,browserTitle:'VintelTool — Advanced Trading',footerBranding:'Powered by VintelTool',customCss:''};
const nav:{id:Section;label:string;icon:string}[] = [
 {id:'overview',label:'Overview',icon:'⌂'},{id:'branding',label:'Website design',icon:'◈'},{id:'users',label:'Users & access',icon:'♙'},{id:'bots',label:'Bot Builder',icon:'▦'},{id:'settings',label:'Platform settings',icon:'⚙'},{id:'deployments',label:'Deployments',icon:'↗'},{id:'integrations',label:'GitHub & Vercel',icon:'⌘'}
];
export default function StudioApp(){
 const [section,setSection]=useState<Section>('overview');
 const [sectionHistory,setSectionHistory]=useState<Section[]>([]);
 const navigate=(next:Section)=>{setSectionHistory(old=>[...old,section]);setSection(next);};
 const goBack=()=>{setSectionHistory(old=>{if(old.length){setSection(old[old.length-1]);return old.slice(0,-1);}setSection('overview');return old;});};
 const [menu,setMenu]=useState(false);
 const [brand,setBrand]=useState<Brand>(initial);
 const [status,setStatus]=useState('Ready to inspect connections.');
 const [github,setGithub]=useState<'unknown'|'ok'|'error'>('unknown');
 const [vercel,setVercel]=useState<'unknown'|'ok'|'error'>('unknown');
 const [adminKey,setAdminKey]=useState('');
 const [busy,setBusy]=useState(false);
 const [deployments,setDeployments]=useState<any[]>([]);
 const [deploymentError,setDeploymentError]=useState('');
 const [botMarket,setBotMarket]=useState('Volatility 100 (1s) Index');
 const [botContract,setBotContract]=useState('Over/Under');
 const [botDuration,setBotDuration]=useState('5');
 const [botStake,setBotStake]=useState('1');
 const [botTP,setBotTP]=useState('5');
 const [botSL,setBotSL]=useState('10');
 const [botEntry,setBotEntry]=useState('Last digit is odd');
 const [botCategory,setBotCategory]=useState('trade');
 const [botBlocks,setBotBlocks]=useState<string[]>(['trade','purchase','sell']);
 const [botStatus,setBotStatus]=useState('Default Deriv-style trade, purchase and sell blocks are ready.');
 useEffect(()=>{try{const s=localStorage.getItem('vinteltool-studio-branding-v2');if(s)setBrand({...initial,...JSON.parse(s)});}catch{}},[]);
 useEffect(()=>{try{localStorage.setItem('vinteltool-studio-branding-v2',JSON.stringify(brand));}catch{}},[brand]);
 const set=(key:keyof Brand,value:string|boolean)=>setBrand(old=>({...old,[key]:value}));
 async function checkConnections(){
  setBusy(true);setStatus('Checking configured integrations…');
  try{
   const [g,v]=await Promise.all([fetch('/api/github-check'),fetch('/api/vercel-check')]);
   setGithub(g.ok?'ok':'error');setVercel(v.ok?'ok':'error');
   const [gd,vd]=await Promise.all([g.json().catch(()=>({})),v.json().catch(()=>({}))]);
   setStatus(g.ok&&v.ok?'GitHub and Vercel API checks passed.':[`GitHub: ${gd.error||g.status}`,`Vercel: ${vd.error||v.status}`].join(' · '));
  }catch{setGithub('error');setVercel('error');setStatus('Could not reach one or more Studio API routes.');}
  finally{setBusy(false);}
 }
 async function publish(){
  if(!adminKey.trim()){setStatus('Enter the Studio admin key configured in Vercel before publishing.');return;}
  setBusy(true);setStatus('Publishing branding to the connected VintelTool repository…');
  try{
   const r=await fetch('/api/publish-vinteltool',{method:'POST',headers:{'content-type':'application/json','x-studio-admin-key':adminKey},body:JSON.stringify({siteId:'vinteltool',domain:'vinteltool.site',branding:brand})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.ok){setStatus(d.error||'Publishing failed.');return;}
   setStatus('Brand settings committed to GitHub. Check Deployments for the resulting Vercel build.');
  }catch{setStatus('Could not reach the publisher API.');}
  finally{setBusy(false);}
 }
 async function loadDeployments(){
  setBusy(true);setDeploymentError('');
  try{const r=await fetch('/api/deployments');const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load deployments.');setDeployments(d.deployments||[]);}
  catch(e){setDeploymentError(e instanceof Error?e.message:'Deployment API is not configured yet.');}
  finally{setBusy(false);}
 }
 const title=nav.find(n=>n.id===section)?.label||'Overview';
 return <div className="va-shell">
  {menu&&<button aria-label="Close menu" className="va-scrim" onClick={()=>setMenu(false)}/>}
  <aside className={menu?'va-sidebar va-open':'va-sidebar'}>
   <div className="va-brand"><span className="va-mark">V</span><div><b>Vintel<span>Tool</span></b><small>STUDIO · ADMIN</small></div><button className="va-close" onClick={()=>setMenu(false)}>×</button></div>
   <div className="va-workspace"><small>WORKSPACE</small><strong>VintelTool Production</strong><span><i/> vinteltool.site</span></div>
   <nav>{nav.map(n=><button key={n.id} className={section===n.id?'va-nav active':'va-nav'} onClick={()=>{navigate(n.id);setMenu(false);}}><span>{n.icon}</span>{n.label}{n.id==='integrations'&&<b className="va-nav-dot">●</b>}</button>)}</nav>
   <div className="va-sidefoot"><span className="va-online"/> Admin workspace <small>Credentials remain server-side</small></div>
  </aside>
  <main className="va-main">
   <header className="va-top"><div className="va-title"><button className="va-back" onClick={goBack} aria-label="Go back" title={sectionHistory.length?'Back to previous section':'Back to overview'}>←</button><button className="va-menu" onClick={()=>setMenu(true)} aria-label="Open navigation menu">☰</button><div><small>VINTELTOOL / ADMIN</small><h1>{title}</h1></div></div><a href="https://vinteltool.site" target="_blank" rel="noreferrer">Open live site ↗</a></header>
   <div className="va-content">
    {section==='overview'&&<><section className="va-hero"><div><span className="va-kicker">CONTROL CENTER</span><h2>Your platform.<br/><em>Your control.</em></h2><p>Manage VintelTool's brand, trading experience and deployment workflow from one protected workspace.</p><button onClick={()=>navigate('branding')}>Customize website <span>→</span></button></div><div className="va-hero-art"><div className="va-ring va-ring1"/><div className="va-ring va-ring2"/><div className="va-hero-v">V</div><span className="va-art-tag">TRADING PLATFORM</span></div></section>
    <div className="va-stats"><article><span>Website</span><strong>vinteltool.site</strong><small><i className="va-green"/> Production target</small></article><article><span>Source control</span><strong>GitHub · main</strong><small>DerivFX4/vinteltool</small></article><article><span>Hosting</span><strong>Vercel</strong><small>Project: vinteltool</small></article><article><span>Integration checks</span><strong>{github==='ok'&&vercel==='ok'?'Connected':github==='error'||vercel==='error'?'Needs attention':'Not checked'}</strong><small>{github==='ok'?'GitHub ✓':'GitHub ?'} · {vercel==='ok'?'Vercel ✓':'Vercel ?'}</small></article></div>
    <section className="va-panel"><div className="va-panelhead"><div><small>QUICK ACCESS</small><h3>Manage your platform</h3></div><button className="va-secondary" onClick={checkConnections} disabled={busy}>{busy?'Checking…':'Check integrations'}</button></div><div className="va-quick">{nav.slice(1).map(n=><button key={n.id} onClick={()=>setSection(n.id)}><span>{n.icon}</span><div><b>{n.label}</b><small>{n.id==='branding'?'Colors, logo and page identity':n.id==='users'?'Account roles and access controls':n.id==='bots'?'Bot Builder and strategy settings':n.id==='settings'?'Platform behavior and defaults':n.id==='deployments'?'Build history and release status':'Connection and deployment health'}</small></div><strong>↗</strong></button>)}</div><p className="va-status">{status}</p></section></>}
    {section==='branding'&&<><div className="va-intro"><small>DESIGN SYSTEM</small><h2>Make VintelTool yours.</h2><p>Changes are saved in this browser while editing. Publish commits supported brand settings to GitHub.</p></div><div className="va-brandgrid"><section className="va-panel"><h3>Brand identity</h3><label>Website name<input value={brand.siteName} onChange={e=>set('siteName',e.target.value)}/></label><label>Browser title<input value={brand.browserTitle} onChange={e=>set('browserTitle',e.target.value)}/></label><label>Footer branding<input value={brand.footerBranding} onChange={e=>set('footerBranding',e.target.value)}/></label><label>Font<select value={brand.font} onChange={e=>set('font',e.target.value)}>{['Georgia','Inter','Arial','Roboto','System UI','Monospace'].map(v=><option key={v}>{v}</option>)}</select></label><label className="va-toggle"><input type="checkbox" checked={brand.showBrandName} onChange={e=>set('showBrandName',e.target.checked)}/> Show brand name</label><label>Theme<select value={brand.theme} onChange={e=>set('theme',e.target.value as Brand['theme'])}><option value="dark">Dark</option><option value="light">Light</option></select></label><h3>Platform colors</h3><div className="va-colors">{([['primary','Primary'],['secondary','Secondary'],['accent','Accent'],['success','Success'],['danger','Danger'],['warning','Warning']] as const).map(([k,l])=><label key={k}>{l}<span><input type="color" value={brand[k]} onChange={e=>set(k,e.target.value)}/><input value={brand[k]} onChange={e=>set(k,e.target.value)}/></span></label>)}</div><label>Custom CSS<textarea rows={5} value={brand.customCss} onChange={e=>set('customCss',e.target.value)} placeholder="/* CSS support requires the template integration */"/></label><label>Studio admin key<input type="password" autoComplete="current-password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="Set STUDIO_ADMIN_KEY in Vercel first"/></label><button className="va-primary" onClick={publish} disabled={busy}>{busy?'Publishing…':'Publish brand settings →'}</button><p className="va-status">{status}</p></section><section className="va-preview"><small>LIVE PREVIEW · LOCAL</small><div className="va-previewbar"><span className="va-mark">V</span>{brand.showBrandName&&<b>{brand.siteName||'VintelTool'}</b>}<span>Dashboard　 Bot Builder　 Charts</span></div><div className="va-previewbody" style={{background:brand.theme==='dark'?brand.secondary:'#f8fafc',color:brand.theme==='dark'?'#fff':'#0f172a',fontFamily:brand.font}}><small style={{color:brand.accent}}>WELCOME TO YOUR PLATFORM</small><h2>{brand.browserTitle||brand.siteName}</h2><p>Trade smarter with your VintelTool workspace.</p><div className="va-previewcards"><span style={{borderColor:brand.accent}}>Bot Builder</span><span style={{borderColor:brand.success}}>Quick Bot Builder</span></div><button style={{background:brand.primary,color:'#fff'}}>Open workspace</button></div></section></div></>}
    {section==='integrations'&&<><div className="va-intro"><small>CONNECTIONS</small><h2>GitHub & Vercel</h2><p>Verify the linked server-side credentials without revealing tokens.</p></div><section className="va-panel"><div className="va-integration"><div><b>GitHub</b><span>DerivFX4/Vinteltoolstudio and DerivFX4/vinteltool</span><strong className={'va-chip '+github}>{github==='ok'?'Connected':github==='error'?'Needs attention':'Not checked'}</strong></div><div><b>Vercel</b><span>Team: DerivFX · Project: vinteltoolstudio</span><strong className={'va-chip '+vercel}>{vercel==='ok'?'Connected':vercel==='error'?'Needs attention':'Not checked'}</strong></div></div><button className="va-primary" onClick={checkConnections} disabled={busy}>{busy?'Checking…':'Run connection checks'}</button><p className="va-status">{status}</p></section></>}
    {section==='deployments'&&<><div className="va-intro"><small>RELEASE MANAGEMENT</small><h2>Deployment history</h2><p>Inspect Studio releases and identify the commit currently deployed.</p></div><section className="va-panel"><button className="va-primary" onClick={loadDeployments} disabled={busy}>{busy?'Loading…':'Load deployments'}</button>{deploymentError&&<p className="va-status">{deploymentError}</p>}{deployments.map((d,i)=><div className="va-deploy" key={d.uid||d.id||i}><b>{d.name||'VintelTool Studio'}</b><span>{d.meta?.githubCommitMessage||d.url||'Vercel deployment'}</span><strong>{d.state||d.readyState||'Unknown'}</strong></div>)}</section></>}
    {section==='users'&&<><div className="va-intro"><small>ACCESS CONTROL</small><h2>Users & roles</h2><p>Administrator access must be tied to a real authentication provider and persistent user store.</p></div><section className="va-panel"><div className="va-notice">Security first</div><h3>User management is not yet connected</h3><p>The current Studio has no authentication provider or database-backed user directory. This panel intentionally does not fabricate users or offer unsafe account controls. Connect an auth provider and database before enabling invite, suspend, role-change or session-revocation actions.</p><button className="va-secondary" onClick={()=>setSection('settings')}>Review platform settings</button></section></>}
    {section==='bots'&&<><div className="va-intro"><small>LIVE PLATFORM WORKSPACE</small><h2>Actual Deriv Bot Builder</h2><p>This opens the existing VintelTool application and its real Deriv Blockly engine, custom blocks, workspace stores and bot skeleton—not a simulated block editor.</p></div><section className="va-panel va-live-bot-panel"><div className="va-live-bot-toolbar"><div><span className="va-bot-live"/><b>VintelTool · Production Bot Builder</b><small>Actual application · Sign in with Deriv if prompted</small></div><div className="va-bot-actions"><button className="va-secondary" onClick={()=>window.open('https://www.vinteltool.site/','_blank','noopener,noreferrer')}>Open in new tab ↗</button><button className="va-primary" onClick={()=>{const frame=document.getElementById('va-live-bot-frame') as HTMLIFrameElement|null;if(frame)frame.src='https://www.vinteltool.site/';}}>Reload workspace</button></div></div><div className="va-live-bot-frame-wrap"><iframe id="va-live-bot-frame" title="Actual VintelTool Deriv Blockly Bot Builder" src="https://www.vinteltool.site/" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write; fullscreen; storage-access" /></div><p className="va-status">The embedded application retains its own authentication and trading safeguards. If the site blocks embedding or browser sign-in, use “Open in new tab.” Studio does not read or store Deriv tokens.</p></section></>}
    {section==='settings'&&<><div className="va-intro"><small>PLATFORM CONFIGURATION</small><h2>Settings & safety</h2><p>Current project references discovered during inspection.</p></div><section className="va-panel"><div className="va-setting"><span>Studio repository</span><b>DerivFX4/Vinteltoolstudio · main</b></div><div className="va-setting"><span>Main platform repository</span><b>DerivFX4/vinteltool · main</b></div><div className="va-setting"><span>Studio Vercel project</span><b>vinteltoolstudio</b></div><div className="va-setting"><span>Main Vercel project</span><b>vinteltool</b></div><div className="va-setting"><span>Administrator authorization</span><b>Must be configured server-side before write actions</b></div><button className="va-secondary" onClick={checkConnections} disabled={busy}>Check current integrations</button><p className="va-status">{status}</p></section></>}
   </div>
   <footer className="va-footer">VintelTool Studio <span>·</span> Protected administration workspace <span>·</span> Never expose Deriv API tokens in the browser.</footer>
  </main>
 </div>;
}
