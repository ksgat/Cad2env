import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Color } from "three";
import { RigSceneObjects } from "../render/RigSceneObjects";
import type { RigScene } from "../model/types";

interface Viewport3DProps {
  scene?: RigScene;
}

export function Viewport3D({ scene }: Viewport3DProps) {
  const bodies = scene?.bodies ?? [];

  return (
    <Canvas
      className="rig-viewport-canvas"
      camera={{
        position: [3.2, 2.8, 2.2],
        fov: 45,
        near: 0.01,
        far: 1000
      }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[new Color("#121820")]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />

      <Grid
        args={[20, 20]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor="#2d3b46"
        sectionSize={1}
        sectionThickness={1.2}
        sectionColor="#475866"
        fadeDistance={24}
        fadeStrength={1}
        infiniteGrid
      />

      <axesHelper args={[1.5]} />
      <RigSceneObjects bodies={bodies} />

      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.045, 0.06, 32]} />
        <meshBasicMaterial color="#7ee0b5" />
      </mesh>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        minDistance={0.3}
        maxDistance={80}
      />
    </Canvas>
  );
}
