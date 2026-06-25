import { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface NeighborCitiesProps {
  username: string;
  onVisit: (username: string) => void;
  onClose: () => void;
}

async function fetchNeighbors(username: string): Promise<GitHubUser[]> {
  try {
    const cacheKey = `github_city_neighbors_${username}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const [followers, following] = await Promise.allSettled([
      fetch(`https://api.github.com/users/${username}/followers?per_page=30`).then(r => r.json()),
      fetch(`https://api.github.com/users/${username}/following?per_page=30`).then(r => r.json()),
    ]);

    const followerList: GitHubUser[] = Array.isArray(followers.value) ? followers.value : [];
    const followingList: GitHubUser[] = Array.isArray(following.value) ? following.value : [];

    const seen = new Set<string>();
    const merged: GitHubUser[] = [];
    for (const u of [...followerList, ...followingList]) {
      if (u.login && !seen.has(u.login) && u.login.toLowerCase() !== username.toLowerCase()) {
        seen.add(u.login);
        merged.push({ login: u.login, avatar_url: u.avatar_url });
      }
    }

    sessionStorage.setItem(cacheKey, JSON.stringify(merged));
    return merged;
  } catch {
    return [];
  }
}

function Avatar({ user, size = 44 }: { user: GitHubUser; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = user.login.slice(0, 2).toUpperCase();
  const hue = user.login.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `hsl(${hue},55%,38%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.33, fontWeight: 700, color: 'white', flexShrink: 0,
      }}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={user.avatar_url}
      alt={user.login}
      onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0,
        border: '2px solid rgba(74,191,176,0.30)',
      }}
    />
  );
}

export default function NeighborCities({ username, onVisit, onClose }: NeighborCitiesProps) {
  const [neighbors, setNeighbors] = useState<GitHubUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNeighbors([]);
    fetchNeighbors(username).then(data => {
      setNeighbors(data);
      setLoading(false);
    });
  }, [username]);

  return (
    <div
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 'min(280px, 82vw)',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(18,9,4,0.96)',
        borderLeft: '1px solid rgba(74,191,176,0.18)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        animation: 'slideInRight 0.22s ease-out both',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 14px 12px',
        borderBottom: '1px solid rgba(74,191,176,0.12)',
      }}>
        <MapPin size={14} color="#4ABFB0" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>
            Kota Tetangga
          </div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
            Followers & following of {username}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
            width: 28, height: 28, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)',
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, padding: '40px 16px',
            color: 'rgba(255,255,255,0.40)',
          }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12 }}>Memuat tetangga…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && neighbors.length === 0 && (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏙️</div>
            Belum ada tetangga.<br />
            User ini belum memiliki<br />followers atau following.
          </div>
        )}

        {!loading && neighbors.map((user) => (
          <button
            key={user.login}
            onClick={() => onVisit(user.login)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', padding: '9px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,191,176,0.10)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Avatar user={user} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: 'white',
                letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.login}
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(74,191,176,0.75)', marginTop: 1 }}>
                Kunjungi kota →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      {!loading && neighbors.length > 0 && (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(74,191,176,0.10)',
          fontSize: 10, color: 'rgba(255,255,255,0.28)', textAlign: 'center',
        }}>
          {neighbors.length} tetangga ditemukan
        </div>
      )}
    </div>
  );
}
