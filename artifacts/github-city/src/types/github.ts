export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  fork: boolean;
  html_url: string;
  created_at: string;
}

export interface GitHubEvent {
  type: string;
  repo: { name: string };
  payload: {
    commits?: { message: string }[];
    pull_request?: unknown;
    issue?: unknown;
  };
  created_at: string;
}

export interface DailyActivity {
  date: string;
  commits: number;
}

export interface RepoActivity {
  [repoName: string]: {
    [date: string]: number;
  };
}

export interface BuildingData {
  repo: GitHubRepo;
  height: number;
  width: number;
  depth: number;
  x: number;
  z: number;
  color: string;
  isLandmark: boolean;
  hasPark: boolean;
  shape: 'box' | 'podium' | 'lshape';
  activity: number;
}

export interface SkylineBar {
  date: string;
  commits: number;
  x: number;
  z: number;
  weekIndex: number;
  dayIndex: number;
}

export interface CityData {
  buildings: BuildingData[];
  skyline: SkylineBar[];
  stats: {
    repoCount: number;
    totalCommits: number;
    topLanguage: string | null;
    totalStars: number;
  };
}

export type LoadingStep =
  | 'idle'
  | 'fetching-repos'
  | 'fetching-events'
  | 'building-city'
  | 'done'
  | 'error';

export interface LoadingState {
  step: LoadingStep;
  message: string;
  error?: string;
}
