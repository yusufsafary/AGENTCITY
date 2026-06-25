import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingData } from '../../types/github';
import { hashString, NIGHT_PALETTE, MARS_PALETTE } from '../../utils/colors';

/* ═══════════════════════════════════════════════
   Spring easing — elastic overshoot + settle
═══════════════════════════════════════════════ */
function springEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-7.0 * t) * Math.cos(t * Math.PI * 2.1);
}

/* ═══════════════════════════════════════════════
   Language color palette
═══════════════════════════════════════════════ */
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
  Rust: '#ce422b', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#a0a0a0', Ruby: '#cc342d', PHP: '#4f5d95', Swift: '#fa7343',
  Kotlin: '#a97bff', Dart: '#00b4ab', 'C#': '#239120', Scala: '#dc322f',
  Vue: '#41b883', SCSS: '#c6538c', Shell: '#89e051', HTML: '#e34c26',
  CSS: '#563d7c', R: '#276dc3', Elixir: '#6e4a7e', Haskell: '#5e5086',
};
function getLangColor(lang: string | null | undefined): string {
  return lang ? (LANG_COLORS[lang] ?? '#4ABFB0') : '#4ABFB0';
}

/* ═══════════════════════════════════════════════
   Material types
═══════════════════════════════════════════════ */
const MAT_TYPES = ['glass', 'concrete', 'classic', 'warm', 'dark'] as const;
type MatType = typeof MAT_TYPES[number];
const MAT_PROPS: Record<MatType, { metal: number; rough: number }> = {
  glass:    { metal: 0.58, rough: 0.04 },
  concrete: { metal: 0.02, rough: 0.92 },
  classic:  { metal: 0.06, rough: 0.74 },
  warm:     { metal: 0.00, rough: 0.80 },
  dark:     { metal: 0.48, rough: 0.12 },
};

/* ═══════════════════════════════════════════════
   Canvas window texture — seeded + detailed
═══════════════════════════════════════════════ */
function createWindowTexture(
  color: string, night: boolean, matType: MatType, seed: number,
): THREE.CanvasTexture {
  const SZ = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SZ; canvas.height = SZ;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SZ, SZ);

  if (matType === 'glass' || matType === 'dark') {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < SZ; x += SZ / 6) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SZ); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let y = 0; y < SZ; y += SZ / 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
    }
  }
  if (matType === 'concrete' || matType === 'classic' || matType === 'warm') {
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < SZ; y += SZ / 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SZ, y); ctx.stroke();
    }
  }

  let rng = seed;
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    return (rng >>> 0) / 0xffffffff;
  };

  const rows = 14, cols = 5;
  const padX = SZ * 0.055, padY = SZ * 0.04;
  const cellW = (SZ - padX * 2) / cols;
  const cellH = (SZ - padY * 2) / rows;
  const wW = cellW * 0.54, wH = cellH * 0.60;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rand() > (night ? 0.22 : 0.42);
      const cx = padX + c * cellW + (cellW - wW) / 2;
      const cy = padY + r * cellH + (cellH - wH) / 2;

      if (night) {
        const warm = rand() > 0.38;
        const base = lit ? (0.80 + rand() * 0.18) : (0.04 + rand() * 0.04);
        ctx.fillStyle = warm
          ? `rgba(255,210,105,${base})`
          : `rgba(48,200,188,${base})`;
      } else {
        const base = lit ? (0.45 + rand() * 0.22) : (0.06 + rand() * 0.04);
        ctx.fillStyle = matType === 'glass'
          ? `rgba(170,230,255,${base})`
          : `rgba(255,218,155,${base})`;
      }
      ctx.fillRect(cx, cy, wW, wH);

      if (lit) {
        ctx.strokeStyle = night ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, wW, wH);
        if (rand() > 0.55) {
          ctx.beginPath();
          ctx.moveTo(cx + wW / 2, cy); ctx.lineTo(cx + wW / 2, cy + wH);
          ctx.strokeStyle = 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
  }

  if (matType === 'glass') {
    const grad = ctx.createLinearGradient(0, SZ - 28, 0, SZ);
    grad.addColorStop(0, 'rgba(160,225,255,0.28)');
    grad.addColorStop(1, 'rgba(80,180,255,0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, SZ - 28, SZ, 28);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

/* ═══════════════════════════════════════════════
   Glowing crown ring — landmark buildings
═══════════════════════════════════════════════ */
function GlowCrown({ yTop, color, nightMode }: {
  yTop: number; color: string; nightMode: boolean;
}) {
  const outerRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.82 + Math.sin(t * 1.9) * 0.18;
    if (outerRef.current) outerRef.current.emissiveIntensity = pulse * (nightMode ? 4.0 : 2.2);
    if (innerRef.current) innerRef.current.emissiveIntensity = pulse * (nightMode ? 2.8 : 1.5);
    if (lightRef.current) lightRef.current.intensity = pulse * (nightMode ? 1.4 : 0.5);
  });

  return (
    <group position={[0, yTop + 0.14, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.058, 10, 36]} />
        <meshStandardMaterial ref={outerRef}
          color={color} emissive={color} emissiveIntensity={nightMode ? 4.0 : 2.2}
          transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.36, 0.030, 8, 28]} />
        <meshStandardMaterial ref={innerRef}
          color={color} emissive={color} emissiveIntensity={nightMode ? 2.8 : 1.5} />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={nightMode ? 1.4 : 0.5} distance={14} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Neon accent band — pulsing emissive strip
═══════════════════════════════════════════════ */
function NeonBand({ bw, bd, y, color }: { bw: number; bd: number; y: number; color: string }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime();
      matRef.current.emissiveIntensity = 1.5 + Math.sin(t * 1.3) * 0.5;
    }
  });
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[bw + 0.045, 0.13, bd + 0.045]} />
      <meshStandardMaterial ref={matRef}
        color={color} emissive={color} emissiveIntensity={1.5} roughness={0.08} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   Glass lobby — transparent reflective base
═══════════════════════════════════════════════ */
function GlassLobby({ bw, bd, lobbyH }: { bw: number; bd: number; lobbyH: number }) {
  return (
    <group>
      <mesh position={[0, lobbyH / 2, 0]}>
        <boxGeometry args={[bw + 0.025, lobbyH, bd + 0.025]} />
        <meshStandardMaterial
          color="#b8e4f8" transparent opacity={0.28}
          metalness={0.95} roughness={0.03} depthWrite={false} />
      </mesh>
      <mesh position={[0, lobbyH * 0.98, 0]}>
        <boxGeometry args={[bw + 0.055, 0.05, bd + 0.055]} />
        <meshStandardMaterial color="#d8f0ff" metalness={0.8} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Helipad — rooftop landing pad for tall landmarks
═══════════════════════════════════════════════ */
function Helipad({ bw, bd, yTop }: { bw: number; bd: number; yTop: number }) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      glowRef.current.emissiveIntensity = 0.65 + Math.sin(t * 2.4) * 0.30;
    }
  });
  const pad = Math.min(bw, bd) * 0.72;
  return (
    <group position={[0, yTop + 0.040, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[pad * 0.54, 32]} />
        <meshStandardMaterial color="#111820" roughness={0.72} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[pad * 0.46, pad * 0.54, 36]} />
        <meshStandardMaterial ref={glowRef}
          color="#ffe844" emissive="#ffe844" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, pad * 0.08, 16]} />
        <meshStandardMaterial color="#ffe844" emissive="#ffe844" emissiveIntensity={1.2} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * pad * 0.51, 0.022, Math.sin(a) * pad * 0.51]}>
            <sphereGeometry args={[0.042, 6, 6]} />
            <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={2.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Tapered tower crown — pyramid spire on glass type
═══════════════════════════════════════════════ */
function TaperedSpire({ bw, bd, baseY, spireH, color, nightMode }: {
  bw: number; bd: number; baseY: number; spireH: number; color: string; nightMode: boolean;
}) {
  const tipRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (tipRef.current) {
      const t = clock.getElapsedTime();
      tipRef.current.emissiveIntensity = (nightMode ? 2.4 : 0.8) + Math.sin(t * 2.0) * 0.3;
    }
  });
  const base = Math.min(bw, bd) * 0.55;
  return (
    <group position={[0, baseY, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.01, base, spireH, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color} emissiveIntensity={nightMode ? 1.8 : 0.15}
          metalness={0.7} roughness={0.08} />
      </mesh>
      <mesh position={[0, spireH * 0.5 + 0.10, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial ref={tipRef}
          color={color} emissive={color} emissiveIntensity={nightMode ? 2.4 : 0.8} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Stepped art-deco setbacks
═══════════════════════════════════════════════ */
function SteppedCrown({ bw, bd, yBase, fullH, matStyle }: {
  bw: number; bd: number; yBase: number; fullH: number;
  matStyle: React.ComponentProps<typeof THREE.MeshStandardMaterial>['args'] & object;
}) {
  const steps = 3;
  const stepH = (fullH - yBase) / steps;
  return (
    <>
      {Array.from({ length: steps }, (_, i) => {
        const shrink = 0.78 ** (i + 1);
        const sw = bw * shrink, sd = bd * shrink;
        const y = yBase + stepH * i;
        return (
          <group key={i}>
            <mesh position={[0, y + stepH / 2, 0]} castShadow>
              <boxGeometry args={[sw, stepH, sd]} />
              <meshStandardMaterial {...(matStyle as object)} />
            </mesh>
            <mesh position={[0, y + stepH + 0.03, 0]}>
              <boxGeometry args={[sw + 0.06, 0.06, sd + 0.06]} />
              <meshStandardMaterial color="#c0c0be" roughness={0.5} metalness={0.15} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Language accent strip — thin vertical glow
═══════════════════════════════════════════════ */
function LanguageStrip({ bw, h, color, nightMode }: {
  bw: number; h: number; color: string; nightMode: boolean;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime();
      matRef.current.emissiveIntensity = (nightMode ? 2.2 : 0.7) + Math.sin(t * 0.9) * 0.3;
    }
  });
  return (
    <mesh position={[bw / 2 + 0.012, h / 2, 0]}>
      <boxGeometry args={[0.024, h * 0.92, 0.06]} />
      <meshStandardMaterial ref={matRef}
        color={color} emissive={color}
        emissiveIntensity={nightMode ? 2.2 : 0.7} roughness={0.1} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   Cornice — decorative cap
═══════════════════════════════════════════════ */
function Cornice({ w, d, yTop }: { w: number; d: number; yTop: number }) {
  return (
    <group position={[0, yTop, 0]}>
      <mesh position={[0, 0.062, 0]}>
        <boxGeometry args={[w + 0.075, 0.125, d + 0.075]} />
        <meshStandardMaterial color="#c8c8c6" roughness={0.58} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[w + 0.04, 0.04, d + 0.04]} />
        <meshStandardMaterial color="#b0b0ae" roughness={0.65} metalness={0.08} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Antenna
═══════════════════════════════════════════════ */
function Antenna({ yTop, nightMode, color }: { yTop: number; nightMode: boolean; color: string }) {
  const tipRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (tipRef.current) {
      const t = clock.getElapsedTime();
      tipRef.current.emissiveIntensity = nightMode
        ? 2.8 + Math.sin(t * 3.0) * 0.8
        : 0.55;
    }
  });
  return (
    <group position={[0, yTop + 0.05, 0]}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.052, 1.35, 7]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.078, 10, 10]} />
        <meshStandardMaterial ref={tipRef}
          color={color} emissive={color} emissiveIntensity={nightMode ? 2.8 : 0.55} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Water tower
═══════════════════════════════════════════════ */
function WaterTower({ ox, oy, oz }: { ox: number; oy: number; oz: number }) {
  return (
    <group position={[ox, oy, oz]}>
      <mesh position={[0, 0.30, 0]}>
        <cylinderGeometry args={[0.155, 0.185, 0.54, 10]} />
        <meshStandardMaterial color="#8a7a62" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <coneGeometry args={[0.205, 0.26, 10]} />
        <meshStandardMaterial color="#6a5c48" roughness={0.90} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.115, 0.04, Math.sin(a) * 0.115]} rotation={[0, 0, 0.22]}>
            <cylinderGeometry args={[0.014, 0.014, 0.54, 4]} />
            <meshStandardMaterial color="#5a4c3a" roughness={0.92} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   AC units (rooftop)
═══════════════════════════════════════════════ */
function AcUnits({ bw, bh, bd }: { bw: number; bh: number; bd: number }) {
  const positions: [number, number, number][] = [
    [-bw * 0.20, bh + 0.055, bd * 0.18],
    [ bw * 0.15, bh + 0.055, -bd * 0.15],
  ];
  return (
    <>
      {positions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.19, 0.11, 0.15]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.70} metalness={0.22} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Click indicator ring + dot
═══════════════════════════════════════════════ */
function ClickIndicator({ yTop, hovered, animProgress, nightMode }: {
  yTop: number; hovered: boolean; animProgress: number; nightMode: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = Date.now() / 1000;
    const pulse = 1 + Math.sin(t * 2.8) * 0.18;
    const bob = Math.sin(t * 1.6) * 0.08;
    if (ringRef.current) {
      const s = hovered ? 1.55 : pulse;
      ringRef.current.scale.setScalar(s);
      ringRef.current.position.y = yTop + 0.58 + bob;
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered ? 3.2 : 1.3;
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity = hovered ? 1 : 0.80;
    }
    if (dotRef.current) {
      dotRef.current.position.y = yTop + 0.58 + bob;
      (dotRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered ? 3.5 : 1.6;
    }
  });

  if (animProgress < 0.80) return null;
  const color = '#CAFF00';
  return (
    <group>
      <mesh ref={ringRef} position={[0, yTop + 0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.042, 8, 32]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={1.3}
          transparent opacity={0.80} depthWrite={false} />
      </mesh>
      <mesh ref={dotRef} position={[0, yTop + 0.58, 0]}>
        <sphereGeometry args={[0.060, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Hover tooltip
═══════════════════════════════════════════════ */
function RepoTooltip({ h, data }: { h: number; data: BuildingData }) {
  const langColor = getLangColor(data.repo.language);
  return (
    <Html position={[0, h + 1.3, 0]} center distanceFactor={14} zIndexRange={[100, 0]}>
      <div style={{
        background: 'rgba(12,5,2,0.95)',
        border: '1px solid rgba(202,255,0,0.55)',
        borderRadius: 9,
        padding: '5px 12px',
        color: 'white',
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.60)',
        letterSpacing: '-0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {data.repo.language && (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: langColor, flexShrink: 0,
            boxShadow: `0 0 4px ${langColor}`,
          }} />
        )}
        {data.repo.name}
        {data.repo.stargazers_count > 0 && (
          <span style={{ color: '#ffcc44', fontSize: 10, fontWeight: 500 }}>
            ★ {data.repo.stargazers_count}
          </span>
        )}
      </div>
    </Html>
  );
}

/* ═══════════════════════════════════════════════
   Main Building component
═══════════════════════════════════════════════ */
interface BuildingProps {
  data: BuildingData;
  nightMode: boolean;
  onSelect: (data: BuildingData) => void;
  animProgress: number;
}

export default function Building({ data, nightMode, onSelect, animProgress }: BuildingProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const hoverYRef  = useRef(0);
  const emitRef    = useRef<THREE.MeshStandardMaterial[]>([]);
  const [hovered, setHovered]   = useState(false);
  const [winSeed, setWinSeed]   = useState(0);

  const hash    = useMemo(() => hashString(data.repo.name), [data.repo.name]);
  const matType = MAT_TYPES[hash % MAT_TYPES.length] as MatType;
  const mp      = MAT_PROPS[matType];
  const langColor = useMemo(() => getLangColor(data.repo.language), [data.repo.language]);

  const texture = useMemo(
    () => createWindowTexture(data.color, nightMode, matType, hash + winSeed),
    [data.color, nightMode, matType, hash, winSeed],
  );

  useEffect(() => {
    const jitter = 1800 + (hash % 1200);
    const id = setInterval(() => setWinSeed(s => s + 1), jitter);
    return () => clearInterval(id);
  }, [hash]);

  const emissiveColor = useMemo(() => {
    if (!nightMode) return new THREE.Color(0x000000);
    const palette = [NIGHT_PALETTE.neonPink, NIGHT_PALETTE.turquoise, '#4060ff'];
    return new THREE.Color(palette[hash % palette.length]);
  }, [nightMode, hash]);

  const springP = springEase(animProgress);
  const h       = data.height * Math.min(springP, 1);
  const { width: bw, depth: bd } = data;

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    const targetY  = hovered ? 0.35 : 0;
    hoverYRef.current += (targetY - hoverYRef.current) * (dt * 8);
    groupRef.current.position.y = hoverYRef.current;

    const targetXZ = hovered ? 1.045 : 1.0;
    groupRef.current.scale.x += (targetXZ - groupRef.current.scale.x) * (dt * 10);
    groupRef.current.scale.z += (targetXZ - groupRef.current.scale.z) * (dt * 10);

    const targetEmit = hovered ? (nightMode ? 0.7 : 0.25) : (nightMode ? 0.35 : 0);
    emitRef.current.forEach(m => {
      if (m) m.emissiveIntensity += (targetEmit - m.emissiveIntensity) * (dt * 8);
    });
  });

  const matStyle = {
    map: texture,
    color: data.color,
    emissive: emissiveColor,
    emissiveIntensity: nightMode ? 0.35 : 0,
    roughness: nightMode ? Math.max(0.04, mp.rough - 0.06) : mp.rough,
    metalness: nightMode ? mp.metal + 0.14 : mp.metal,
  };

  const hasWaterTower   = hash % 4 === 0 && h > 4 && animProgress > 0.88;
  const showAntenna     = data.isLandmark && animProgress > 0.80;
  const showGlowCrown   = data.isLandmark && animProgress > 0.88;
  const showHelipad     = data.isLandmark && h > 6 && animProgress > 0.92;
  const showLobby       = matType === 'glass' && h > 3 && animProgress > 0.60;
  const lobbyH          = Math.min(h * 0.14, 1.2);
  const showNeonBand    = h > 3.5 && animProgress > 0.82 && (hash % 3 !== 0);
  const neonBandY       = h * 0.66;
  const showTaperedSpire= matType === 'glass' && h > 5 && !data.isLandmark && hash % 5 === 0;
  const taperedBaseH    = h * 0.82;
  const taperedSpireH   = h * 0.22;
  const isArtDeco       = matType === 'dark' && h > 4 && hash % 4 === 1;
  const artDecoBaseH    = h * 0.60;

  const events = {
    onClick:        (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect(data); },
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
  };

  const collectMatRef = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !emitRef.current.includes(m)) emitRef.current.push(m);
  };

  /* ─── BOX ─── */
  if (data.shape === 'box') {
    return (
      <group position={[data.x, 0, data.z]}>
        <group ref={groupRef} {...events}>
          {showLobby && <GlassLobby bw={bw} bd={bd} lobbyH={lobbyH} />}
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bw, Math.max(h, 0.01), bd]} />
            <meshStandardMaterial ref={collectMatRef} {...matStyle} />
          </mesh>
          {h > 0.15 && <Cornice w={bw} d={bd} yTop={h / 2} />}
          {showTaperedSpire && (
            <TaperedSpire bw={bw} bd={bd} baseY={taperedBaseH} spireH={taperedSpireH}
              color={langColor} nightMode={nightMode} />
          )}
          {isArtDeco && (
            <SteppedCrown bw={bw} bd={bd} yBase={artDecoBaseH} fullH={h}
              matStyle={{ ...matStyle, metalness: (matStyle.metalness as number) + 0.1 } as object} />
          )}
          {showAntenna && !showTaperedSpire && <Antenna yTop={h} nightMode={nightMode} color={langColor} />}
          {showGlowCrown && <GlowCrown yTop={h} color={langColor} nightMode={nightMode} />}
          {showHelipad && <Helipad bw={bw} bd={bd} yTop={h} />}
          {showNeonBand && <NeonBand bw={bw} bd={bd} y={neonBandY} color={langColor} />}
          {h > 1.5 && <LanguageStrip bw={bw} h={h} color={langColor} nightMode={nightMode} />}
          {hasWaterTower && <WaterTower ox={bw * 0.28} oy={h} oz={bd * 0.28} />}
          {h > 2 && animProgress > 0.85 && <AcUnits bw={bw} bh={h} bd={bd} />}
          {data.hasPark && animProgress > 0.5 && (
            <mesh position={[bw + 0.68, 0.058, 0]} receiveShadow>
              <boxGeometry args={[1.05, 0.10, 1.05]} />
              <meshStandardMaterial color={nightMode ? '#1a3a2a' : MARS_PALETTE.greenPatch} roughness={0.9} />
            </mesh>
          )}
          <ClickIndicator yTop={h} hovered={hovered} animProgress={animProgress} nightMode={nightMode} />
        </group>
        {hovered && <RepoTooltip h={h} data={data} />}
      </group>
    );
  }

  /* ─── PODIUM ─── */
  if (data.shape === 'podium') {
    const baseH  = h * 0.60;
    const crownH = h * 0.40;
    const cw = bw * 0.70, cd = bd * 0.70;
    const crownMat = {
      ...matStyle,
      metalness: Math.min(1, (matStyle.metalness as number) + 0.10),
      roughness: Math.max(0.02, (matStyle.roughness as number) - 0.08),
    };
    return (
      <group position={[data.x, 0, data.z]}>
        <group ref={groupRef} {...events}>
          {showLobby && <GlassLobby bw={bw} bd={bd} lobbyH={lobbyH} />}
          <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[bw, Math.max(baseH, 0.01), bd]} />
            <meshStandardMaterial ref={collectMatRef} {...matStyle} />
          </mesh>
          {baseH > 0.15 && <Cornice w={bw} d={bd} yTop={baseH / 2} />}
          {crownH > 0.08 && (
            <>
              <mesh position={[0, baseH + crownH / 2, 0]} castShadow>
                <boxGeometry args={[cw, Math.max(crownH, 0.01), cd]} />
                <meshStandardMaterial ref={collectMatRef} {...crownMat} />
              </mesh>
              <Cornice w={cw} d={cd} yTop={baseH + crownH / 2} />
            </>
          )}
          {showAntenna && <Antenna yTop={h} nightMode={nightMode} color={langColor} />}
          {showGlowCrown && <GlowCrown yTop={h} color={langColor} nightMode={nightMode} />}
          {showHelipad && <Helipad bw={cw} bd={cd} yTop={h} />}
          {showNeonBand && <NeonBand bw={bw} bd={bd} y={baseH * 0.90} color={langColor} />}
          {h > 1.5 && <LanguageStrip bw={bw} h={h * 0.60} color={langColor} nightMode={nightMode} />}
          {hasWaterTower && <WaterTower ox={bw * 0.28} oy={baseH} oz={bd * 0.28} />}
          <ClickIndicator yTop={h} hovered={hovered} animProgress={animProgress} nightMode={nightMode} />
        </group>
        {hovered && <RepoTooltip h={h} data={data} />}
      </group>
    );
  }

  /* ─── L-SHAPE ─── */
  const mainD = bd * 0.62;
  const mainZ = (bd - mainD) / 2;
  const wingW = bw * 0.45;
  const wingD = bd * 0.38;
  const wingH = h * 0.78;
  const wingX = -(bw - wingW) / 2;
  const wingZ = -(bd - wingD) / 2;

  return (
    <group position={[data.x, 0, data.z]}>
      <group ref={groupRef} {...events}>
        <mesh position={[0, h / 2, mainZ]} castShadow receiveShadow>
          <boxGeometry args={[bw, Math.max(h, 0.01), mainD]} />
          <meshStandardMaterial ref={collectMatRef} {...matStyle} />
        </mesh>
        {h > 0.15 && <Cornice w={bw} d={mainD} yTop={h / 2} />}
        {wingH > 0.08 && (
          <>
            <mesh position={[wingX, wingH / 2, wingZ]} castShadow receiveShadow>
              <boxGeometry args={[wingW, Math.max(wingH, 0.01), wingD]} />
              <meshStandardMaterial ref={collectMatRef} {...matStyle} />
            </mesh>
            <Cornice w={wingW} d={wingD} yTop={wingH / 2} />
          </>
        )}
        {showAntenna && <Antenna yTop={h} nightMode={nightMode} color={langColor} />}
        {showGlowCrown && <GlowCrown yTop={h} color={langColor} nightMode={nightMode} />}
        {showNeonBand && <NeonBand bw={bw} bd={mainD} y={h * 0.68} color={langColor} />}
        {h > 1.5 && <LanguageStrip bw={bw} h={h} color={langColor} nightMode={nightMode} />}
        {hasWaterTower && <WaterTower ox={bw * 0.28} oy={h * 0.62} oz={bd * 0.28} />}
        <ClickIndicator yTop={h} hovered={hovered} animProgress={animProgress} nightMode={nightMode} />
      </group>
      {hovered && <RepoTooltip h={h} data={data} />}
    </group>
  );
}
