import type { Shape, Shapes } from "three-cad-viewer";
import type { BoundingBoxFlat } from "three-cad-viewer";
import type { Body, Geom, RigScene, Vec3 } from "../model/types";

export function rigSceneToCadShapes(scene: RigScene): Shapes {
  const bodyIds = new Set(scene.bodies.map((body) => body.id));
  const rootBodies = scene.bodies.filter(
    (body) => !body.parentBodyId || !bodyIds.has(body.parentBodyId)
  );

  const bodyNodes = rootBodies.map((body) =>
    bodyToShapes(scene.bodies, body, new Set())
  );
  const rootBb = combineBbs(bodyNodes.map((node) => node.bb));

  return {
    version: 3,
    name: scene.name || "CAD2Env Rig",
    id: "/CAD2EnvRig",
    loc: [
      [0, 0, 0],
      [0, 0, 0, 1]
    ],
    parts: bodyNodes,
    bb: rootBb ?? defaultBb()
  };
}

function bodyToShapes(
  bodies: Body[],
  body: Body,
  visited: Set<string>
): Shapes {
  const nextVisited = new Set(visited);
  nextVisited.add(body.id);

  const children = bodies.filter(
    (candidate) =>
      candidate.parentBodyId === body.id && !nextVisited.has(candidate.id)
  );

  const parts = [
    ...body.geoms.map((geom) => geomToShapes(geom, body.id)),
    ...children.map((child) => bodyToShapes(bodies, child, nextVisited))
  ];
  const bb = combineBbs(parts.map((part) => offsetBb(part.bb, part.loc?.[0] ?? [0, 0, 0])));

  return {
    version: 3,
    name: safeName(body.name),
    id: `/CAD2EnvRig/${body.id}`,
    loc: [body.position, eulerToQuaternion(body.rotation)],
    parts,
    bb: bb ?? defaultBb()
  };
}

function geomToShapes(geom: Geom, bodyId: string): Shapes {
  const shape = createGeomShape(geom);
  const bb = shapeBb(shape);

  return {
    version: 3,
    name: safeName(geom.name),
    id: `/CAD2EnvRig/${bodyId}/${geom.id}`,
    type: "shapes",
    subtype: "solid",
    shape,
    state: [geom.visualOnly ? 1 : 1, geom.collisionOnly ? 1 : 1],
    color: rgbaToHex(geom.rgba),
    alpha: geom.rgba[3],
    texture: null,
    loc: [geom.position, eulerToQuaternion(geom.rotation)],
    renderback: geom.type === "plane",
    accuracy: null,
    bb
  };
}

function createGeomShape(geom: Geom): Shape {
  switch (geom.type) {
    case "box":
      return createBoxShape(geom.size);
    case "sphere":
      return createSphereShape(geom.size[0], 18, 10);
    case "cylinder":
      return createCylinderShape(geom.size[0], geom.size[1], 24);
    case "capsule":
      return createCapsuleShape(geom.size[0], geom.size[1], 24, 8);
    case "plane":
      return createPlaneShape(geom.size);
    default:
      return createBoxShape([0.05, 0.05, 0.05]);
  }
}

function createBoxShape(size: Vec3): Shape {
  const [x, y, z] = size;
  const triangles: Array<[Vec3, Vec3, Vec3, Vec3]> = [
    [[-x, -y, z], [x, -y, z], [x, y, z], [0, 0, 1]],
    [[-x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1]],
    [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [0, 0, -1]],
    [[x, -y, -z], [-x, y, -z], [x, y, -z], [0, 0, -1]],
    [[x, -y, z], [x, -y, -z], [x, y, -z], [1, 0, 0]],
    [[x, -y, z], [x, y, -z], [x, y, z], [1, 0, 0]],
    [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-1, 0, 0]],
    [[-x, -y, -z], [-x, y, z], [-x, y, -z], [-1, 0, 0]],
    [[-x, y, z], [x, y, z], [x, y, -z], [0, 1, 0]],
    [[-x, y, z], [x, y, -z], [-x, y, -z], [0, 1, 0]],
    [[-x, -y, -z], [x, -y, -z], [x, -y, z], [0, -1, 0]],
    [[-x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0]]
  ];
  const edges = [
    [-x, -y, -z], [x, -y, -z], [x, -y, -z], [x, y, -z],
    [x, y, -z], [-x, y, -z], [-x, y, -z], [-x, -y, -z],
    [-x, -y, z], [x, -y, z], [x, -y, z], [x, y, z],
    [x, y, z], [-x, y, z], [-x, y, z], [-x, -y, z],
    [-x, -y, -z], [-x, -y, z], [x, -y, -z], [x, -y, z],
    [x, y, -z], [x, y, z], [-x, y, -z], [-x, y, z]
  ] as Vec3[];

  return makeShape(triangles, edges);
}

function createPlaneShape(size: Vec3): Shape {
  const [x, y] = size;
  return makeShape(
    [
      [[-x, -y, 0], [x, -y, 0], [x, y, 0], [0, 0, 1]],
      [[-x, -y, 0], [x, y, 0], [-x, y, 0], [0, 0, 1]]
    ],
    [[-x, -y, 0], [x, -y, 0], [x, -y, 0], [x, y, 0], [x, y, 0], [-x, y, 0], [-x, y, 0], [-x, -y, 0]]
  );
}

function createCylinderShape(radius: number, halfLength: number, segments: number): Shape {
  const { triangles, edges } = createCylinderTuples(radius, halfLength, segments);

  return makeShape(triangles, edges);
}

function createCylinderTuples(
  radius: number,
  halfLength: number,
  segments: number
): { triangles: Array<[Vec3, Vec3, Vec3, Vec3]>; edges: Vec3[] } {
  const triangles: Array<[Vec3, Vec3, Vec3, Vec3]> = [];
  const edges: Vec3[] = [];
  const top: Vec3 = [0, halfLength, 0];
  const bottom: Vec3 = [0, -halfLength, 0];

  for (let index = 0; index < segments; index += 1) {
    const a0 = (index / segments) * Math.PI * 2;
    const a1 = ((index + 1) / segments) * Math.PI * 2;
    const p0: Vec3 = [Math.cos(a0) * radius, -halfLength, Math.sin(a0) * radius];
    const p1: Vec3 = [Math.cos(a1) * radius, -halfLength, Math.sin(a1) * radius];
    const p2: Vec3 = [Math.cos(a1) * radius, halfLength, Math.sin(a1) * radius];
    const p3: Vec3 = [Math.cos(a0) * radius, halfLength, Math.sin(a0) * radius];
    const n0: Vec3 = normalize([Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)]);

    triangles.push([p0, p1, p2, n0], [p0, p2, p3, n0]);
    triangles.push([top, p3, p2, [0, 1, 0]]);
    triangles.push([bottom, p1, p0, [0, -1, 0]]);
    edges.push(p0, p1, p3, p2);
  }

  return { triangles, edges };
}

function createSphereShape(radius: number, segments: number, rings: number): Shape {
  const triangles: Array<[Vec3, Vec3, Vec3, Vec3]> = [];
  const edges: Vec3[] = [];

  for (let ring = 0; ring < rings; ring += 1) {
    const phi0 = (ring / rings) * Math.PI;
    const phi1 = ((ring + 1) / rings) * Math.PI;

    for (let segment = 0; segment < segments; segment += 1) {
      const theta0 = (segment / segments) * Math.PI * 2;
      const theta1 = ((segment + 1) / segments) * Math.PI * 2;
      const p00 = spherePoint(radius, phi0, theta0);
      const p01 = spherePoint(radius, phi0, theta1);
      const p10 = spherePoint(radius, phi1, theta0);
      const p11 = spherePoint(radius, phi1, theta1);

      triangles.push([p00, p10, p11, normalize(p00)]);
      triangles.push([p00, p11, p01, normalize(p11)]);

      if (segment % 3 === 0) {
        edges.push(p00, p10);
      }

      if (ring === Math.floor(rings / 2)) {
        edges.push(p00, p01);
      }
    }
  }

  return makeShape(triangles, edges);
}

function createCapsuleShape(
  radius: number,
  halfLength: number,
  segments: number,
  rings: number
): Shape {
  const cylinder = createCylinderTuples(radius, halfLength, segments);
  const top = createHemisphereTriangles(radius, halfLength, segments, rings, 1);
  const bottom = createHemisphereTriangles(radius, -halfLength, segments, rings, -1);

  return makeShape(
    [...cylinder.triangles, ...top.triangles, ...bottom.triangles],
    [...cylinder.edges, ...top.edges, ...bottom.edges]
  );
}

function createHemisphereTriangles(
  radius: number,
  centerY: number,
  segments: number,
  rings: number,
  direction: 1 | -1
): { triangles: Array<[Vec3, Vec3, Vec3, Vec3]>; edges: Vec3[] } {
  const triangles: Array<[Vec3, Vec3, Vec3, Vec3]> = [];
  const edges: Vec3[] = [];

  for (let ring = 0; ring < rings; ring += 1) {
    const phi0 = (ring / rings) * (Math.PI / 2);
    const phi1 = ((ring + 1) / rings) * (Math.PI / 2);

    for (let segment = 0; segment < segments; segment += 1) {
      const theta0 = (segment / segments) * Math.PI * 2;
      const theta1 = ((segment + 1) / segments) * Math.PI * 2;
      const p00 = hemispherePoint(radius, centerY, phi0, theta0, direction);
      const p01 = hemispherePoint(radius, centerY, phi0, theta1, direction);
      const p10 = hemispherePoint(radius, centerY, phi1, theta0, direction);
      const p11 = hemispherePoint(radius, centerY, phi1, theta1, direction);

      triangles.push([p00, p10, p11, normalize([p00[0], p00[1] - centerY, p00[2]])]);
      triangles.push([p00, p11, p01, normalize([p11[0], p11[1] - centerY, p11[2]])]);

      if (segment % 4 === 0) {
        edges.push(p00, p10);
      }
    }
  }

  return { triangles, edges };
}

function spherePoint(radius: number, phi: number, theta: number): Vec3 {
  return [
    Math.sin(phi) * Math.cos(theta) * radius,
    Math.cos(phi) * radius,
    Math.sin(phi) * Math.sin(theta) * radius
  ];
}

function hemispherePoint(
  radius: number,
  centerY: number,
  phi: number,
  theta: number,
  direction: 1 | -1
): Vec3 {
  return [
    Math.sin(phi) * Math.cos(theta) * radius,
    centerY + Math.cos(phi) * radius * direction,
    Math.sin(phi) * Math.sin(theta) * radius
  ];
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);

  if (length <= Number.EPSILON) {
    return [0, 1, 0];
  }

  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function makeShape(
  trianglesWithNormals: Array<[Vec3, Vec3, Vec3, Vec3]>,
  edgePoints: Vec3[]
): Shape {
  const vertices: number[] = [];
  const normals: number[] = [];
  const triangles: number[] = [];

  trianglesWithNormals.forEach(([a, b, c, normal], index) => {
    vertices.push(...a, ...b, ...c);
    normals.push(...normal, ...normal, ...normal);
    triangles.push(index * 3, index * 3 + 1, index * 3 + 2);
  });

  const edges = edgePoints.flat();
  const vertexCount = vertices.length / 3;
  const triangleCount = vertexCount / 3;
  const edgeCount = edges.length / 6;

  return {
    vertices,
    normals,
    triangles,
    edges,
    obj_vertices: vertices,
    edge_types: Array.from({ length: edgeCount }, () => 0),
    face_types: Array.from({ length: triangleCount }, () => 0),
    triangles_per_face: Array.from({ length: triangleCount }, () => 1),
    segments_per_edge: Array.from({ length: edgeCount }, () => 1)
  };
}

function eulerToQuaternion(rotation: Vec3): [number, number, number, number] {
  const [x, y, z] = rotation;
  const c1 = Math.cos(x / 2);
  const c2 = Math.cos(y / 2);
  const c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2);
  const s2 = Math.sin(y / 2);
  const s3 = Math.sin(z / 2);

  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3
  ];
}

function rgbaToHex(rgba: Geom["rgba"]): string {
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(rgba[0])}${channel(rgba[1])}${channel(rgba[2])}`;
}

function safeName(name: string): string {
  return name.trim().replace(/\//g, "_") || "unnamed";
}

function shapeBb(shape: Shape): BoundingBoxFlat {
  const vertices = Array.from(shape.vertices);

  if (vertices.length < 3) {
    return defaultBb();
  }

  const bb = emptyBb();

  for (let index = 0; index < vertices.length; index += 3) {
    expandBb(bb, vertices[index], vertices[index + 1], vertices[index + 2]);
  }

  return finiteBb(bb);
}

function combineBbs(
  bbs: Array<BoundingBoxFlat | null | undefined>
): BoundingBoxFlat | null {
  const result = emptyBb();
  let hasBounds = false;

  bbs.forEach((bb) => {
    if (!bb) {
      return;
    }

    expandBb(result, bb.xmin, bb.ymin, bb.zmin);
    expandBb(result, bb.xmax, bb.ymax, bb.zmax);
    hasBounds = true;
  });

  return hasBounds ? finiteBb(result) : null;
}

function offsetBb(
  bb: BoundingBoxFlat | null | undefined,
  offset: Vec3
): BoundingBoxFlat | null {
  if (!bb) {
    return null;
  }

  return {
    xmin: bb.xmin + offset[0],
    xmax: bb.xmax + offset[0],
    ymin: bb.ymin + offset[1],
    ymax: bb.ymax + offset[1],
    zmin: bb.zmin + offset[2],
    zmax: bb.zmax + offset[2]
  };
}

function emptyBb(): BoundingBoxFlat {
  return {
    xmin: Number.POSITIVE_INFINITY,
    xmax: Number.NEGATIVE_INFINITY,
    ymin: Number.POSITIVE_INFINITY,
    ymax: Number.NEGATIVE_INFINITY,
    zmin: Number.POSITIVE_INFINITY,
    zmax: Number.NEGATIVE_INFINITY
  };
}

function expandBb(
  bb: BoundingBoxFlat,
  x: number,
  y: number,
  z: number
) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return;
  }

  bb.xmin = Math.min(bb.xmin, x);
  bb.xmax = Math.max(bb.xmax, x);
  bb.ymin = Math.min(bb.ymin, y);
  bb.ymax = Math.max(bb.ymax, y);
  bb.zmin = Math.min(bb.zmin, z);
  bb.zmax = Math.max(bb.zmax, z);
}

function finiteBb(bb: BoundingBoxFlat): BoundingBoxFlat {
  if (
    !Number.isFinite(bb.xmin) ||
    !Number.isFinite(bb.xmax) ||
    !Number.isFinite(bb.ymin) ||
    !Number.isFinite(bb.ymax) ||
    !Number.isFinite(bb.zmin) ||
    !Number.isFinite(bb.zmax)
  ) {
    return defaultBb();
  }

  return bb;
}

function defaultBb(): BoundingBoxFlat {
  return {
    xmin: -0.5,
    xmax: 0.5,
    ymin: -0.5,
    ymax: 0.5,
    zmin: -0.5,
    zmax: 0.5
  };
}
