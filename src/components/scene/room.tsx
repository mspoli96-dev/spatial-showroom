import { useEffect, useMemo } from "react";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import { ROOM } from "@/lib/catalog";
import { SoftBox, type Vec3 } from "./geometry";

function Art() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 512;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#e9dfc8";
    context.fillRect(0, 0, 384, 512);
    context.fillStyle = "#b09a72";
    context.beginPath();
    context.arc(124, 170, 65, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#6e7a64";
    context.beginPath();
    context.moveTo(45, 415);
    context.lineTo(45, 287);
    context.bezierCurveTo(46, 209, 212, 182, 231, 291);
    context.lineTo(231, 415);
    context.closePath();
    context.fill();
    context.fillStyle = "#c2b398";
    context.beginPath();
    context.moveTo(165, 415);
    context.bezierCurveTo(178, 240, 340, 260, 340, 415);
    context.fill();
    context.fillStyle = "#4f554b";
    context.font = "16px sans-serif";
    context.fillText("S T U D I E S   I N   F O R M", 46, 465);
    context.font = "12px sans-serif";
    context.fillText("NO. 01", 46, 63);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group position={[0.35, 1.79, -ROOM.depth / 2 + 0.055]}>
    <SoftBox size={[0.66, 0.86, 0.035]} radius={0.003} color="#705b44" />
    <mesh position={[0, 0, 0.019]} receiveShadow>
      <planeGeometry args={[0.621, 0.821]} /><meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  </group>;
}

export function Room({ evening, plan }: { evening: boolean; plan: boolean }) {
  const width = ROOM.width;
  const depth = ROOM.depth;
  const wall = "#e5e1d5";
  return <group>
    <SoftBox size={[width + 0.16, 0.15, depth + 0.16]} position={[-0.025, -0.101, -0.025]} radius={0.013} color="#d0c8b9" />
    <mesh position={[0, -0.018, 0]} receiveShadow>
      <boxGeometry args={[width, 0.035, depth]} /><meshStandardMaterial color="#bdab90" roughness={0.87} />
    </mesh>
    {Array.from({ length: 18 }, (_, row) => Array.from({ length: 3 }, (_, column) => {
      const segmentDepth = depth / 3;
      const light = (row * 7 + column * 3) % 5;
      return <mesh key={`${row}-${column}`} position={[-width / 2 + width / 18 * (row + 0.5), 0.001, -depth / 2 + segmentDepth * (column + 0.5)]} receiveShadow>
        <boxGeometry args={[width / 18 - 0.0025, 0.011, segmentDepth - 0.003]} />
        <meshStandardMaterial color={["#d0c0a4", "#cdbc9e", "#d5c5aa", "#cbbb9e", "#d1c2a8"][light]} roughness={0.76} />
      </mesh>;
    }))}
    <SoftBox size={[2.10, 0.015, 1.78]} position={[0.21, 0.015, 0.28]} radius={0.007} color="#bfb79f" />
    <SoftBox size={[2.055, 0.009, 1.73]} position={[0.21, 0.025, 0.28]} radius={0.004} color="#d6ceba" />
    {[-1, 1].map(side => Array.from({ length: 45 }, (_, index) => <mesh key={`${side}-${index}`} position={[-0.79 + index * 0.045, 0.02, 0.28 + side * 0.906]} receiveShadow>
      <boxGeometry args={[0.009, 0.008, 0.040]} /><meshStandardMaterial color="#c3bba6" roughness={1} />
    </mesh>))}
    {!plan && <>
      <mesh position={[-0.045, ROOM.height / 2, -depth / 2 - 0.045]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.09, ROOM.height, 0.09]} /><meshStandardMaterial color={wall} roughness={0.93} />
      </mesh>
      <SoftBox size={[width, 0.073, 0.026]} position={[0, 0.047, -depth / 2 + 0.019]} radius={0.003} color="#eee8db" />
      <mesh position={[-width / 2 - 0.045, 0.39, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.78, depth]} /><meshStandardMaterial color={wall} roughness={0.93} />
      </mesh>
      <mesh position={[-width / 2 - 0.045, 2.51, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.28, depth]} /><meshStandardMaterial color={wall} roughness={0.93} />
      </mesh>
      {[{ z: -1.405, depth: 0.39 }, { z: 1.25, depth: 0.70 }].map(segment => <mesh key={segment.z} position={[-width / 2 - 0.045, 1.575, segment.z]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 1.59, segment.depth]} /><meshStandardMaterial color={wall} roughness={0.93} />
      </mesh>)}
      <SoftBox size={[0.026, 0.073, depth]} position={[-width / 2 + 0.02, 0.047, 0]} radius={0.003} color="#eee8db" />
      <group position={[-width / 2, 1.575, -0.155]}>
        <mesh position={[-0.078, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.09, 1.60]} /><meshStandardMaterial color={evening ? "#596b80" : "#cfddd6"} emissive={evening ? "#3e485f" : "#dce9df"} emissiveIntensity={evening ? 0.18 : 0.34} roughness={0.7} side={DoubleSide} />
        </mesh>
        {[-1, 1].map(side => <SoftBox key={side} size={[0.092, 1.63, 0.052]} position={[0.005, 0, side * 1.047]} radius={0.003} color="#f1ede3" />)}
        {[-1, 1].map(side => <SoftBox key={side} size={[0.092, 0.052, 2.11]} position={[0.005, side * 0.804, 0]} radius={0.003} color="#f1ede3" />)}
        <SoftBox size={[0.07, 1.56, 0.044]} position={[0.018, 0, 0]} radius={0.003} color="#f1ede3" />
        <SoftBox size={[0.07, 0.038, 2.06]} position={[0.02, 0.13, 0]} radius={0.003} color="#f1ede3" />
        <SoftBox size={[0.16, 0.045, 2.21]} position={[0.025, -0.80, 0]} radius={0.005} color="#e5dfcf" />
      </group>
      <Art />
    </>}
    {plan && <>
      <SoftBox size={[width + 0.09, 0.06, 0.09]} position={[-0.045, 0.03, -depth / 2 - 0.045]} radius={0.005} color="#e5e1d5" />
      <SoftBox size={[0.09, 0.06, depth]} position={[-width / 2 - 0.045, 0.03, 0]} radius={0.005} color="#e5e1d5" />
    </>}
  </group>;
}

function DimensionLabel({ text, position, vertical = false }: { text: string; position: Vec3; vertical?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#eeeae1";
    context.fillRect(0, 0, 512, 128);
    context.font = "500 61px sans-serif";
    context.fillStyle = "#55564e";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 256, 67);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[-Math.PI / 2, 0, vertical ? Math.PI / 2 : 0]}>
    <planeGeometry args={[0.60, 0.15]} /><meshBasicMaterial map={texture} transparent depthWrite={false} />
  </mesh>;
}

export function Dimensions() {
  return <group>
    <mesh position={[0, 0.014, 1.80]}><boxGeometry args={[3.60, 0.004, 0.006]} /><meshBasicMaterial color="#a4a398" /></mesh>
    <mesh position={[1.995, 0.014, 0]}><boxGeometry args={[0.006, 0.004, 3.20]} /><meshBasicMaterial color="#a4a398" /></mesh>
    {[-1, 1].map(side => <group key={side}>
      <mesh position={[side * 1.8, 0.014, 1.80]}><boxGeometry args={[0.006, 0.004, 0.10]} /><meshBasicMaterial color="#a4a398" /></mesh>
      <mesh position={[1.995, 0.014, side * 1.60]}><boxGeometry args={[0.10, 0.004, 0.006]} /><meshBasicMaterial color="#a4a398" /></mesh>
    </group>)}
    <DimensionLabel text="3.60 m" position={[0, 0.023, 1.805]} />
    <DimensionLabel text="3.20 m" position={[2.00, 0.023, 0]} vertical />
  </group>;
}
