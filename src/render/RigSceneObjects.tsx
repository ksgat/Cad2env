import type { Body, Geom } from "../model/types";

interface RigSceneObjectsProps {
  bodies: Body[];
}

export function RigSceneObjects({ bodies }: RigSceneObjectsProps) {
  return (
    <>
      {bodies.map((body) => (
        <group key={body.id} position={body.position} rotation={body.rotation}>
          <BodyOrigin />
          {body.geoms.map((geom) => (
            <GeomMesh key={geom.id} geom={geom} />
          ))}
        </group>
      ))}
    </>
  );
}

function BodyOrigin() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.025, 16, 12]} />
        <meshBasicMaterial color="#f4f7fa" />
      </mesh>
    </group>
  );
}

function GeomMesh({ geom }: { geom: Geom }) {
  const color = rgbaToCss(geom.rgba);
  const opacity = geom.rgba[3];

  return (
    <group position={geom.position} rotation={geom.rotation}>
      <PrimitiveGeometry geom={geom} color={color} opacity={opacity} />
    </group>
  );
}

function PrimitiveGeometry({
  geom,
  color,
  opacity
}: {
  geom: Geom;
  color: string;
  opacity: number;
}) {
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={0.64}
      metalness={0.04}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );

  switch (geom.type) {
    case "box":
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[geom.size[0] * 2, geom.size[1] * 2, geom.size[2] * 2]} />
          {material}
        </mesh>
      );
    case "sphere":
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[geom.size[0], 36, 24]} />
          {material}
        </mesh>
      );
    case "cylinder":
      return (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[geom.size[0], geom.size[0], geom.size[1] * 2, 36]} />
          {material}
        </mesh>
      );
    case "capsule":
      return <CapsuleApproximation geom={geom} color={color} opacity={opacity} />;
    case "plane":
      return (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[geom.size[0] * 2, geom.size[1] * 2]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
      );
    default:
      return null;
  }
}

function CapsuleApproximation({
  geom,
  color,
  opacity
}: {
  geom: Geom;
  color: string;
  opacity: number;
}) {
  const radius = geom.size[0];
  const halfLength = geom.size[1];
  const materialProps = {
    color,
    roughness: 0.64,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity
  };

  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, halfLength * 2, 36]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, halfLength, 0]}>
        <sphereGeometry args={[radius, 36, 18]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -halfLength, 0]}>
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
