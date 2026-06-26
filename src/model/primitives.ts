import { nanoid } from "nanoid";
import type { Body, Geom, GeomType, RGBA, Vec3 } from "./types";

interface PrimitiveSpec {
  type: GeomType;
  bodyName: string;
  geomName: string;
  size: Vec3;
  mass: number;
  rgba: RGBA;
  position?: Vec3;
}

const primitiveSpecs: Record<GeomType, PrimitiveSpec> = {
  box: {
    type: "box",
    bodyName: "box_body",
    geomName: "box_collision",
    size: [0.3, 0.2, 0.08],
    mass: 1,
    rgba: [0.4, 0.6, 1, 1],
    position: [0, 0.08, 0]
  },
  sphere: {
    type: "sphere",
    bodyName: "sphere_body",
    geomName: "sphere_collision",
    size: [0.16, 0, 0],
    mass: 1,
    rgba: [0.95, 0.55, 0.34, 1],
    position: [0, 0.16, 0]
  },
  cylinder: {
    type: "cylinder",
    bodyName: "cylinder_body",
    geomName: "cylinder_collision",
    size: [0.12, 0.28, 0],
    mass: 1,
    rgba: [0.35, 0.82, 0.65, 1],
    position: [0, 0.28, 0]
  },
  capsule: {
    type: "capsule",
    bodyName: "capsule_body",
    geomName: "capsule_collision",
    size: [0.09, 0.32, 0],
    mass: 1,
    rgba: [0.72, 0.58, 0.96, 1],
    position: [0, 0.41, 0]
  },
  plane: {
    type: "plane",
    bodyName: "plane_body",
    geomName: "plane_collision",
    size: [1.2, 1.2, 0.02],
    mass: 0,
    rgba: [0.46, 0.5, 0.54, 1],
    position: [0, 0, 0]
  }
};

export function createPrimitiveBody(type: GeomType, index: number): Body {
  const spec = primitiveSpecs[type];
  const bodyId = nanoid();
  const geom = createPrimitiveGeomForBody(type, bodyId, index);
  const suffix = String(index).padStart(2, "0");

  return {
    id: bodyId,
    name: `${spec.bodyName}_${suffix}`,
    parentBodyId: null,
    position: spec.position ?? [0, 0, 0],
    rotation: [0, 0, 0],
    mass: spec.mass,
    inertial: {
      auto: true,
      diaginertia: [0, 0, 0],
      pos: [0, 0, 0]
    },
    geoms: [
      {
        ...geom,
        name: `${spec.geomName}_${suffix}`
      }
    ],
    visualRefs: [],
    metadata: {
      primitiveType: type
    }
  };
}

export function createPrimitiveGeomForBody(
  type: GeomType,
  bodyId: string,
  index: number
): Geom {
  const spec = primitiveSpecs[type];
  const suffix = String(index).padStart(2, "0");

  return {
    id: nanoid(),
    name: `${spec.geomName}_${suffix}`,
    bodyId,
    type: spec.type,
    size: spec.size,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    rgba: spec.rgba,
    density: null,
    mass: null,
    friction: [1, 0.005, 0.0001],
    condim: 3,
    contype: 1,
    conaffinity: 1,
    visualOnly: false,
    collisionOnly: false,
    metadata: {
      sizeConvention: getSizeConvention(spec.type)
    }
  };
}

function getSizeConvention(type: GeomType): string {
  switch (type) {
    case "box":
      return "half_extents_xyz";
    case "sphere":
      return "radius_x";
    case "cylinder":
      return "radius_x_half_length_y";
    case "capsule":
      return "radius_x_half_length_y";
    case "plane":
      return "half_extents_xy";
    default:
      return "unknown";
  }
}
