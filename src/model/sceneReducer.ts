import type { Body, RigScene, Selection } from "./types";

export interface EditorState {
  scene: RigScene;
  selection: Selection;
}

export type EditorAction =
  | { type: "setSceneName"; name: string }
  | { type: "select"; selection: Selection }
  | { type: "loadScene"; scene: RigScene }
  | { type: "addBody"; body: Body };

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
    default:
      return state;
  }
}
