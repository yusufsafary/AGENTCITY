export const config = { runtime: 'nodejs' };

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function trackVisit(username, host) {
  try {
    await fetch(`https://${host}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'agentcity-share' },
      body: JSON.stringify({ username })
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  const username = (req.query.u || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!username) return res.redirect(302, '/');

  let name = username, bio = '', followers = 0, repos = 0;

  try {
    const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    const ghRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'User-Agent': 'agentcity-og/1.0',
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    if (ghRes.ok) {
      const d = await ghRes.json();
      name = d.name || username;
      bio = d.bio || '';
      followers = d.followers || 0;
      repos = d.public_repos || 0;
    }
  } catch (_) {}

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'agentcity.uk';

  trackVisit(username, host);

  const pageUrl = `${proto}://${host}/${username}`;
  const baseUrl = `${proto}://${host}`;

  // OG image via /api/og with stats baked in
  const ogImageUrl = `${baseUrl}/api/og?u=${encodeURIComponent(username)}&name=${encodeURIComponent(name)}&followers=${followers}&repos=${repos}&bio=${encodeURIComponent(bio.slice(0, 80))}`;

  const title = esc(`${name}'s Agent City`);
  const statsLine = `${followers.toLocaleString()} followers · ${repos} public repos`;
  const desc = esc(bio ? `${bio} · ${statsLine}` : `${statsLine} — visualised as a living 3D city on agentcity.uk`);
  const escapedPageUrl = esc(pageUrl);
  const escapedOgImage = esc(ogImageUrl);
  const redirectUrl = pageUrl.replace(/"/g, '\\"');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Agent City">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${escapedPageUrl}">
  <meta property="og:image" content="${escapedOgImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(name)}&apos;s GitHub activity as a 3D city">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@agentcityuk">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${escapedOgImage}">
  <meta name="twitter:image:alt" content="${esc(name)}&apos;s Agent City">

  <meta http-equiv="refresh" content="0;url=${escapedPageUrl}">
  <link rel="canonical" href="${escapedPageUrl}">
</head>
<body>
  <script>window.location.replace("${redirectUrl}")</script>
  <p>Redirecting to <a href="${escapedPageUrl}">${title}</a>…</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}
