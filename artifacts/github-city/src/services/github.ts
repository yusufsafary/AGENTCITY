import type { GitHubRepo, GitHubEvent, DailyActivity, RepoActivity } from '../types/github';

const CACHE_TTL = 15 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function cacheKey(username: string, type: string): string {
  return `github_city_${username}_${type}`;
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function sanitizeUsername(input: string): string {
  return input.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 39);
}

function getAuthHeaders(): Record<string, string> {
  const token = (import.meta.env.VITE_GITHUB_TOKEN as string | undefined) ?? '';
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (res.status === 404) throw new Error('USER_NOT_FOUND');
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('X-RateLimit-Reset');
    const resetTime = reset ? parseInt(reset) * 1000 : Date.now() + 60000;
    throw new Error(`RATE_LIMIT:${resetTime}`);
  }
  if (!res.ok) throw new Error(`HTTP_ERROR:${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const key = cacheKey(username, 'repos');
  const cached = getCache<GitHubRepo[]>(key);
  if (cached) return cached;

  const data = await apiFetch<GitHubRepo[]>(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
  );
  setCache(key, data);
  return data;
}

export async function fetchEvents(username: string): Promise<GitHubEvent[]> {
  const key = cacheKey(username, 'events');
  const cached = getCache<GitHubEvent[]>(key);
  if (cached) return cached;

  const events: GitHubEvent[] = [];
  try {
    for (let page = 1; page <= 3; page++) {
      const page_data = await apiFetch<GitHubEvent[]>(
        `https://api.github.com/users/${username}/events/public?per_page=100&page=${page}`
      );
      events.push(...page_data);
      if (page_data.length < 100) break;
    }
  } catch (e) {
    if (events.length === 0) throw e;
  }

  setCache(key, events);
  return events;
}

export function aggregateActivity(events: GitHubEvent[]): {
  repoActivity: RepoActivity;
  dailyActivity: DailyActivity[];
  totalCommits: number;
} {
  const repoActivity: RepoActivity = {};
  const dailyMap: Record<string, number> = {};
  let totalCommits = 0;

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

  for (const event of events) {
    const eventTime = new Date(event.created_at).getTime();
    if (eventTime < cutoff) continue;

    const date = event.created_at.slice(0, 10);
    const repoName = event.repo.name.split('/')[1] ?? event.repo.name;

    if (event.type === 'PushEvent') {
      const commits = event.payload.commits?.length ?? 0;
      if (!repoActivity[repoName]) repoActivity[repoName] = {};
      repoActivity[repoName][date] = (repoActivity[repoName][date] ?? 0) + commits;
      dailyMap[date] = (dailyMap[date] ?? 0) + commits;
      totalCommits += commits;
    }
  }

  const dailyActivity: DailyActivity[] = Object.entries(dailyMap)
    .map(([date, commits]) => ({ date, commits }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { repoActivity, dailyActivity, totalCommits };
}

export function getRepoTotalActivity(repoActivity: RepoActivity, repoName: string): number {
  const repo = repoActivity[repoName];
  if (!repo) return 0;
  return Object.values(repo).reduce((sum, v) => sum + v, 0);
}
