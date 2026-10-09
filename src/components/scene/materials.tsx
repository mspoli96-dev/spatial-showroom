import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";
import type { Fabric, Finish } from "@/lib/contracts";

const woodColours = { oak: "#b99569", walnut: "#674533", chalk: "#e4dfd3" };
const fabricColours = { sage: "#84907b", sand: "#c5b293", charcoal: "#444b4b" };

function surfaceTexture(kind: "wood" | "fabric") {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "wood" ? 256 : 128;
  canvas.height = kind === "wood" ? 512 : 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#e7e1d5";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (kind === "wood") {
    for (let index = 0; index < 150; index++) {
      const x = index * 1.8;
      context.beginPath();
      context.strokeStyle = `rgba(89,66,42,${0.025 + ((index * 7) % 11) * 0.006})`;
      context.lineWidth = index % 5 === 0 ? 1.1 : 0.45;
      context.moveTo(x, 0);
      context.bezierCurveTo(x + Math.sin(index) * 13, 180, x + Math.cos(index * 0.7) * 9, 320, x + Math.sin(index * 2) * 4, 512);
      context.stroke();
    }
  } else {
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 128; x += 2) {
        context.fillStyle = `rgba(255,255,255,${0.12 + ((x * 13 + y * 7) % 11) * 0.025})`;
        context.fillRect(x, y, 1, 2);
        context.fillStyle = "rgba(48,42,30,.055)";
        context.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(kind === "wood" ? 1 : 5, kind === "wood" ? 1 : 5);
  texture.anisotropy = 4;
  return texture;
}

function createMaterials(finish: Finish, fabric: Fabric) {
  const woodTexture = surfaceTexture("wood");
  const fabricTexture = surfaceTexture("fabric");
  return {
    wood: new MeshStandardMaterial({ color: woodColours[finish], map: woodTexture, roughness: 0.58 }),
    fabric: new MeshStandardMaterial({ color: fabricColours[fabric], map: fabricTexture, roughness: 0.98 }),
    seam: new MeshStandardMaterial({ color: fabricColours[fabric], roughness: 1 }),
    metal: new MeshStandardMaterial({ color: "#4a4b43", metalness: 0.68, roughness: 0.38 }),
    brass: new MeshStandardMaterial({ color: "#b1996f", metalness: 0.7, roughness: 0.32 }),
    ceramic: new MeshStandardMaterial({ color: "#e5dcca", roughness: 0.44 }),
    paper: new MeshStandardMaterial({ color: "#ede4d2", roughness: 1 }),
    woodTexture,
    fabricTexture,
  };
}

type Materials = ReturnType<typeof createMaterials>;
const MaterialsContext = createContext<Materials | null>(null);

export function MaterialPalette({ finish, fabric, children }: { finish: Finish; fabric: Fabric; children: ReactNode }) {
  const materials = useMemo(() => createMaterials(finish, fabric), [finish, fabric]);
  useEffect(() => () => { Object.values(materials).forEach(value => value.dispose()); }, [materials]);
  return <MaterialsContext.Provider value={materials}>{children}</MaterialsContext.Provider>;
}

export function useMaterials() {
  const materials = useContext(MaterialsContext);
  if (!materials) throw new Error("Scene materials are unavailable.");
  return materials;
}
