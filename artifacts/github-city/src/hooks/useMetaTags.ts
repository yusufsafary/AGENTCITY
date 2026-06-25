import { useEffect } from 'react';

interface MetaTagsOptions {
  username: string;
  name?: string;
  bio?: string;
  followers?: number;
  repos?: number;
}

const BASE_ORIGIN = window.location.origin;
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function setMeta(property: string, content: string) {
  // Handle both name= and property= meta tags
  let el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (property.startsWith('og:') || property.startsWith('article:')) {
      el.setAttribute('property', property);
    } else {
      el.setAttribute('name', property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
}

export function useMetaTags(opts: MetaTagsOptions | null) {
  useEffect(() => {
    if (!opts) {
      // Reset to defaults
      document.title = 'Agent City — Your GitHub activity as a living 3D city';
      setMeta('og:title', 'Agent City — Your GitHub activity as a living 3D city');
      setMeta('og:description', 'Turn any GitHub profile into a living 3D city. Every repo, every commit — rendered as a glowing skyline.');
      setMeta('og:url', 'https://agentcity.uk/');
      setMeta('og:image', 'https://agentcity.uk/og-image.png');
      setMeta('og:image:width', '1200');
      setMeta('og:image:height', '630');
      setMeta('twitter:card', 'summary_large_image');
      setMeta('twitter:title', 'Agent City — Your GitHub activity as a living 3D city');
      setMeta('twitter:description', 'Turn any GitHub profile into a living 3D city. Every repo, every commit — rendered as a glowing skyline.');
      setMeta('twitter:image', 'https://agentcity.uk/og-image.png');
      return;
    }

    const { username, name = username, bio = '', followers = 0, repos = 0 } = opts;

    const displayName = name || username;
    const statsLine = `${fmt(followers)} followers · ${repos} repos`;
    const desc = bio
      ? `${bio} · ${statsLine} — visualised as a living 3D city`
      : `${statsLine} — visualised as a living 3D city on agentcity.uk`;

    const pageUrl = `${BASE_ORIGIN}${BASE}/u/${encodeURIComponent(username)}`;
    const ogImageUrl = `${BASE_ORIGIN}/api/og?u=${encodeURIComponent(username)}&name=${encodeURIComponent(displayName)}&followers=${followers}&repos=${repos}&bio=${encodeURIComponent(bio.slice(0, 80))}`;
    const title = `${displayName}'s Agent City`;

    document.title = title;

    setMeta('og:site_name', 'Agent City');
    setMeta('og:type', 'website');
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:url', pageUrl);
    setMeta('og:image', ogImageUrl);
    setMeta('og:image:width', '1200');
    setMeta('og:image:height', '630');
    setMeta('og:image:alt', `${displayName}'s GitHub activity as a 3D city`);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', ogImageUrl);
    setMeta('twitter:image:alt', `${displayName}'s Agent City`);
  }, [opts?.username, opts?.name, opts?.followers, opts?.repos, opts?.bio]);
}
