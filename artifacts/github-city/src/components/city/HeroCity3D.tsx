import {
  Canvas, useFrame, useThree,
} from '@react-three/fiber';
import {
  createContext, useContext, useRef, useMemo,
  Suspense, useState, useCallback, useEffect,
} from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════
   Responsive camera — globe view
═══════════════════════════════════════════════ */
function CameraAdjuster() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const portrait = size.height > size.width;
    if (portrait) { cam.fov = 68; cam.position.set(0, 2, 14.5); }
    else           { cam.fov = 55; cam.position.set(0, 1.5, 12.5); }
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/* ═══════════════════════════════════════════════
   Shared transition context (0 = bright, 1 = night)
═══════════════════════════════════════════════ */
const ProgressCtx = createContext<React.MutableRefObject<number>>({ current: 0 });

function TransitionDriver({ night }: { night: boolean }) {
  const pr = useContext(ProgressCtx);
  useFrame((_, dt) => { pr.current = THREE.MathUtils.lerp(pr.current, night ? 1 : 0, dt * 1.6); });
  return null;
}

/* ═══════════════════════════════════════════════
   Color palette
═══════════════════════════════════════════════ */
const CYAN   = '#00D4FF';
const PURPLE = '#9D00FF';
const GREEN  = '#00FF94';
const PINK   = '#FF0090';
const GOLD   = '#FFB700';
const ORANGE = '#FF6B00';

/* ═══════════════════════════════════════════════
   Dynamic sky + fog
═══════════════════════════════════════════════ */
const SKY_A = new THREE.Color('#060D1F');
const SKY_B = new THREE.Color('#020509');
const FOG_A = new THREE.Color('#04080F');
const FOG_B = new THREE.Color('#010306');

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
  const pr  = useContext(ProgressCtx);
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const dirRef  = useRef<THREE.DirectionalLight>(null);
  const dir2Ref = useRef<THREE.DirectionalLight>(null);
  const c1Ref   = useRef<THREE.PointLight>(null);
  const c2Ref   = useRef<THREE.PointLight>(null);
  const c3Ref   = useRef<THREE.PointLight>(null);
  const c4Ref   = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t  = pr.current;
    const time = clock.getElapsedTime();
    if (ambRef.current)  ambRef.current.intensity  = THREE.MathUtils.lerp(0.28, 0.10, t);
    if (dirRef.current)  dirRef.current.intensity  = THREE.MathUtils.lerp(0.80, 0.18, t);
    if (dir2Ref.current) dir2Ref.current.intensity = THREE.MathUtils.lerp(0.18, 0.08, t);
    if (c1Ref.current)   c1Ref.current.intensity   = THREE.MathUtils.lerp(1.2, 2.8, t) * (0.9 + Math.sin(time * 0.8) * 0.1);
    if (c2Ref.current)   c2Ref.current.intensity   = THREE.MathUtils.lerp(0.8, 1.8, t);
    if (c3Ref.current)   c3Ref.current.intensity   = THREE.MathUtils.lerp(0.6, 1.4, t);
    if (c4Ref.current)   c4Ref.current.intensity   = THREE.MathUtils.lerp(0.6, 1.8, t) * (0.9 + Math.cos(time * 1.3) * 0.1);
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.28} color="#1A3060" />
      <directionalLight ref={dirRef} position={[10, 16, 8]} intensity={0.8} color="#A0C8FF" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-near={0.5} shadow-camera-far={60}
        shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <directionalLight ref={dir2Ref} position={[-8, 6, -6]} intensity={0.18} color="#6040AA" />
      <pointLight ref={c1Ref} position={[0, 14, 0]}  color={CYAN}   intensity={1.2} distance={22} />
      <pointLight ref={c2Ref} position={[-6, 3, 5]}  color={PURPLE} intensity={0.8} distance={14} />
      <pointLight ref={c3Ref} position={[6,  3, -5]} color={GREEN}  intensity={0.6} distance={12} />
      <pointLight ref={c4Ref} position={[0,  -4, 0]} color={CYAN}   intensity={0.6} distance={10} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   Stars
═══════════════════════════════════════════════ */
const STARS_DATA = Array.from({ length: 180 }, (_, i) => {
  const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
  const theta = rng(i * 2.3) * Math.PI * 2;
  const phi   = Math.acos(1 - rng(i * 3.7) * 1.6);
  const r     = 16 + rng(i * 1.7) * 8;
  const cols  = [CYAN, PURPLE, '#ffffff', GREEN, '#A0C0FF', GOLD];
  return {
    pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)] as [number,number,number],
    col: cols[i % cols.length],
  };
});

function Stars() {
  const pr   = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        THREE.MathUtils.lerp(0.08, 0.70, Math.max(0, (p - 0.2) / 0.8)) *
        (0.5 + (i % 5) * 0.1) * (0.8 + Math.sin(t * 1.4 + i) * 0.2);
    });
  });
  return (
    <>
      {STARS_DATA.map((s, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={s.pos}>
          <sphereGeometry args={[0.032 + (i % 4) * 0.012, 4, 4]} />
          <meshBasicMaterial color={s.col} opacity={0} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   AI Data particles — float around globe
═══════════════════════════════════════════════ */
function Particles() {
  const pr    = useContext(ProgressCtx);
  const PCOLS = [CYAN, PURPLE, GREEN, PINK, GOLD, '#3B82F6'];
  const defs  = useMemo(() => {
    const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: 100 }, (_, i) => ({
      x: (rng(i * 3.1) - 0.5) * 22,
      z: (rng(i * 7.3) - 0.5) * 22,
      y: (rng(i * 2.7) - 0.5) * 18,
      speed: 0.18 + rng(i * 5.1) * 0.40,
      size:  0.018 + rng(i * 1.9) * 0.030,
      col:   PCOLS[i % PCOLS.length],
    }));
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs  = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((_, dt) => {
    const p = pr.current;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y += dt * defs[i].speed;
      if (mesh.position.y > 12) mesh.position.y = -10;
    });
    matRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = THREE.MathUtils.lerp(0.06, 0.55, p) * (0.4 + (i % 4) * 0.15);
    });
  });

  return (
    <>
      {defs.map((d, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.size, 4, 4]} />
          <meshBasicMaterial ref={el => { matRefs.current[i] = el; }}
            color={d.col} opacity={0.06} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Aurora bands — neon energy halos
═══════════════════════════════════════════════ */
const AURORA_DEFS = [
  { color: CYAN,   h: 11, sz: 28, sp: 0.22, phase: 0   },
  { color: PURPLE, h: 13, sz: 26, sp: 0.16, phase: 2.1 },
  { color: GREEN,  h: 15, sz: 24, sp: 0.30, phase: 4.5 },
  { color: PINK,   h: 10, sz: 22, sp: 0.18, phase: 1.8 },
];

function Aurora() {
  const pr   = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const a = AURORA_DEFS[i];
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (p * 0.16 + 0.03) * (0.5 + Math.sin(t * a.sp + a.phase) * 0.4);
      mesh.position.y = a.h + Math.sin(t * 0.20 + a.phase) * 0.8;
      mesh.rotation.y = t * 0.014 * (i % 2 === 0 ? 1 : -1);
    });
  });
  return (
    <>
      {AURORA_DEFS.map((a, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}
          rotation={[Math.PI / 2, 0, i * 0.7]} position={[0, a.h, 0]}>
          <planeGeometry args={[a.sz, a.sz]} />
          <meshBasicMaterial color={a.color} opacity={0} transparent side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Building materials
═══════════════════════════════════════════════ */
const MATS = {
  glass:    { body: '#040E22', metal: 0.92, rough: 0.04, win: CYAN,   winB: '#0AF0FF' },
  classic:  { body: '#0A041E', metal: 0.82, rough: 0.12, win: PURPLE, winB: '#CC44FF' },
  concrete: { body: '#031410', metal: 0.60, rough: 0.30, win: GREEN,  winB: '#44FFAA' },
  warm:     { body: '#180410', metal: 0.88, rough: 0.08, win: PINK,   winB: '#FF44CC' },
  dark:     { body: '#020612', metal: 0.96, rough: 0.03, win: GOLD,   winB: ORANGE   },
} as const;
type MatKey = keyof typeof MATS;

/* ═══════════════════════════════════════════════
   Globe geometry helper
═══════════════════════════════════════════════ */
const GLOBE_R = 4.2;

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/* ═══════════════════════════════════════════════
   Globe buildings dataset — 8 AI city clusters
═══════════════════════════════════════════════ */
interface GlobeBldg { lat: number; lon: number; h: number; w: number; type: MatKey }

const GLOBE_BUILDINGS: GlobeBldg[] = [
  // ⚡ NeoTokyo
  { lat:  35.0, lon: 139.0, h: 0.45, w: 0.110, type: 'glass'    },
  { lat:  35.4, lon: 139.3, h: 0.34, w: 0.090, type: 'dark'     },
  { lat:  34.7, lon: 138.8, h: 0.30, w: 0.090, type: 'classic'  },
  { lat:  35.2, lon: 138.5, h: 0.24, w: 0.080, type: 'glass'    },
  { lat:  34.5, lon: 139.5, h: 0.20, w: 0.075, type: 'warm'     },
  { lat:  35.8, lon: 139.0, h: 0.18, w: 0.070, type: 'concrete' },
  { lat:  35.0, lon: 139.8, h: 0.16, w: 0.065, type: 'dark'     },
  { lat:  34.3, lon: 139.2, h: 0.14, w: 0.065, type: 'classic'  },

  // 🔮 CyberBerlin
  { lat:  52.0, lon:  13.0, h: 0.42, w: 0.120, type: 'dark'     },
  { lat:  52.3, lon:  13.4, h: 0.32, w: 0.090, type: 'classic'  },
  { lat:  51.7, lon:  12.7, h: 0.28, w: 0.090, type: 'glass'    },
  { lat:  52.5, lon:  12.5, h: 0.22, w: 0.080, type: 'warm'     },
  { lat:  51.5, lon:  13.8, h: 0.18, w: 0.070, type: 'concrete' },
  { lat:  52.8, lon:  13.2, h: 0.16, w: 0.065, type: 'dark'     },
  { lat:  51.3, lon:  12.4, h: 0.13, w: 0.065, type: 'classic'  },

  // 🌟 DigitalDubai (tallest cluster)
  { lat:  25.0, lon:  55.0, h: 0.55, w: 0.130, type: 'warm'     },
  { lat:  25.4, lon:  55.3, h: 0.42, w: 0.105, type: 'dark'     },
  { lat:  24.7, lon:  54.7, h: 0.36, w: 0.100, type: 'glass'    },
  { lat:  25.6, lon:  54.5, h: 0.28, w: 0.090, type: 'warm'     },
  { lat:  24.5, lon:  55.6, h: 0.24, w: 0.085, type: 'classic'  },
  { lat:  25.2, lon:  55.8, h: 0.20, w: 0.075, type: 'concrete' },
  { lat:  25.8, lon:  55.1, h: 0.17, w: 0.070, type: 'warm'     },
  { lat:  24.3, lon:  55.2, h: 0.14, w: 0.065, type: 'dark'     },

  // 🍃 SynthSingapore
  { lat:   1.0, lon: 104.0, h: 0.38, w: 0.100, type: 'glass'    },
  { lat:   1.3, lon: 104.3, h: 0.28, w: 0.085, type: 'concrete' },
  { lat:   0.7, lon: 103.7, h: 0.24, w: 0.080, type: 'dark'     },
  { lat:   1.5, lon: 103.5, h: 0.20, w: 0.075, type: 'warm'     },
  { lat:   0.5, lon: 104.6, h: 0.17, w: 0.070, type: 'classic'  },
  { lat:   1.8, lon: 104.1, h: 0.14, w: 0.065, type: 'glass'    },

  // 🗽 QuantumNYC
  { lat:  41.0, lon: -74.0, h: 0.50, w: 0.120, type: 'glass'    },
  { lat:  41.3, lon: -73.7, h: 0.40, w: 0.100, type: 'dark'     },
  { lat:  40.7, lon: -74.3, h: 0.33, w: 0.095, type: 'classic'  },
  { lat:  41.5, lon: -74.5, h: 0.27, w: 0.085, type: 'glass'    },
  { lat:  40.5, lon: -73.5, h: 0.22, w: 0.080, type: 'warm'     },
  { lat:  41.8, lon: -73.8, h: 0.18, w: 0.070, type: 'concrete' },
  { lat:  40.3, lon: -74.6, h: 0.15, w: 0.065, type: 'dark'     },

  // 🌺 NexusSaoPaulo
  { lat: -23.0, lon: -47.0, h: 0.35, w: 0.100, type: 'concrete' },
  { lat: -22.7, lon: -46.7, h: 0.26, w: 0.085, type: 'warm'     },
  { lat: -23.4, lon: -47.4, h: 0.22, w: 0.080, type: 'glass'    },
  { lat: -22.5, lon: -47.6, h: 0.18, w: 0.070, type: 'classic'  },
  { lat: -23.8, lon: -46.5, h: 0.14, w: 0.065, type: 'dark'     },
  { lat: -22.2, lon: -47.1, h: 0.12, w: 0.065, type: 'concrete' },

  // 🦘 ByteSydney
  { lat: -34.0, lon: 151.0, h: 0.33, w: 0.100, type: 'classic'  },
  { lat: -33.7, lon: 151.3, h: 0.25, w: 0.085, type: 'glass'    },
  { lat: -34.4, lon: 150.7, h: 0.21, w: 0.080, type: 'dark'     },
  { lat: -33.5, lon: 150.5, h: 0.17, w: 0.070, type: 'warm'     },
  { lat: -34.7, lon: 151.5, h: 0.14, w: 0.065, type: 'concrete' },

  // 🔥 NeuralLagos
  { lat:   6.0, lon:   3.0, h: 0.30, w: 0.095, type: 'warm'     },
  { lat:   6.3, lon:   3.3, h: 0.22, w: 0.075, type: 'dark'     },
  { lat:   5.7, lon:   2.7, h: 0.18, w: 0.070, type: 'classic'  },
  { lat:   6.5, lon:   2.5, h: 0.15, w: 0.065, type: 'glass'    },
  { lat:   5.5, lon:   3.6, h: 0.13, w: 0.065, type: 'concrete' },
];

/* ═══════════════════════════════════════════════
   Globe building component
═══════════════════════════════════════════════ */
function GlobeBuilding({ lat, lon, h, w, type }: GlobeBldg) {
  const mat    = MATS[type];
  const roofRef = useRef<THREE.MeshStandardMaterial>(null);
  const antRef  = useRef<THREE.MeshStandardMaterial>(null);

  const { pos, quat } = useMemo(() => {
    const surface = latLonToVec3(lat, lon, GLOBE_R);
    const dir     = surface.clone().normalize();
    const center  = surface.clone().add(dir.clone().multiplyScalar(h / 2));
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), dir,
    );
    return { pos: center, quat: quaternion };
  }, [lat, lon, h]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (roofRef.current) roofRef.current.emissiveIntensity = 1.4 + Math.sin(t * 2.0 + lat * 0.4) * 0.8;
    if (antRef.current)  antRef.current.emissiveIntensity  = 2.5 + Math.sin(t * 3.0 + lon * 0.1) * 1.0;
  });

  return (
    <group position={pos} quaternion={quat}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={mat.body} metalness={mat.metal} roughness={mat.rough} />
      </mesh>
      {/* Front windows */}
      {Array.from({ length: Math.max(2, Math.round(h * 14)) }, (_, r) =>
        Array.from({ length: 2 }, (_, c) => {
          const rows = Math.max(2, Math.round(h * 14));
          const lit  = (r + c) % 3 !== 0;
          const wCol = c % 2 === 0 ? mat.win : mat.winB;
          return (
            <mesh key={`${r}-${c}`}
              position={[(c - 0.5) * w * 0.38, -h / 2 + (r + 0.8) * (h / rows), w / 2 + 0.003]}>
              <planeGeometry args={[w * 0.22, h * 0.042]} />
              <meshStandardMaterial color={wCol} emissive={wCol}
                emissiveIntensity={lit ? 1.6 : 0.25} roughness={0.1} />
            </mesh>
          );
        })
      )}
      {/* Roof glow strip */}
      <mesh position={[0, h / 2 + 0.006, 0]}>
        <boxGeometry args={[w + 0.012, 0.012, w + 0.012]} />
        <meshStandardMaterial ref={roofRef} color={mat.win} emissive={mat.win} emissiveIntensity={1.5} roughness={0.04} />
      </mesh>
      {/* Antenna on tall buildings */}
      {h > 0.32 && (
        <>
          <mesh position={[0, h / 2 + 0.055, 0]}>
            <cylinderGeometry args={[0.003, 0.005, 0.11, 4]} />
            <meshStandardMaterial color="#1A2A3A" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, h / 2 + 0.12, 0]}>
            <sphereGeometry args={[0.007, 5, 5]} />
            <meshStandardMaterial ref={antRef} color={mat.win} emissive={mat.win} emissiveIntensity={3.0} roughness={0.04} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Globe sphere — core + wireframe grid + atmosphere
═══════════════════════════════════════════════ */
function GlobeSphere() {
  const pr      = useContext(ProgressCtx);
  const atmRef  = useRef<THREE.MeshBasicMaterial>(null);
  const gridRef = useRef<THREE.MeshBasicMaterial>(null);
  const atmRef2 = useRef<THREE.MeshBasicMaterial>(null);
  const coreRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    if (atmRef.current)  atmRef.current.opacity  = 0.10 + Math.sin(t * 0.45) * 0.04 + p * 0.05;
    if (atmRef2.current) atmRef2.current.opacity = 0.04 + Math.sin(t * 0.28) * 0.02 + p * 0.03;
    if (gridRef.current) gridRef.current.opacity = 0.07 + Math.sin(t * 0.35) * 0.025;
    if (coreRef.current) coreRef.current.emissiveIntensity = 0.05 + p * 0.08;
  });

  return (
    <>
      {/* Ocean core */}
      <mesh>
        <sphereGeometry args={[GLOBE_R, 48, 36]} />
        <meshStandardMaterial ref={coreRef} color="#020C1E" emissive="#081830" emissiveIntensity={0.05}
          metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Grid wireframe */}
      <mesh>
        <sphereGeometry args={[GLOBE_R + 0.012, 24, 18]} />
        <meshBasicMaterial ref={gridRef} color={CYAN} wireframe transparent opacity={0.07} depthWrite={false} />
      </mesh>
      {/* Second grid — latitude-emphasis */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <sphereGeometry args={[GLOBE_R + 0.018, 18, 12]} />
        <meshBasicMaterial color={PURPLE} wireframe transparent opacity={0.03} depthWrite={false} />
      </mesh>
      {/* Inner atmosphere glow */}
      <mesh>
        <sphereGeometry args={[GLOBE_R + 0.22, 32, 24]} />
        <meshBasicMaterial ref={atmRef} color={CYAN} transparent opacity={0.10}
          side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Outer atmosphere fringe */}
      <mesh>
        <sphereGeometry args={[GLOBE_R + 0.55, 32, 24]} />
        <meshBasicMaterial ref={atmRef2} color={PURPLE} transparent opacity={0.04}
          side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════════
   City cluster glow orbs
═══════════════════════════════════════════════ */
const CITY_CENTERS = [
  { lat:  35, lon: 139, color: CYAN,   r: 0.20 },
  { lat:  52, lon:  13, color: PURPLE, r: 0.18 },
  { lat:  25, lon:  55, color: GOLD,   r: 0.22 },
  { lat:   1, lon: 104, color: GREEN,  r: 0.16 },
  { lat:  41, lon: -74, color: CYAN,   r: 0.20 },
  { lat: -23, lon: -47, color: PINK,   r: 0.15 },
  { lat: -34, lon: 151, color: ORANGE, r: 0.14 },
  { lat:   6, lon:   3, color: GREEN,  r: 0.14 },
];

function CityGlows() {
  const glowRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    glowRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = 0.20 + Math.sin(t * 1.1 + i * 0.85) * 0.15;
    });
  });
  return (
    <>
      {CITY_CENTERS.map((c, i) => {
        const p = latLonToVec3(c.lat, c.lon, GLOBE_R + c.r * 0.5);
        return (
          <group key={i} position={p}>
            <mesh>
              <sphereGeometry args={[c.r, 10, 8]} />
              <meshBasicMaterial ref={el => { glowRefs.current[i] = el; }}
                color={c.color} transparent opacity={0.20} depthWrite={false} />
            </mesh>
            <pointLight color={c.color} intensity={0.9} distance={2.8} decay={2} />
          </group>
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Connection arcs between city clusters
═══════════════════════════════════════════════ */
const ARC_PAIRS = [
  { from: [ 35,  139] as [number,number], to: [ 41,  -74] as [number,number], color: CYAN,   lift: 1.2 },
  { from: [ 35,  139] as [number,number], to: [  1,  104] as [number,number], color: GREEN,  lift: 0.7 },
  { from: [ 52,   13] as [number,number], to: [  6,    3] as [number,number], color: PURPLE, lift: 0.8 },
  { from: [ 25,   55] as [number,number], to: [ 52,   13] as [number,number], color: GOLD,   lift: 0.6 },
  { from: [ 41,  -74] as [number,number], to: [ 52,   13] as [number,number], color: CYAN,   lift: 1.0 },
  { from: [  1,  104] as [number,number], to: [-34,  151] as [number,number], color: GREEN,  lift: 0.5 },
  { from: [-23,  -47] as [number,number], to: [ 41,  -74] as [number,number], color: PINK,   lift: 0.7 },
  { from: [ 25,   55] as [number,number], to: [  1,  104] as [number,number], color: ORANGE, lift: 0.6 },
];

function buildArcPoints(from: [number,number], to: [number,number], R: number, lift: number, n = 32): THREE.Vector3[] {
  const p1 = latLonToVec3(from[0], from[1], R);
  const p2 = latLonToVec3(to[0],   to[1],   R);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = p1.clone().lerp(p2, t).normalize();
    p.multiplyScalar(R + Math.sin(Math.PI * t) * lift);
    pts.push(p);
  }
  return pts;
}

function ConnectionArc({ from, to, color, lift }: typeof ARC_PAIRS[0]) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const pts    = useMemo(() => buildArcPoints(from, to, GLOBE_R, lift), [from, to, lift]);
  const geo    = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts]);
  const obj    = useMemo(() => {
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false });
    const l = new THREE.Line(geo, m);
    return l;
  }, [geo, color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    (obj.material as THREE.LineBasicMaterial).opacity = 0.18 + Math.sin(t * 0.75 + lift) * 0.14;
  });

  return <primitive object={obj} />;
}

function ConnectionArcs() {
  return <>{ARC_PAIRS.map((a, i) => <ConnectionArc key={i} {...a} />)}</>;
}

/* ═══════════════════════════════════════════════
   Globe beam pillars — shoot outward from cities
═══════════════════════════════════════════════ */
function GlobeBeams() {
  const pr      = useContext(ProgressCtx);
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const beamData = useMemo(() => CITY_CENTERS.map(c => {
    const dir  = latLonToVec3(c.lat, c.lon, 1).normalize();
    const base = latLonToVec3(c.lat, c.lon, GLOBE_R + 0.08);
    const len  = 2.5;
    const ctr  = base.clone().add(dir.clone().multiplyScalar(len / 2));
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { ctr, quat, color: c.color, len };
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    matRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.opacity = (0.03 + pr.current * 0.08) * (0.4 + Math.sin(t * 0.85 + i * 1.2) * 0.4);
    });
  });

  return (
    <>
      {beamData.map((d, i) => (
        <mesh key={i} position={d.ctr} quaternion={d.quat}>
          <coneGeometry args={[0.16, d.len, 10, 1, true]} />
          <meshBasicMaterial ref={el => { matRefs.current[i] = el; }}
            color={d.color} transparent opacity={0.04}
            side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Orbital ring satellites — torus rings at angle
═══════════════════════════════════════════════ */
const GLOBE_RINGS = [
  { r: GLOBE_R + 0.60, tube: 0.013, color: CYAN,   tiltX:  0.30, tiltZ:  0.00, sp:  0.45 },
  { r: GLOBE_R + 0.90, tube: 0.009, color: PURPLE,  tiltX: -0.55, tiltZ:  0.20, sp: -0.30 },
  { r: GLOBE_R + 1.25, tube: 0.007, color: PINK,    tiltX:  1.10, tiltZ: -0.30, sp:  0.20 },
  { r: GLOBE_R + 1.60, tube: 0.006, color: GREEN,   tiltX: -0.20, tiltZ:  0.80, sp: -0.15 },
];

function GlobeRings() {
  const pr   = useContext(ProgressCtx);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.y = t * GLOBE_RINGS[i].sp;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.18 + Math.sin(t * 0.85 + i) * 0.10) * (0.45 + pr.current * 0.55);
    });
  });

  return (
    <>
      {GLOBE_RINGS.map((d, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} rotation={[d.tiltX, 0, d.tiltZ]}>
          <torusGeometry args={[d.r, d.tube, 8, 96]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════
   Orbital drones — fly tilted ellipses around globe
═══════════════════════════════════════════════ */
const GLOBE_DRONES = [
  { orbitR: GLOBE_R + 0.75, speed:  0.32, startA: 0.0, color: CYAN,   tiltX:  0.30 },
  { orbitR: GLOBE_R + 1.10, speed: -0.22, startA: 2.1, color: PURPLE, tiltX: -0.55 },
  { orbitR: GLOBE_R + 0.55, speed:  0.48, startA: 4.2, color: GREEN,  tiltX:  0.80 },
  { orbitR: GLOBE_R + 1.45, speed:  0.18, startA: 1.0, color: PINK,   tiltX: -0.20 },
  { orbitR: GLOBE_R + 0.95, speed: -0.36, startA: 3.1, color: GOLD,   tiltX:  1.10 },
];

function GlobeDrone({ orbitR, speed, startA, color, tiltX }: typeof GLOBE_DRONES[0]) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const blinkRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t     = clock.getElapsedTime();
    const angle = startA + t * speed;
    if (groupRef.current) groupRef.current.rotation.y = angle;
    if (innerRef.current) innerRef.current.position.set(orbitR, 0, 0);
    if (blinkRef.current) blinkRef.current.emissiveIntensity = ((t * 2.8 + startA) % 1) < 0.12 ? 6.0 : 0.15;
  });

  return (
    <group rotation={[tiltX, 0, 0]}>
      <group ref={groupRef}>
        <group ref={innerRef}>
          <mesh><boxGeometry args={[0.10, 0.040, 0.10]} />
            <meshStandardMaterial color="#1A2A3A" metalness={0.85} roughness={0.15} />
          </mesh>
          {([0, 1, 2, 3] as number[]).map(i => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.07, 0.008, Math.sin(a) * 0.07]}>
                <cylinderGeometry args={[0.030, 0.030, 0.005, 8]} />
                <meshStandardMaterial color={color} transparent opacity={0.5} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.028, 0]}>
            <sphereGeometry args={[0.007, 5, 5]} />
            <meshStandardMaterial ref={blinkRef} color={color} emissive={color} emissiveIntensity={6.0} />
          </mesh>
          <pointLight position={[0, -0.04, 0]} color={color} intensity={0.30} distance={2} decay={2} />
        </group>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Neural orb — floating above globe north pole
═══════════════════════════════════════════════ */
function NeuralOrb() {
  const pr      = useContext(ProgressCtx);
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const rings   = useRef<(THREE.Mesh | null)[]>([]);
  const nodes   = useRef<(THREE.Mesh | null)[]>([]);
  const COLS    = [CYAN, PURPLE, GREEN, PINK, GOLD, '#3B82F6'];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = pr.current;
    if (groupRef.current) groupRef.current.rotation.y = t * 0.3;
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.2) * 0.08;
      coreRef.current.scale.setScalar(s);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(t * 1.8) * 0.5 + p * 0.8;
    }
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      ring.rotation.x = t * (0.35 + i * 0.10);
      ring.rotation.z = t * (0.20 - i * 0.07);
      (ring.material as THREE.MeshBasicMaterial).opacity = (0.22 + Math.sin(t * 1.4 + i * 1.1) * 0.15) * (0.4 + p * 0.6);
    });
    nodes.current.forEach((node, i) => {
      if (!node) return;
      (node.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5 + Math.sin(t * 2.5 + i * 0.7) * 1.0;
    });
  });

  return (
    <group position={[0, GLOBE_R + 1.2, 0]}>
      <group ref={groupRef}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.22, 2]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.5} metalness={0.4} roughness={0.05} />
        </mesh>
        {[CYAN, PURPLE, GREEN].map((color, i) => (
          <mesh key={i} ref={el => { rings.current[i] = el; }} rotation={[i * Math.PI / 2.8, i * Math.PI / 3.5, 0]}>
            <torusGeometry args={[0.38 + i * 0.12, 0.011, 8, 36]} />
            <meshBasicMaterial color={color} transparent opacity={0.30} depthWrite={false} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const a = (i / 8) * Math.PI * 2;
          const r = 0.48 + (i % 3) * 0.07;
          return (
            <mesh key={`n-${i}`} ref={el => { nodes.current[i] = el; }}
              position={[Math.cos(a) * r, Math.sin(i * 0.8) * 0.18, Math.sin(a) * r]}>
              <sphereGeometry args={[0.025 + (i % 3) * 0.007, 6, 6]} />
              <meshStandardMaterial color={COLS[i % COLS.length]} emissive={COLS[i % COLS.length]} emissiveIntensity={1.5} roughness={0.05} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[0, 0, 0]} color={CYAN} intensity={2.0} distance={5} decay={2} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Camera drift — gentle orbit around globe
═══════════════════════════════════════════════ */
function CameraDrift() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.set(
      Math.sin(t * 0.06) * 2.2,
      1.5 + Math.sin(t * 0.10) * 2.2,
      12.5 + Math.cos(t * 0.06) * 1.8,
    );
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ═══════════════════════════════════════════════
   Globe group — everything that rotates with globe
═══════════════════════════════════════════════ */
function GlobeGroup() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.09; });
  return (
    <group ref={ref}>
      <GlobeSphere />
      {GLOBE_BUILDINGS.map((b, i) => <GlobeBuilding key={i} {...b} />)}
      <CityGlows />
      <ConnectionArcs />
      <GlobeBeams />
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
  const [night, setNight]   = useState(false);
  const progressRef = useRef(0);
  const toggle = useCallback(() => setNight(v => !v), []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 1.5, 12.5], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
      >
        <color attach="background" args={['#060D1F']} />
        <fog attach="fog" args={['#04080F', 18, 45]} />

        <ProgressCtx.Provider value={progressRef}>
          <Suspense fallback={null}>
            <CameraAdjuster />
            <TransitionDriver night={night} />
            <DynamicSky />
            <DynamicLights />
            <CameraDrift />
            <GlobeGroup />
            <GlobeRings />
            <NeuralOrb />
            {GLOBE_DRONES.map((d, i) => <GlobeDrone key={i} {...d} />)}
            <Stars />
            <Particles />
            <Aurora />
          </Suspense>
        </ProgressCtx.Provider>
      </Canvas>

      <button
        onClick={toggle}
        style={{
          position: 'absolute',
          bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          right:  'max(16px, env(safe-area-inset-right, 16px))',
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
