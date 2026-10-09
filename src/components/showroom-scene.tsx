"use client";

import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { productById } from "@/lib/catalog";
import { getPlacements } from "@/lib/configuration";
import type { Category, Configuration, Placement } from "@/lib/contracts";
import { CameraRig } from "./scene/camera";
import { Chair, Desk, Lamp, Storage } from "./scene/furniture";
import { MaterialPalette } from "./scene/materials";
import { Dimensions, Room } from "./scene/room";

export type ShowroomSceneProps = {
  configuration: Configuration;
  selectedCategory: Category | null;
  onSelect: (category: Category) => void;
  showDimensions: boolean;
  resetViewToken: number;
  cameraMode: "perspective" | "plan";
};

function SceneFallback() {
  return <div className="scene-fallback" role="status" style={{ display: "grid", placeContent: "center", gap: 12, padding: 32, height: "100%", color: "#5b5b51", background: "#eeebe3", textAlign: "center" }}>
    <strong>Keep making it yours.</strong>
    <p style={{ maxWidth: 320, margin: 0, fontSize: 14, lineHeight: 1.6 }}>The 3D preview is unavailable on this device. You can still explore every product, edit your room and check your budget.</p>
  </div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

function SceneHealth({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener("webglcontextlost", onContextLost);
    return () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, [gl, onLost]);
  return null;
}

function SelectionFootprint({ width, depth, surface }: { width: number; depth: number; surface: Placement["surface"] }) {
  const corner = Math.min(0.15, width / 4, depth / 4);
  return <group position={[0, surface === "desktop" ? 0.002 : 0.039, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} /><meshBasicMaterial color="#9d7ceb" transparent opacity={0.065} depthWrite={false} />
    </mesh>
    {[-1, 1].flatMap(x => [-1, 1].map(z => <group key={`${x}-${z}`}>
      <mesh position={[x * (width / 2 - corner / 2), 0.004, z * depth / 2]}>
        <boxGeometry args={[corner, 0.006, 0.008]} /><meshBasicMaterial color="#9d7ceb" />
      </mesh>
      <mesh position={[x * width / 2, 0.004, z * (depth / 2 - corner / 2)]}>
        <boxGeometry args={[0.008, 0.006, corner]} /><meshBasicMaterial color="#9d7ceb" />
      </mesh>
    </group>))}
  </group>;
}

function ProductObject({ placement, selected, evening, onSelect }: { placement: Placement; selected: boolean; evening: boolean; onSelect: (category: Category) => void }) {
  const product = productById(placement.productId)!;
  const { gl } = useThree();
  const [hovered, setHovered] = useState(false);
  const select = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta <= 5) onSelect(placement.category); };
  return <group position={placement.position} rotation={[0, placement.rotationY, 0]} onClick={select}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); gl.domElement.style.cursor = "pointer"; }}
    onPointerOut={() => { setHovered(false); gl.domElement.style.cursor = "grab"; }}>
    {product.category === "desk" && <Desk product={product} />}
    {product.category === "chair" && <Chair product={product} />}
    {product.category === "lamp" && <Lamp product={product} evening={evening} />}
    {product.category === "storage" && <Storage product={product} />}
    {(selected || hovered) && <SelectionFootprint width={product.width} depth={product.depth} surface={placement.surface} />}
  </group>;
}

export function ShowroomScene({ configuration, selectedCategory, onSelect, showDimensions, resetViewToken, cameraMode }: ShowroomSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const evening = configuration.lighting === "evening";
  const placements = getPlacements(configuration);
  return <div className="showroom-scene" style={{ width: "100%", height: "100%", minHeight: 360 }}>
    <SceneBoundary>
      {contextLost ? <SceneFallback /> : <Canvas shadows="percentage" frameloop="demand" dpr={[1, 1.75]} camera={{ position: [4.4, 3.7, 5.2], fov: 39, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; }}
        fallback={<SceneFallback />} aria-label="Interactive 3D home office. Drag to orbit. Select furniture to explore its options.">
        <color attach="background" args={[evening ? "#e1dfd8" : "#eeeae1"]} />
        <ambientLight intensity={evening ? 0.28 : 0.52} color={evening ? "#8792b2" : "#fff8e9"} />
        <hemisphereLight args={[evening ? "#a7b5cf" : "#eff4ed", "#aa987f", evening ? 0.75 : 1.35]} />
        <directionalLight position={[-3.5, 5.5, 2.3]} intensity={evening ? 0.7 : 3.2} color={evening ? "#a8b9d9" : "#fff1d5"} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-3.6} shadow-camera-right={3.6} shadow-camera-top={4} shadow-camera-bottom={-3.2} shadow-camera-near={0.5} shadow-camera-far={15} shadow-bias={-0.00015} shadow-normalBias={0.016} />
        <directionalLight position={[3.8, 3.5, 2.2]} intensity={evening ? 0.5 : 0.65} color={evening ? "#dfc4a2" : "#ffffff"} />
        <Suspense fallback={null}>
          <MaterialPalette finish={configuration.finish} fabric={configuration.fabric}>
            <Room evening={evening} plan={cameraMode === "plan"} />
            {placements.map(placement => <ProductObject key={placement.category} placement={placement} selected={selectedCategory === placement.category} evening={evening} onSelect={onSelect} />)}
            {showDimensions && <Dimensions />}
          </MaterialPalette>
        </Suspense>
        <CameraRig resetViewToken={resetViewToken} mode={cameraMode} reducedMotion={reducedMotion} />
        <SceneHealth onLost={() => setContextLost(true)} />
      </Canvas>}
    </SceneBoundary>
  </div>;
}
