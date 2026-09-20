export default async function handler() {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !teamId) return new Response(JSON.stringify({ok:false,error:'Vercel environment variables are not configured.'}), {status:500,headers:{'content-type':'application/json'}});
  const r = await fetch(`https://api.vercel.com/v9/projects?teamId=${encodeURIComponent(teamId)}&limit=1`, { headers:{Authorization:`Bearer ${token}`} });
  const data = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ok:false,error:data.error?.message||'Vercel request failed.'}), {status:r.status,headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify({ok:true, connected:true}), {headers:{'content-type':'application/json'}});
}
