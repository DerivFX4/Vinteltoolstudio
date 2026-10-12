const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
export default async function handler(req:Request){
 if(req.method!=='GET')return json({error:'GET required.'},405);
 const token=process.env.STUDIO_VERCEL_TOKEN,team=process.env.STUDIO_VERCEL_TEAM_ID;
 if(!token||!team)return json({error:'STUDIO_VERCEL_TOKEN or STUDIO_VERCEL_TEAM_ID is missing.'},503);
 const url=new URL('https://api.vercel.com/v6/deployments');
 url.searchParams.set('teamId',team);url.searchParams.set('app','vinteltoolstudio');url.searchParams.set('limit','10');
 const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
 const data=await r.json();
 if(!r.ok)return json({error:data.error?.message||'Vercel API request failed.'},r.status);
 const items=(data.deployments||[]).map((d:any)=>({id:d.uid||d.id,name:d.name,url:d.url,state:d.readyState||d.state,created:d.created,meta:{githubCommitMessage:d.meta?.githubCommitMessage,githubCommitRef:d.meta?.githubCommitRef,githubCommitSha:d.meta?.githubCommitSha}}));
 return json({deployments:items});
}