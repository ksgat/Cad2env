import { useCallback, useMemo, useReducer } from "react";
import { Viewport3D } from "./components/Viewport3D";
import { WorkbenchTopbar } from "./components/WorkbenchTopbar";
import { createDefaultScene, EMPTY_SELECTION } from "./model/defaultScene";
import { sceneReducer } from "./model/sceneReducer";

export function App() {
  const [state, dispatch] = useReducer(sceneReducer, undefined, () => ({
    scene: createDefaultScene(),
    selection: EMPTY_SELECTION
  }));

  const sceneJson = useMemo(
    () => JSON.stringify(state.scene, null, 2),
    [state.scene]
  );
  const selectFromViewport = useCallback(
    (selection: typeof state.selection) => dispatch({ type: "select", selection }),
    []
  );

  return (
    <main className="app-shell">
      <WorkbenchTopbar
        scene={state.scene}
        selection={state.selection}
        sceneJson={sceneJson}
        dispatch={dispatch}
      />

      <section className="viewport-workspace">
        <div className="viewport-panel">
          <Viewport3D
            scene={state.scene}
            onSelect={selectFromViewport}
          />
        </div>
      </section>
    </main>
  );
}
