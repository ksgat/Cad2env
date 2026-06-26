export type Vec3 = [number, number, number];

export type RGBA = [number, number, number, number];

export interface BBox {
  min: Vec3;
  max: Vec3;
  size: Vec3;
  center: Vec3;
}

export interface CADPart {
  id: string;
  name: string;
  sourceType: "step";
  fileName: string;
  meshId: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  bbox: BBox;
  assignedBodyId: string | null;
  visualOnly: boolean;
  metadata: {
    stepFileName?: string;
    originalPartName?: string;
    importer?: string;
    [key: string]: unknown;
  };
}

export interface Inertial {
  auto: boolean;
  diaginertia: Vec3;
  pos: Vec3;
}

export type GeomType = "box" | "sphere" | "cylinder" | "capsule" | "plane";

export interface Geom {
  id: string;
  name: string;
  bodyId: string;
  type: GeomType;
  size: Vec3;
  position: Vec3;
  rotation: Vec3;
  rgba: RGBA;
  density: number | null;
  mass: number | null;
  friction: Vec3;
  condim: number;
  contype: number;
  conaffinity: number;
  visualOnly: boolean;
  collisionOnly: boolean;
  metadata: Record<string, unknown>;
}

export interface VisualRef {
  id: string;
  cadPartId: string;
  kind: "step_mesh";
  localPosition: Vec3;
  localRotation: Vec3;
  localScale: Vec3;
  visualOnly: boolean;
}

export interface Body {
  id: string;
  name: string;
  parentBodyId: string | null;
  position: Vec3;
  rotation: Vec3;
  mass: number;
  inertial: Inertial;
  geoms: Geom[];
  visualRefs: VisualRef[];
  metadata: Record<string, unknown>;
}

export type JointType = "hinge" | "slide" | "ball" | "free" | "fixed";

export interface Joint {
  id: string;
  name: string;
  bodyId: string;
  type: JointType;
  axis: Vec3;
  position: Vec3;
  range: [number, number];
  limited: boolean;
  damping: number;
  stiffness: number;
  armature: number;
  frictionloss: number;
  metadata: {
    source: "manual";
    parentMateRef: string | null;
    childMateRef: string | null;
    [key: string]: unknown;
  };
}

export type ActuatorType = "motor" | "position" | "velocity";

export interface Actuator {
  id: string;
  name: string;
  jointId: string;
  type: ActuatorType;
  gear: number;
  ctrlrange: [number, number];
  ctrllimited: boolean;
  forcerange: [number, number] | null;
  forcelimited: boolean;
  metadata: Record<string, unknown>;
}

export interface CompilerSettings {
  angle: "degree" | "radian";
  coordinate: "local" | "global";
  inertiaFromGeom: boolean;
}

export interface OptionSettings {
  timestep: number;
  gravity: Vec3;
}

export interface RigScene {
  version: "0.1";
  name: string;
  units: "meters";
  compiler: CompilerSettings;
  options: OptionSettings;
  cadParts: CADPart[];
  bodies: Body[];
  joints: Joint[];
  actuators: Actuator[];
  metadata: {
    createdBy: "CAD2Env Rig Editor";
    notes: string;
    [key: string]: unknown;
  };
}

export interface Selection {
  type: "cadPart" | "body" | "geom" | "joint" | "actuator" | null;
  id: string | null;
}
