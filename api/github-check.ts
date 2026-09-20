export default async function handler() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return new Response(JSON.stringify({ ok:false, error:'GitHub environment variables are not configured.' }), { status:500, headers:{'content-type':'application/json'} });
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Authorization: `Bearer ${token}`, Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' }
  });
  const data = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ok:false,error:data.message||'GitHub request failed.'}), {status:r.status,headers:{'content-type':'application/json'}});
  return new Response(JSON.stringify({ok:true, full_name:data.full_name, private:data.private, default_branch:data.default_branch}), {headers:{'content-type':'application/json'}});
}
