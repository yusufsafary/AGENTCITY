import { useState, useCallback } from 'react';
import type { CityData, LoadingState } from '../types/github';
import { fetchRepos, fetchEvents, aggregateActivity, sanitizeUsername } from '../services/github';
import { buildCityData } from '../utils/cityLayout';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function useGitHubCity() {
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ step: 'idle', message: '' });
  const [showForks, setShowForks] = useState(false);
  const [username, setUsername] = useState('');
  const [lastUsername, setLastUsername] = useState('');

  const buildCity = useCallback(async (inputUsername: string, forksOverride?: boolean) => {
    const safe = sanitizeUsername(inputUsername.trim());
    if (!safe) return;

    const useForks = forksOverride ?? showForks;

    setLoading({ step: 'fetching-repos', message: 'Fetching repositories…' });
    setCityData(null);

    try {
      const repos = await fetchRepos(safe);
      if (repos.length === 0) {
        setLoading({ step: 'error', message: '', error: 'This user has no public repositories.' });
        return;
      }

      setLoading({ step: 'fetching-events', message: 'Calculating activity…' });
      const events = await fetchEvents(safe);

      setLoading({ step: 'building-city', message: 'Building your city…' });
      const { repoActivity, dailyActivity, totalCommits } = aggregateActivity(events);

      await new Promise(r => setTimeout(r, 300));

      const data = buildCityData(repos, repoActivity, dailyActivity, totalCommits, useForks);
      setCityData(data);
      setLastUsername(safe);
      setLoading({ step: 'done', message: '' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'USER_NOT_FOUND') {
        setLoading({ step: 'error', message: '', error: `User "${safe}" not found on GitHub.` });
      } else if (msg.startsWith('RATE_LIMIT:')) {
        const resetTime = parseInt(msg.split(':')[1]);
        const seconds = Math.ceil((resetTime - Date.now()) / 1000);
        setLoading({ step: 'error', message: '', error: `GitHub rate limit hit. Try again in ${seconds}s.` });
      } else {
        setLoading({ step: 'error', message: '', error: 'Network error. Check your connection.' });
      }
    }
  }, [showForks]);

  const toggleForks = useCallback((val: boolean) => {
    setShowForks(val);
    if (lastUsername) buildCity(lastUsername, val);
  }, [lastUsername, buildCity]);

  const resetCity = useCallback(() => {
    setCityData(null);
    setLoading({ step: 'idle', message: '' });
    setLastUsername('');
    setUsername('');
    window.history.pushState({}, '', BASE + '/');
  }, []);

  return {
    cityData,
    loading,
    buildCity,
    showForks,
    toggleForks,
    username,
    setUsername,
    lastUsername,
    resetCity,
  };
}
