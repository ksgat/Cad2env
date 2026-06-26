import type { Dispatch } from "react";
import { createPrimitiveGeomForBody } from "../model/primitives";
import type { EditorAction } from "../model/sceneReducer";
import type { Body, Geom, GeomType, RGBA, RigScene, Selection, Vec3 } from "../model/types";

interface InspectorPanelProps {
  scene: RigScene;
  selection: Selection;
  dispatch: Dispatch<EditorAction>;
}

const geomTypes: GeomType[] = ["box", "sphere", "cylinder", "capsule", "plane"];

export function InspectorPanel({
  scene,
  selection,
  dispatch
}: InspectorPanelProps) {
  if (selection.type === "body" && selection.id) {
    const body = scene.bodies.find((candidate) => candidate.id === selection.id);

    if (body) {
      return <BodyInspector scene={scene} body={body} dispatch={dispatch} />;
    }
  }

  if (selection.type === "geom" && selection.id) {
    const geom = findGeom(scene.bodies, selection.id);

    if (geom) {
      return <GeomInspector scene={scene} geom={geom} dispatch={dispatch} />;
    }
  }

  return (
    <div className="empty-note">
      Select a body origin, primitive geom, or scene tree item to edit its
      serialized properties.
    </div>
  );
}

function BodyInspector({
  scene,
  body,
  dispatch
}: {
  scene: RigScene;
  body: Body;
  dispatch: Dispatch<EditorAction>;
}) {
  const updateBody = (patch: Partial<Body>) =>
    dispatch({ type: "updateBody", bodyId: body.id, patch });

  const addGeom = (type: GeomType) => {
    dispatch({
      type: "addGeom",
      bodyId: body.id,
      geom: createPrimitiveGeomForBody(type, body.id, body.geoms.length + 1)
    });
  };

  return (
    <div className="inspector-content">
      <div className="inspector-title-row">
        <div>
          <span className="inspector-kicker">Body</span>
          <h3>{body.name}</h3>
        </div>
        <button
          className="danger-button"
          type="button"
          onClick={() => dispatch({ type: "deleteBody", bodyId: body.id })}
        >
          Delete
        </button>
      </div>

      <TextField
        label="Name"
        value={body.name}
        onChange={(name) => updateBody({ name })}
      />
      <label className="field">
        <span>Parent body</span>
        <select
          value={body.parentBodyId ?? ""}
          onChange={(event) =>
            updateBody({ parentBodyId: event.target.value || null })
          }
        >
          <option value="">None</option>
          {scene.bodies
            .filter(
              (candidate) =>
                candidate.id !== body.id &&
                !isDescendant(scene.bodies, candidate.id, body.id)
            )
            .map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
        </select>
      </label>
      <Vec3Field
        label="Position"
        value={body.position}
        onChange={(position) => updateBody({ position })}
      />
      <Vec3Field
        label="Rotation"
        value={body.rotation}
        onChange={(rotation) => updateBody({ rotation })}
      />
      <NumberField
        label="Mass"
        value={body.mass}
        onChange={(mass) => updateBody({ mass })}
      />
      <CheckboxField
        label="Inertial auto"
        checked={body.inertial.auto}
        onChange={(auto) =>
          updateBody({ inertial: { ...body.inertial, auto } })
        }
      />
      <Vec3Field
        label="Diag inertia"
        value={body.inertial.diaginertia}
        onChange={(diaginertia) =>
          updateBody({ inertial: { ...body.inertial, diaginertia } })
        }
      />
      <Vec3Field
        label="Inertial pos"
        value={body.inertial.pos}
        onChange={(pos) => updateBody({ inertial: { ...body.inertial, pos } })}
      />

      <div className="inspector-button-group">
        <span>Add geom</span>
        <div className="mini-button-row">
          {geomTypes.map((type) => (
            <button key={type} type="button" onClick={() => addGeom(type)}>
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeomInspector({
  scene,
  geom,
  dispatch
}: {
  scene: RigScene;
  geom: Geom;
  dispatch: Dispatch<EditorAction>;
}) {
  const updateGeom = (patch: Partial<Geom>) =>
    dispatch({ type: "updateGeom", geomId: geom.id, patch });

  return (
    <div className="inspector-content">
      <div className="inspector-title-row">
        <div>
          <span className="inspector-kicker">Geom</span>
          <h3>{geom.name}</h3>
        </div>
        <button
          className="danger-button"
          type="button"
          onClick={() => dispatch({ type: "deleteGeom", geomId: geom.id })}
        >
          Delete
        </button>
      </div>

      <TextField
        label="Name"
        value={geom.name}
        onChange={(name) => updateGeom({ name })}
      />
      <label className="field">
        <span>Body</span>
        <select
          value={geom.bodyId}
          onChange={(event) => updateGeom({ bodyId: event.target.value })}
        >
          {scene.bodies.map((body) => (
            <option key={body.id} value={body.id}>
              {body.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Type</span>
        <select
          value={geom.type}
          onChange={(event) => {
            const type = event.target.value as GeomType;
            const defaults = createPrimitiveGeomForBody(type, geom.bodyId, 1);
            updateGeom({
              type,
              size: defaults.size,
              rgba: defaults.rgba,
              metadata: defaults.metadata
            });
          }}
        >
          {geomTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <Vec3Field
        label="Size"
        value={geom.size}
        onChange={(size) => updateGeom({ size })}
      />
      <Vec3Field
        label="Position"
        value={geom.position}
        onChange={(position) => updateGeom({ position })}
      />
      <Vec3Field
        label="Rotation"
        value={geom.rotation}
        onChange={(rotation) => updateGeom({ rotation })}
      />
      <ColorField
        label="Color"
        value={geom.rgba}
        onChange={(rgba) => updateGeom({ rgba })}
      />
      <Vec3Field
        label="Friction"
        value={geom.friction}
        onChange={(friction) => updateGeom({ friction })}
      />
      <NumberField
        label="Condim"
        value={geom.condim}
        onChange={(condim) => updateGeom({ condim })}
      />
      <NumberField
        label="Contype"
        value={geom.contype}
        onChange={(contype) => updateGeom({ contype })}
      />
      <NumberField
        label="Conaffinity"
        value={geom.conaffinity}
        onChange={(conaffinity) => updateGeom({ conaffinity })}
      />
      <CheckboxField
        label="Visual only"
        checked={geom.visualOnly}
        onChange={(visualOnly) => updateGeom({ visualOnly })}
      />
      <CheckboxField
        label="Collision only"
        checked={geom.collisionOnly}
        onChange={(collisionOnly) => updateGeom({ collisionOnly })}
      />
      <NullableNumberField
        label="Density"
        value={geom.density}
        onChange={(density) => updateGeom({ density })}
      />
      <NullableNumberField
        label="Mass"
        value={geom.mass}
        onChange={(mass) => updateGeom({ mass })}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step="0.001"
        value={value}
        onChange={(event) => onChange(readNumber(event.target.value, value))}
      />
    </label>
  );
}

function NullableNumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step="0.001"
        placeholder="null"
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue === "" ? null : readNumber(nextValue, value ?? 0));
        }}
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="checkbox-field">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Vec3Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: Vec3;
  onChange: (value: Vec3) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="triplet-field">
        {value.map((item, index) => (
          <input
            key={index}
            type="number"
            step="0.001"
            value={item}
            onChange={(event) => {
              const next = [...value] as Vec3;
              next[index] = readNumber(event.target.value, item);
              onChange(next);
            }}
          />
        ))}
      </div>
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: RGBA;
  onChange: (value: RGBA) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="color-field">
        <input
          type="color"
          value={rgbaToHex(value)}
          onChange={(event) => onChange(hexToRgba(event.target.value, value[3]))}
        />
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={value[3]}
          onChange={(event) => {
            const alpha = Math.min(
              1,
              Math.max(0, readNumber(event.target.value, value[3]))
            );
            onChange([value[0], value[1], value[2], alpha]);
          }}
        />
      </div>
    </label>
  );
}

function findGeom(bodies: Body[], geomId: string): Geom | null {
  for (const body of bodies) {
    const geom = body.geoms.find((candidate) => candidate.id === geomId);

    if (geom) {
      return geom;
    }
  }

  return null;
}

function isDescendant(
  bodies: Body[],
  candidateBodyId: string,
  parentBodyId: string
): boolean {
  let current = bodies.find((body) => body.id === candidateBodyId);

  while (current?.parentBodyId) {
    if (current.parentBodyId === parentBodyId) {
      return true;
    }

    current = bodies.find((body) => body.id === current?.parentBodyId);
  }

  return false;
}

function readNumber(value: string, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function rgbaToHex(rgba: RGBA): string {
  const channel = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(rgba[0])}${channel(rgba[1])}${channel(rgba[2])}`;
}

function hexToRgba(hex: string, alpha: number): RGBA {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  return [r, g, b, alpha];
}
