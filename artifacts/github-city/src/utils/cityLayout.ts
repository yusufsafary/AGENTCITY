import type { GitHubRepo, BuildingData, SkylineBar, CityData, DailyActivity, RepoActivity } from '../types/github';
import { getLanguageColor, getBuildingShape, hashString } from './colors';
import { getRepoTotalActivity } from '../services/github';

const GRID_SPACING = 4;
const MAX_HEIGHT = 18;
const MIN_HEIGHT = 1.2;

function logScale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max <= min) return outMin;
  const logVal = Math.log1p(value - min);
  const logMax = Math.log1p(max - min);
  return outMin + (logVal / logMax) * (outMax - outMin);
}

function spiralGrid(index: number): [number, number] {
  if (index === 0) return [0, 0];
  let layer = 1;
  let count = 0;
  while (count + 8 * layer <= index) {
    count += 8 * layer;
    layer++;
  }
  const pos = index - count;
  const side = Math.floor(pos / (2 * layer));
  const offset = pos % (2 * layer);
  switch (side) {
    case 0: return [-layer + offset, -layer];
    case 1: return [layer, -layer + offset];
    case 2: return [layer - offset, layer];
    case 3: return [-layer, layer - offset];
    default: return [0, 0];
  }
}

export function buildCityData(
  repos: GitHubRepo[],
  repoActivity: RepoActivity,
  dailyActivity: DailyActivity[],
  totalCommits: number,
  showForks: boolean
): CityData {
  const filtered = showForks ? repos : repos.filter(r => !r.fork);

  const activities = filtered.map(r => getRepoTotalActivity(repoActivity, r.name));
  const sizes = filtered.map(r => r.size);
  const maxActivity = Math.max(...activities, 1);
  const maxSize = Math.max(...sizes, 1);
  const maxStars = Math.max(...filtered.map(r => r.stargazers_count), 1);

  const buildings: BuildingData[] = filtered.map((repo, i) => {
    const activity = activities[i];
    const heightScore = (repo.size / maxSize) * 0.4 + (activity / maxActivity) * 0.6;
    const height = logScale(heightScore, 0, 1, MIN_HEIGHT, MAX_HEIGHT);
    const isLandmark = repo.stargazers_count >= Math.max(5, maxStars * 0.3);
    const width = isLandmark ? 2.2 + (hashString(repo.name) % 10) / 20 : 1.4 + (hashString(repo.name) % 10) / 30;
    const depth = isLandmark ? 2.2 + (hashString(repo.name + 'd') % 10) / 20 : 1.4 + (hashString(repo.name + 'd') % 10) / 30;
    const [gx, gz] = spiralGrid(i);

    return {
      repo,
      height,
      width,
      depth,
      x: gx * GRID_SPACING,
      z: gz * GRID_SPACING,
      color: getLanguageColor(repo.language),
      isLandmark,
      hasPark: (repo as unknown as Record<string, unknown>).has_issues !== false && hashString(repo.name) % 4 === 0,
      shape: getBuildingShape(repo.name),
      activity,
    };
  });

  // Downtown skyline: last 90 days in a 7-col weekly grid
  const last90: DailyActivity[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = dailyActivity.find(da => da.date === dateStr);
    last90.push({ date: dateStr, commits: found?.commits ?? 0 });
  }

  const skyline: SkylineBar[] = last90.map((day, i) => {
    const weekIndex = Math.floor(i / 7);
    const dayIndex = i % 7;
    const SKYLINE_OFFSET_X = buildings.length > 0
      ? (Math.max(...buildings.map(b => Math.abs(b.x))) + 12)
      : 20;
    return {
      date: day.date,
      commits: day.commits,
      x: SKYLINE_OFFSET_X + weekIndex * 1.6,
      z: (dayIndex - 3) * 1.6,
      weekIndex,
      dayIndex,
    };
  });

  const langCounts: Record<string, number> = {};
  for (const r of filtered) {
    if (r.language) langCounts[r.language] = (langCounts[r.language] ?? 0) + 1;
  }
  const topLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    buildings,
    skyline,
    stats: {
      repoCount: filtered.length,
      totalCommits,
      topLanguage,
      totalStars: filtered.reduce((s, r) => s + r.stargazers_count, 0),
    },
  };
}
