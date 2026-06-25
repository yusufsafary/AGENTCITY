import { useEffect, useState } from 'react';
import { Trophy, ArrowLeft, Loader2 } from 'lucide-react';

interface Entry { username: string; visits: number; }

interface Props {
  nightMode: boolean;
  onSelect: (username: string) => void;
  onBack: () => void;
}

function GitCityLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="16" fill="#B84C1F" />
      <path d="M5 17 Q5.5 7 16 7 Q26.5 7 27 17Z" fill="#4ABFB0" opacity="0.22" />
      <path d="M5 17 Q5.5 7 16 7 Q26.5 7 27 17" stroke="#4ABFB0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="5" y="17" width="22" height="0.8" fill="white" opacity="0.45" />
      <rect x="8" y="13" width="3.5" height="4" fill="white" opacity="0.95" rx="0.4" />
      <rect x="14" y="10" width="4" height="7" fill="white" opacity="0.95" rx="0.4" />
      <rect x="20.5" y="14" width="3" height="3" fill="white" opacity="0.95" rx="0.4" />
      <circle cx="16" cy="22" r="1.4" fill="white" opacity="0.9" />
      <line x1="16" y1="23.4" x2="12.5" y2="26" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
      <line x1="16" y1="23.4" x2="19.5" y2="26" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
      <circle cx="12.5" cy="26.8" r="1.2" fill="white" opacity="0.85" />
      <circle cx="19.5" cy="26.8" r="1.2" fill="white" opacity="0.85" />
    </svg>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ nightMode, onSelect, onBack }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const panelBg = nightMode ? 'bg-[#0F0315]/90 border-white/10' : 'bg-[#1C0E06]/85 border-[#4ABFB0]/25';

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setEntries(d.leaderboard ?? []); setLoading(false); })
      .catch(() => { setError('Could not load leaderboard'); setLoading(false); });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-4 px-3 pb-6 overflow-y-auto">
      {/* Header */}
      <div className={`w-full max-w-lg ${panelBg} backdrop-blur-md rounded-2xl border shadow-xl p-4 mb-3`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/50 hover:text-white/90 transition-colors p-1 -ml-1">
            <ArrowLeft size={18} />
          </button>
          <GitCityLogo size={22} />
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">GitHub City</h1>
            <p className="text-white/50 text-xs">Most explored cities</p>
          </div>
          <Trophy size={18} className="ml-auto text-[#F0A882]" />
        </div>
      </div>

      {/* List */}
      <div className={`w-full max-w-lg ${panelBg} backdrop-blur-md rounded-2xl border shadow-xl overflow-hidden`}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-[#4ABFB0]" />
          </div>
        )}
        {error && (
          <p className="text-white/50 text-sm text-center py-10">{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-white/50 text-sm text-center py-10">No cities explored yet — be the first!</p>
        )}
        {!loading && entries.map((entry, i) => (
          <button
            key={entry.username}
            onClick={() => onSelect(entry.username)}
            className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-base w-6 text-center flex-shrink-0">
              {i < 3 ? MEDAL[i] : <span className="text-white/30 text-xs font-mono">{i + 1}</span>}
            </span>
            <img
              src={`https://github.com/${entry.username}.png?size=64`}
              alt={entry.username}
              className="w-9 h-9 rounded-full flex-shrink-0 bg-white/10"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{entry.username}</p>
              <p className="text-white/40 text-xs">{entry.visits.toLocaleString()} {entry.visits === 1 ? 'visit' : 'visits'}</p>
            </div>
            <span className="text-[#4ABFB0] text-xs font-medium shrink-0">Explore →</span>
          </button>
        ))}
      </div>

      <p className="text-white/25 text-xs mt-4 text-center">
        Updated each time a city is shared
      </p>
    </div>
  );
}
