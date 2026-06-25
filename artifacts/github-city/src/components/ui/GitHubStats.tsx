import { useEffect, useState } from 'react';

interface RepoStats {
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  watchers: number;
}

function fmt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

/* ── SVG icons ─────────────────────────────── */
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const ForkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
    <path d="M6 9v2a3 3 0 003 3h6a3 3 0 003-3V9"/><line x1="12" y1="12" x2="12" y2="15"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* ── Stat pill ──────────────────────────────── */
function StatPill({
  icon, value, label, delay,
}: {
  icon: React.ReactNode; value: string; label: string; delay: string;
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        padding: '8px 14px',
        animation: `gc-fade-up 0.55s ease-out ${delay} both`,
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>{icon}</div>
      <span style={{
        fontSize: '17px', fontWeight: 700, color: '#ffffff', lineHeight: 1,
        letterSpacing: '-0.02em', fontFamily: 'inherit',
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '9.5px', fontWeight: 500, color: 'rgba(255,255,255,0.48)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        {label}
      </span>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: '1px', opacity: 0.35 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 64, height: 60, borderRadius: 10,
          background: 'rgba(255,255,255,0.18)',
          animation: `pulse 1.6s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────── */
export default function GitHubStats({ repo }: { repo: string }) {
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [repoRes, contribRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}`, {
            headers: { Accept: 'application/vnd.github+json' },
          }),
          fetch(`https://api.github.com/repos/${repo}/contributors?per_page=100&anon=1`, {
            headers: { Accept: 'application/vnd.github+json' },
          }),
        ]);
        if (!repoRes.ok || !active) return;
        const data = await repoRes.json();
        const contribs = contribRes.ok ? await contribRes.json() : [];
        if (!active) return;
        setStats({
          stars: data.stargazers_count ?? 0,
          forks: data.forks_count ?? 0,
          issues: data.open_issues_count ?? 0,
          contributors: Array.isArray(contribs) ? contribs.length : 0,
          watchers: data.subscribers_count ?? data.watchers_count ?? 0,
        });
      } catch { /* silently ignore — stats are decorative */ }
      finally { if (active) setLoading(false); }
    })();

    return () => { active = false; };
  }, [repo]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    }}>
      {/* Panel */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderRadius: '18px',
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {loading || !stats ? (
          <Skeleton />
        ) : (
          <>
            <StatPill icon={<StarIcon />}  value={fmt(stats.stars)}        label="Stars"        delay="0.55s" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.10)', margin: '10px 0' }} />
            <StatPill icon={<ForkIcon />}  value={fmt(stats.forks)}        label="Forks"        delay="0.65s" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.10)', margin: '10px 0' }} />
            <StatPill icon={<UsersIcon />} value={fmt(stats.contributors)} label="Contributors" delay="0.75s" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.10)', margin: '10px 0' }} />
            <StatPill icon={<EyeIcon />}   value={fmt(stats.watchers)}     label="Watchers"     delay="0.85s" />
          </>
        )}
      </div>

      {/* Repo label */}
      {!loading && stats && (
        <a
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', color: 'rgba(255,255,255,0.42)',
            textDecoration: 'none', letterSpacing: '0.02em',
            transition: 'color 0.2s',
            animation: 'gc-fade-up 0.5s ease-out 0.9s both',
            pointerEvents: 'auto',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.42)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {repo}
        </a>
      )}
    </div>
  );
}
