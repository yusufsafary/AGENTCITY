import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { BuildingData } from '../../types/github';
import { hashString } from '../../utils/colors';

interface TreesProps {
  buildings: BuildingData[];
  nightMode: boolean;
}

interface TreeDef {
  x: number;
  z: number;
  scale: number;
  type: 0 | 1 | 2; // 0=pine, 1=round, 2=palm
}

export default function Trees({ buildings, nightMode }: TreesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const cone1Ref = useRef<THREE.InstancedMesh>(null);
  const cone2Ref = useRef<THREE.InstancedMesh>(null);
  const sphereRef = useRef<THREE.InstancedMesh>(null);
  const palmRef  = useRef<THREE.InstancedMesh>(null);

  const trees = useMemo<TreeDef[]>(() => {
    const out: TreeDef[] = [];
    const rng = (s: number) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };

    buildings.forEach((b, bi) => {
      const h = hashString(b.repo.name);

      // Side trees (2 per building)
      const sides: [number, number][] = [
        [b.x - b.width / 2 - 0.85 + (rng(bi * 3.1) - 0.5) * 0.3,
         b.z + (rng(bi * 1.7) - 0.5) * b.depth * 0.6],
        [b.x + b.width / 2 + 0.85 + (rng(bi * 2.3) - 0.5) * 0.3,
         b.z + (rng(bi * 4.1) - 0.5) * b.depth * 0.6],
      ];

      sides.forEach(([x, z], si) => {
        out.push({
          x, z,
          scale: 0.65 + rng(bi * 7 + si) * 0.70,
          type: (h + si + bi) % 3 as 0 | 1 | 2,
        });
      });

      // Park cluster (extra trees when hasPark)
      if (b.hasPark) {
        for (let k = 0; k < 3; k++) {
          out.push({
            x: b.x + b.width + 0.5 + rng(bi * 11 + k * 3) * 0.7,
            z: b.z + (rng(bi * 5 + k) - 0.5) * b.depth,
            scale: 0.55 + rng(bi * 9 + k) * 0.55,
            type: (h + k) % 3 as 0 | 1 | 2,
          });
        }
      }
    });

    return out;
  }, [buildings]);

  // Segment by type
  const pines   = useMemo(() => trees.filter(t => t.type === 0), [trees]);
  const rounds  = useMemo(() => trees.filter(t => t.type === 1), [trees]);
  const palms   = useMemo(() => trees.filter(t => t.type === 2), [trees]);
  const allTrees = trees;

  const TRUNK_COLOR = nightMode ? '#1a0e04' : '#5c3d1e';
  const PINE_COLOR  = nightMode ? '#0d2a1a' : '#2d6a4f';
  const ROUND_COLOR = nightMode ? '#0a2818' : '#3a7a55';
  const PALM_COLOR  = nightMode ? '#0f2a10' : '#4a8a3a';

  useEffect(() => {
    const dummy = new THREE.Object3D();

    // Trunks (all trees)
    if (trunkRef.current) {
      allTrees.forEach((t, i) => {
        const trunkH = 0.75 * t.scale;
        dummy.position.set(t.x, trunkH / 2, t.z);
        dummy.scale.set(t.scale * 0.7, t.scale, t.scale * 0.7);
        dummy.updateMatrix();
        trunkRef.current!.setMatrixAt(i, dummy.matrix);
      });
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }

    // Pine cone layer 1 (bottom, wide)
    if (cone1Ref.current) {
      pines.forEach((t, i) => {
        dummy.position.set(t.x, 0.65 * t.scale, t.z);
        dummy.scale.setScalar(t.scale);
        dummy.updateMatrix();
        cone1Ref.current!.setMatrixAt(i, dummy.matrix);
      });
      cone1Ref.current.instanceMatrix.needsUpdate = true;
    }
    // Pine cone layer 2 (top, narrow)
    if (cone2Ref.current) {
      pines.forEach((t, i) => {
        dummy.position.set(t.x, 1.25 * t.scale, t.z);
        dummy.scale.set(t.scale * 0.65, t.scale * 0.8, t.scale * 0.65);
        dummy.updateMatrix();
        cone2Ref.current!.setMatrixAt(i, dummy.matrix);
      });
      cone2Ref.current.instanceMatrix.needsUpdate = true;
    }

    // Round tree foliage (sphere)
    if (sphereRef.current) {
      rounds.forEach((t, i) => {
        dummy.position.set(t.x, 1.15 * t.scale, t.z);
        dummy.scale.setScalar(t.scale * 0.88);
        dummy.updateMatrix();
        sphereRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sphereRef.current.instanceMatrix.needsUpdate = true;
    }

    // Palm fronds (wide flat cone)
    if (palmRef.current) {
      palms.forEach((t, i) => {
        dummy.position.set(t.x, 1.3 * t.scale, t.z);
        dummy.scale.set(t.scale * 1.2, t.scale * 0.45, t.scale * 1.2);
        dummy.updateMatrix();
        palmRef.current!.setMatrixAt(i, dummy.matrix);
      });
      palmRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [allTrees, pines, rounds, palms]);

  if (allTrees.length === 0) return null;

  const emNight = (col: string) => (nightMode ? new THREE.Color(col) : new THREE.Color(0));
  const emInt = nightMode ? 0.3 : 0;

  return (
    <>
      {/* Shared trunks */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, allTrees.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.10, 0.75, 5]} />
        <meshStandardMaterial color={TRUNK_COLOR} roughness={0.92} />
      </instancedMesh>

      {/* Pine layer 1 */}
      {pines.length > 0 && (
        <instancedMesh ref={cone1Ref} args={[undefined, undefined, pines.length]} castShadow>
          <coneGeometry args={[0.52, 1.0, 7]} />
          <meshStandardMaterial color={PINE_COLOR} roughness={0.80}
            emissive={emNight('#0a3320')} emissiveIntensity={emInt} />
        </instancedMesh>
      )}
      {/* Pine layer 2 */}
      {pines.length > 0 && (
        <instancedMesh ref={cone2Ref} args={[undefined, undefined, pines.length]} castShadow>
          <coneGeometry args={[0.34, 0.8, 7]} />
          <meshStandardMaterial color={PINE_COLOR} roughness={0.80}
            emissive={emNight('#0a3320')} emissiveIntensity={emInt} />
        </instancedMesh>
      )}

      {/* Round tree */}
      {rounds.length > 0 && (
        <instancedMesh ref={sphereRef} args={[undefined, undefined, rounds.length]} castShadow>
          <sphereGeometry args={[0.55, 8, 7]} />
          <meshStandardMaterial color={ROUND_COLOR} roughness={0.82}
            emissive={emNight('#0a3a20')} emissiveIntensity={emInt} />
        </instancedMesh>
      )}

      {/* Palm fronds */}
      {palms.length > 0 && (
        <instancedMesh ref={palmRef} args={[undefined, undefined, palms.length]} castShadow>
          <coneGeometry args={[0.70, 0.5, 6]} />
          <meshStandardMaterial color={PALM_COLOR} roughness={0.78}
            emissive={emNight('#0a3010')} emissiveIntensity={emInt} />
        </instancedMesh>
      )}
    </>
  );
}
