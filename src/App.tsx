import { useMemo, useReducer } from "react";
import { InspectorPanel } from "./components/InspectorPanel";
import { SceneTree } from "./components/SceneTree";
import { Viewport3D } from "./components/Viewport3D";
import { createDefaultScene, EMPTY_SELECTION } from "./model/defaultScene";
import { createPrimitiveBody } from "./model/primitives";
import { sceneReducer } from "./model/sceneReducer";
import type { GeomType } from "./model/types";

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
          <SceneTree
            scene={state.scene}
            selection={state.selection}
            onSelect={(selection) => dispatch({ type: "select", selection })}
          />
          <div className="empty-note">
            Bodies are organized by parentBodyId. Geoms are serialized inside
            their owning body.
          </div>
        </aside>

        <section className="viewport-column">
          <div className="viewport-panel">
            <Viewport3D
              scene={state.scene}
              selection={state.selection}
              onSelect={(selection) => dispatch({ type: "select", selection })}
            />
          </div>

          <section className="panel utility-panel">
            <PanelHeader eyebrow="Serialization" title="Scene JSON" />
            <pre className="json-preview">{sceneJson}</pre>
          </section>
        </section>

        <aside className="panel inspector-panel">
          <PanelHeader eyebrow="Inspector" title="Selection" />
          <InspectorPanel
            scene={state.scene}
            selection={state.selection}
            dispatch={dispatch}
          />
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
