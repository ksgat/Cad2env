import { useMemo, useReducer } from "react";
import { Viewport3D } from "./components/Viewport3D";
import { createDefaultScene, EMPTY_SELECTION } from "./model/defaultScene";
import { createPrimitiveBody } from "./model/primitives";
import { sceneReducer } from "./model/sceneReducer";
import type { GeomType, Selection } from "./model/types";

const selectionOptions: Selection[] = [
  EMPTY_SELECTION,
  { type: "cadPart", id: "placeholder-cad-part" },
  { type: "body", id: "placeholder-body" },
  { type: "geom", id: "placeholder-geom" },
  { type: "joint", id: "placeholder-joint" },
  { type: "actuator", id: "placeholder-actuator" }
];

export function App() {
  const [state, dispatch] = useReducer(sceneReducer, undefined, () => ({
    scene: createDefaultScene(),
    selection: EMPTY_SELECTION
  }));

  const sceneJson = useMemo(
    () => JSON.stringify(state.scene, null, 2),
    [state.scene]
  );

  const addPrimitiveBody = (type: GeomType) => {
    const nextIndex =
      state.scene.bodies.filter(
        (body) => body.metadata.primitiveType === type
      ).length + 1;

    dispatch({
      type: "addBody",
      body: createPrimitiveBody(type, nextIndex)
    });
  };

  return (
    <main className="app-shell">
      <header className="top-toolbar">
        <div className="brand-lockup">
          <span className="brand-mark">C2E</span>
          <div>
            <h1>CAD2Env Rig Editor</h1>
            <p>Visual rig authoring for clean MJCF-oriented serialization</p>
          </div>
        </div>

        <div className="toolbar-controls">
          <div className="primitive-buttons" aria-label="Primitive body tools">
            <button type="button" onClick={() => addPrimitiveBody("box")}>
              Add Box Body
            </button>
            <button type="button" onClick={() => addPrimitiveBody("sphere")}>
              Add Sphere Body
            </button>
            <button type="button" onClick={() => addPrimitiveBody("cylinder")}>
              Add Cylinder Body
            </button>
            <button type="button" onClick={() => addPrimitiveBody("capsule")}>
              Add Capsule Body
            </button>
            <button type="button" onClick={() => addPrimitiveBody("plane")}>
              Add Plane
            </button>
          </div>

          <label className="scene-name-field">
            <span>Scene</span>
            <input
              value={state.scene.name}
              onChange={(event) =>
                dispatch({
                  type: "setSceneName",
                  name: event.target.value
                })
              }
            />
          </label>
        </div>
      </header>

      <section className="editor-grid">
        <aside className="panel left-sidebar">
          <PanelHeader eyebrow="Scene" title="Rig Structure" />
          <div className="tree-section">
            <TreeGroup label="CAD Parts" count={state.scene.cadParts.length} />
            <TreeGroup label="Bodies" count={state.scene.bodies.length} />
            <TreeGroup label="Joints" count={state.scene.joints.length} />
            <TreeGroup label="Actuators" count={state.scene.actuators.length} />
          </div>
          <div className="empty-note">
            Primitive bodies are stored as MuJoCo-style bodies with nested geoms.
            Selection and editing arrive in Phase 4.
          </div>
        </aside>

        <section className="viewport-column">
          <div className="viewport-panel">
            <Viewport3D scene={state.scene} />
          </div>

          <section className="panel utility-panel">
            <PanelHeader eyebrow="Serialization" title="Scene JSON" />
            <pre className="json-preview">{sceneJson}</pre>
          </section>
        </section>

        <aside className="panel inspector-panel">
          <PanelHeader eyebrow="Inspector" title="Selection" />
          <div className="field-stack">
            <label className="field">
              <span>Selection preview</span>
              <select
                value={selectionToValue(state.selection)}
                onChange={(event) =>
                  dispatch({
                    type: "select",
                    selection: valueToSelection(event.target.value)
                  })
                }
              >
                {selectionOptions.map((selection) => (
                  <option
                    key={selectionToValue(selection)}
                    value={selectionToValue(selection)}
                  >
                    {selectionLabel(selection)}
                  </option>
                ))}
              </select>
            </label>

            <div className="readout">
              <span>Type</span>
              <strong>{state.selection.type ?? "none"}</strong>
            </div>
            <div className="readout">
              <span>ID</span>
              <strong>{state.selection.id ?? "none"}</strong>
            </div>
          </div>

          <div className="empty-note">
            Object-specific inspectors are introduced with selectable bodies,
            geoms, joints, actuators, and CAD parts in later phases.
          </div>
        </aside>
      </section>
    </main>
  );
}

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="panel-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function TreeGroup({ label, count }: { label: string; count: number }) {
  return (
    <button className="tree-group" type="button">
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function selectionToValue(selection: Selection): string {
  if (!selection.type || !selection.id) {
    return "none";
  }

  return `${selection.type}:${selection.id}`;
}

function valueToSelection(value: string): Selection {
  if (value === "none") {
    return EMPTY_SELECTION;
  }

  const [type, id] = value.split(":") as [Selection["type"], string];

  return {
    type,
    id
  };
}

function selectionLabel(selection: Selection): string {
  if (!selection.type || !selection.id) {
    return "None";
  }

  return `${selection.type} - ${selection.id}`;
}
