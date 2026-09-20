type PublishRequest = {
  siteId?: string;
  domain?: string;
  branding?: {
    siteName?: string;
    primary?: string;
    secondary?: string;
    accent?: string;
    success?: string;
    danger?: string;
    warning?: string;
    font?: string;
    theme?: 'light'|'dark';
    showBrandName?: boolean;
    browserTitle?: string;
    footerBranding?: string;
    logo?: string;
    favicon?: string;
  };
};

const allowedSite = 'vinteltool.site';
const owner = () => process.env.GITHUB_OWNER || 'DerivFX4';
const repoName = () => process.env.GITHUB_TEMPLATE_REPO || 'vinteltool';

export default async function handler(req: Request) {
  if (req.method && req.method !== 'POST') {
    return new Response(JSON.stringify({ok:false,error:'POST required.'}), {status:405,headers:{'content-type':'application/json'}});
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ok:false,error:'GitHub credentials are not configured.'}), {status:500,headers:{'content-type':'application/json'}});
  }

  let body: PublishRequest;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ok:false,error:'Invalid JSON body.'}), {status:400,headers:{'content-type':'application/json'}});
  }

  if ((body.domain || allowedSite).replace(/^www\./,'') !== allowedSite) {
    return new Response(JSON.stringify({ok:false,error:'This Studio publisher is restricted to vinteltool.site.'}), {status:403,headers:{'content-type':'application/json'}});
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const base = `https://api.github.com/repos/${encodeURIComponent(owner())}/${encodeURIComponent(repoName())}`;
  const fileUrl = `${base}/contents/brand.config.json`;

  const existingResponse = await fetch(fileUrl, {headers});
  const existing = await existingResponse.json();
  if (!existingResponse.ok || !existing.content || !existing.sha) {
    return new Response(JSON.stringify({ok:false,error:existing.message||'Could not read VintelTool brand.config.json.'}), {status:502,headers:{'content-type':'application/json'}});
  }

  let config: any;
  try {
    const raw = atob(String(existing.content).replace(/\n/g,''));
    config = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ok:false,error:'VintelTool brand.config.json could not be parsed.'}), {status:502,headers:{'content-type':'application/json'}});
  }

  const b = body.branding || {};
  config.brand_name = b.siteName || config.brand_name;
  config.domain_name = b.siteName ? `${b.siteName}.site` : config.domain_name;
  config.brand_domain = allowedSite;
  config.brand_hostname = {
    ...(config.brand_hostname || {}),
    production: allowedSite + '/dashboard',
  };
  config.colors = {
    ...(config.colors || {}),
    primary: b.primary || config.colors?.primary,
    secondary: b.secondary || config.colors?.secondary,
    tertiary: b.accent || config.colors?.tertiary,
    success: b.success || config.colors?.success,
    danger: b.danger || config.colors?.danger,
    warning: b.warning || config.colors?.warning,
  };
  config.typography = {
    ...(config.typography || {}),
    font_family: {
      ...(config.typography?.font_family || {}),
      primary: b.font || config.typography?.font_family?.primary,
    },
  };
  config.platform = {
    ...(config.platform || {}),
    name: b.siteName || config.platform?.name,
    show_name: b.showBrandName ?? config.platform?.show_name ?? true,
    logo_path: b.logo ? '/studio-logo' : (config.platform?.logo_path || '/logo.jpg'),
    hostname: {
      ...(config.platform?.hostname || {}),
      production: {
        ...(config.platform?.hostname?.production || {}),
        com: 'www.vinteltool.site',
      },
    },
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 4) + '\n')));
  const updateResponse = await fetch(fileUrl, {
    method:'PUT',
    headers:{...headers,'Content-Type':'application/json'},
    body:JSON.stringify({
      message:`Studio: update vinteltool.site branding`,
      content:encoded,
      sha:existing.sha,
      branch:'main',
    }),
  });
  const updated = await updateResponse.json();

  if (!updateResponse.ok) {
    return new Response(JSON.stringify({ok:false,error:updated.message||'GitHub update failed.'}), {status:updateResponse.status,headers:{'content-type':'application/json'}});
  }

  return new Response(JSON.stringify({
    ok:true,
    site:'vinteltool.site',
    repository:`${owner()}/${repoName()}`,
    commit:updated.commit?.sha||null,
    message:'Branding published to the VintelTool source repository. Vercel will deploy the connected site automatically.',
  }), {headers:{'content-type':'application/json'}});
}
