import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';
import Leaderboard from './components/ui/Leaderboard';
import NeighborCities from './components/ui/NeighborCities';
import { AboutModal, HowToPlayModal } from './components/ui/InfoModals';
import { MARS_PALETTE } from './utils/colors';

const HeroCity3D = lazy(() => import('./components/city/HeroCity3D'));

const RESERVED_PATHS = new Set(['u', 'api', 'share', 'top', '']);

function useIsLandscape() {
  const check = useCallback(
    () => window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches,
    [],
  );
  const [land, setLand] = useState(check);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 520px)');
    const handler = () => setLand(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [check]);
  return land;
}

function usernameFromPath(): string {
  const seg = window.location.pathname.slice(1).split('/')[0];
  if (!seg || RESERVED_PATHS.has(seg)) return '';
  return seg;
}

export default function App() {
  const {
    cityData, loading, buildCity,
    showForks, toggleForks,
    username, setUsername, lastUsername,
    resetCity,
  } = useGitHubCity();

  const [showSkyline, setShowSkyline] = useState(true);
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(
    window.location.pathname === '/top'
  );

  const hasCity = cityData !== null && loading.step === 'done';
  const skyColor = MARS_PALETTE.skyDay;

  useEffect(() => {
    if (window.location.pathname === '/top') return;
    const u = usernameFromPath();
    if (u) { setUsername(u); buildCity(u); }
  }, []);

  useEffect(() => {
    if (lastUsername && hasCity && !showLeaderboard) {
      const target = `/${lastUsername}`;
      if (window.location.pathname !== target) {
        window.history.pushState({}, '', target);
      }
    }
  }, [lastUsername, hasCity, showLeaderboard]);

  useEffect(() => {
    setShowNeighbors(false);
  }, [lastUsername]);

  const handleLeaderboardSelect = (u: string) => {
    setShowLeaderboard(false);
    setUsername(u);
    buildCity(u);
    window.history.pushState({}, '', `/${u}`);
  };

  const handleToggleLeaderboard = () => {
    const next = !showLeaderboard;
    setShowLeaderboard(next);
    window.history.pushState({}, '', next ? '/top' : (lastUsername ? `/${lastUsername}` : '/'));
  };

  const handleVisitNeighbor = (neighborUsername: string) => {
    setShowNeighbors(false);
    setUsername(neighborUsername);
    buildCity(neighborUsername);
    window.history.pushState({}, '', `/${neighborUsername}`);
  };

  if (showLeaderboard) {
    return (
      <div className="w-full min-h-screen" style={{ background: skyColor }}>
        <Leaderboard
          nightMode={false}
          onSelect={handleLeaderboardSelect}
          onBack={() => { setShowLeaderboard(false); window.history.pushState({}, '', lastUsername ? `/${lastUsername}` : '/'); }}
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden relative" style={{ background: skyColor, height: '100dvh' }}>
      {!hasCity && loading.step === 'idle' && (
        <LandingHero onShowLeaderboard={handleToggleLeaderboard} />
      )}

      {hasCity && cityData && (
        <div className="absolute inset-0">
          <CityScene
            cityData={cityData}
            nightMode={false}
            showSkyline={showSkyline}
            onSelectBuilding={(b) => setSelectedBuilding(b)}
          />
        </div>
      )}

      <TopBar
        onBuild={buildCity}
        loading={loading.step !== 'idle' && loading.step !== 'done' && loading.step !== 'error'}
        hasCity={hasCity}
        username={username}
        setUsername={setUsername}
        nightMode={false}
        lastUsername={lastUsername}
        onShowLeaderboard={handleToggleLeaderboard}
        onHome={resetCity}
      />

      {hasCity && cityData && (
        <StatsOverlay stats={cityData.stats} username={lastUsername} nightMode={false} />
      )}

      {hasCity && (
        <FloatingControls
          showForks={showForks}
          onToggleForks={toggleForks}
          showSkyline={showSkyline}
          onToggleSkyline={() => setShowSkyline(v => !v)}
          showNeighbors={showNeighbors}
          onToggleNeighbors={() => setShowNeighbors(v => !v)}
        />
      )}

      {hasCity && showNeighbors && lastUsername && (
        <NeighborCities
          username={lastUsername}
          onVisit={handleVisitNeighbor}
          onClose={() => setShowNeighbors(false)}
        />
      )}

      <BottomSheet building={selectedBuilding} onClose={() => setSelectedBuilding(null)} nightMode={false} />
      <LoadingOverlay state={loading} nightMode={false} />
    </div>
  );
}

function LandingHero({ onShowLeaderboard }: { onShowLeaderboard: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const landscape = useIsLandscape();

  return (
    <div className="absolute inset-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Suspense fallback={<div className="absolute inset-0" style={{ background: '#060D1F' }} />}>
        <HeroCity3D />
      </Suspense>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 35%)',
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,12,30,0.55) 0%, transparent 100%)',
          ].join(', '),
        }}
      />

      {landscape ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
        >
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto mr-6">
            <AgentCityLogo size={46} />
            <h1
              className="text-[1.55rem] font-bold leading-tight drop-shadow-lg text-center"
              style={{ letterSpacing: '-0.025em', textShadow: '0 0 20px #00D4FF88, 0 2px 12px rgba(0,0,0,0.8)', color: '#00D4FF' }}
            >
              Agent City
            </h1>
            <p
              className="text-white/70 text-[0.72rem] leading-snug font-light text-center"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)', maxWidth: '140px' }}
            >
              A metropolis inhabited by AI agents — built from your GitHub activity
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 pointer-events-auto">
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm"
              style={{ border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,20,40,0.5)', boxShadow: '0 0 12px rgba(0,212,255,0.15)' }}
            >
              <span className="text-base leading-none">🏆</span>
              <span className="font-medium">Top Cities</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHowTo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                <span className="text-[11px] leading-none">❓</span>
                How to use
              </button>
              <span className="text-white/20 text-xs select-none">·</span>
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/55 hover:text-white/90 transition-colors"
                style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,212,255,0.15)' }}
              >
                <span className="text-[11px] leading-none">ℹ️</span>
                About
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            paddingTop: 'max(80px, calc(56px + env(safe-area-inset-top)))',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="gc-float gc-fade-up-1 mb-4 pointer-events-auto">
            <AgentCityLogo size={72} />
          </div>

          <div className="gc-fade-up-2 text-center">
            <h1
              className="text-[2.2rem] font-bold leading-tight drop-shadow-lg"
              style={{ letterSpacing: '-0.03em', color: '#00D4FF', textShadow: '0 0 30px #00D4FF66, 0 2px 16px rgba(0,0,0,0.6)' }}
            >
              Agent City
            </h1>
            <div className="mx-auto mt-2 h-[2px] w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #A855F7, #00D4FF, #00FF88)', opacity: 0.9 }} />
          </div>

          <p
            className="gc-fade-up-3 mt-3 text-white/75 text-[0.88rem] leading-relaxed font-light text-center"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)', maxWidth: '220px' }}
          >
            A futuristic metropolis<br />inhabited by AI agents —<br />built from your GitHub activity
          </p>

          {/* Animated agent badges */}
          <div
            className="gc-fade-up-4 mt-4 flex items-center gap-2"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.45s both' }}
          >
            {['🤖 Builder', '🧠 Thinker', '⚡ Executor'].map((label, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(0,212,255,0.10)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: '#00D4FF',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={onShowLeaderboard}
            className="pointer-events-auto mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm"
            style={{
              border: '1px solid rgba(0,212,255,0.35)',
              background: 'rgba(0,20,40,0.55)',
              boxShadow: '0 0 18px rgba(0,212,255,0.18)',
              animation: 'gc-fade-up 0.6s ease-out 0.55s both',
            }}
          >
            <span className="text-base leading-none">🏆</span>
            <span className="font-medium">View Top Cities</span>
          </button>

          <div
            className="pointer-events-auto flex items-center gap-2 mt-3"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.70s both' }}
          >
            <button
              onClick={() => setShowHowTo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/85 transition-colors"
              style={{ background: 'rgba(0,20,40,0.35)', border: '1px solid rgba(0,212,255,0.12)' }}
            >
              <span className="text-[11px] leading-none">❓</span>
              How to use
            </button>
            <span className="text-white/20 text-xs select-none">·</span>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/85 transition-colors"
              style={{ background: 'rgba(0,20,40,0.35)', border: '1px solid rgba(0,212,255,0.12)' }}
            >
              <span className="text-[11px] leading-none">ℹ️</span>
              About
            </button>
          </div>

          {/* Powered by GitHub */}
          <div
            className="pointer-events-auto flex flex-col items-center gap-1.5 mt-4"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.85s both' }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,20,40,0.40)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-[11px] font-medium text-white/55" style={{ letterSpacing: '0.06em' }}>
                POWERED BY GITHUB
              </span>
            </div>
          </div>
        </div>
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
    </div>
  );
}

export function GitCityLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return <AgentCityLogo size={size} className={className} />;
}

export function AgentCityLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="ac-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0A2040" />
          <stop offset="100%" stopColor="#030810" />
        </radialGradient>
        <radialGradient id="ac-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </radialGradient>
        <filter id="ac-blur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      {/* Background */}
      <circle cx="24" cy="24" r="24" fill="url(#ac-bg)" />
      <circle cx="24" cy="24" r="24" fill="url(#ac-glow)" />
      {/* Grid lines */}
      <line x1="6" y1="36" x2="42" y2="36" stroke="#00D4FF" strokeOpacity="0.18" strokeWidth="0.7" />
      <line x1="24" y1="8" x2="24" y2="36" stroke="#00D4FF" strokeOpacity="0.10" strokeWidth="0.5" />
      {/* Buildings */}
      <rect x="6" y="28" width="6" height="8" fill="#00D4FF" opacity="0.55" rx="0.5" />
      <rect x="7" y="29.5" width="1.6" height="1.4" fill="#00FF88" opacity="0.9" />
      <rect x="7" y="32" width="1.6" height="1.4" fill="#00D4FF" opacity="0.6" />
      <rect x="14" y="21" width="7" height="15" fill="#00D4FF" opacity="0.75" rx="0.5" />
      <rect x="15.2" y="22.5" width="1.8" height="1.5" fill="#A855F7" opacity="0.9" />
      <rect x="18" y="22.5" width="1.8" height="1.5" fill="#00D4FF" opacity="0.6" />
      <rect x="15.2" y="25.5" width="1.8" height="1.5" fill="#00D4FF" opacity="0.8" />
      <rect x="18" y="25.5" width="1.8" height="1.5" fill="#A855F7" opacity="0.5" />
      <rect x="15.2" y="28.5" width="1.8" height="1.5" fill="#00FF88" opacity="0.7" />
      {/* Tallest building */}
      <rect x="22" y="12" width="8" height="24" fill="#00D4FF" opacity="0.90" rx="0.5" />
      {/* Antenna */}
      <rect x="25.5" y="9.5" width="1.5" height="3" fill="#00D4FF" opacity="0.7" rx="0.5" />
      <circle cx="26.25" cy="9" r="1.2" fill="#00FF88" opacity="1.0" />
      {/* Neural rings on tall building */}
      <rect x="23.2" y="14" width="2" height="1.8" fill="#A855F7" opacity="0.9" />
      <rect x="26.2" y="14" width="2" height="1.8" fill="#00D4FF" opacity="0.6" />
      <rect x="23.2" y="17.5" width="2" height="1.8" fill="#00D4FF" opacity="0.7" />
      <rect x="26.2" y="17.5" width="2" height="1.8" fill="#00FF88" opacity="0.9" />
      <rect x="23.2" y="21" width="2" height="1.8" fill="#A855F7" opacity="0.5" />
      <rect x="26.2" y="21" width="2" height="1.8" fill="#00D4FF" opacity="0.8" />
      <rect x="23.2" y="24.5" width="2" height="1.8" fill="#00FF88" opacity="0.6" />
      <rect x="26.2" y="24.5" width="2" height="1.8" fill="#A855F7" opacity="0.7" />
      {/* Right building */}
      <rect x="31" y="18" width="7" height="18" fill="#00D4FF" opacity="0.70" rx="0.5" />
      <rect x="32.2" y="19.5" width="1.8" height="1.5" fill="#A855F7" opacity="0.8" />
      <rect x="35.2" y="19.5" width="1.8" height="1.5" fill="#00D4FF" opacity="0.5" />
      <rect x="32.2" y="22.5" width="1.8" height="1.5" fill="#00D4FF" opacity="0.9" />
      <rect x="35.2" y="22.5" width="1.8" height="1.5" fill="#00FF88" opacity="0.6" />
      {/* Small right building */}
      <rect x="39" y="26" width="5" height="10" fill="#00D4FF" opacity="0.55" rx="0.5" />
      <rect x="40" y="27.5" width="1.6" height="1.5" fill="#A855F7" opacity="0.7" />
      {/* Drone */}
      <circle cx="10" cy="18" r="1.5" fill="#00D4FF" opacity="0.6" />
      <line x1="8" y1="18" x2="12" y2="18" stroke="#00D4FF" strokeOpacity="0.4" strokeWidth="0.8" />
      <line x1="10" y1="16" x2="10" y2="20" stroke="#00D4FF" strokeOpacity="0.4" strokeWidth="0.8" />
      {/* Data stream dots */}
      <circle cx="38" cy="14" r="0.9" fill="#00FF88" opacity="0.8" />
      <circle cx="40" cy="12" r="0.6" fill="#A855F7" opacity="0.7" />
      <circle cx="42" cy="10" r="0.5" fill="#00D4FF" opacity="0.6" />
    </svg>
  );
}
