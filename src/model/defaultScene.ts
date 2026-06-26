import type { RigScene, Selection } from "./types";

export const EMPTY_SELECTION: Selection = {
  type: null,
  id: null
};

export function createDefaultScene(): RigScene {
  return {
    version: "0.1",
    name: "untitled_rig",
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
