const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async function handler(req:Request){
 if(req.method!=='GET')return json({ok:false,error:'GET required.'},405);
 const token=process.env.GITHUB_TOKEN;
 const owner=process.env.PRODUCTION_SITE_OWNER||process.env.GITHUB_OWNER||'DerivFX4';
 const repo=process.env.PRODUCTION_SITE_REPO||'vinteltool';
 if(!token)return json({ok:false,error:'GitHub credentials are not configured for Studio.'},503);
 const url=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/brand.config.json?ref=main`;
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
 const data=await r.json();
 if(!r.ok||!data.content)return json({ok:false,error:data.message||'Could not load production site configuration.'},r.status||502);
 try{
  const config=JSON.parse(atob(String(data.content).replace(/\\n/g,'')));
  return json({ok:true,repository:`${owner}/${repo}`,branch:'main',config});
 }catch{return json({ok:false,error:'Production brand configuration is not valid JSON.'},502);}
}