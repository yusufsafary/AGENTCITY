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

function AgentCityLogoSmall({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="tb-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0A2040" />
          <stop offset="100%" stopColor="#030810" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#tb-bg)" />
      <line x1="6" y1="36" x2="42" y2="36" stroke="#00D4FF" strokeOpacity="0.2" strokeWidth="0.7" />
      <rect x="6" y="28" width="6" height="8" fill="#00D4FF" opacity="0.55" rx="0.5" />
      <rect x="7" y="29.5" width="1.6" height="1.4" fill="#00FF88" opacity="0.9" />
      <rect x="14" y="21" width="7" height="15" fill="#00D4FF" opacity="0.75" rx="0.5" />
      <rect x="15.2" y="22.5" width="1.8" height="1.5" fill="#A855F7" opacity="0.9" />
      <rect x="18" y="22.5" width="1.8" height="1.5" fill="#00D4FF" opacity="0.6" />
      <rect x="22" y="12" width="8" height="24" fill="#00D4FF" opacity="0.90" rx="0.5" />
      <rect x="25.5" y="9.5" width="1.5" height="3" fill="#00D4FF" opacity="0.7" rx="0.5" />
      <circle cx="26.25" cy="9" r="1.2" fill="#00FF88" opacity="1.0" />
      <rect x="23.2" y="14" width="2" height="1.8" fill="#A855F7" opacity="0.9" />
      <rect x="26.2" y="14" width="2" height="1.8" fill="#00D4FF" opacity="0.6" />
      <rect x="23.2" y="17.5" width="2" height="1.8" fill="#00D4FF" opacity="0.7" />
      <rect x="26.2" y="17.5" width="2" height="1.8" fill="#00FF88" opacity="0.9" />
      <rect x="31" y="18" width="7" height="18" fill="#00D4FF" opacity="0.70" rx="0.5" />
      <rect x="32.2" y="19.5" width="1.8" height="1.5" fill="#A855F7" opacity="0.8" />
      <rect x="39" y="26" width="5" height="10" fill="#00D4FF" opacity="0.55" rx="0.5" />
      <circle cx="10" cy="18" r="1.5" fill="#00D4FF" opacity="0.6" />
      <line x1="8" y1="18" x2="12" y2="18" stroke="#00D4FF" strokeOpacity="0.4" strokeWidth="0.8" />
      <line x1="10" y1="16" x2="10" y2="20" stroke="#00D4FF" strokeOpacity="0.4" strokeWidth="0.8" />
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
        await navigator.share({ title: `${shareUser}'s Agent City`, text: `Check out ${shareUser}'s GitHub activity as a 3D AI city!`, url: shareUrl });
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
    setTimeout(() => setCopied(false), 2200);
  };

  const panelBg = nightMode ? 'bg-[#0D0828]/80 border-white/12' : 'bg-[#04080F]/75 border-white/12';
  const btnColor = '#00D4FF';

  if (collapsed && hasCity) {
    return (
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between gap-2 pointer-events-none" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={onHome} title="Back to Home" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border text-white/70 hover:text-white transition-colors`}>
            <Home size={15} />
          </button>
          <button onClick={() => setCollapsed(false)} className={`flex items-center gap-2 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full shadow-lg border`}>
            <AgentCityLogoSmall size={18} />
            <span className="text-white/70 text-xs font-medium">Agent City</span>
            <ChevronDown size={13} className="text-white/50" />
          </button>
        </div>
        <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 ${panelBg} backdrop-blur-md px-3 py-2 rounded-full text-sm font-medium shadow-lg border transition-colors pointer-events-auto ${copied ? 'border-[#00D4FF]/60 text-[#00D4FF]' : 'text-white/70'}`}>
          {copied ? <Check size={15} /> : <Share2 size={15} />}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="p-3 flex items-center gap-2">
        <div className={`flex-1 flex items-center gap-2 ${panelBg} backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border pointer-events-auto`}>
          <AgentCityLogoSmall size={22} />
          <span className="text-white font-semibold text-sm tracking-tight" style={{ letterSpacing: '-0.01em', color: btnColor }}>Agent City</span>
          <div className="flex items-center gap-1.5 ml-1">
            {hasCity && onHome && (
              <button onClick={onHome} title="Back to Home" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-white hover:border-white/25">
                <Home size={13} />
              </button>
            )}
            <button onClick={onShowLeaderboard} title="Top Cities" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/60 hover:text-[#00D4FF] hover:border-white/25">
              <Trophy size={13} /><span className="hidden sm:inline">Top</span>
            </button>
            {hasCity && (
              <button onClick={handleShare} title="Copy shareable link" className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${copied ? 'bg-[#00D4FF]/20 border-[#00D4FF]/50 text-[#00D4FF]' : 'bg-white/8 border-white/10 text-white/60 hover:text-white/90 hover:border-white/25'}`}>
                {copied ? <Check size={13} /> : <Share2 size={13} />}<span className="hidden sm:inline">Share</span>
              </button>
            )}
            {hasCity && (
              <button onClick={() => setCollapsed(true)} className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors border bg-white/8 border-white/10 text-white/40 hover:text-white/70 hover:border-white/25" title="Collapse bar">
                <ChevronUp size={13} />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="GitHub username"
              maxLength={39}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              style={{ fontFamily: 'inherit', fontWeight: 400 }}
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: loading ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.85)', color: loading ? '#00D4FF' : '#000', letterSpacing: '0.02em', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}
            >
              {loading ? '…' : 'Build City'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
