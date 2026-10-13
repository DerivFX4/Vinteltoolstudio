type PublishRequest = {
  domain?: string;
  branding?: {
    siteName?: string; primary?: string; secondary?: string; accent?: string;
    success?: string; danger?: string; warning?: string; font?: string;
    theme?: 'light'|'dark'; showBrandName?: boolean; browserTitle?: string;
    footerBranding?: string; customCss?: string;
  };
};
const allowedSite = 'vinteltool.site';
const owner = () => process.env.GITHUB_OWNER || 'DerivFX4';
const repoName = () => process.env.GITHUB_TEMPLATE_REPO || 'vinteltool';
const json = (data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ok:false,error:'POST required.'},405);
  // Studio key entry was removed for one-tap publishing. Restrict browser requests to the
  // known Studio origin; this is a usability guard, not a substitute for administrator login.
  const origin = req.headers.get('origin') || '';
  if (origin !== 'https://vinteltoolstudio-nine.vercel.app') {
    return json({ok:false,error:'Publish requests must come from the VintelTool Studio site.'},403);
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) return json({ok:false,error:'GitHub credentials are not configured.'},500);
  let body:PublishRequest;
  try { body=await req.json(); } catch { return json({ok:false,error:'Invalid JSON body.'},400); }
  if ((body.domain || allowedSite).replace(/^www\./,'').toLowerCase() !== allowedSite) return json({ok:false,error:'This publisher is restricted to vinteltool.site.'},403);
  const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const fileUrl=`https://api.github.com/repos/${encodeURIComponent(owner())}/${encodeURIComponent(repoName())}/contents/brand.config.json?ref=main`;
  const existingResponse=await fetch(fileUrl,{headers});
  const existing=await existingResponse.json();
  if(!existingResponse.ok||!existing.content||!existing.sha) return json({ok:false,error:existing.message||'Could not read brand.config.json.'},502);
  let config:any;
  try { config=JSON.parse(atob(String(existing.content).replace(/\n/g,''))); } catch { return json({ok:false,error:'brand.config.json could not be parsed.'},502); }
  const b=body.branding||{};
  if(b.siteName!==undefined) config.brand_name=b.siteName;
  config.brand_domain=allowedSite;
  if(b.browserTitle!==undefined) config.browser_title=b.browserTitle;
  if(b.footerBranding!==undefined) config.footer_branding=b.footerBranding;
  if(b.customCss!==undefined) config.custom_css=b.customCss;
  config.colors={...(config.colors||{}),primary:b.primary||config.colors?.primary,secondary:b.secondary||config.colors?.secondary,tertiary:b.accent||config.colors?.tertiary,success:b.success||config.colors?.success,danger:b.danger||config.colors?.danger,warning:b.warning||config.colors?.warning};
  config.typography={...(config.typography||{}),font_family:{...(config.typography?.font_family||{}),primary:b.font||config.typography?.font_family?.primary}};
  config.theme_config={...(config.theme_config||{}),default_theme:b.theme||config.theme_config?.default_theme};
  config.platform={...(config.platform||{}),name:b.siteName||config.platform?.name,show_name:b.showBrandName??config.platform?.show_name??true,hostname:{...(config.platform?.hostname||{}),production:{...(config.platform?.hostname?.production||{}),com:'www.vinteltool.site'}}};
  const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(config,null,2)+'\n')));
  const updateResponse=await fetch(fileUrl.replace('?ref=main',''),{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Studio: update vinteltool.site brand settings',content:encoded,sha:existing.sha,branch:'main'})});
  const updated=await updateResponse.json();
  if(!updateResponse.ok) return json({ok:false,error:updated.message||'GitHub update failed.'},updateResponse.status);
  return json({ok:true,site:allowedSite,repository:`${owner()}/${repoName()}`,commit:updated.commit?.sha||null,message:'Supported brand settings committed to GitHub. Vercel deployment status must be checked separately.'});
}