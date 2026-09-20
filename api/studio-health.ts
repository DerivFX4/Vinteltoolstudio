export default async function handler(req: Request) {
  const githubConfigured = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
  const vercelConfigured = Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID);
  return new Response(JSON.stringify({
    github: { configured: githubConfigured },
    vercel: { configured: vercelConfigured },
    templateRepo: process.env.GITHUB_TEMPLATE_REPO || null,
  }), { headers: { 'content-type': 'application/json' } });
}
