export const config = { runtime: 'nodejs' };

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function trackVisit(username, host, token) {
  try {
    await fetch(`https://${host}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'githubcity-share' },
      body: JSON.stringify({ username })
    });
  } catch (_) {}
}

export default async function handler(req, res) {
  const username = (req.query.u || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!username) return res.redirect(302, '/');

  let name = username, bio = '', followers = 0, repos = 0;
  let avatarUrl = `https://github.com/${username}.png?size=400`;

  try {
    const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    const ghRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'githubcity-og/1.0', Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (ghRes.ok) {
      const d = await ghRes.json();
      name = d.name || username; bio = d.bio || ''; followers = d.followers || 0; repos = d.public_repos || 0;
      avatarUrl = d.avatar_url ? `${d.avatar_url}&size=400` : avatarUrl;
    }
  } catch (_) {}

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'githubcity.com';

  // Track this visit (fire and forget)
  trackVisit(username, host, process.env.VITE_GITHUB_TOKEN);

  const pageUrl = `${proto}://${host}/${username}`;
  const title = esc(`${name}'s GitHub City`);
  const statsLine = `${followers.toLocaleString()} followers · ${repos} public repos`;
  const desc = esc(bio ? `${bio} · ${statsLine}` : statsLine);
  const avatar = esc(avatarUrl);
  const escapedPageUrl = esc(pageUrl);
  const redirectUrl = pageUrl.replace(/"/g, '\\"');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GitHub City">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${escapedPageUrl}">
  <meta property="og:image" content="${avatar}">
  <meta property="og:image:width" content="400">
  <meta property="og:image:height" content="400">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${avatar}">
  <meta http-equiv="refresh" content="0;url=${escapedPageUrl}">
  <link rel="canonical" href="${escapedPageUrl}">
</head>
<body>
  <script>window.location.replace("${redirectUrl}")</script>
  <p>Redirecting to <a href="${escapedPageUrl}">${title}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}
