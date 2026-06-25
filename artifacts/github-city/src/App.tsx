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

// Base path from Vite — "/AGENTCITY" in production, "" in dev
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function getRelativePath(): string {
  const rel = window.location.pathname.slice(BASE.length);
  return rel || '/';
}

function pushPath(path: string) {
  // path should start with '/', e.g. '/torvalds', '/top', '/'
  window.history.pushState({}, '', BASE + path);
}

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
  const rel = getRelativePath();
  const seg = rel.slice(1).split('/')[0];
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
    getRelativePath() === '/top'
  );

  const hasCity = cityData !== null && loading.step === 'done';
  const skyColor = MARS_PALETTE.skyDay;

  useEffect(() => {
    if (getRelativePath() === '/top') return;
    const u = usernameFromPath();
    if (u) { setUsername(u); buildCity(u); }
  }, []);

  useEffect(() => {
    if (lastUsername && hasCity && !showLeaderboard) {
      const target = `/${lastUsername}`;
      if (getRelativePath() !== target) {
        pushPath(target);
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
    pushPath(`/${u}`);
  };

  const handleToggleLeaderboard = () => {
    const next = !showLeaderboard;
    setShowLeaderboard(next);
    pushPath(next ? '/top' : (lastUsername ? `/${lastUsername}` : '/'));
  };

  const handleVisitNeighbor = (neighborUsername: string) => {
    setShowNeighbors(false);
    setUsername(neighborUsername);
    buildCity(neighborUsername);
    pushPath(`/${neighborUsername}`);
  };

  if (showLeaderboard) {
    return (
      <div className="w-full min-h-screen" style={{ background: skyColor }}>
        <Leaderboard
          nightMode={false}
          onSelect={handleLeaderboardSelect}
          onBack={() => { setShowLeaderboard(false); pushPath(lastUsername ? `/${lastUsername}` : '/'); }}
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
              style={{ letterSpacing: '-0.025em', textShadow: '0 0 20px #CAFF0066, 0 2px 12px rgba(0,0,0,0.8)', color: '#CAFF00' }}
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
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ background: '#CAFF00', color: '#000', boxShadow: '0 0 16px rgba(202,255,0,0.35)' }}
            >
              <span className="text-base leading-none">🏆</span>
              <span>Top Cities</span>
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
              style={{ letterSpacing: '-0.03em', color: '#CAFF00', textShadow: '0 0 30px #CAFF0055, 0 2px 16px rgba(0,0,0,0.7)' }}
            >
              Agent City
            </h1>
            <div className="mx-auto mt-2 h-[2px] w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #CAFF00, #FF0090)', opacity: 0.9 }} />
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
                  background: i === 1 ? 'rgba(255,0,144,0.12)' : 'rgba(202,255,0,0.10)',
                  border: `1px solid ${i === 1 ? 'rgba(255,0,144,0.30)' : 'rgba(202,255,0,0.28)'}`,
                  color: i === 1 ? '#FF0090' : '#CAFF00',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={onShowLeaderboard}
            className="pointer-events-auto mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background: '#CAFF00',
              color: '#000',
              boxShadow: '0 0 24px rgba(202,255,0,0.40)',
              animation: 'gc-fade-up 0.6s ease-out 0.55s both',
            }}
          >
            <span className="text-base leading-none">🏆</span>
            <span>View Top Cities</span>
          </button>

          <div
            className="pointer-events-auto flex items-center gap-2 mt-3"
            style={{ animation: 'gc-fade-up 0.6s ease-out 0.70s both' }}
          >
            <button
              onClick={() => setShowHowTo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/85 transition-colors"
              style={{ background: 'rgba(202,255,0,0.08)', border: '1px solid rgba(202,255,0,0.18)' }}
            >
              <span className="text-[11px] leading-none">❓</span>
              How to use
            </button>
            <span className="text-white/20 text-xs select-none">·</span>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/50 hover:text-white/85 transition-colors"
              style={{ background: 'rgba(255,0,144,0.08)', border: '1px solid rgba(255,0,144,0.18)' }}
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
        <linearGradient id="ac-grad" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CAFF00" />
          <stop offset="100%" stopColor="#FF0090" />
        </linearGradient>
        <linearGradient id="ac-grad2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF0090" />
          <stop offset="100%" stopColor="#CAFF00" />
        </linearGradient>
      </defs>
      {/* Bold skyline silhouette — single graphic path */}
      <path
        d="M2,42 L2,32 L7,32 L7,26 L11,26 L11,32 L16,32 L16,14 L19,14 L19,9 L24,9 L24,14 L29,14 L29,22 L33,22 L33,26 L37,26 L37,30 L41,30 L41,22 L46,22 L46,42 Z"
        fill="url(#ac-grad)"
      />
      {/* Antenna */}
      <rect x="22.5" y="5" width="3" height="5" fill="#FF0090" rx="1" />
      {/* Beacon dot */}
      <circle cx="24" cy="4" r="3" fill="#CAFF00" />
      <circle cx="24" cy="4" r="1.5" fill="#FF0090" />
      {/* Window highlights — lime on left buildings */}
      <rect x="17.5" y="17" width="2" height="1.8" fill="rgba(0,0,0,0.5)" rx="0.3" />
      <rect x="20.5" y="17" width="2" height="1.8" fill="rgba(0,0,0,0.5)" rx="0.3" />
      <rect x="17.5" y="21" width="2" height="1.8" fill="rgba(0,0,0,0.4)" rx="0.3" />
      <rect x="20.5" y="21" width="2" height="1.8" fill="rgba(255,0,144,0.7)" rx="0.3" />
      <rect x="17.5" y="25" width="2" height="1.8" fill="rgba(255,0,144,0.5)" rx="0.3" />
      <rect x="20.5" y="25" width="2" height="1.8" fill="rgba(0,0,0,0.4)" rx="0.3" />
      {/* Right tower windows */}
      <rect x="30" y="25" width="2" height="1.8" fill="rgba(0,0,0,0.4)" rx="0.3" />
      <rect x="33.5" y="25" width="2" height="1.8" fill="rgba(255,0,144,0.6)" rx="0.3" />
    </svg>
  );
}
