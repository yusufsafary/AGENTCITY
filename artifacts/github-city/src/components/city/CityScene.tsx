import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { CityData, BuildingData } from '../../types/github';
import Building from './Building';
import Ground from './Ground';
import Trees from './Trees';
import DowntownSkyline from './DowntownSkyline';
import Traffic from './Traffic';
import CityLife from './CityLife';

export type ScreenshotRef = { capture: () => string | null };

const SKY_DEEP = '#060D1F';
const SKY_FOG  = '#020408';
const LIME = '#CAFF00';
const PINK = '#FF0090';

interface CitySceneProps {
  cityData: CityData;
  nightMode: boolean;
  showSkyline: boolean;
  onSelectBuilding: (data: BuildingData | null) => void;
  screenshotRef?: React.RefObject<ScreenshotRef | null>;
}

/* ── Screenshot capture — inside Canvas so we can access gl ─ */
function ScreenshotCapture({ screenshotRef }: { screenshotRef?: React.RefObject<ScreenshotRef | null> }) {
  const { gl } = useThree();
  if (screenshotRef) {
    (screenshotRef as React.MutableRefObject<ScreenshotRef>).current = {
      capture: () => {
        try { return gl.domElement.toDataURL('image/png'); }
        catch { return null; }
      },
    };
  }
  return null;
}

/* ── Lighting ──────────────────────────────────────────── */
function SceneLighting({ nightMode }: { nightMode: boolean }) {
  return (
    <>
      <ambientLight intensity={0.25} color="#1A3A5A" />
      <directionalLight
        position={[40, 60, 30]}
        intensity={0.6}
        color="#A0C8FF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-25, 20, -20]} intensity={0.20} color="#7040CC" />
      <directionalLight position={[0, -8, -30]} intensity={0.10} color="#0080FF" />

      {/* Lime/pink city glow — always on */}
      <pointLight position={[0, 22, 0]}   intensity={2.2}  color={LIME}   />
      <pointLight position={[30,  10, 0]} intensity={1.6}  color={PINK}   />
      <pointLight position={[-30, 10, 0]} intensity={1.4}  color={LIME}   />
      <pointLight position={[0,   5, 30]} intensity={1.2}  color={PINK}   />
      <pointLight position={[0,   5,-30]} intensity={1.2}  color={LIME}   />
      <pointLight position={[0,   3,  0]} intensity={0.8}  color={LIME}   />
      <pointLight position={[15, 2, 15]}  intensity={0.6}  color={PINK}   />
      <pointLight position={[-15,2,-15]}  intensity={0.6}  color={LIME}   />
    </>
  );
}

/* ── Sky / fog ─────────────────────────────────────────── */
function SkyBackground() {
  const { scene } = useThree();
  const curBg = useRef(new THREE.Color(SKY_DEEP));

  useFrame((_, dt) => {
    const bg = new THREE.Color(SKY_DEEP);
    curBg.current.lerp(bg, dt * 1.8);
    (scene.background as THREE.Color)?.set(curBg.current);
    if (scene.fog) (scene.fog as THREE.Fog).color.set(SKY_FOG);
  });
  return null;
}

/* ── Matrix-rain data streaks across the sky ───────────── */
function SkyDataStreams() {
  const COUNT = 90;
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const defs = useRef(Array.from({ length: COUNT }, (_, i) => {
    const s = Math.sin(i * 2.3);
    const c = Math.cos(i * 3.7);
    return {
      x:      (s - 0.5) * 110,
      z:      (c - 0.5) * 110,
      y:      15 + (s * 0.5 + 0.5) * 40,
      speed:  2.5 + (i % 7) * 0.9,
      len:    0.4 + (i % 4) * 0.35,
      col:    i % 2 === 0 ? LIME : PINK,
      opBase: 0.15 + (i % 5) * 0.04,
    };
  }));

  useFrame((_, dt) => {
    defs.current.forEach((d, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      d.y -= dt * d.speed;
      if (d.y < 2) {
        d.y = 50 + Math.random() * 20;
        d.x = (Math.random() - 0.5) * 110;
        d.z = (Math.random() - 0.5) * 110;
      }
      mesh.position.set(d.x, d.y, d.z);
    });
  });

  return (
    <>
      {defs.current.map((d, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[d.x, d.y, d.z]}>
          <boxGeometry args={[0.025, d.len, 0.025]} />
          <meshBasicMaterial color={d.col} transparent opacity={d.opBase} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ── Ground pulse rings — concentric glow on the city floor */
function GroundGlow() {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const RADII = [4, 8, 14, 22, 32, 44];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    rings.current.forEach((mesh, i) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        0.045 + Math.sin(t * 0.55 + i * 0.9) * 0.028;
    });
  });

  return (
    <>
      {RADII.map((r, i) => (
        <mesh key={i} ref={el => { rings.current[i] = el; }}
          position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.14, r + 0.14, 72]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? LIME : PINK}
            transparent opacity={0.05}
            depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

/* ── Citywide scan pulse — expanding ring from center ───── */
function CityPulseRing() {
  const ringRef  = useRef<THREE.Mesh>(null);
  const state    = useRef({ radius: 0, active: false, nextAt: 3.5 });

  useFrame(({ clock }) => {
    const t  = clock.getElapsedTime();
    const ps = state.current;
    if (!ps.active && t > ps.nextAt) { ps.active = true; ps.radius = 0.1; }
    if (ps.active && ringRef.current) {
      ps.radius += 0.35;
      ringRef.current.scale.setScalar(ps.radius);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.max(0, 0.28 - ps.radius / 65);
      if (ps.radius > 65) {
        ps.active = false;
        ps.nextAt = t + 4.5 + Math.random() * 3;
      }
    } else if (ringRef.current) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.88, 1, 72]} />
      <meshBasicMaterial color={LIME} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ── Animated buildings ────────────────────────────────── */
function AnimatedBuildings({
  buildings, nightMode, onSelect,
}: {
  buildings: BuildingData[];
  nightMode: boolean;
  onSelect: (d: BuildingData) => void;
}) {
  const [progress, setProgress] = useState(0);
  const start = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - start.current) / 1800;
    setProgress(Math.min(elapsed, 1));
  });

  return (
    <>
      {buildings.map((b, i) => (
        <Building
          key={b.repo.name}
          data={b}
          nightMode={nightMode}
          onSelect={onSelect}
          animProgress={Math.max(0, Math.min(1, (progress - (i / buildings.length) * 0.4) * 2.5))}
        />
      ))}
    </>
  );
}

/* ── Skyline wrapper ───────────────────────────────────── */
function SkylineWrapper({ bars, nightMode }: { bars: CityData['skyline']; nightMode: boolean }) {
  const [progress, setProgress] = useState(0);
  const start = useRef(Date.now());
  useFrame(() => {
    const elapsed = (Date.now() - start.current) / 1500;
    setProgress(Math.min(elapsed, 1));
  });
  return <DowntownSkyline bars={bars} nightMode={nightMode} animProgress={progress} />;
}

/* ── Main export ───────────────────────────────────────── */
export default function CityScene({ cityData, nightMode, showSkyline, onSelectBuilding, screenshotRef }: CitySceneProps) {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      shadows={!isMobile}
      camera={{ position: [38, 32, 38], fov: 48, near: 0.1, far: 500 }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ background: SKY_DEEP }}
    >
      <color attach="background" args={[SKY_DEEP]} />
      <fog attach="fog" args={[SKY_FOG, 50, 150]} />

      <ScreenshotCapture screenshotRef={screenshotRef} />
      <SkyBackground />
      <SceneLighting nightMode={nightMode} />

      <Stars radius={120} depth={60} count={5000} factor={5} fade saturation={0.5} />

      <Suspense fallback={null}>
        <AnimatedBuildings
          buildings={cityData.buildings}
          nightMode={nightMode}
          onSelect={onSelectBuilding}
        />
        <Trees buildings={cityData.buildings} nightMode={nightMode} />
        {showSkyline && <SkylineWrapper bars={cityData.skyline} nightMode={nightMode} />}
        <Ground nightMode={nightMode} size={300} onClick={() => onSelectBuilding(null)} />
        <Traffic />
        <CityLife nightMode={nightMode} />
        <SkyDataStreams />
        <GroundGlow />
        <CityPulseRing />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.65}
        minDistance={8}
        maxDistance={130}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </Canvas>
  );
}
