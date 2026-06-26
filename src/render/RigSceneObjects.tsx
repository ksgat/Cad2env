import type { ThreeEvent } from "@react-three/fiber";
import { EMPTY_SELECTION } from "../model/defaultScene";
import type { Body, Geom, Selection } from "../model/types";

interface RigSceneObjectsProps {
  bodies: Body[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
}

export function RigSceneObjects({
  bodies,
  selection,
  onSelect
}: RigSceneObjectsProps) {
  const currentSelection = selection ?? EMPTY_SELECTION;

  return (
    <>
      {bodies.map((body) => (
        <group key={body.id} position={body.position} rotation={body.rotation}>
          <BodyOrigin
            selected={
              currentSelection.type === "body" && currentSelection.id === body.id
            }
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ type: "body", id: body.id });
            }}
          />
          {body.geoms.map((geom) => (
            <GeomMesh
              key={geom.id}
              geom={geom}
              selected={
                currentSelection.type === "geom" && currentSelection.id === geom.id
              }
              bodySelected={
                currentSelection.type === "body" && currentSelection.id === body.id
              }
              onClick={(event) => {
                event.stopPropagation();
                onSelect({ type: "geom", id: geom.id });
              }}
            />
          ))}
        </group>
      ))}
    </>
  );
}

function BodyOrigin({
  selected,
  onClick
}: {
  selected: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <group>
      <mesh onClick={onClick}>
        <sphereGeometry args={[selected ? 0.045 : 0.028, 16, 12]} />
        <meshBasicMaterial color={selected ? "#f8d66d" : "#f4f7fa"} />
      </mesh>
    </group>
  );
}

function GeomMesh({
  geom,
  selected,
  bodySelected,
  onClick
}: {
  geom: Geom;
  selected: boolean;
  bodySelected: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const color = rgbaToCss(geom.rgba);
  const opacity = geom.rgba[3];

  return (
    <group position={geom.position} rotation={geom.rotation}>
      <PrimitiveGeometry
        geom={geom}
        color={color}
        opacity={opacity}
        highlighted={selected || bodySelected}
        selected={selected}
        onClick={onClick}
      />
    </group>
  );
}

function PrimitiveGeometry({
  geom,
  color,
  opacity,
  highlighted,
  selected,
  onClick
}: {
  geom: Geom;
  color: string;
  opacity: number;
  highlighted: boolean;
  selected: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const material = (
    <meshStandardMaterial
      color={color}
      emissive={highlighted ? "#3d2f08" : "#000000"}
      emissiveIntensity={highlighted ? 0.45 : 0}
      roughness={0.64}
      metalness={0.04}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );

  switch (geom.type) {
    case "box":
      return (
        <mesh castShadow receiveShadow onClick={onClick}>
          <boxGeometry args={[geom.size[0] * 2, geom.size[1] * 2, geom.size[2] * 2]} />
          {material}
        </mesh>
      );
    case "sphere":
      return (
        <mesh castShadow receiveShadow onClick={onClick}>
          <sphereGeometry args={[geom.size[0], 36, 24]} />
          {material}
        </mesh>
      );
    case "cylinder":
      return (
        <mesh castShadow receiveShadow onClick={onClick}>
          <cylinderGeometry args={[geom.size[0], geom.size[0], geom.size[1] * 2, 36]} />
          {material}
        </mesh>
      );
    case "capsule":
      return (
        <CapsuleApproximation
          geom={geom}
          color={color}
          opacity={opacity}
          highlighted={highlighted}
          onClick={onClick}
        />
      );
    case "plane":
      return (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
          <planeGeometry args={[geom.size[0] * 2, geom.size[1] * 2]} />
          <meshStandardMaterial
            color={color}
            emissive={highlighted ? "#3d2f08" : "#000000"}
            emissiveIntensity={highlighted ? 0.4 : 0}
            roughness={0.8}
            metalness={0}
          />
        </mesh>
      );
    default:
      return null;
  }
}

function CapsuleApproximation({
  geom,
  color,
  opacity,
  highlighted,
  onClick
}: {
  geom: Geom;
  color: string;
  opacity: number;
  highlighted: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const radius = geom.size[0];
  const halfLength = geom.size[1];
  const materialProps = {
    color,
    emissive: highlighted ? "#3d2f08" : "#000000",
    emissiveIntensity: highlighted ? 0.45 : 0,
    roughness: 0.64,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity
  };

  return (
    <group>
      <mesh castShadow receiveShadow onClick={onClick}>
        <cylinderGeometry args={[radius, radius, halfLength * 2, 36]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, halfLength, 0]} onClick={onClick}>
        <sphereGeometry args={[radius, 36, 18]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -halfLength, 0]} onClick={onClick}>
        <sphereGeometry args={[radius, 36, 18]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
    </group>
  );
}

function rgbaToCss(rgba: Geom["rgba"]): string {
  const [r, g, b] = rgba;
  const toChannel = (value: number) => Math.round(value * 255);

  return `rgb(${toChannel(r)} ${toChannel(g)} ${toChannel(b)})`;
}
