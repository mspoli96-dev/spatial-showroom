import { useMaterials } from "./materials";
import { CurveRod, CurvedBack, Rod, SoftBox, type Vec3 } from "./geometry";
import type { Product } from "@/lib/contracts";

const bookColors = ["#666e59", "#d7c5a3", "#967e69", "#bab3a5", "#454b45", "#b7a286"];

export function Books({ position, count = 5, scale = 1 }: { position: Vec3; count?: number; scale?: number }) {
  return <group position={position} scale={scale}>
    {Array.from({ length: count }, (_, index) => {
      const height = 0.17 + (index * 7 % 5) * 0.018;
      return <group key={index} position={[index * 0.035, 0, 0]} rotation={[0, 0, index === count - 1 ? -0.13 : 0]}>
        <SoftBox size={[0.028, height, 0.135]} position={[0, height / 2, 0]} radius={0.003} color={bookColors[index % bookColors.length]} />
        <SoftBox size={[0.03, 0.002, 0.12]} position={[0, height - 0.03, 0.004]} radius={0.001} color="#e4d9c4" />
      </group>;
    })}
  </group>;
}

export function Plant({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const materials = useMaterials();
  return <group position={position} scale={scale}>
    <mesh material={materials.ceramic} castShadow receiveShadow position={[0, 0.052, 0]}>
      <cylinderGeometry args={[0.066, 0.046, 0.104, 24]} />
    </mesh>
    <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.059, 24]} /><meshStandardMaterial color="#44382b" roughness={1} />
    </mesh>
    {Array.from({ length: 7 }, (_, index) => {
      const theta = index * 2.399;
      const length = 0.10 + (index % 3) * 0.025;
      const target: Vec3 = [Math.cos(theta) * 0.065, 0.18 + (index % 3) * 0.025, Math.sin(theta) * 0.055];
      return <group key={index}>
        <Rod from={[0, 0.10, 0]} to={target} radius={0.0025} material={materials.metal} />
        <mesh position={target} rotation={[Math.cos(theta) * 0.55, theta, Math.sin(theta) * 0.6]} scale={[0.027, length / 2, 0.009]} castShadow>
          <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={index % 2 ? "#6b7957" : "#85906b"} roughness={0.9} />
        </mesh>
      </group>;
    })}
  </group>;
}

function DeskObjects({ product }: { product: Product }) {
  const materials = useMaterials();
  return <group position={[-0.06, product.height + 0.006, -0.03]}>
    <SoftBox size={[0.40, 0.008, 0.27]} position={[0, 0.003, 0.015]} radius={0.008} color="#80765f" />
    <SoftBox size={[0.29, 0.012, 0.19]} position={[0, 0.015, 0.005]} radius={0.008} color="#a5a6a0" />
    <group position={[0, 0.13, -0.09]} rotation={[-0.13, 0, 0]}>
      <SoftBox size={[0.29, 0.20, 0.012]} radius={0.008} color="#9fa09a" />
      <SoftBox size={[0.273, 0.178, 0.002]} position={[0, 0.002, 0.008]} radius={0.004} color="#2f4340" />
      <SoftBox size={[0.089, 0.10, 0.002]} position={[-0.07, 0.015, 0.010]} radius={0.003} color="#adba9d" />
      <SoftBox size={[0.11, 0.018, 0.002]} position={[0.044, 0.052, 0.010]} radius={0.002} color="#d4d8bd" />
      {[0, 1, 2].map(index => <SoftBox key={index} size={[0.10 - index * 0.02, 0.005, 0.002]} position={[0.037 - index * 0.01, 0.017 - index * 0.018, 0.010]} radius={0.001} color="#7c9287" />)}
    </group>
    <SoftBox size={[0.09, 0.002, 0.046]} position={[0, 0.022, 0.05]} radius={0.003} color="#818981" />
    <group position={[-product.width * 0.28, 0.012, 0.04]} rotation={[0, -0.12, 0]}>
      <SoftBox size={[0.15, 0.019, 0.19]} radius={0.006} color="#a08e76" />
      <SoftBox size={[0.145, 0.004, 0.18]} position={[0, 0.007, 0]} radius={0.002} material={materials.paper} />
      <Rod from={[-0.035, 0.019, -0.07]} to={[-0.035, 0.019, 0.06]} radius={0.003} material={materials.brass} />
    </group>
  </group>;
}

export function Desk({ product }: { product: Product }) {
  const materials = useMaterials();
  const { width, height, depth } = product;
  const trestle = product.id === "span-180";
  return <group>
    <SoftBox size={[width, 0.047, depth]} position={[0, height - 0.0235, 0]} radius={0.016} material={materials.wood} />
    <SoftBox size={[width - 0.18, 0.065, 0.045]} position={[0, height - 0.085, -depth / 2 + 0.08]} radius={0.005} material={materials.wood} />
    {[-1, 1].map(side => trestle ? <group key={side} position={[side * (width / 2 - 0.18), 0, 0]}>
      {[-1, 1].map(end => <Rod key={end} from={[0, 0.024, end * (depth / 2 - 0.045)]} to={[0, height - 0.053, end * 0.12]} radius={0.035} endRadius={0.029} material={materials.wood} />)}
      <SoftBox size={[0.075, 0.055, depth - 0.03]} position={[0, 0.052, 0]} radius={0.012} material={materials.wood} />
      <SoftBox size={[0.075, 0.055, depth - 0.18]} position={[0, height - 0.07, 0]} radius={0.008} material={materials.wood} />
    </group> : [-1, 1].map(end => <Rod key={`${side}-${end}`} from={[side * (width / 2 - 0.045), 0.017, end * (depth / 2 - 0.05)]} to={[side * (width / 2 - 0.09), height - 0.055, end * (depth / 2 - 0.085)]} radius={0.02} endRadius={0.035} material={materials.wood} />))}
    {trestle && <SoftBox size={[width - 0.33, 0.042, 0.04]} position={[0, 0.29, 0]} radius={0.004} material={materials.wood} />}
    {product.id === "studio-140" && <group position={[-0.25, height - 0.104, 0.015]}>
      <SoftBox size={[0.52, 0.104, depth - 0.13]} radius={0.007} material={materials.wood} />
      <SoftBox size={[0.505, 0.082, 0.012]} position={[0, -0.003, depth / 2 - 0.053]} radius={0.005} material={materials.wood} />
      <SoftBox size={[0.095, 0.012, 0.018]} position={[0, 0.008, depth / 2 - 0.040]} radius={0.005} material={materials.brass} />
    </group>}
    <DeskObjects product={product} />
  </group>;
}

export function Chair({ product }: { product: Product }) {
  const materials = useMaterials();
  const { width, depth, height } = product;
  const cove = product.id === "cove-chair";
  const loop = product.id === "loop-chair";
  const seatWidth = width - (cove ? 0.09 : 0.055);
  const seatDepth = depth - (cove ? 0.085 : 0.065);
  return <group>
    {[-1, 1].flatMap(side => [-1, 1].map(end => <Rod key={`${side}-${end}`} from={[side * (width / 2 - 0.06), 0.019, end * (depth / 2 - 0.06)]} to={[side * (width / 2 - 0.115), 0.435, end * (depth / 2 - 0.12)]} radius={0.016} endRadius={0.027} material={materials.wood} />))}
    <SoftBox size={[seatWidth, 0.055, seatDepth]} position={[0, 0.43, -0.012]} radius={0.025} material={materials.wood} />
    <SoftBox size={[seatWidth, cove ? 0.13 : 0.10, seatDepth]} position={[0, cove ? 0.486 : 0.471, -0.012]} radius={cove ? 0.06 : 0.045} material={materials.fabric} />
    <CurvedBack width={width - 0.014} height={height} depth={depth} bottom={cove ? 0.45 : 0.57} wrap={cove} material={materials.fabric} />
    {!cove && [-1, 1].map(side => <Rod key={side} from={[side * width * 0.32, 0.435, depth * 0.29]} to={[side * width * 0.32, 0.70, depth * 0.38]} radius={0.015} material={materials.wood} />)}
    {loop && [-1, 1].map(side => <CurveRod key={side} points={[[side * (width / 2 - 0.037), 0.45, -depth * 0.25], [side * (width / 2 - 0.037), 0.64, -depth * 0.25], [side * (width / 2 - 0.037), 0.68, -0.07], [side * (width / 2 - 0.045), 0.68, depth * 0.27]]} radius={0.026} material={materials.wood} />)}
  </group>;
}

export function Lamp({ product, evening }: { product: Product; evening: boolean }) {
  const materials = useMaterials();
  const halo = product.id === "halo-lamp";
  return <group>
    <mesh position={[0, 0.012, 0]} material={halo ? materials.brass : materials.metal} castShadow receiveShadow>
      <cylinderGeometry args={[0.082, 0.085, 0.024, 32]} />
    </mesh>
    {halo ? <>
      <Rod from={[0, 0.022, 0]} to={[0, 0.31, 0]} radius={0.011} material={materials.brass} />
      <mesh position={[0, 0.29, 0]} material={materials.ceramic} castShadow>
        <sphereGeometry args={[0.11, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.2905, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.107, 32]} /><meshStandardMaterial color="#fff5df" emissive="#ffbe72" emissiveIntensity={evening ? 1.8 : 0.15} />
      </mesh>
    </> : <>
      <CurveRod points={[[-0.035, 0.025, 0], [-0.062, 0.27, 0], [-0.055, 0.39, 0], [0.025, 0.425, 0]]} radius={0.009} material={materials.metal} />
      <group position={[0.037, 0.412, 0]} rotation={[0, 0, -0.20]}>
        <mesh material={materials.metal} castShadow><cylinderGeometry args={[0.034, 0.075, 0.065, 32]} /></mesh>
        <mesh position={[0, -0.033, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.071, 32]} /><meshStandardMaterial color="#fff0d4" emissive="#ffc17b" emissiveIntensity={evening ? 2 : 0.2} />
        </mesh>
      </group>
    </>}
    {evening && <pointLight color="#ffbd78" position={[0, halo ? 0.27 : 0.36, 0.018]} intensity={0.75} distance={2.6} decay={2} />}
  </group>;
}

export function Storage({ product }: { product: Product }) {
  const materials = useMaterials();
  const { width, height, depth } = product;
  const tall = product.id === "tower-shelf";
  const levels = tall ? [0.14, 0.51, 0.88, 1.25, height - 0.017] : [0.14, 0.60, height - 0.017];
  return <group>
    {[-1, 1].map(side => <SoftBox key={side} size={[0.028, height, depth]} position={[side * (width / 2 - 0.014), height / 2, 0]} radius={0.005} material={materials.wood} />)}
    <SoftBox size={[width - 0.045, height - 0.13, 0.016]} position={[0, (height + 0.13) / 2, -depth / 2 + 0.009]} radius={0.004} color="#d8cdb9" />
    {levels.map(y => <SoftBox key={y} size={[width - 0.04, 0.034, depth]} position={[0, y, 0]} radius={0.005} material={materials.wood} />)}
    {!tall && <SoftBox size={[0.025, height - 0.17, depth - 0.02]} position={[0.10, (height + 0.12) / 2, 0]} radius={0.003} material={materials.wood} />}
    <Books position={[-width / 2 + 0.095, levels[1] + 0.017, 0]} count={tall ? 7 : 9} scale={tall ? 1 : 1.25} />
    <Plant position={[width * (tall ? 0.14 : 0.30), levels[tall ? 3 : 1] + 0.017, 0]} scale={tall ? 0.95 : 1.1} />
    <SoftBox size={[width * 0.55, 0.23, depth * 0.71]} position={[-width * 0.07, levels[0] + 0.133, 0.014]} radius={0.017} color="#a3a28a" />
    <SoftBox size={[0.083, 0.022, 0.006]} position={[-width * 0.07, levels[0] + 0.165, depth * 0.355 + 0.019]} radius={0.005} color="#656d5b" />
    {tall && <group position={[0.06, levels[2] + 0.017, 0]}>
      <SoftBox size={[0.28, 0.037, 0.19]} position={[0, 0.02, 0]} radius={0.003} color="#c8ba9f" />
      <SoftBox size={[0.25, 0.030, 0.17]} position={[-0.012, 0.053, 0]} rotation={[0, -0.10, 0]} radius={0.003} color="#79826c" />
      <mesh material={materials.ceramic} position={[0.015, 0.13, 0]} castShadow><sphereGeometry args={[0.06, 24, 18]} /></mesh>
    </group>}
  </group>;
}
