import { useState, type Dispatch } from "react";
import { createPrimitiveBody } from "../model/primitives";
import {
  addVec3,
  duplicateBodySubtree,
  duplicateGeom,
  findSelectedBody,
  findSelectedGeom,
  scaleGeomSize
} from "../model/rigOperations";
import type { EditorAction } from "../model/sceneReducer";
import type { Body, Geom, GeomType, RigScene, Selection, Vec3 } from "../model/types";
import { InspectorPanel } from "./InspectorPanel";
import { SceneTree } from "./SceneTree";

interface WorkbenchTopbarProps {
  scene: RigScene;
  selection: Selection;
  sceneJson: string;
  dispatch: Dispatch<EditorAction>;
}

type Workflow = "cad" | "rig" | "mate" | "serialize";
type MenuId = "create" | "edit" | "structure" | "inspect" | "json" | null;

const workflows: Array<{ id: Workflow; label: string }> = [
  { id: "cad", label: "CAD" },
  { id: "rig", label: "Rig" },
  { id: "mate", label: "Mates" },
  { id: "serialize", label: "Serialize" }
];
const workflowMenus: Record<Workflow, Array<Exclude<MenuId, null>>> = {
  cad: ["create", "edit", "structure"],
  rig: ["structure", "inspect", "edit"],
  mate: ["structure", "inspect"],
  serialize: ["json", "structure", "inspect"]
};
const menuLabels: Record<Exclude<MenuId, null>, string> = {
  create: "Create",
  edit: "Edit",
  structure: "Structure",
  inspect: "Inspector",
  json: "JSON"
};
const primitiveTypes: GeomType[] = ["box", "sphere", "cylinder", "capsule", "plane"];
const nudgeStep = 0.05;
const rotateStep = Math.PI / 12;

export function WorkbenchTopbar({
  scene,
  selection,
  sceneJson,
  dispatch
}: WorkbenchTopbarProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow>("cad");
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const selectedBody = findSelectedBody(scene, selection);
  const selectedGeom = findSelectedGeom(scene, selection);
  const selectedName = selectionLabel(selectedBody, selectedGeom);

  const openWorkflow = (workflow: Workflow) => {
    setActiveWorkflow(workflow);
    setOpenMenu(workflow === "serialize" ? "json" : null);
  };

  return (
    <header className="workbench-topbar">
      <div className="title-row">
        <div className="brand-lockup">
          <span className="brand-mark">C2E</span>
          <div>
            <h1>CAD2Env Rig Editor</h1>
            <p>three-cad-viewer rig workbench</p>
          </div>
        </div>

        <label className="scene-name-field">
          <span>Scene</span>
          <input
            value={scene.name}
            onChange={(event) =>
              dispatch({
                type: "setSceneName",
                name: event.target.value
              })
            }
          />
        </label>
      </div>

      <nav className="workflow-tabs" aria-label="Workbench workflows">
        {workflows.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            className={activeWorkflow === workflow.id ? "is-active" : ""}
            onClick={() => openWorkflow(workflow.id)}
          >
            {workflow.label}
          </button>
        ))}
      </nav>

      <div className="command-row">
        {workflowMenus[activeWorkflow].map((menuId) => (
          <MenuButton
            key={menuId}
            id={menuId}
            active={openMenu === menuId}
            label={menuLabels[menuId]}
            onToggle={setOpenMenu}
          />
        ))}
        <div className="selection-readout">
          <span>{selection.type ?? "none"}</span>
          <strong>{selectedName}</strong>
        </div>
      </div>

      <SelectionParameterStrip
        selectedBody={selectedBody}
        selectedGeom={selectedGeom}
        dispatch={dispatch}
      />

      {openMenu ? (
        <div className={`topbar-popout topbar-popout-${openMenu}`}>
          {openMenu === "create" ? (
            <CreateMenu scene={scene} dispatch={dispatch} />
          ) : null}
          {openMenu === "edit" ? (
            <EditMenu
              scene={scene}
              selectedBody={selectedBody}
              selectedGeom={selectedGeom}
              dispatch={dispatch}
            />
          ) : null}
          {openMenu === "structure" ? (
            <SceneTree
              scene={scene}
              selection={selection}
              onSelect={(nextSelection) =>
                dispatch({ type: "select", selection: nextSelection })
              }
            />
          ) : null}
          {openMenu === "inspect" ? (
            <InspectorPanel
              scene={scene}
              selection={selection}
              dispatch={dispatch}
            />
          ) : null}
          {openMenu === "json" ? (
            <pre className="json-preview popout-json">{sceneJson}</pre>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

function MenuButton({
  id,
  label,
  active,
  onToggle
}: {
  id: Exclude<MenuId, null>;
  label: string;
  active: boolean;
  onToggle: (id: MenuId) => void;
}) {
  return (
    <button
      type="button"
      className={active ? "command-button is-active" : "command-button"}
      onClick={() => onToggle(active ? null : id)}
    >
      {label}
    </button>
  );
}

function CreateMenu({
  scene,
  dispatch
}: {
  scene: RigScene;
  dispatch: Dispatch<EditorAction>;
}) {
  return (
    <div className="menu-command-grid">
      {primitiveTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => {
            const nextIndex =
              scene.bodies.filter((body) => body.metadata.primitiveType === type)
                .length + 1;
            dispatch({
              type: "addBody",
              body: createPrimitiveBody(type, nextIndex)
            });
          }}
        >
          <span>{type}</span>
          <strong>Add {type} body</strong>
        </button>
      ))}
    </div>
  );
}

function EditMenu({
  scene,
  selectedBody,
  selectedGeom,
  dispatch
}: {
  scene: RigScene;
  selectedBody: Body | null;
  selectedGeom: Geom | null;
  dispatch: Dispatch<EditorAction>;
}) {
  const hasSelection = Boolean(selectedBody || selectedGeom);

  return (
    <div className="edit-popout">
      <div className="command-strip">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => duplicateSelection(scene, selectedBody, selectedGeom, dispatch)}
        >
          Duplicate
        </button>
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => deleteSelection(selectedBody, selectedGeom, dispatch)}
        >
          Delete
        </button>
        <button
          type="button"
          disabled={!selectedGeom && !selectedBody}
          onClick={() => scaleSelection(selectedBody, selectedGeom, dispatch, 0.9)}
        >
          Scale -
        </button>
        <button
          type="button"
          disabled={!selectedGeom && !selectedBody}
          onClick={() => scaleSelection(selectedBody, selectedGeom, dispatch, 1.1)}
        >
          Scale +
        </button>
      </div>

      <div className="axis-command-group">
        <span>Nudge</span>
        <AxisControls
          disabled={!hasSelection}
          labels={["-X", "+X", "-Y", "+Y", "-Z", "+Z"]}
          onApply={(delta) => transformSelection(selectedBody, selectedGeom, dispatch, "position", delta)}
          step={nudgeStep}
        />
      </div>

      <div className="axis-command-group">
        <span>Rotate</span>
        <AxisControls
          disabled={!hasSelection}
          labels={["RX-", "RX+", "RY-", "RY+", "RZ-", "RZ+"]}
          onApply={(delta) => transformSelection(selectedBody, selectedGeom, dispatch, "rotation", delta)}
          step={rotateStep}
        />
      </div>

      {selectedGeom ? (
        <div className="command-strip">
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "updateGeom",
                geomId: selectedGeom.id,
                patch: {
                  visualOnly: !selectedGeom.visualOnly,
                  collisionOnly: false
                }
              })
            }
          >
            {selectedGeom.visualOnly ? "Visual on" : "Visual only"}
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: "updateGeom",
                geomId: selectedGeom.id,
                patch: {
                  collisionOnly: !selectedGeom.collisionOnly,
                  visualOnly: false
                }
              })
            }
          >
            {selectedGeom.collisionOnly ? "Collision on" : "Collision only"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SelectionParameterStrip({
  selectedBody,
  selectedGeom,
  dispatch
}: {
  selectedBody: Body | null;
  selectedGeom: Geom | null;
  dispatch: Dispatch<EditorAction>;
}) {
  if (!selectedBody && !selectedGeom) {
    return (
      <div className="parameter-strip">
        <span>No selection</span>
      </div>
    );
  }

  if (selectedBody) {
    return (
      <div className="parameter-strip">
        <strong>Body</strong>
        <Vec3Inline
          label="pos"
          value={selectedBody.position}
          onChange={(position) =>
            dispatch({
              type: "updateBody",
              bodyId: selectedBody.id,
              patch: { position }
            })
          }
        />
        <Vec3Inline
          label="rot"
          value={selectedBody.rotation}
          onChange={(rotation) =>
            dispatch({
              type: "updateBody",
              bodyId: selectedBody.id,
              patch: { rotation }
            })
          }
        />
      </div>
    );
  }

  if (!selectedGeom) {
    return null;
  }

  return (
    <div className="parameter-strip">
      <strong>{selectedGeom.type}</strong>
      <Vec3Inline
        label="pos"
        value={selectedGeom.position}
        onChange={(position) =>
          dispatch({
            type: "updateGeom",
            geomId: selectedGeom.id,
            patch: { position }
          })
        }
      />
      <Vec3Inline
        label="rot"
        value={selectedGeom.rotation}
        onChange={(rotation) =>
          dispatch({
            type: "updateGeom",
            geomId: selectedGeom.id,
            patch: { rotation }
          })
        }
      />
      <Vec3Inline
        label="size"
        value={selectedGeom.size}
        onChange={(size) =>
          dispatch({
            type: "updateGeom",
            geomId: selectedGeom.id,
            patch: { size }
          })
        }
      />
    </div>
  );
}

function Vec3Inline({
  label,
  value,
  onChange
}: {
  label: string;
  value: Vec3;
  onChange: (value: Vec3) => void;
}) {
  return (
    <label className="topbar-vec3">
      <span>{label}</span>
      {value.map((item, index) => (
        <input
          key={index}
          type="number"
          step="0.001"
          value={item}
          onChange={(event) => {
            const next = [...value] as Vec3;
            const parsed = Number(event.target.value);
            next[index] = Number.isFinite(parsed) ? parsed : item;
            onChange(next);
          }}
        />
      ))}
    </label>
  );
}

function AxisControls({
  disabled,
  labels,
  step,
  onApply
}: {
  disabled: boolean;
  labels: string[];
  step: number;
  onApply: (delta: Vec3) => void;
}) {
  const deltas: Vec3[] = [
    [-step, 0, 0],
    [step, 0, 0],
    [0, -step, 0],
    [0, step, 0],
    [0, 0, -step],
    [0, 0, step]
  ];

  return (
    <div className="axis-command-buttons">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onApply(deltas[index])}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function duplicateSelection(
  scene: RigScene,
  selectedBody: Body | null,
  selectedGeom: Geom | null,
  dispatch: Dispatch<EditorAction>
) {
  if (selectedBody) {
    const duplicated = duplicateBodySubtree(scene, selectedBody.id);

    if (duplicated) {
      dispatch({
        type: "addBodies",
        bodies: duplicated.bodies,
        selectBodyId: duplicated.rootBodyId
      });
      return;
    }
  }

  if (selectedGeom) {
    dispatch({
      type: "addGeom",
      bodyId: selectedGeom.bodyId,
      geom: duplicateGeom(selectedGeom)
    });
  }
}

function deleteSelection(
  selectedBody: Body | null,
  selectedGeom: Geom | null,
  dispatch: Dispatch<EditorAction>
) {
  if (selectedBody) {
    dispatch({ type: "deleteBody", bodyId: selectedBody.id });
  }

  if (selectedGeom) {
    dispatch({ type: "deleteGeom", geomId: selectedGeom.id });
  }
}

function transformSelection(
  selectedBody: Body | null,
  selectedGeom: Geom | null,
  dispatch: Dispatch<EditorAction>,
  field: "position" | "rotation",
  delta: Vec3
) {
  if (selectedBody) {
    dispatch({
      type: "updateBody",
      bodyId: selectedBody.id,
      patch: {
        [field]: addVec3(selectedBody[field], delta)
      }
    });
  }

  if (selectedGeom) {
    dispatch({
      type: "updateGeom",
      geomId: selectedGeom.id,
      patch: {
        [field]: addVec3(selectedGeom[field], delta)
      }
    });
  }
}

function scaleSelection(
  selectedBody: Body | null,
  selectedGeom: Geom | null,
  dispatch: Dispatch<EditorAction>,
  factor: number
) {
  if (selectedGeom) {
    dispatch({
      type: "updateGeom",
      geomId: selectedGeom.id,
      patch: { size: scaleGeomSize(selectedGeom, factor) }
    });
  }

  if (selectedBody) {
    selectedBody.geoms.forEach((geom) =>
      dispatch({
        type: "updateGeom",
        geomId: geom.id,
        patch: { size: scaleGeomSize(geom, factor) }
      })
    );
  }
}

function selectionLabel(selectedBody: Body | null, selectedGeom: Geom | null): string {
  if (selectedGeom) {
    return selectedGeom.name;
  }

  if (selectedBody) {
    return selectedBody.name;
  }

  return "No selection";
}
