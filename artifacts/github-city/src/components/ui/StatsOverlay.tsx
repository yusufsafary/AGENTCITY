import { useState } from 'react';
import { BarChart2, ChevronUp, ChevronDown } from 'lucide-react';
import { getLanguageColor } from '../../utils/colors';

interface StatsOverlayProps {
  stats: {
    repoCount: number;
    totalCommits: number;
    topLanguage: string | null;
    totalStars: number;
  };
  username: string;
  nightMode: boolean;
}

export default function StatsOverlay({ stats, username, nightMode }: StatsOverlayProps) {
  const [open, setOpen] = useState(true);

  const bg = nightMode ? 'rgba(15,3,21,0.88)' : 'rgba(4,8,15,0.84)';
  const border = nightMode ? 'rgba(255,255,255,0.10)' : 'rgba(202,255,0,0.20)';
  const sub = nightMode ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.52)';
  const divLine = nightMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)';

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 12, zIndex: 40,
      minWidth: 160, maxWidth: 196,
    }}>
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            width: '100%', padding: '8px 10px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'white', minHeight: 40,
          }}
        >
          <BarChart2 size={13} color="#CAFF00" style={{ flexShrink: 0 }} />
          <span style={{
            flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600,
            letterSpacing: '-0.01em', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {username}
          </span>
          {open
            ? <ChevronDown size={11} color={sub} style={{ flexShrink: 0 }} />
            : <ChevronUp size={11} color={sub} style={{ flexShrink: 0 }} />
          }
        </button>

        {/* Body */}
        {open && (
          <div style={{ borderTop: `1px solid ${divLine}`, padding: '8px 10px 10px' }}>
            {[
              { label: 'Repos',   value: stats.repoCount.toLocaleString() },
              { label: 'Commits', value: stats.totalCommits.toLocaleString(), note: '~90d' },
              { label: 'Stars',   value: stats.totalStars.toLocaleString() },
            ].map(({ label, value, note }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: sub }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{value}</span>
                  {note && <span style={{ fontSize: 10, color: sub }}>{note}</span>}
                </div>
              </div>
            ))}

            {stats.topLanguage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: sub }}>Top lang</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: getLanguageColor(stats.topLanguage),
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{stats.topLanguage}</span>
                </div>
              </div>
            )}

            <p style={{ fontSize: 9.5, color: sub, marginTop: 6, lineHeight: 1.4 }}>
              * Commit data ~90 days
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
