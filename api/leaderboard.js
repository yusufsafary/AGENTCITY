export const config = { runtime: 'nodejs' };

const GIST_ID = process.env.LEADERBOARD_GIST_ID || '';
const GH_TOKEN = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
const GIST_FILE = 'leaderboard.json';

async function readGist() {
  if (!GIST_ID) return { visits: {}, updated: new Date().toISOString() };
  const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { 'User-Agent': 'githubcity', Accept: 'application/vnd.github+json', ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}) }
  });
  if (!r.ok) return { visits: {}, updated: new Date().toISOString() };
  const g = await r.json();
  return JSON.parse(g.files?.[GIST_FILE]?.content ?? '{"visits":{}}');
}

async function writeGist(data) {
  if (!GIST_ID || !GH_TOKEN) return;
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: { 'User-Agent': 'githubcity', Accept: 'application/vnd.github+json', Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(data) } } })
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  if (req.method === 'POST') {
    const username = (req.body?.username || req.query.u || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!username) return res.status(400).json({ error: 'missing username' });
    try {
      const data = await readGist();
      data.visits = data.visits || {};
      data.visits[username] = (data.visits[username] || 0) + 1;
      data.updated = new Date().toISOString();
      await writeGist(data);
      return res.json({ ok: true, count: data.visits[username] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET — return sorted leaderboard
  try {
    const data = await readGist();
    const sorted = Object.entries(data.visits || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([username, visits]) => ({ username, visits }));
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.json({ leaderboard: sorted, updated: data.updated });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
