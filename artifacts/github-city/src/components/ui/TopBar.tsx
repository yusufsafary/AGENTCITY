import { useState, FormEvent } from 'react';
import { ChevronDown, ChevronUp, Share2, Check, Trophy, Home } from 'lucide-react';

interface TopBarProps {
  onBuild: (username: string) => void;
  loading: boolean;
  hasCity: boolean;
  username: string;
  setUsername: (v: string) => void;
  nightMode?: boolean;
  lastUsername?: string;
  onShowLeaderboard?: () => void;
  onHome?: () => void;
}

function GitCityLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r="24" fill="#A8421A" />
      <circle cx="24" cy="24" r="24" fill="url(#tb-grad)" />
      <ellipse cx="24" cy="16" rx="14" ry="6" fill="#4ABFB0" opacity="0.12" />
      <rect x="6" y="35" width="36" height="1" fill="white" opacity="0.25" rx="0.5" />
      <rect x="7" y="28" width="6" height="7" fill="white" opacity="0.75" rx="0.5" />
      <rect x="8.5" y="29.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.7" />
      <rect x="14" y="22" width="7" height="13" fill="white" opacity="0.85" rx="0.5" />
      <rect x="15.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.8" />
      <rect x="18" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.5" />
      <rect x="15.2" y="26.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.55" />
      <rect x="18" y="26.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.8" />
      <rect x="22" y="14" width="8" height="21" fill="white" opacity="0.97" rx="0.5" />
      <rect x="25.5" y="10.5" width="1.5" height="3.5" fill="white" opacity="0.6" rx="0.5" />
      <circle cx="26.25" cy="10" r="1" fill="#4ABFB0" opacity="0.9" />
      <rect x="23.2" y="16" width="2" height="1.8" fill="#4ABFB0" opacity="0.85" />
      <rect x="26.2" y="16" width="2" height="1.8" fill="#4ABFB0" opacity="0.5" />
      <rect x="23.2" y="19.5" width="2" height="1.8" fill="#4ABFB0" opacity="0.65" />
      <rect x="26.2" y="19.5" width="2" height="1.8" fill="#4ABFB0" opacity="0.9" />
      <rect x="23.2" y="23" width="2" height="1.8" fill="#4ABFB0" opacity="0.4" />
      <rect x="26.2" y="23" width="2" height="1.8" fill="#4ABFB0" opacity="0.7" />
      <rect x="31" y="19" width="7" height="16" fill="white" opacity="0.85" rx="0.5" />
      <rect x="32.2" y="20.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.7" />
      <rect x="35.2" y="20.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.4" />
      <rect x="32.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.9" />
      <rect x="35.2" y="23.5" width="1.8" height="1.5" fill="#4ABFB0" opacity="0.55" />
      <rect x="39" y="27" width="5" height="8" fill="white" opacity="0.7" rx="0.5" />
      <rect x="40" y="28.5" width="1.6" height="1.5" fill="#4ABFB0" opacity="0.65" />
      <defs>
        <radialGradient id="tb-grad" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#C1521E" />
          <stop offset="100%" stopColor="#8B3510" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function buildShareUrl(username: string): string {
  return `${window.location.origin}/u/${encodeURIComponent(username)}`;
}

export default function TopBar({
  onBuild, loading, hasCity, username, setUsername, nightMode = false, lastUsername, onShowLeaderboard, onHome,
}: TopBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!loading && username.trim()) onBuild(username.trim());
  };

  const handleShare = async () => {
    const shareUser = lastUsername ?? username.trim();
    if (!shareUser) return;
    const shareUrl = buildShareUrl(shareUser);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${shareUser}'s GitHub City`, text: `Check out ${shareUser}'s GitHub activity as a 3D city!`, url: shareUrl });
        return;
      } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(shareUrl); }
    catch {
      const el = document.createElement('textarea');
      el.value = shareUrl; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const panelBg = nightMode ? 'bg-[#0F0315]/85 border-white/10' : 'bg-[#1C0E06]/80 border-[#4ABFB0]/25';

  if (collapsed && hasCity) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {onHome && (
          <button onClick={onHome} title="Back to Home" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border text-white/70 hover:text-white transition-colors`}>
            <Home size={14} />
          </button>
        )}
        <button onClick={() => setCollapsed(false)} className={`flex items-center gap-2 ${panelBg} backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border`}>
          <GitCityLogo size={18} />
          <span className="max-w-[140px] truncate">{username}</span>
          <ChevronDown size={14} className="text-[#4ABFB0]" />
        </button>
        <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border transition-colors ${copied ? 'border-[#4ABFB0]/60 text-[#4ABFB0]' : 'text-white/70'}`}>
          {copied ? <Check size={15} className="text-[#4ABFB0]" /> : <Share2 size={15} />}
          <span className="text-xs">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 pb-2">
      <div className={`max-w-lg mx-auto ${panelBg} backdrop-blur-md rounded-2xl border shadow-xl p-3`}>
        <div className="flex items-center gap-2.5 mb-2">
          <GitCityLogo size={22} />
          <span className="text-white font-semibold text-sm tracking-tight" style={{ letterSpacing: '-0.01em' }}>GitHub City</span>
          <div className="ml-auto flex items-center gap-1.5">
            {hasCity && onHome && (
              <button onClick={onHome} title="Back to Home" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-white hover:border-white/25`}>
                <Home size={13} />
                <span>Home</span>
              </button>
            )}
            {onShowLeaderboard && (
              <button onClick={onShowLeaderboard} title="Top Cities" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-[#F0A882] hover:border-white/25`}>
                <Trophy size={13} />
                <span>Top</span>
              </button>
            )}
            {hasCity && (
              <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${copied ? 'bg-[#4ABFB0]/20 border-[#4ABFB0]/50 text-[#4ABFB0]' : 'bg-white/8 border-white/10 text-white/60 hover:text-white/90 hover:border-white/25'}`}>
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            )}
            {hasCity && (
              <button onClick={() => setCollapsed(true)} className="text-white/50 hover:text-white/80 transition-colors p-1">
                <ChevronUp size={16} />
              </button>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="GitHub username…"
            className="flex-1 bg-white/10 text-white placeholder-white/35 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-[#4ABFB0]/60 min-h-[44px] transition-colors"
            autoComplete="off" autoCapitalize="none" spellCheck={false}
          />
          <button type="submit" disabled={loading || !username.trim()}
            className="bg-[#4ABFB0] hover:bg-[#5DD3C6] disabled:bg-white/15 disabled:text-white/35 text-black font-bold rounded-xl px-4 py-2.5 text-sm transition-colors min-h-[44px] min-w-[90px] shrink-0">
            {loading ? '…' : 'Build City'}
          </button>
        </form>
      </div>
    </div>
  );
}
