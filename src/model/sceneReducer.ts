import type { Body, Geom, RigScene, Selection } from "./types";

export interface EditorState {
  scene: RigScene;
  selection: Selection;
}

export type EditorAction =
  | { type: "setSceneName"; name: string }
  | { type: "select"; selection: Selection }
  | { type: "loadScene"; scene: RigScene }
  | { type: "addBody"; body: Body }
  | { type: "updateBody"; bodyId: string; patch: Partial<Body> }
  | { type: "deleteBody"; bodyId: string }
  | { type: "addGeom"; bodyId: string; geom: Geom }
  | { type: "updateGeom"; geomId: string; patch: Partial<Geom> }
  | { type: "deleteGeom"; geomId: string };

export function sceneReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "setSceneName":
      return {
        ...state,
        scene: {
          ...state.scene,
          name: action.name
        }
      };
    case "select":
      return {
        ...state,
        selection: action.selection
      };
    case "loadScene":
      return {
        scene: action.scene,
        selection: { type: null, id: null }
      };
    case "addBody":
      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: [...state.scene.bodies, action.body]
        },
        selection: {
          type: "body",
          id: action.body.id
        }
      };
    case "updateBody":
      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: state.scene.bodies.map((body) =>
            body.id === action.bodyId ? { ...body, ...action.patch } : body
          )
        }
      };
    case "deleteBody": {
      const bodyIdsToDelete = collectBodyAndDescendantIds(
        state.scene.bodies,
        action.bodyId
      );
      const geomIdsToDelete = new Set(
        state.scene.bodies
          .filter((body) => bodyIdsToDelete.has(body.id))
          .flatMap((body) => body.geoms.map((geom) => geom.id))
      );
      const jointIdsToDelete = new Set(
        state.scene.joints
          .filter((joint) => bodyIdsToDelete.has(joint.bodyId))
          .map((joint) => joint.id)
      );
      const nextSelection = isSelectionDeleted(
        state.selection,
        bodyIdsToDelete,
        geomIdsToDelete
      )
        ? { type: null, id: null }
        : state.selection;

      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: state.scene.bodies.filter(
            (body) => !bodyIdsToDelete.has(body.id)
          ),
          joints: state.scene.joints.filter(
            (joint) => !jointIdsToDelete.has(joint.id)
          ),
          actuators: state.scene.actuators.filter(
            (actuator) => !jointIdsToDelete.has(actuator.jointId)
          )
        },
        selection: nextSelection
      };
    }
    case "addGeom":
      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: state.scene.bodies.map((body) =>
            body.id === action.bodyId
              ? { ...body, geoms: [...body.geoms, action.geom] }
              : body
          )
        },
        selection: {
          type: "geom",
          id: action.geom.id
        }
      };
    case "updateGeom": {
      const existingGeom = findGeom(state.scene.bodies, action.geomId);

      if (!existingGeom) {
        return state;
      }

      const nextGeom = {
        ...existingGeom,
        ...action.patch
      };

      if (!state.scene.bodies.some((body) => body.id === nextGeom.bodyId)) {
        return state;
      }

      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: state.scene.bodies.map((body) => {
            const remainingGeoms = body.geoms.filter(
              (geom) => geom.id !== action.geomId
            );

            if (body.id !== nextGeom.bodyId) {
              return { ...body, geoms: remainingGeoms };
            }

            const previousIndex = body.geoms.findIndex(
              (geom) => geom.id === action.geomId
            );

            if (previousIndex === -1) {
              return { ...body, geoms: [...remainingGeoms, nextGeom] };
            }

            return {
              ...body,
              geoms: body.geoms.map((geom) =>
                geom.id === action.geomId ? nextGeom : geom
              )
            };
          })
        }
      };
    }
    case "deleteGeom": {
      const nextSelection =
        state.selection.type === "geom" && state.selection.id === action.geomId
          ? { type: null, id: null }
          : state.selection;

      return {
        ...state,
        scene: {
          ...state.scene,
          bodies: state.scene.bodies.map((body) => ({
            ...body,
            geoms: body.geoms.filter((geom) => geom.id !== action.geomId)
          }))
        },
        selection: nextSelection
      };
    }
    default:
      return state;
  }
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

function findGeom(bodies: Body[], geomId: string): Geom | null {
  for (const body of bodies) {
    const geom = body.geoms.find((candidate) => candidate.id === geomId);

    if (geom) {
      return geom;
    }
  }

  return null;
}

function isSelectionDeleted(
  selection: Selection,
  deletedBodyIds: Set<string>,
  deletedGeomIds: Set<string>
): boolean {
  if (selection.type === "body" && selection.id) {
    return deletedBodyIds.has(selection.id);
  }

  if (selection.type === "geom" && selection.id) {
    return deletedGeomIds.has(selection.id);
  }

  return false;
}
