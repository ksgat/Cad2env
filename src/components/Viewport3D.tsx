import { CadViewerViewport } from "./CadViewerViewport";
import type { RigScene, Selection } from "../model/types";

interface Viewport3DProps {
  scene?: RigScene;
  onSelect: (selection: Selection) => void;
}

export function Viewport3D({ scene, onSelect }: Viewport3DProps) {
  return (
    <CadViewerViewport
      scene={scene ?? createFallbackScene()}
      onSelect={onSelect}
    />
  );
}

function createFallbackScene(): RigScene {
  return {
    version: "0.1",
    name: "empty",
    units: "meters",
    compiler: {
      angle: "radian",
      coordinate: "local",
      inertiaFromGeom: true
    },
    options: {
      timestep: 0.002,
      gravity: [0, 0, -9.81]
    },
    cadParts: [],
    bodies: [],
    joints: [],
    actuators: [],
    metadata: {
      createdBy: "CAD2Env Rig Editor",
      notes: ""
    }
  };
}
