import { useEffect, useMemo } from "react";
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Quaternion, TubeGeometry, Vector3, type Material } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type Vec3 = [number, number, number];

export function SoftBox({ size, position = [0, 0, 0], radius = 0.015, material, rotation = [0, 0, 0], color }: { size: Vec3; position?: Vec3; radius?: number; material?: Material; rotation?: Vec3; color?: string }) {
  const [width, height, depth] = size;
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, Math.min(width, height, depth) / 2)), [width, height, depth, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position} rotation={rotation} material={material} castShadow receiveShadow>
    {!material && <meshStandardMaterial color={color ?? "#eee8df"} roughness={0.8} />}
  </mesh>;
}

export function Rod({ from, to, radius = 0.015, endRadius, material }: { from: Vec3; to: Vec3; radius?: number; endRadius?: number; material: Material }) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={midpoint} quaternion={quaternion} material={material} castShadow receiveShadow>
    <cylinderGeometry args={[endRadius ?? radius, radius, direction.length(), 12]} />
  </mesh>;
}

export function CurveRod({ points, radius = 0.01, material }: { points: Vec3[]; radius?: number; material: Material }) {
  const key = JSON.stringify(points);
  const geometry = useMemo(() => new TubeGeometry(new CatmullRomCurve3((JSON.parse(key) as Vec3[]).map(point => new Vector3(...point))), 30, radius, 8, false), [key, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

export function CurvedBack({ width, height, depth, bottom, wrap, material }: { width: number; height: number; depth: number; bottom: number; wrap: boolean; material: Material }) {
  const geometry = useMemo(() => {
    const segments = 32;
    const span = wrap ? 1.52 : 1.12;
    const thickness = wrap ? 0.055 : 0.045;
    const radius = (width / 2 - thickness / 2) / Math.sin(span);
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let step = 0; step <= segments; step++) {
      const theta = (step / segments * 2 - 1) * span;
      const top = wrap ? height - Math.pow(Math.abs(theta / span), 2) * (height - bottom - 0.12) : height - Math.pow(theta / span, 2) * 0.025;
      for (let side = 0; side < 2; side++) {
        const r = radius + (side === 0 ? -1 : 1) * thickness / 2;
        const x = Math.sin(theta) * r;
        const z = Math.cos(theta) * r + depth / 2 - radius - thickness / 2;
        vertices.push(x, bottom, z, x, top, z);
      }
      if (step < segments) {
        const a = step * 4;
        indices.push(a, a + 4, a + 1, a + 1, a + 4, a + 5);
        indices.push(a + 2, a + 3, a + 6, a + 3, a + 7, a + 6);
        indices.push(a + 1, a + 5, a + 3, a + 3, a + 5, a + 7);
        indices.push(a, a + 2, a + 4, a + 2, a + 6, a + 4);
      }
    }
    const last = segments * 4;
    indices.push(0, 1, 2, 1, 3, 2, last, last + 2, last + 1, last + 1, last + 2, last + 3);
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
  }, [width, height, depth, bottom, wrap]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}
