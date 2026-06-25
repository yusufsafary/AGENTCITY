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

const SKY_DEEP = '#060D1F';
const SKY_FOG  = '#04080F';
const CYAN = '#00D4FF';
const PURPLE = '#A855F7';
const GREEN = '#00FF88';

interface CitySceneProps {
  cityData: CityData;
  nightMode: boolean;
  showSkyline: boolean;
  onSelectBuilding: (data: BuildingData | null) => void;
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

      {/* Ambient AI city glow — always on */}
      <pointLight position={[0, 18, 0]}   intensity={1.2}  color={CYAN}   />
      <pointLight position={[25,  8,  0]} intensity={0.8}  color={PURPLE} />
      <pointLight position={[-25, 8,  0]} intensity={0.7}  color={CYAN}   />
      <pointLight position={[0,   4, 25]} intensity={0.6}  color={GREEN}  />
      <pointLight position={[0,   4,-25]} intensity={0.6}  color={PURPLE} />
      <pointLight position={[0,   2,  0]} intensity={0.4}  color={CYAN}   />
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

/* ── Animated data-stream particles across the sky ─────── */
function SkyDataStreams() {
  const COUNT = 60;
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const defs = useRef(Array.from({ length: COUNT }, (_, i) => {
    const s = Math.sin(i * 2.3);
    const c = Math.cos(i * 3.7);
    return {
      x: (s - 0.5) * 80,
      z: (c - 0.5) * 80,
      y: 15 + (s * 0.5 + 0.5) * 25,
      speed: 0.3 + (i % 5) * 0.12,
      col: i % 3 === 0 ? CYAN : i % 3 === 1 ? PURPLE : GREEN,
    };
  }));

  useFrame((_, dt) => {
    defs.current.forEach((d, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      d.y -= dt * d.speed * 2;
      if (d.y < 5) d.y = 40 + Math.random() * 15;
      mesh.position.set(d.x, d.y, d.z);
    });
  });

  return (
    <>
      {defs.current.map((d, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[0.06 + (i % 3) * 0.04, 4, 4]} />
          <meshBasicMaterial color={d.col} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </>
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
export default function CityScene({ cityData, nightMode, showSkyline, onSelectBuilding }: CitySceneProps) {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      shadows={!isMobile}
      camera={{ position: [38, 32, 38], fov: 48, near: 0.1, far: 500 }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      style={{ background: SKY_DEEP }}
    >
      <color attach="background" args={[SKY_DEEP]} />
      <fog attach="fog" args={[SKY_FOG, 70, 200]} />

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
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.4}
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
