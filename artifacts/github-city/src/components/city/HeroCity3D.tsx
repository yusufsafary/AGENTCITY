import {
  Canvas, useFrame, useThree,
} from '@react-three/fiber';
import {
  createContext, useContext, useRef, useMemo,
  Suspense, useState, useCallback, memo, useEffect,
} from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════
   Responsive camera
═══════════════════════════════════════════════ */
function CameraAdjuster() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const portrait = size.height > size.width;
    const shortLandscape = !portrait && size.height < 520;
    if (portrait) { cam.fov = 62; cam.position.set(11, 7.5, 11); }
    else if (shortLandscape) { cam.fov = 56; cam.position.set(10.5, 7, 10.5); }
    else { cam.fov = 52; cam.position.set(10, 7, 10); }
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/* ═══════════════════════════════════════════════
   Shared transition context (0=day/cyberpunk-bright, 1=night/dark)
═══════════════════════════════════════════════ */
const ProgressCtx = createContext<React.MutableRefObject<number>>({ current: 0 });

function TransitionDriver({ night }: { night: boolean }) {
  const pr = useContext(ProgressCtx);
  useFrame((_, dt) => { pr.current = THREE.MathUtils.lerp(pr.current, night ? 1 : 0, dt * 1.6); });
  return null;
}

/* ═══════════════════════════════════════════════
   Color constants — AI/Cyberpunk palette
═══════════════════════════════════════════════ */
const SKY_A = new THREE.Color('#060D1F');   // cyberpunk day
const SKY_B = new THREE.Color('#020509');   // deeper night
const FOG_A = new THREE.Color('#04080F');
const FOG_B = new THREE.Color('#010306');
const DIR_A = new THREE.Color('#A0C8FF');
const DIR_B = new THREE.Color('#6060AA');

const CYAN   = '#CAFF00';
const PURPLE = '#FF0090';
const GREEN  = '#CAFF00';
const PINK   = '#FF0090';

/* ═══════════════════════════════════════════════
   Dynamic sky + fog
═══════════════════════════════════════════════ */
function DynamicSky() {
  const { scene } = useThree();
  const pr = useContext(ProgressCtx);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const t = pr.current;
    col.lerpColors(SKY_A, SKY_B, t);
    (scene.background as THREE.Color)?.set(col);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) fog.color.lerpColors(FOG_A, FOG_B, t);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   Dynamic lights
═══════════════════════════════════════════════ */
function DynamicLights() {
  const pr = useContext(ProgressCtx);
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const dirRef  = useRef<THREE.DirectionalLight>(null);
  const dir2Ref = useRef<THREE.DirectionalLight>(null);
  const c1Ref   = useRef<THREE.PointLight>(null);
  const c2Ref   = useRef<THREE.PointLight>(null);
  const c3Ref   = useRef<THREE.PointLight>(null);
  const c4Ref   = useRef<THREE.PointLight>(null);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const t = pr.current;
    const time = clock.getElapsedTime();
    if (ambRef.current)  ambRef.current.intensity  = THREE.MathUtils.lerp(0.30, 0.08, t);
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(0.9, 0.12, t);
      col.lerpColors(DIR_A, DIR_B, t);
      dirRef.current.color.set(col);
    }
    if (dir2Ref.current) dir2Ref.current.intensity = THREE.MathUtils.lerp(0.22, 0.06, t);
    // Pulsing neon city glow
    if (c1Ref.current) c1Ref.current.intensity = THREE.MathUtils.lerp(1.5, 3.5, t) * (0.9 + Math.sin(time * 1.1) * 0.1);
    if (c2Ref.current) c2Ref.current.intensity = THREE.MathUtils.lerp(1.0, 2.8, t) * (0.9 + Math.sin(time * 0.8 + 1) * 0.1);
    if (c3Ref.current) c3Ref.current.intensity = THREE.MathUtils.lerp(0.8, 2.2, t);
    if (c4Ref.current) c4Ref.current.intensity = THREE.MathUtils.lerp(0.6, 1.8, t) * (0.9 + Math.cos(time * 1.3) * 0.1);
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.30} color="#1A3060" />
      <directionalLight ref={dirRef} position={[8, 14, 6]} intensity={0.9} color="#A0C8FF"
        castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={55}
        shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={14} shadow-camera-bottom={-14} />
      <directionalLight ref={dir2Ref} position={[-6, 8, -4]} intensity={0.22} color="#6040AA" />
      <pointLight ref={c1Ref} position={[0, 10, 0]} color={CYAN} intensity={1.5} distance={18} />
      <pointLight ref={c2Ref} position={[-3, 4, 3]} color={PURPLE} intensity={1.0} distance={12} />
      <pointLight ref={c3Ref} position={[3, 3, -3]} color={GREEN} intensity={0.8} distance={10} />
      <pointLight ref={c4Ref} position={[0, 2, 0]} color={CYAN} intensity={0.6} distance={8} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   Neural Network Visualization (AI brain at center)
═══════════════════════════════════════════════ */
function NeuralBrainOrb() {
  const pr = useContext(ProgressCtx);
  const groupRef = useRef<THREE.Group>(null);
  const coreRef  = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);

  const COLORS_LIST = [CYAN, PURPLE, GREEN, PINK, '#FBBF24', '#3B82F6'];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.25;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.08;
      coreRef.current.scale.setScalar(s);
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(t * 1.8) * 0.5 + p * 0.8;
    }
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.x = t * (0.35 + i * 0.12);
      ring.rotation.z = t * (0.22 - i * 0.08);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.25 + Math.sin(t * 1.4 + i * 1.1) * 0.18) * (0.5 + p * 0.5);
    });
    nodes.current.forEach((node, i) => {
      if (!node) return;
      const mat = node.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 2.5 + i * 0.7) * 1.0;
    });
  });

  return (
    <group position={[0, 1.95, 0]}>
      {/* Base pillar */}
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 1.4, 8]} />
        <meshStandardMaterial color="#0A2040" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Platform */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.55, 0.70, 0.12, 16]} />
        <meshStandardMaterial color="#0D1E30" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Platform glow ring */}
      <mesh position={[0, -0.58, 0]}>
        <torusGeometry args={[0.52, 0.018, 6, 24]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} roughness={0.05} />
      </mesh>
      {/* Neural core */}
      <group ref={groupRef}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.28, 2]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} metalness={0.4} roughness={0.05} />
        </mesh>
        {/* Orbital rings */}
        {[CYAN, PURPLE, GREEN].map((color, i) => (
          <mesh key={i} ref={el => { rings.current[i] = el; }} rotation={[i * Math.PI/2.8, i * Math.PI/3.5, 0]}>
            <torusGeometry args={[0.45 + i * 0.14, 0.013, 8, 36]} />
            <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
          </mesh>
        ))}
        {/* Orbiting AI nodes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const a = (i / 8) * Math.PI * 2;
          const r = 0.55 + (i % 3) * 0.08;
          const y = Math.sin(i * 0.8) * 0.22;
          return (
            <mesh key={`n-${i}`} ref={el => { nodes.current[i] = el; }}
              position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
              <sphereGeometry args={[0.030 + (i % 3) * 0.008, 6, 6]} />
              <meshStandardMaterial
                color={COLORS_LIST[i % COLORS_LIST.length]}
                emissive={COLORS_LIST[i % COLORS_LIST.length]}
                emissiveIntensity={1.5} roughness={0.05}
              />
            </mesh>
          );
        })}
        {/* Connection beams between nodes */}
        {[0, 2, 4, 6].map(i => {
          const a1 = (i / 8) * Math.PI * 2;
          const a2 = ((i + 2) / 8) * Math.PI * 2;
          const r = 0.55;
          const p1 = new THREE.Vector3(Math.cos(a1) * r, 0, Math.sin(a1) * r);
          const p2 = new THREE.Vector3(Math.cos(a2) * r, 0, Math.sin(a2) * r);
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          const len = p1.distanceTo(p2);
          const dir = p2.clone().sub(p1).normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          return (
            <mesh key={`b-${i}`} position={[mid.x, mid.y, mid.z]} quaternion={quat}>
              <cylinderGeometry args={[0.006, 0.006, len, 4]} />
              <meshBasicMaterial color={CYAN} transparent opacity={0.25} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 0, 0]} color={CYAN} intensity={1.8} distance={6} decay={2} />
      <pointLight position={[0, 0, 0]} color={PURPLE} intensity={0.8} distance={4} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Aurora bands — neon AI energy waves
═══════════════════════════════════════════════ */
const AURORA_DEFS = [
  { color: CYAN,   h: 8.0,  sz: 24, sp: 0.28, phase: 0 },
  { color: PURPLE, h: 9.5,  sz: 22, sp: 0.19, phase: 2.1 },
  { color: GREEN,  h: 11.0, sz: 20, sp: 0.35, phase: 4.5 },
  { color: PINK,   h: 7.0,  sz: 18, sp: 0.22, phase: 1.8 },
];

function Aurora() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = AURORA_DEFS[i];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (p * 0.18 + 0.04) * (0.6 + Math.sin(t * a.sp + a.phase) * 0.4);
      mesh.position.y = a.h + Math.sin(t * 0.22 + a.phase) * 0.7;
      mesh.rotation.y = t * 0.016 * (i % 2 === 0 ? 1 : -1);
    });
  });
  return (
    <>
      {AURORA_DEFS.map((a, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}
          rotation={[Math.PI / 2, 0, i * 0.7]} position={[0, a.h, 0]}>
          <planeGeometry args={[a.sz, a.sz, 1, 1]} />
          <meshBasicMaterial color={a.color} opacity={0} transparent
            side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Search beams (data relay beams)
═══════════════════════════════════════════════ */
function SearchBeams() {
  const pr = useContext(ProgressCtx);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats   = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const beamDefs = [
    { pos: [-1.8, 3.4, 0.5] as [number,number,number], color: CYAN,   r: 0.06, h: 15, sp: [0.45, 0.28], amp: [0.38, 0.20] },
    { pos: [ 1.9, 4.0,-0.4] as [number,number,number], color: PURPLE, r: 0.05, h: 13, sp: [0.38, 0.32], amp: [0.35, 0.22] },
    { pos: [ 0.6, 2.6, 1.5] as [number,number,number], color: GREEN,  r: 0.04, h: 11, sp: [0.52, 0.21], amp: [0.30, 0.18] },
  ];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    groups.current.forEach((g, i) => {
      if (!g) return;
      const d = beamDefs[i];
      g.rotation.z = Math.sin(t * d.sp[0]) * d.amp[0] - 0.15;
      g.rotation.x = Math.cos(t * d.sp[1]) * d.amp[1];
    });
    mats.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = (0.06 + pr.current * 0.12) * (0.7 + Math.sin(i + mats.current.length) * 0.3);
    });
  });

  return (
    <>
      {beamDefs.map((d, i) => (
        <group key={i} position={d.pos}>
          <group ref={el => { groups.current[i] = el; }}>
            <mesh>
              <coneGeometry args={[d.r * 10, d.h, 16, 1, true]} />
              <meshBasicMaterial ref={el => { mats.current[i] = el; }}
                color={d.color} opacity={0} transparent side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   AI Data particles — flowing upward
═══════════════════════════════════════════════ */
interface ParticleDef { x: number; z: number; y: number; speed: number; size: number; col: string }

function Particles() {
  const pr = useContext(ProgressCtx);
  const PCOLS = [CYAN, PURPLE, GREEN, PINK, '#FBBF24', '#3B82F6'];
  const defs = useMemo<ParticleDef[]>(() => {
    const rng = (seed: number) => { const x = Math.sin(seed) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: 120 }, (_, i) => ({
      x: (rng(i * 3.1) - 0.5) * 16,
      z: (rng(i * 7.3) - 0.5) * 16,
      y: rng(i * 2.7) * 10,
      speed: 0.28 + rng(i * 5.1) * 0.55,
      size: 0.020 + rng(i * 1.9) * 0.035,
      col: PCOLS[i % PCOLS.length],
    }));
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, dt) => {
    const p = pr.current;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y += dt * defs[i].speed;
      if (mesh.position.y > 12) mesh.position.y = 0;
    });
    matRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = THREE.MathUtils.lerp(0.08, 0.60, p) * (0.5 + (i % 4) * 0.12);
    });
  });

  return (
    <>
      {defs.map((d, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.size, 4, 4]} />
          <meshBasicMaterial ref={el => { matRefs.current[i] = el; }}
            color={d.col} opacity={0.08} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Floating holographic rings above buildings
═══════════════════════════════════════════════ */
const HOLO_RINGS = [
  { pos: [ 0.0, 5.2,  0.0] as [number,number,number], color: CYAN,   r: 0.55, sp: 0.8 },
  { pos: [ 1.9, 4.2,  0.0] as [number,number,number], color: PURPLE, r: 0.38, sp: -0.6 },
  { pos: [-1.8, 3.6,  0.0] as [number,number,number], color: GREEN,  r: 0.30, sp: 1.1 },
  { pos: [ 0.6, 3.1, -1.5] as [number,number,number], color: PINK,   r: 0.25, sp: -0.9 },
];

function HoloRings() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const d = HOLO_RINGS[i];
      mesh.rotation.x = t * d.sp * 0.5;
      mesh.rotation.y = t * d.sp;
      mesh.position.y = d.pos[1] + Math.sin(t * 0.7 + i * 1.2) * 0.12;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.18 + Math.sin(t * 1.2 + i) * 0.10) * (0.4 + p * 0.6);
    });
  });

  return (
    <>
      {HOLO_RINGS.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={d.pos} rotation={[Math.PI/4, 0, i * 0.5]}>
          <torusGeometry args={[d.r, 0.012, 8, 36]} />
          <meshBasicMaterial color={d.color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Stars
═══════════════════════════════════════════════ */
const STARS_DATA = Array.from({ length: 150 }, (_, i) => {
  const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
  const theta = rng(i * 2.3) * Math.PI * 2;
  const phi = Math.acos(1 - rng(i * 3.7) * 0.9) * 0.9;
  const r = 14 + rng(i * 1.7) * 5;
  const cols = [CYAN, PURPLE, '#ffffff', GREEN, '#A0C0FF'];
  return {
    pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.abs(Math.cos(phi)) + 4, r * Math.sin(phi) * Math.sin(theta)] as [number, number, number],
    col: cols[i % cols.length],
  };
});

function Stars() {
  const pr = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(0.05, 0.65, Math.max(0, (p - 0.3) / 0.7)) * (0.4 + (i % 6) * 0.1) * (0.8 + Math.sin(t * 1.5 + i) * 0.2);
    });
  });
  return (
    <>
      {STARS_DATA.map((s, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={s.pos}>
          <sphereGeometry args={[0.035 + (i % 4) * 0.012, 4, 4]} />
          <meshBasicMaterial color={s.col} opacity={0} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Data grid floor
═══════════════════════════════════════════════ */
function DataGrid() {
  const pr = useContext(ProgressCtx);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    matRef.current.emissiveIntensity = 0.15 + Math.sin(t * 0.8) * 0.08 + pr.current * 0.12;
  });
  return (
    <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[18, 18, 16, 16]} />
      <meshStandardMaterial ref={matRef}
        color={CYAN} emissive={CYAN} emissiveIntensity={0.15}
        wireframe transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   Building system — AI/Cyberpunk themed
═══════════════════════════════════════════════ */
const MATS = {
  glass:    { body: '#0D1E30', metal: 0.85, rough: 0.08, win: CYAN,   winB: '#0099BB' },
  classic:  { body: '#0A1828', metal: 0.7,  rough: 0.20, win: PURPLE, winB: '#7030C0' },
  concrete: { body: '#0C1820', metal: 0.5,  rough: 0.40, win: GREEN,  winB: '#00BB66' },
  warm:     { body: '#0E1A2A', metal: 0.8,  rough: 0.12, win: PINK,   winB: '#C040A0' },
  dark:     { body: '#08121C', metal: 0.92, rough: 0.06, win: CYAN,   winB: PURPLE },
} as const;
type MatKey = keyof typeof MATS;

interface BldgDef {
  x: number; z: number; w: number; d: number; h: number;
  type: MatKey; crown?: boolean; antenna?: boolean; water?: boolean;
}

const BUILDINGS: BldgDef[] = [
  { x: 0,    z: 0,    w: 1.05, d: 1.05, h: 5.0,  type: 'glass',    crown: true,  antenna: true },
  { x: -1.8, z: 0.5,  w: 0.92, d: 0.92, h: 3.4,  type: 'classic',  water: true },
  { x: 1.9,  z: -0.4, w: 0.98, d: 0.98, h: 4.0,  type: 'dark',     crown: true,  antenna: true },
  { x: 0.6,  z: -1.6, w: 0.88, d: 0.88, h: 2.9,  type: 'concrete' },
  { x: -1.2, z: -1.9, w: 0.82, d: 0.82, h: 2.5,  type: 'warm',     water: true },
  { x: 1.0,  z: 1.7,  w: 0.80, d: 0.80, h: 2.7,  type: 'classic' },
  { x: -3.2, z: -0.4, w: 0.76, d: 0.76, h: 2.2,  type: 'warm' },
  { x: 3.1,  z: 0.9,  w: 0.80, d: 0.80, h: 2.6,  type: 'glass' },
  { x: 0.4,  z: 3.2,  w: 0.72, d: 0.72, h: 2.0,  type: 'concrete', water: true },
  { x: -2.2, z: 2.6,  w: 0.70, d: 0.70, h: 2.2,  type: 'classic' },
  { x: 2.6,  z: -2.1, w: 0.76, d: 0.76, h: 2.3,  type: 'dark' },
  { x: -2.6, z: -2.6, w: 0.70, d: 0.70, h: 1.8,  type: 'warm' },
  { x: 3.6,  z: -1.6, w: 0.66, d: 0.66, h: 1.5,  type: 'concrete' },
  { x: -3.0, z: 2.0,  w: 0.68, d: 0.68, h: 1.7,  type: 'glass' },
  { x: -5.0, z: 1.5,  w: 0.60, d: 0.60, h: 1.3,  type: 'classic' },
  { x: 5.0,  z: 1.0,  w: 0.60, d: 0.60, h: 1.5,  type: 'warm' },
  { x: 1.2,  z: 5.0,  w: 0.56, d: 0.56, h: 1.0,  type: 'concrete' },
  { x: -1.8, z: -4.5, w: 0.60, d: 0.60, h: 1.1,  type: 'classic' },
  { x: 4.2,  z: -3.2, w: 0.56, d: 0.56, h: 1.0,  type: 'dark' },
  { x: -4.2, z: -3.5, w: 0.56, d: 0.56, h: 1.1,  type: 'warm' },
  { x: 2.5,  z: 4.5,  w: 0.56, d: 0.56, h: 0.9,  type: 'glass' },
  { x: -4.0, z: 4.0,  w: 0.56, d: 0.56, h: 1.2,  type: 'classic' },
  { x: 5.5,  z: -0.5, w: 0.50, d: 0.50, h: 0.8,  type: 'concrete' },
  { x: -5.5, z: -0.8, w: 0.50, d: 0.50, h: 0.9,  type: 'warm' },
  { x:  6.5, z:  2.0, w: 0.48, d: 0.48, h: 0.75, type: 'classic' },
  { x: -6.5, z: -2.0, w: 0.48, d: 0.48, h: 0.80, type: 'warm' },
  { x:  2.2, z:  6.5, w: 0.46, d: 0.46, h: 0.70, type: 'concrete' },
  { x: -2.2, z: -6.5, w: 0.46, d: 0.46, h: 0.72, type: 'glass' },
  { x:  6.2, z: -2.8, w: 0.44, d: 0.44, h: 0.65, type: 'dark' },
  { x: -6.2, z:  2.8, w: 0.44, d: 0.44, h: 0.60, type: 'classic' },
  { x:  3.8, z: -6.0, w: 0.44, d: 0.44, h: 0.65, type: 'warm' },
  { x: -3.8, z:  6.0, w: 0.44, d: 0.44, h: 0.62, type: 'glass' },
  { x:  7.2, z:  0.2, w: 0.42, d: 0.42, h: 0.55, type: 'concrete' },
  { x: -7.2, z: -0.2, w: 0.42, d: 0.42, h: 0.58, type: 'warm' },
  { x:  0.3, z:  7.2, w: 0.42, d: 0.42, h: 0.52, type: 'classic' },
  { x:  0.3, z: -7.2, w: 0.40, d: 0.40, h: 0.50, type: 'dark' },
  { x:  5.2, z:  4.8, w: 0.40, d: 0.40, h: 0.55, type: 'glass' },
  { x: -5.2, z: -4.8, w: 0.40, d: 0.40, h: 0.52, type: 'warm' },
  { x:  4.8, z: -5.2, w: 0.38, d: 0.38, h: 0.48, type: 'classic' },
  { x: -4.8, z:  5.2, w: 0.38, d: 0.38, h: 0.50, type: 'concrete' },
];

/* ── Window face ────────────────────────────────────────── */
const WinFaceBase = ({ fw, fh, posZ, cols, rows, winA, winB, rotY = 0, nightMult = 1 }: {
  fw: number; fh: number; posZ: number; cols: number; rows: number;
  winA: THREE.Color; winB: THREE.Color; rotY?: number; nightMult?: number;
}) => {
  const cSpc = fw / (cols + 1);
  const rSpc = fh / (rows + 1);
  const wW = cSpc * 0.48; const wH = Math.min(rSpc * 0.65, 0.3);
  return (
    <group rotation={[0, rotY, 0]}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const lit = (r + c) % 3 !== 0;
          const color = (r + c) % 4 === 0 ? winB : winA;
          return (
            <mesh key={`${r}-${c}`} position={[-fw/2 + cSpc*(c+1), -fh/2 + rSpc*(r+1), posZ]}>
              <planeGeometry args={[wW, wH]} />
              <meshStandardMaterial color={color} emissive={color}
                emissiveIntensity={(lit ? 1.2 : 0.45) * nightMult} roughness={0.1} />
            </mesh>
          );
        })
      )}
    </group>
  );
};
const WinFace = memo(WinFaceBase);

/* ── Satellite dish (replaces water tower) ─────────────── */
function SatelliteDish({ ox, oy, oz }: { ox: number; oy: number; oz: number }) {
  const dishRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (dishRef.current) dishRef.current.rotation.y = clock.getElapsedTime() * 0.3;
  });
  return (
    <group position={[ox, oy, oz]}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.35, 6]} />
        <meshStandardMaterial color="#1A3050" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh ref={dishRef} position={[0, 0.42, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <sphereGeometry args={[0.18, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#243040" side={THREE.DoubleSide} metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.018, 5, 5]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} roughness={0.05} />
      </mesh>
    </group>
  );
}

/* ── Building ───────────────────────────────────────────── */
function Building({ x, z, w, d, h, type, crown, antenna, water, night }: BldgDef & { night: boolean }) {
  const pr = useContext(ProgressCtx);
  const mat = MATS[type];
  const winACol = useMemo(() => new THREE.Color(mat.win), [mat.win]);
  const winBCol = useMemo(() => new THREE.Color(mat.winB), [mat.winB]);
  const roofRef = useRef<THREE.MeshStandardMaterial>(null);

  const cols = Math.max(2, Math.round(w * 3.5));
  const rows = Math.max(3, Math.round(h * 2.5));
  const posZ = w / 2 + 0.005;
  const halfH = h / 2;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    if (roofRef.current) {
      roofRef.current.emissiveIntensity = 0.4 + Math.sin(t * 1.8 + x * 2.3) * 0.3 + p * 0.5;
    }
  });

  return (
    <group position={[x, h / 2, z]}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={mat.body} metalness={mat.metal} roughness={mat.rough} />
      </mesh>
      {/* Windows — all 4 faces */}
      <WinFace fw={w} fh={h} posZ={posZ}        cols={cols} rows={rows} winA={winACol} winB={winBCol} />
      <WinFace fw={w} fh={h} posZ={-posZ}       cols={cols} rows={rows} winA={winACol} winB={winBCol} rotY={Math.PI} />
      <WinFace fw={d} fh={h} posZ={posZ}        cols={cols} rows={rows} winA={winACol} winB={winBCol} rotY={Math.PI / 2} />
      <WinFace fw={d} fh={h} posZ={-posZ}       cols={cols} rows={rows} winA={winACol} winB={winBCol} rotY={-Math.PI / 2} />
      {/* Roof glow edge */}
      <mesh position={[0, halfH + 0.01, 0]}>
        <boxGeometry args={[w + 0.01, 0.018, d + 0.01]} />
        <meshStandardMaterial ref={roofRef} color={mat.win} emissive={mat.win} emissiveIntensity={0.5} roughness={0.05} />
      </mesh>
      {/* Crown */}
      {crown && (
        <mesh position={[0, halfH + 0.08, 0]}>
          <boxGeometry args={[w * 0.55, 0.16, d * 0.55]} />
          <meshStandardMaterial color={mat.body} metalness={mat.metal + 0.05} roughness={mat.rough * 0.8} />
        </mesh>
      )}
      {/* Antenna / data relay */}
      {antenna && (
        <>
          <mesh position={[0, halfH + 0.22 + 0.28, 0]}>
            <cylinderGeometry args={[0.018, 0.025, 0.56, 6]} />
            <meshStandardMaterial color="#1A3050" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, halfH + 0.22 + 0.58, 0]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} roughness={0.05} />
          </mesh>
        </>
      )}
      {water && (
        <SatelliteDish ox={w * 0.22} oy={halfH} oz={0} />
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Neon Building Accents
═══════════════════════════════════════════════ */
const NEON_DEFS = [
  { x:  0.00, y: 4.62, z:  0.55, color: CYAN,   w: 0.58, h: 0.09 },
  { x:  1.90, y: 3.72, z:  0.53, color: PURPLE, w: 0.44, h: 0.08 },
  { x: -1.80, y: 3.06, z:  0.50, color: GREEN,  w: 0.36, h: 0.07 },
  { x:  0.60, y: 2.62, z:  0.48, color: CYAN,   w: 0.30, h: 0.07 },
  { x:  3.10, y: 2.40, z:  0.44, color: PINK,   w: 0.28, h: 0.07 },
  { x: -3.20, y: 2.02, z:  0.42, color: PURPLE, w: 0.26, h: 0.06 },
  { x:  0.00, y: 4.62, z: -0.55, color: GREEN,  w: 0.44, h: 0.09 },
  { x:  1.90, y: 3.72, z: -0.53, color: CYAN,   w: 0.34, h: 0.07 },
  { x: -1.80, y: 3.06, z: -0.50, color: PINK,   w: 0.30, h: 0.07 },
];

function BuildingNeonAccents() {
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    matRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 1.2 + i * 1.1) * 0.7;
    });
  });
  return (
    <>
      {NEON_DEFS.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <boxGeometry args={[n.w, n.h, 0.016]} />
          <meshStandardMaterial ref={el => { matRefs.current[i] = el; }}
            color={n.color} emissive={n.color} emissiveIntensity={1.5} roughness={0.08} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Ground
═══════════════════════════════════════════════ */
function Ground({ night }: { night: boolean }) {
  return (
    <>
      {/* Dark asphalt base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#050D18" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Road grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[20, 20, 8, 8]} />
        <meshStandardMaterial color="#0A1828" roughness={0.85} metalness={0.15} wireframe />
      </mesh>
      {/* Center intersection glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[2.2, 24]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.08} transparent opacity={0.25} roughness={0.1} />
      </mesh>
      {/* Road lines */}
      {[[-1.5, 0, 20, 0.08], [1.5, 0, 20, 0.08], [0, -1.5, 0.08, 20], [0, 1.5, 0.08, 20]].map(([rx, rz, rw, rd], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[rx, 0.005, rz]}>
          <planeGeometry args={[rw, rd]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} transparent opacity={0.18} roughness={0.1} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Mini AI Traffic light
═══════════════════════════════════════════════ */
const HERO_TL_DEFS: Array<{ x: number; z: number; rot: number; off: number }> = [
  { x:  1.55, z:  0.85, rot: 0,            off: 0.0 },
  { x: -1.55, z: -0.85, rot: Math.PI,      off: 2.0 },
  { x:  0.85, z:  1.55, rot: Math.PI / 2,  off: 1.0 },
  { x: -0.85, z: -1.55, rot: -Math.PI / 2, off: 3.0 },
];

function MiniTrafficLight({ x, z, rot, off }: { x: number; z: number; rot: number; off: number }) {
  const grnRef = useRef<THREE.MeshStandardMaterial>(null);
  const redRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() + off) % 5;
    const isGrn = phase < 2.5;
    if (grnRef.current) grnRef.current.emissiveIntensity = isGrn ? 5.0 : 0.05;
    if (redRef.current) redRef.current.emissiveIntensity = isGrn ? 0.05 : 5.0;
  });

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 1.1, 5]} />
        <meshStandardMaterial color="#1A3050" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.14, 1.05, 0]}>
        <boxGeometry args={[0.07, 0.18, 0.06]} />
        <meshStandardMaterial color="#0A1828" roughness={0.5} />
      </mesh>
      <mesh position={[0.14, 1.10, 0.032]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial ref={grnRef} color={GREEN} emissive={GREEN} emissiveIntensity={5.0} roughness={0.1} />
      </mesh>
      <mesh position={[0.14, 1.00, 0.032]}>
        <sphereGeometry args={[0.022, 6, 6]} />
        <meshStandardMaterial ref={redRef} color="#ff2222" emissive="#ff2222" emissiveIntensity={0.05} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini AI lamp
═══════════════════════════════════════════════ */
const HERO_LAMP_DEFS: [number, number][] = [
  [-0.95, 1.60], [0.95, 1.60], [-0.95, -1.60], [0.95, -1.60],
  [-1.80, 0.20], [1.80, 0.20], [-1.80, -0.20], [1.80, -0.20],
  [0.20, -1.80], [-0.20, 1.80], [0.20, 2.80], [-0.20, -2.80],
  [2.80, 0.20], [-2.80, -0.20],
];

function MiniLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.012, 0.018, 1.04, 5]} />
        <meshStandardMaterial color="#1A3050" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0.12, 1.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.24, 4]} />
        <meshStandardMaterial color="#1A3050" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.24, 1.04, 0]}>
        <boxGeometry args={[0.06, 0.030, 0.04]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.5} roughness={0.05} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini bench
═══════════════════════════════════════════════ */
const HERO_BENCH_DEFS = [
  { x:  1.30, z:  0.55, r: 0.8 }, { x: -1.20, z:  0.80, r: 2.4 },
  { x:  0.80, z: -1.40, r: 4.8 }, { x: -1.10, z: -1.10, r: 1.2 },
  { x:  2.20, z:  1.20, r: 3.3 }, { x: -2.00, z: -1.40, r: 0.5 },
];

function MiniBench({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.36, 0.025, 0.13]} />
        <meshStandardMaterial color="#1A3050" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.25, -0.055]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.022]} />
        <meshStandardMaterial color="#1A3050" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Mini tree (data node cluster)
═══════════════════════════════════════════════ */
const HERO_TREE_DEFS = [
  { x:  2.6, z:  0.6, h: 0.8, r: 0.28 }, { x: -2.4, z:  0.8, h: 0.7, r: 0.24 },
  { x:  0.8, z:  2.8, h: 0.6, r: 0.22 }, { x: -0.8, z: -2.6, h: 0.9, r: 0.26 },
  { x:  2.5, z: -2.2, h: 0.7, r: 0.24 }, { x: -2.8, z: -2.4, h: 0.6, r: 0.20 },
  { x:  3.5, z:  2.0, h: 0.5, r: 0.18 }, { x: -3.4, z:  2.0, h: 0.6, r: 0.20 },
];

function MiniTree({ x, z, h, r }: { x: number; z: number; h: number; r: number }) {
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.emissiveIntensity = 0.3 + Math.sin(clock.getElapsedTime() * 1.5 + x * 3) * 0.2;
    }
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h * 0.3, 0]}>
        <cylinderGeometry args={[0.018, 0.025, h * 0.55, 5]} />
        <meshStandardMaterial color="#1A3050" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, h * 0.78, 0]}>
        <sphereGeometry args={[r, 8, 8]} />
        <meshStandardMaterial ref={glowRef} color={GREEN} emissive={GREEN} emissiveIntensity={0.3} roughness={0.5} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Hero Traffic — AI vehicles + mini drones
═══════════════════════════════════════════════ */
const HERO_CARS = [
  { radius: 1.55, speed:  0.55, startAngle: 0.00, color: CYAN   },
  { radius: 1.55, speed:  0.55, startAngle: 3.14, color: PURPLE },
  { radius: 2.55, speed: -0.38, startAngle: 1.05, color: GREEN  },
  { radius: 2.55, speed: -0.38, startAngle: 4.20, color: PINK   },
  { radius: 3.50, speed:  0.28, startAngle: 0.80, color: CYAN   },
  { radius: 3.50, speed:  0.28, startAngle: 3.90, color: '#FBBF24' },
];

function MiniAIVehicle({ radius, speed, startAngle, color }: { radius: number; speed: number; startAngle: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = startAngle + t * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius);
      ref.current.rotation.y = Math.PI / 2 - angle;
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.38, 0.07, 0.18]} />
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.08} />
      </mesh>
      <mesh position={[0.02, 0.11, 0]}>
        <boxGeometry args={[0.18, 0.05, 0.14]} />
        <meshStandardMaterial color="#00D4FF" transparent opacity={0.35} metalness={0.95} roughness={0.02} />
      </mesh>
      <mesh position={[0.20, 0.07, 0.06]}>
        <boxGeometry args={[0.010, 0.028, 0.042]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.0} />
      </mesh>
      <mesh position={[0.20, 0.07, -0.06]}>
        <boxGeometry args={[0.010, 0.028, 0.042]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.0} />
      </mesh>
      <pointLight position={[0, -0.04, 0]} color={color} intensity={0.3} distance={0.8} decay={2} />
    </group>
  );
}

/* Mini surveillance drone */
const HERO_DRONES = [
  { orbitR: 3.8, orbitH: 4.2, speed:  0.55, startA: 0.0, color: CYAN   },
  { orbitR: 5.5, orbitH: 6.5, speed: -0.42, startA: 2.1, color: PURPLE },
  { orbitR: 2.5, orbitH: 3.2, speed:  0.70, startA: 4.2, color: GREEN  },
  { orbitR: 7.0, orbitH: 8.0, speed:  0.30, startA: 1.0, color: PINK   },
];

function MiniDrone({ orbitR, orbitH, speed, startA, color }: { orbitR: number; orbitH: number; speed: number; startA: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const blinkRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = startA + t * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(angle) * orbitR, orbitH + Math.sin(t * 0.9 + startA) * 0.35, Math.sin(angle) * orbitR);
      ref.current.rotation.y = Math.PI / 2 - angle;
    }
    if (blinkRef.current) {
      blinkRef.current.emissiveIntensity = ((t * 2.8 + startA) % 1) < 0.12 ? 6.0 : 0.15;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.10, 0.040, 0.10]} />
        <meshStandardMaterial color="#1A2A3A" metalness={0.85} roughness={0.15} />
      </mesh>
      {([0, 1, 2, 3] as number[]).map(i => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.07, 0.008, Math.sin(a) * 0.07]}>
            <cylinderGeometry args={[0.035, 0.035, 0.005, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.50} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.028, 0]}>
        <sphereGeometry args={[0.007, 5, 5]} />
        <meshStandardMaterial ref={blinkRef} color={color} emissive={color} emissiveIntensity={6.0} />
      </mesh>
      <pointLight position={[0, -0.04, 0]} color={color} intensity={0.25} distance={1.5} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Crosswalk neon markings
═══════════════════════════════════════════════ */
function CrosswalkMarkings() {
  return (
    <>
      {[
        { x:  1.55, z: 0.00, rot: 0 },
        { x: -1.55, z: 0.00, rot: 0 },
        { x:  0.00, z: 1.55, rot: Math.PI / 2 },
        { x:  0.00, z: -1.55, rot: Math.PI / 2 },
      ].map((cw, ci) => (
        <group key={ci} position={[cw.x, 0.006, cw.z]} rotation={[0, cw.rot, 0]}>
          {Array.from({ length: 5 }, (_, j) => (
            <mesh key={j} position={[(j - 2) * 0.19, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.09, 0.50]} />
              <meshBasicMaterial color={CYAN} opacity={0.18} transparent />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Rooftop server / tech units
═══════════════════════════════════════════════ */
const TECH_UNITS = [
  { x:  0.25, y: 5.03, z:  0.25 }, { x: -0.25, y: 5.03, z: -0.25 },
  { x:  1.90, y: 4.05, z:  0.30 }, { x: -1.80, y: 3.45, z:  0.30 },
];

function RooftopTechUnits() {
  const diskRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ledRefs  = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    diskRefs.current.forEach((r, i) => { if (r) r.rotation.y += 0.04 * (1 + i * 0.2); });
    ledRefs.current.forEach((mat, i) => {
      if (mat) mat.emissiveIntensity = 1.0 + Math.sin(t * 3 + i * 1.2) * 0.7;
    });
  });

  return (
    <>
      {TECH_UNITS.map((u, i) => (
        <group key={i} position={[u.x, u.y, u.z]}>
          <mesh>
            <boxGeometry args={[0.18, 0.10, 0.12]} />
            <meshStandardMaterial color="#0D1E30" metalness={0.85} roughness={0.18} />
          </mesh>
          <mesh ref={el => { diskRefs.current[i] = el; }} position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.048, 0.048, 0.030, 8]} />
            <meshStandardMaterial color="#1A3050" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0.07, 0.02, 0.065]}>
            <boxGeometry args={[0.04, 0.018, 0.004]} />
            <meshStandardMaterial ref={el => { ledRefs.current[i] = el; }}
              color={i % 2 === 0 ? CYAN : GREEN} emissive={i % 2 === 0 ? CYAN : GREEN} emissiveIntensity={1.0} roughness={0.05} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   HorizonGlow (neon ring)
═══════════════════════════════════════════════ */
function HorizonGlow() {
  const pr = useContext(ProgressCtx);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.5 + Math.sin(t * 0.7) * 0.08;
    matRef.current.opacity = THREE.MathUtils.lerp(0.12, 0.28, pr.current) * pulse;
    matRef.current.color.lerpColors(new THREE.Color(CYAN), new THREE.Color(PURPLE), pr.current);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <ringGeometry args={[2.5, 9, 64]} />
      <meshBasicMaterial ref={matRef} color={CYAN} opacity={0.12} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   Camera — cinematic drift
═══════════════════════════════════════════════ */
function CameraDrift() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.set(
      10 + Math.cos(t * 0.14) * 1.2,
      7  + Math.sin(t * 0.22) * 1.8,
      10 + Math.sin(t * 0.11) * 0.9,
    );
    camera.lookAt(0, 1.8, 0);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   CityGroup — all hero scene objects
═══════════════════════════════════════════════ */
function CityGroup({ night }: { night: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.12; });
  return (
    <group ref={ref}>
      <Ground night={night} />
      <DataGrid />
      <CrosswalkMarkings />
      {BUILDINGS.map((b, i) => <Building key={i} {...b} night={night} />)}
      <BuildingNeonAccents />
      <RooftopTechUnits />
      <NeuralBrainOrb />
      {HERO_CARS.map((c, i) => <MiniAIVehicle key={`hc-${i}`} {...c} />)}
      {HERO_DRONES.map((d, i) => <MiniDrone key={`hd-${i}`} {...d} />)}
      {HERO_TREE_DEFS.map((t, i) => <MiniTree key={`t-${i}`} {...t} />)}
      {HERO_LAMP_DEFS.map(([x, z], i) => <MiniLamp key={`l-${i}`} x={x} z={z} />)}
      {HERO_BENCH_DEFS.map((b, i) => <MiniBench key={`bh-${i}`} x={b.x} z={b.z} r={b.r} />)}
      {HERO_TL_DEFS.map((tl, i) => <MiniTrafficLight key={`tl-${i}`} {...tl} />)}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Icons
═══════════════════════════════════════════════ */
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Main export
═══════════════════════════════════════════════ */
export default function HeroCity3D() {
  const [night, setNight] = useState(false);
  const progressRef = useRef(0);
  const toggle = useCallback(() => setNight(v => !v), []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [10, 7, 10], fov: 52 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <color attach="background" args={['#060D1F']} />
        <fog attach="fog" args={['#04080F', 14, 34]} />

        <ProgressCtx.Provider value={progressRef}>
          <Suspense fallback={null}>
            <CameraAdjuster />
            <TransitionDriver night={night} />
            <DynamicSky />
            <DynamicLights />
            <CameraDrift />
            <CityGroup night={night} />
            <Stars />
            <Particles />
            <Aurora />
            <SearchBeams />
            <HoloRings />
            <HorizonGlow />
          </Suspense>
        </ProgressCtx.Provider>
      </Canvas>

      {/* Night/Day toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute',
          bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          right: 'max(16px, env(safe-area-inset-right, 16px))',
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 12px', borderRadius: '20px',
          border: `1px solid rgba(0,212,255,${night ? '0.35' : '0.22'})`,
          background: night ? 'rgba(2,5,16,0.80)' : 'rgba(6,13,31,0.60)',
          color: night ? '#00D4FF' : 'rgba(255,255,255,0.85)',
          fontSize: '12px', fontFamily: 'inherit', fontWeight: 500,
          cursor: 'pointer', backdropFilter: 'blur(10px)',
          transition: 'all 0.4s ease', zIndex: 10, letterSpacing: '0.01em',
          boxShadow: night ? '0 0 12px rgba(0,212,255,0.2)' : 'none',
        }}
      >
        {night ? <SunIcon /> : <MoonIcon />}
        {night ? 'Day Mode' : 'Night Mode'}
      </button>
    </div>
  );
}
