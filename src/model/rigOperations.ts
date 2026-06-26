import { nanoid } from "nanoid";
import type { Body, Geom, RigScene, Selection, Vec3 } from "./types";

export function findSelectedBody(scene: RigScene, selection: Selection): Body | null {
  if (selection.type !== "body" || !selection.id) {
    return null;
  }

  return scene.bodies.find((body) => body.id === selection.id) ?? null;
}

export function findSelectedGeom(scene: RigScene, selection: Selection): Geom | null {
  if (selection.type !== "geom" || !selection.id) {
    return null;
  }

  return findGeom(scene.bodies, selection.id);
}

export function findGeom(bodies: Body[], geomId: string): Geom | null {
  for (const body of bodies) {
    const geom = body.geoms.find((candidate) => candidate.id === geomId);

    if (geom) {
      return geom;
    }
  }

  return null;
}

export function duplicateBodySubtree(
  scene: RigScene,
  bodyId: string
): { bodies: Body[]; rootBodyId: string } | null {
  const sourceRoot = scene.bodies.find((body) => body.id === bodyId);

  if (!sourceRoot) {
    return null;
  }

  const sourceIds = collectBodyAndDescendantIds(scene.bodies, bodyId);
  const idMap = new Map<string, string>();

  sourceIds.forEach((sourceId) => idMap.set(sourceId, nanoid()));

  const duplicatedBodies = scene.bodies
    .filter((body) => sourceIds.has(body.id))
    .map((body) => {
      const nextBodyId = idMap.get(body.id) ?? nanoid();
      const isRoot = body.id === bodyId;
      const parentBodyId = body.parentBodyId
        ? idMap.get(body.parentBodyId) ?? null
        : null;

      return {
        ...body,
        id: nextBodyId,
        name: `${body.name}_copy`,
        parentBodyId,
        position: isRoot ? addVec3(body.position, [0.35, 0, 0]) : body.position,
        geoms: body.geoms.map((geom) => ({
          ...geom,
          id: nanoid(),
          bodyId: nextBodyId,
          name: `${geom.name}_copy`
        })),
        visualRefs: body.visualRefs.map((visualRef) => ({
          ...visualRef,
          id: nanoid()
        })),
        metadata: {
          ...body.metadata,
          duplicatedFromBodyId: body.id
        }
      };
    });

  return {
    bodies: duplicatedBodies,
    rootBodyId: idMap.get(bodyId) ?? duplicatedBodies[0]?.id ?? ""
  };
}

export function duplicateGeom(geom: Geom): Geom {
  return {
    ...geom,
    id: nanoid(),
    name: `${geom.name}_copy`,
    position: addVec3(geom.position, [0.15, 0, 0]),
    metadata: {
      ...geom.metadata,
      duplicatedFromGeomId: geom.id
    }
  };
}

export function addVec3(value: Vec3, delta: Vec3): Vec3 {
  return [
    cleanNumber(value[0] + delta[0]),
    cleanNumber(value[1] + delta[1]),
    cleanNumber(value[2] + delta[2])
  ];
}

export function scaleVec3(value: Vec3, factor: number): Vec3 {
  return [
    cleanSize(value[0] * factor),
    cleanSize(value[1] * factor),
    cleanSize(value[2] * factor)
  ];
}

export function scaleGeomSize(geom: Geom, factor: number): Vec3 {
  switch (geom.type) {
    case "sphere":
      return [cleanSize(geom.size[0] * factor), 0, 0];
    case "cylinder":
    case "capsule":
      return [cleanSize(geom.size[0] * factor), cleanSize(geom.size[1] * factor), 0];
    case "plane":
      return [cleanSize(geom.size[0] * factor), cleanSize(geom.size[1] * factor), geom.size[2]];
    case "box":
    default:
      return scaleVec3(geom.size, factor);
  }
}

export function cleanNumber(value: number): number {
  return Number(value.toFixed(6));
}

function cleanSize(value: number): number {
  return Math.max(0.0001, cleanNumber(value));
}

function collectBodyAndDescendantIds(
  bodies: Body[],
  rootBodyId: string
): Set<string> {
  const ids = new Set<string>([rootBodyId]);
  let changed = true;

  while (changed) {
    changed = false;

    bodies.forEach((body) => {
      if (body.parentBodyId && ids.has(body.parentBodyId) && !ids.has(body.id)) {
        ids.add(body.id);
        changed = true;
      }
    });
  }

  return ids;
}
