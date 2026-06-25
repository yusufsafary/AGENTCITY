import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { useGitHubCity } from './hooks/useGitHubCity';
import type { BuildingData } from './types/github';
import CityScene, { type ScreenshotRef } from './components/city/CityScene';
import TopBar from './components/ui/TopBar';
import BottomSheet from './components/ui/BottomSheet';
import StatsOverlay from './components/ui/StatsOverlay';
import FloatingControls from './components/ui/FloatingControls';
import LoadingOverlay from './components/ui/LoadingOverlay';
import Leaderboard from './components/ui/Leaderboard';
import NeighborCities from './components/ui/NeighborCities';
import { AboutModal, HowToPlayModal } from './components/ui/InfoModals';
import { PrivacyPage, TermsPage, CookiesPage, LegalFooterLinks } from './components/ui/LegalPages';
import CookieConsent from './components/ui/CookieConsent';
import { useMetaTags } from './hooks/useMetaTags';
import { MARS_PALETTE } from './utils/colors';

const HeroCity3D = lazy(() => import('./components/city/HeroCity3D'));

const RESERVED_PATHS = new Set(['u', 'api', 'share', 'top', '', 'privacy', 'terms', 'cookies']);

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
  const [downloading, setDownloading] = useState(false);
  const screenshotRef = useRef<ScreenshotRef | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(
    getRelativePath() === '/top'
  );
  const [legalPage, setLegalPage] = useState<'privacy' | 'terms' | 'cookies' | null>(() => {
    const rel = getRelativePath().slice(1);
    if (rel === 'privacy' || rel === 'terms' || rel === 'cookies') return rel;
    return null;
  });

  const hasCity = cityData !== null && loading.step === 'done';
  const skyColor = MARS_PALETTE.skyDay;

  // Download city as composited PNG
  const handleDownload = useCallback(async () => {
    if (downloading || !screenshotRef.current) return;
    setDownloading(true);
    try {
      const sceneDataUrl = screenshotRef.current.capture();
      if (!sceneDataUrl) { setDownloading(false); return; }

      const sceneImg = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = sceneDataUrl;
      });

      const W = sceneImg.width, H = sceneImg.height;
      const cvs = document.createElement('canvas');
      cvs.width = W; cvs.height = H;
      const ctx = cvs.getContext('2d')!;

      // Draw 3D scene
      ctx.drawImage(sceneImg, 0, 0);

      // --- Overlay panel (bottom-left) ---
      const PAD = Math.round(W * 0.022);
      const PW  = Math.round(W * 0.30);
      const PH  = Math.round(H * 0.18);
      const PX  = PAD, PY = H - PAD - PH;
      const R   = 14;

      // Panel background
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = '#060D1F';
      ctx.beginPath();
      ctx.roundRect(PX, PY, PW, PH, R);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Top accent line (lime gradient)
      const accent = ctx.createLinearGradient(PX, 0, PX + PW, 0);
      accent.addColorStop(0, '#CAFF00');
      accent.addColorStop(0.5, '#00D4FF');
      accent.addColorStop(1, '#FF0090');
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(PX, PY, PW, 3, [R, R, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Panel border
      ctx.save();
      ctx.strokeStyle = 'rgba(202,255,0,0.30)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(PX, PY, PW, PH, R);
      ctx.stroke();
      ctx.restore();

      // Text: username
      const uname = lastUsername || 'city';
      const fs = Math.round(H * 0.042);
      ctx.save();
      ctx.font = `700 ${fs}px "Space Grotesk", system-ui, sans-serif`;
      ctx.fillStyle = '#CAFF00';
      ctx.shadowColor = '#CAFF00';
      ctx.shadowBlur = 10;
      ctx.fillText(uname, PX + PAD * 0.8, PY + PH * 0.45);
      ctx.restore();

      // Text: stats
      const stats = cityData?.stats;
      const statLine = stats
        ? `${stats.repoCount} repos · ${stats.totalCommits.toLocaleString()} commits · ★ ${stats.totalStars}`
        : '';
      const sfs = Math.round(H * 0.022);
      ctx.save();
      ctx.font = `500 ${sfs}px "Space Grotesk", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.60)';
      ctx.fillText(statLine, PX + PAD * 0.8, PY + PH * 0.70);
      ctx.restore();

      // Text: branding
      const bfs = Math.round(H * 0.018);
      ctx.save();
      ctx.font = `600 ${bfs}px "Space Grotesk", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(0,212,255,0.75)';
      ctx.letterSpacing = '1px';
      ctx.fillText('agentcity.uk', PX + PAD * 0.8, PY + PH * 0.92);
      ctx.restore();

      // Trigger download
      const a = document.createElement('a');
      a.href = cvs.toDataURL('image/png');
      a.download = `agentcity-${uname}.png`;
      a.click();
    } catch (e) {
      console.error('Screenshot failed', e);
    }
    setDownloading(false);
  }, [downloading, lastUsername, cityData]);

  // Share city on X / Twitter with pre-filled tweet
  const handleShare = useCallback(() => {
    const uname = lastUsername || '';
    const stats = cityData?.stats;
    const repoLine = stats ? `📦 ${stats.repoCount} repos · ⚡ ${stats.totalCommits.toLocaleString()} commits · ⭐ ${stats.totalStars} stars\n\n` : '';
    const cityUrl = `https://agentcity.uk/${uname}`;
    const text = `Just built my GitHub city on Agent City 🏙️\n\n${repoLine}See yours at agentcity.uk\n\n#AgentCity #GitHub #OpenSource`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(cityUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=560,height=540');
  }, [lastUsername, cityData]);

  // Update OG / social meta tags when city loads (helps Discord, Slack, iMessage, WhatsApp)
  useMetaTags(
    hasCity && lastUsername
      ? {
          username: lastUsername,
          repos: cityData?.stats.repoCount,
        }
      : null,
  );

  const handleBackFromLegal = () => {
    setLegalPage(null);
    pushPath(lastUsername ? `/${lastUsername}` : '/');
  };

  useEffect(() => {
    const onPopState = () => {
      const rel = getRelativePath().slice(1);
      if (rel === 'privacy' || rel === 'terms' || rel === 'cookies') {
        setLegalPage(rel);
        setShowLeaderboard(false);
      } else if (rel === 'top') {
        setLegalPage(null);
        setShowLeaderboard(true);
      } else {
        setLegalPage(null);
        setShowLeaderboard(false);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (getRelativePath() === '/top') return;
    if (legalPage) return;
    const u = usernameFromPath();
    if (u) { setUsername(u); buildCity(u); }
  }, []);

  useEffect(() => {
    if (lastUsername && hasCity && !showLeaderboard && !legalPage) {
      const target = `/${lastUsername}`;
      if (getRelativePath() !== target) {
        pushPath(target);
      }
    }
  }, [lastUsername, hasCity, showLeaderboard, legalPage]);

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

  if (legalPage === 'privacy') return <PrivacyPage onBack={handleBackFromLegal} />;
  if (legalPage === 'terms') return <TermsPage onBack={handleBackFromLegal} />;
  if (legalPage === 'cookies') return <CookiesPage onBack={handleBackFromLegal} />;

  if (showLeaderboard) {
    return (
      <div className="w-full min-h-screen" style={{ background: skyColor }}>
        <Leaderboard
          nightMode={false}
          onSelect={handleLeaderboardSelect}
          onBack={() => { setShowLeaderboard(false); pushPath(lastUsername ? `/${lastUsername}` : '/'); }}
        />
        <CookieConsent />
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
            screenshotRef={screenshotRef}
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
          onDownload={handleDownload}
          downloading={downloading}
          onShare={handleShare}
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
      <CookieConsent />
    </div>
  );
}

/* ── Matrix Rain canvas ── */
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテト∑⊕◊∇⟨⟩∫≈≠ABCDEF0123456789';

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 11;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = Array.from({ length: cols }, () => Math.random() * -100);
    const PALETTE = ['#CAFF00', '#00D4FF', '#FF0090', '#00FF94', '#FFB700'];

    let frame = 0;
    let animId: number;

    const draw = () => {
      frame++;
      if (frame % 3 !== 0) { animId = requestAnimationFrame(draw); return; }

      ctx.fillStyle = 'rgba(4, 8, 20, 0.10)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      drops.forEach((y, i) => {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const color = PALETTE[i % PALETTE.length];
        // Leading char brighter
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fillText(char, i * fontSize, y * fontSize);
        // Trail chars
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.22;
        ctx.fillText(char, i * fontSize, (y - 1) * fontSize);
        ctx.globalAlpha = 1;

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      });

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.55, mixBlendMode: 'screen' }}
    />
  );
}

/* ── Neural network decorative SVG overlay ── */
function NeuralOverlay() {
  const nodes = [
    { x: 18, y: 22 }, { x: 82, y: 15 }, { x: 50, y: 38 },
    { x: 12, y: 65 }, { x: 88, y: 70 }, { x: 35, y: 80 },
    { x: 72, y: 48 }, { x: 25, y: 45 }, { x: 65, y: 28 },
  ];
  const edges = [
    [0,2],[1,2],[2,6],[2,7],[3,7],[4,6],[5,3],[6,1],[7,0],[8,1],[8,6],
  ];
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ zIndex: 1, opacity: 0.22 }}
    >
      <defs>
        <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <circle cx="2" cy="2" r="1" fill="#00D4FF" opacity="0.6" />
        </marker>
      </defs>
      {edges.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        const len = Math.hypot(nb.x - na.x, nb.y - na.y);
        return (
          <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={i % 3 === 0 ? '#CAFF00' : i % 3 === 1 ? '#00D4FF' : '#FF0090'}
            strokeWidth="0.25" strokeOpacity="0.5"
            strokeDasharray={`${len * 0.3} ${len * 0.7}`}
            style={{
              animation: `gc-neural-pulse ${2.5 + i * 0.4}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        );
      })}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={i === 2 ? 1.2 : 0.7}
          fill={i % 3 === 0 ? '#CAFF00' : i % 3 === 1 ? '#00D4FF' : '#FF0090'}
          style={{ animation: `gc-pulse-glow ${1.5 + i * 0.25}s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </svg>
  );
}

/* ── Horizontal data stream strips ── */
function DataStreams() {
  const streams = [
    { y: '28%', color: '#00D4FF', delay: '0s',   dur: '3.2s', text: '01001010 10110100 00101101' },
    { y: '52%', color: '#CAFF00', delay: '1.1s',  dur: '4.0s', text: 'NEURAL_LINK::ACTIVE > AGENTS:247' },
    { y: '71%', color: '#FF0090', delay: '0.5s',  dur: '3.6s', text: 'COMMIT_HASH:a3f9d2 > BUILDING_CITY...' },
    { y: '85%', color: '#00D4FF', delay: '1.8s',  dur: '2.9s', text: '11001101 01100110 10011001' },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {streams.map((s, i) => (
        <div
          key={i}
          className="absolute text-[8px] font-mono whitespace-nowrap"
          style={{
            top: s.y, left: 0,
            color: s.color,
            opacity: 0.28,
            letterSpacing: '0.12em',
            animation: `gc-data-stream ${s.dur} linear ${s.delay} infinite`,
          }}
        >
          {s.text}
        </div>
      ))}
    </div>
  );
}

/* ── Live agent status ticker ── */
function LiveStatus() {
  const [count, setCount] = useState(247);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3) - 1), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(0,212,255,0.08)',
        border: '1px solid rgba(0,212,255,0.22)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="gc-heartbeat inline-block w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
      <span className="text-[10px] font-mono text-[#00D4FF]" style={{ letterSpacing: '0.08em' }}>
        {count} AGENTS ONLINE
      </span>
    </div>
  );
}

function LandingHero({ onShowLeaderboard }: { onShowLeaderboard: () => void }) {
  const [showAbout, setShowAbout] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const landscape = useIsLandscape();

  return (
    <div className="absolute inset-0 gc-scanlines" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Matrix rain background — full screen canvas */}
      <MatrixRain />

      <Suspense fallback={<div className="absolute inset-0" style={{ background: '#060D1F' }} />}>
        <HeroCity3D />
      </Suspense>

      {/* Neural network decorative overlay */}
      <NeuralOverlay />

      {/* Horizontal data streams */}
      <DataStreams />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 35%)',
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,12,30,0.55) 0%, transparent 100%)',
          ].join(', '),
          zIndex: 3,
        }}
      />

      {landscape ? (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)', zIndex: 10 }}
        >
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto mr-6">
            <AgentCityLogo size={46} />
            <h1
              className="text-[1.55rem] font-bold leading-tight drop-shadow-lg text-center gc-hologram"
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
            <LiveStatus />
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
            zIndex: 10,
          }}
        >
          {/* Logo with orbital rings + beacon pulses */}
          <div className="gc-float gc-fade-up-1 mb-4 pointer-events-auto relative" style={{ width: 100, height: 100 }}>
            {/* Beacon pulse rings */}
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: '50%',
                  width: 20, height: 20,
                  marginLeft: -10, marginTop: -10,
                  border: '1.5px solid #CAFF00',
                  animation: `gc-beacon-ring 2.4s ease-out ${i * 0.8}s infinite`,
                }}
              />
            ))}
            {/* Orbital ring 1 (cyan, slow CW) */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 4,
                border: '1px solid transparent',
                borderTopColor: '#00D4FF',
                borderRightColor: 'rgba(0,212,255,0.3)',
                animation: 'gc-orbit-cw 6s linear infinite',
              }}
            />
            {/* Orbital ring 2 (pink, faster CCW, tilted) */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 10,
                border: '1px solid transparent',
                borderBottomColor: '#FF0090',
                borderLeftColor: 'rgba(255,0,144,0.3)',
                animation: 'gc-orbit-ccw 4s linear infinite',
                transform: 'rotateX(60deg)',
              }}
            />
            {/* Orbital dot on ring 1 */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: 4, left: '50%', marginLeft: -3,
                width: 6, height: 6, borderRadius: '50%',
                background: '#00D4FF',
                boxShadow: '0 0 8px #00D4FF',
                transformOrigin: '3px calc(50% - 4px)',
                animation: 'gc-orbit-cw 6s linear infinite',
              }}
            />
            {/* Logo centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <AgentCityLogo size={72} />
            </div>
          </div>

          {/* Glitch title */}
          <div className="gc-fade-up-2 text-center">
            <div className="relative inline-block">
              <h1
                className="text-[2.2rem] font-bold leading-tight gc-hologram"
                style={{ letterSpacing: '-0.03em', color: '#CAFF00', textShadow: '0 0 30px #CAFF0055, 0 0 60px #CAFF0022, 0 2px 16px rgba(0,0,0,0.7)' }}
              >
                Agent City
              </h1>
              {/* Glitch layers */}
              <h1
                aria-hidden="true"
                className="gc-glitch-1 text-[2.2rem] font-bold leading-tight"
                style={{ letterSpacing: '-0.03em', color: '#00D4FF', position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                Agent City
              </h1>
              <h1
                aria-hidden="true"
                className="gc-glitch-2 text-[2.2rem] font-bold leading-tight"
                style={{ letterSpacing: '-0.03em', color: '#FF0090', position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                Agent City
              </h1>
            </div>
            {/* Animated gradient separator */}
            <div
              className="mx-auto mt-2 h-[2px] w-20 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, #CAFF00, #00D4FF, #FF0090, transparent)',
                backgroundSize: '200% 100%',
                animation: 'gc-border-chase 2s linear infinite',
              }}
            />
          </div>

          {/* Subtitle with typewriter cursor */}
          <p
            className="gc-fade-up-3 mt-3 text-white/75 text-[0.88rem] leading-relaxed font-light text-center"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.7)', maxWidth: '220px' }}
          >
            A futuristic metropolis<br />inhabited by AI agents —<br />built from your GitHub activity
            <span className="gc-cursor ml-0.5 font-bold text-[#00D4FF]">|</span>
          </p>

          {/* Live status */}
          <div className="gc-fade-up-3 mt-3 pointer-events-auto" style={{ animationDelay: '0.5s' }}>
            <LiveStatus />
          </div>

          {/* Expanded agent badges with spawn animation */}
          <div
            className="mt-3 flex flex-wrap items-center justify-center gap-1.5"
            style={{ maxWidth: 280, animation: 'gc-fade-up 0.6s ease-out 0.45s both' }}
          >
            {[
              { label: '🤖 Builder',   color: '#CAFF00', bg: 'rgba(202,255,0,0.10)',   border: 'rgba(202,255,0,0.28)' },
              { label: '🧠 Thinker',   color: '#FF0090', bg: 'rgba(255,0,144,0.12)',  border: 'rgba(255,0,144,0.30)' },
              { label: '⚡ Executor',  color: '#00D4FF', bg: 'rgba(0,212,255,0.10)',  border: 'rgba(0,212,255,0.28)' },
              { label: '🔍 Analyst',   color: '#CAFF00', bg: 'rgba(202,255,0,0.08)',   border: 'rgba(202,255,0,0.22)' },
              { label: '🛡 Guardian',  color: '#FF0090', bg: 'rgba(255,0,144,0.08)',  border: 'rgba(255,0,144,0.22)' },
              { label: '🌐 Networker', color: '#00D4FF', bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.22)' },
            ].map(({ label, color, bg, border }, i) => (
              <span
                key={i}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: bg, border: `1px solid ${border}`, color,
                  letterSpacing: '0.04em',
                  animation: `gc-agent-spawn 0.5s ease-out ${0.6 + i * 0.12}s both`,
                  boxShadow: `0 0 8px ${color}22`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <button
            onClick={onShowLeaderboard}
            className="pointer-events-auto mt-5 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 gc-neon-border"
            style={{
              background: '#CAFF00',
              color: '#000',
              boxShadow: '0 0 24px rgba(202,255,0,0.45), 0 0 48px rgba(202,255,0,0.15)',
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

          {/* Builder Twitter card */}
          <a
            href="https://x.com/jackie_doll96"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-2.5 mt-3 px-3.5 py-2.5 rounded-2xl no-underline group"
            style={{
              background: 'rgba(4,8,15,0.72)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
              maxWidth: 220,
              animation: 'gc-fade-up 0.6s ease-out 0.78s both',
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.22)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.10)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.35)';
            }}
          >
            {/* Avatar */}
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #4ABFB0, #2CA89A)' }}
            >
              J
            </div>
            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-white/40 text-[10px] leading-none mb-0.5">Built by</p>
              <p className="text-white/90 text-xs font-semibold leading-tight truncate">@jackie_doll96</p>
            </div>
            {/* X logo */}
            <div className="shrink-0 text-white/35 group-hover:text-white/70 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
          </a>

          {/* Powered by GitHub + legal footer */}
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
            <LegalFooterLinks />
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
