import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function CameraRig({ resetViewToken, mode, reducedMotion }: { resetViewToken: number; mode: "perspective" | "plan"; reducedMotion: boolean }) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useMemo(() => new OrbitControls(camera), [camera]);
  const transition = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    controls.connect(gl.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.09;
    controls.rotateSpeed = 0.55;
    controls.cursorStyle = "grab";
    controls.mouseButtons.MIDDLE = null;
    controls.mouseButtons.RIGHT = null;
    controls.touches.TWO = null;
    const onChange = () => invalidate();
    controls.addEventListener("change", onChange);
    return () => {
      controls.removeEventListener("change", onChange);
      controls.dispose();
    };
  }, [controls, gl, invalidate, reducedMotion]);

  useEffect(() => {
    const narrow = size.width / Math.max(1, size.height) < 1.0;
    const position = mode === "plan" ? new Vector3(0, narrow ? 8.5 : 7.3, 0.008) : new Vector3(4.4, 3.7, 5.2).multiplyScalar(narrow ? 1.15 : 1);
    const target = mode === "plan" ? new Vector3(0, 0, 0) : new Vector3(0, 1.06, 0);
    controls.enableRotate = mode !== "plan";
    controls.minPolarAngle = mode === "plan" ? 0 : 0.3;
    controls.maxPolarAngle = mode === "plan" ? Math.PI / 2 : 1.40;
    controls.minAzimuthAngle = mode === "plan" ? -Infinity : -0.48;
    controls.maxAzimuthAngle = mode === "plan" ? Infinity : 1.40;
    if (reducedMotion || !ready.current) {
      camera.position.copy(position);
      controls.target.copy(target);
      camera.lookAt(target);
      controls.update();
      transition.current = null;
    } else {
      transition.current = { position, target };
    }
    ready.current = true;
    invalidate();
  }, [camera, controls, invalidate, mode, reducedMotion, resetViewToken, size.width, size.height]);

  useFrame((_, delta) => {
    if (transition.current) {
      const { position, target } = transition.current;
      const step = 1 - Math.exp(-Math.min(delta, 0.05) * 8);
      camera.position.lerp(position, step);
      controls.target.lerp(target, step);
      camera.lookAt(controls.target);
      if (camera.position.distanceTo(position) < 0.006) {
        camera.position.copy(position);
        controls.target.copy(target);
        transition.current = null;
        controls.update();
      }
      invalidate();
    } else if (controls.update()) {
      invalidate();
    }
  });
  return null;
}
